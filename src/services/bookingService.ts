import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, DEFAULT_GROUP_ID } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Match, Reservation, UserProfile, Membership } from '../types';
import { createBroadcastNotification } from './notificationService';

/**
 * Atomic spot reservation using Firestore transaction
 * Guarantees that even with 50 simultaneous clicks on the 12th spot,
 * ONLY 1 succeeds and the rest receive a full rejection error.
 */
export async function reserveSpot(
  matchId: string,
  user: FirebaseUser,
  profile?: UserProfile | null
): Promise<Reservation> {
  const matchRef = doc(db, 'matches', matchId);
  const reservationId = `${matchId}_${user.uid}`;
  const resRef = doc(db, 'reservations', reservationId);
  const now = new Date().toISOString();

  try {
    const reservation = await runTransaction(db, async (transaction) => {
      // 1. Read match document
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists()) {
        throw new Error('Match does not exist.');
      }

      const match = matchDoc.data() as Match;

      // 2. Validate match state
      if (match.status === 'cancelled') {
        throw new Error('This match has been cancelled by an Admin.');
      }

      if (new Date(match.scheduledStartTime).getTime() <= Date.now()) {
        throw new Error('Cannot book: this match has already started.');
      }

      // 3. Check for existing reservation
      const resDoc = await transaction.get(resRef);
      if (resDoc.exists()) {
        const existingData = resDoc.data() as Reservation;
        if (existingData.status === 'confirmed') {
          throw new Error('You already have a confirmed spot in this match.');
        }
      }

      // 4. Strict capacity limit check
      if (match.confirmedCount >= match.maxPlayers) {
        throw new Error(`Match is full (${match.maxPlayers}/${match.maxPlayers}). No spots remaining.`);
      }

      // 5. Atomic state update
      const newCount = match.confirmedCount + 1;
      const isNowFull = newCount >= match.maxPlayers;

      transaction.update(matchRef, {
        confirmedCount: newCount,
        status: isNowFull ? 'full' : 'open',
        updatedAt: now,
      });

      const newReservation: Reservation = {
        id: reservationId,
        matchId,
        groupId: match.groupId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'لاعب',
        userAvatar: profile ? (profile.photoURL ?? null) : (user.photoURL || null),
        bookedAt: now,
        status: 'confirmed',
      };

      transaction.set(resRef, newReservation);
      return newReservation;
    });

    return reservation;
  } catch (error: any) {
    if (error.message?.includes('Match is full') || error.message?.includes('already have a confirmed spot')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `reservations/${reservationId}`);
  }
}

/**
 * Atomic cancellation of a reservation
 * Reopens the slot instantly (e.g. 12/12 -> 11/12)
 */
export async function cancelSpot(
  matchId: string,
  targetUserId: string,
  caller: FirebaseUser,
  isCallerAdminOrOwner: boolean
): Promise<{ match: Match; cancelledPlayerName: string }> {
  // Members can cancel only their own reservation; Admin/Owner can cancel any
  if (caller.uid !== targetUserId && !isCallerAdminOrOwner) {
    throw new Error('Unauthorized: You can only cancel your own booking.');
  }

  const matchRef = doc(db, 'matches', matchId);
  const reservationId = `${matchId}_${targetUserId}`;
  const resRef = doc(db, 'reservations', reservationId);
  const now = new Date().toISOString();

  try {
    const result = await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists()) throw new Error('Match not found.');

      const match = matchDoc.data() as Match;

      const resDoc = await transaction.get(resRef);
      if (!resDoc.exists()) throw new Error('No confirmed reservation found.');

      const resData = resDoc.data() as Reservation;
      if (resData.status !== 'confirmed') {
        throw new Error('Reservation is not active.');
      }

      const cancelledPlayerName = resData.userName || caller.displayName || 'لاعب';

      // Decrement confirmed count safely
      const newCount = Math.max(0, match.confirmedCount - 1);
      // If match was full, reopening the slot marks it open
      const newStatus = match.status === 'full' ? 'open' : match.status;

      transaction.update(matchRef, {
        confirmedCount: newCount,
        status: newStatus,
        updatedAt: now,
      });

      // Remove active reservation document
      transaction.delete(resRef);

      return {
        match: { ...match, confirmedCount: newCount, status: newStatus },
        cancelledPlayerName,
      };
    });

    // Universal Cancellation Broadcast to ALL squad members
    try {
      const playerName = result.cancelledPlayerName || caller.displayName || 'أحد اللاعبين';
      const openSpots = Math.max(0, result.match.maxPlayers - result.match.confirmedCount);
      await createBroadcastNotification({
        type: 'cancellation_opened',
        matchId: matchId,
        actorId: targetUserId || caller.uid,
        actorName: playerName,
        title: 'مكان فضي في الماتش! ⚽',
        message: `اللاعب ${playerName} اعتذر عن "${result.match.title}". فتح مكان دلوقتي (${result.match.confirmedCount}/${result.match.maxPlayers} لاعب) — باقي ${openSpots} ${openSpots === 1 ? 'مكان' : 'أماكن'}، الحق احجز!`,
        groupId: result.match.groupId || DEFAULT_GROUP_ID,
      });
    } catch (notifErr) {
      console.warn('Failed to broadcast cancellation notification:', notifErr);
    }

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reservations/${reservationId}`);
  }
}

/**
 * Real-time subscription to a match's confirmed reservations
 */
export function subscribeToMatchReservations(
  matchId: string,
  callback: (reservations: Reservation[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'reservations'),
    where('matchId', '==', matchId),
    where('status', '==', 'confirmed')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Reservation);
      });
      // Sort chronologically by bookedAt
      list.sort((a, b) => new Date(a.bookedAt).getTime() - new Date(b.bookedAt).getTime());
      callback(list);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Error in reservations snapshot:', err);
    }
  );
}

/**
 * Real-time subscription to the current user's active bookings
 */
export function subscribeToUserReservations(
  userId: string,
  callback: (reservations: Reservation[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'reservations'),
    where('userId', '==', userId),
    where('status', '==', 'confirmed')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Reservation);
      });
      callback(list);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Error in user reservations snapshot:', err);
    }
  );
}

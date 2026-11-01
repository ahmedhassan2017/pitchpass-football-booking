import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, DEFAULT_GROUP_ID } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Match, MatchStatus, UserRole } from '../types';
import { createBroadcastNotification } from './notificationService';

export interface CreateMatchInput {
  title: string;
  location: string;
  scheduledStartTime: string; // ISO string
  scheduledEndTime?: string; // ISO string
  notes?: string;
  maxPlayers?: number; // Default 12
  groupId?: string;
}

export interface UpdateMatchInput {
  title?: string;
  location?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  notes?: string;
  maxPlayers?: number;
}

/**
 * Real-time subscription to all matches for a group
 */
export function subscribeToMatches(
  groupId: string = DEFAULT_GROUP_ID,
  callback: (matches: Match[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'matches';
  const q = query(collection(db, 'matches'), where('groupId', '==', groupId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Match);
      });
      // Sort by scheduledStartTime ascending
      list.sort((a, b) => {
        return new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime();
      });
      callback(list);
    },
    (err) => {
      if (onError) {
        onError(err);
      } else {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

/**
 * Create a new match (Owner or Admin only)
 */
export async function createMatch(
  input: CreateMatchInput,
  user: FirebaseUser,
  userRole: UserRole
): Promise<Match> {
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new Error('Unauthorized: Only an Owner or Admin can schedule a match.');
  }

  const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `matches/${matchId}`;
  const now = new Date().toISOString();

  const maxPlayers = input.maxPlayers && input.maxPlayers > 0 ? input.maxPlayers : 12;

  const newMatch: Match = {
    id: matchId,
    groupId: input.groupId || DEFAULT_GROUP_ID,
    title: input.title.trim(),
    location: input.location.trim(),
    scheduledStartTime: input.scheduledStartTime,
    scheduledEndTime: input.scheduledEndTime || '',
    notes: input.notes?.trim() || null,
    maxPlayers,
    confirmedCount: 0,
    status: 'open',
    createdById: user.uid,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'matches', matchId), newMatch);
    return newMatch;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update match details (Owner or Admin only)
 * Safeguard: Cannot lower capacity below current confirmedCount
 */
export async function updateMatch(
  matchId: string,
  input: UpdateMatchInput,
  userRole: UserRole
): Promise<void> {
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new Error('Unauthorized: Only an Owner or Admin can edit a match.');
  }

  const path = `matches/${matchId}`;
  try {
    const matchSnap = await getDoc(doc(db, 'matches', matchId));
    if (!matchSnap.exists()) {
      throw new Error('Match not found.');
    }
    const current = matchSnap.data() as Match;

    // Capacity lowering validation
    if (input.maxPlayers !== undefined && input.maxPlayers < current.confirmedCount) {
      throw new Error(
        `Cannot reduce capacity to ${input.maxPlayers}: the match already has ${current.confirmedCount} confirmed bookings.`
      );
    }

    const updates: Partial<Match> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.location !== undefined) updates.location = input.location.trim();
    if (input.scheduledStartTime !== undefined) updates.scheduledStartTime = input.scheduledStartTime;
    if (input.scheduledEndTime !== undefined) updates.scheduledEndTime = input.scheduledEndTime;
    if (input.notes !== undefined) updates.notes = input.notes.trim() || null;
    if (input.maxPlayers !== undefined) {
      updates.maxPlayers = input.maxPlayers;
      // Re-evaluate full / open status
      if (current.confirmedCount >= input.maxPlayers) {
        updates.status = 'full';
      } else if (current.status === 'full' && current.confirmedCount < input.maxPlayers) {
        updates.status = 'open';
      }
    }

    await updateDoc(doc(db, 'matches', matchId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Cancel a match (Owner or Admin only)
 */
export async function cancelMatch(
  matchId: string,
  userRole: UserRole,
  reason?: string
): Promise<void> {
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new Error('Unauthorized: Only an Owner or Admin can cancel a match.');
  }

  const path = `matches/${matchId}`;
  try {
    const matchSnap = await getDoc(doc(db, 'matches', matchId));
    const current = matchSnap.exists() ? (matchSnap.data() as Match) : null;

    await updateDoc(doc(db, 'matches', matchId), {
      status: 'cancelled',
      notes: reason ? `[CANCELLED] ${reason}` : '[CANCELLED by Admin]',
      updatedAt: new Date().toISOString(),
    });

    if (current) {
      try {
        await createBroadcastNotification({
          type: 'match_cancelled',
          matchId: matchId,
          actorName: 'Admin',
          title: `Match Cancelled: ${current.title}`,
          message: reason
            ? `Admin cancelled "${current.title}": "${reason}"`
            : `The match "${current.title}" was cancelled by an admin.`,
          groupId: current.groupId,
        });
      } catch (e) {
        console.warn('Failed to send match cancellation notification:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reopen a cancelled or closed match (Owner or Admin only)
 */
export async function reopenMatch(
  matchId: string,
  userRole: UserRole
): Promise<void> {
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new Error('Unauthorized: Only an Owner or Admin can reopen a match.');
  }

  const path = `matches/${matchId}`;
  try {
    const matchSnap = await getDoc(doc(db, 'matches', matchId));
    if (!matchSnap.exists()) throw new Error('Match not found');
    const current = matchSnap.data() as Match;

    const newStatus: MatchStatus = current.confirmedCount >= current.maxPlayers ? 'full' : 'open';

    await updateDoc(doc(db, 'matches', matchId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

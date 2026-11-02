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
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, DEFAULT_GROUP_ID } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Group, Membership, UserRole, MembershipStatus } from '../types';

/**
 * Get Group details
 */
export async function getGroupDetails(groupId: string = DEFAULT_GROUP_ID): Promise<Group | null> {
  const path = `groups/${groupId}`;
  try {
    const snap = await getDoc(doc(db, 'groups', groupId));
    if (snap.exists()) {
      return snap.data() as Group;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Regenerate Group Invite Code (Owner only)
 */
export async function regenerateInviteCode(groupId: string = DEFAULT_GROUP_ID): Promise<string> {
  const path = `groups/${groupId}`;
  const newCode = `PITCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      inviteCode: newCode,
      updatedAt: new Date().toISOString(),
    });
    return newCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Set a custom Group Invite Code (Owner only)
 */
export async function setCustomInviteCode(
  newCode: string,
  groupId: string = DEFAULT_GROUP_ID
): Promise<string> {
  const cleanCode = newCode.trim().toUpperCase().replace(/\s+/g, '-');
  if (!cleanCode || cleanCode.length < 3) {
    throw new Error('كود الدعوة يجب أن يتكون من 3 أحرف على الأقل.');
  }
  const path = `groups/${groupId}`;
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      inviteCode: cleanCode,
      updatedAt: new Date().toISOString(),
    });
    return cleanCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Submit or verify Join Request via Invite Code
 */
export async function submitJoinRequest(
  user: FirebaseUser,
  inviteCode: string,
  groupId: string = DEFAULT_GROUP_ID
): Promise<Membership> {
  const membershipId = `${groupId}_${user.uid}`;
  const path = `memberships/${membershipId}`;

  try {
    // 1. Validate group and invite code
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    if (!groupSnap.exists()) {
      throw new Error('Football group not found.');
    }
    const group = groupSnap.data() as Group;

    if (group.inviteCode && group.inviteCode.toUpperCase() !== inviteCode.trim().toUpperCase()) {
      throw new Error('Invalid invite code. Please check your invitation link.');
    }

    // 2. Check if membership already exists
    const memSnap = await getDoc(doc(db, 'memberships', membershipId));
    if (memSnap.exists()) {
      const existing = memSnap.data() as Partial<Membership>;
      if (existing.status === 'approved') {
        return existing as Membership;
      }
      if (
        existing.status === 'pending' &&
        existing.groupId === groupId &&
        existing.userId === user.uid &&
        existing.role === 'member' &&
        existing.requestedAt
      ) {
        return existing as Membership;
      }
    }

    // 3. Create or repair a pending membership. Older profile syncs could leave
    // a document containing only displayName and photoURL.
    const newMembership: Membership = {
      id: membershipId,
      groupId,
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Player',
      photoURL: user.photoURL || null,
      role: 'member',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };

    await setDoc(doc(db, 'memberships', membershipId), newMembership);
    return newMembership;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for all memberships of the group
 */
export function subscribeToGroupMemberships(
  groupId: string = DEFAULT_GROUP_ID,
  callback: (members: Membership[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'memberships';
  const q = query(collection(db, 'memberships'), where('groupId', '==', groupId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Membership[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Membership);
      });
      // Sort: owner first, then admin, then member, ordered alphabetically
      list.sort((a, b) => {
        const roleOrder: Record<UserRole, number> = { owner: 0, admin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.displayName.localeCompare(b.displayName);
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
 * Real-time listener for current user's membership
 */
export function subscribeToUserMembership(
  userId: string,
  groupId: string = DEFAULT_GROUP_ID,
  callback: (mem: Membership | null) => void
) {
  const membershipId = `${groupId}_${userId}`;
  const path = `memberships/${membershipId}`;

  return onSnapshot(
    doc(db, 'memberships', membershipId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Membership);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Approve a pending membership (Owner or Admin)
 */
export async function approveMembership(
  membershipId: string,
  reviewerId: string
): Promise<void> {
  const path = `memberships/${membershipId}`;
  try {
    await updateDoc(doc(db, 'memberships', membershipId), {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reject a pending membership (Owner or Admin)
 */
export async function rejectMembership(
  membershipId: string,
  reviewerId: string
): Promise<void> {
  const path = `memberships/${membershipId}`;
  try {
    await updateDoc(doc(db, 'memberships', membershipId), {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Promote to Admin or Demote to Member (OWNER ONLY)
 * Strict requirement: Admins cannot promote/demote other members. Only Owner can.
 */
export async function changeMemberRole(
  membershipId: string,
  newRole: 'admin' | 'member',
  callerRole: UserRole
): Promise<void> {
  if (callerRole !== 'owner') {
    throw new Error('Unauthorized: Only the Group Owner can promote or demote squad roles.');
  }

  const path = `memberships/${membershipId}`;
  try {
    const memSnap = await getDoc(doc(db, 'memberships', membershipId));
    if (!memSnap.exists()) throw new Error('Member not found.');

    const target = memSnap.data() as Membership;
    if (target.role === 'owner') {
      throw new Error('The Owner role cannot be changed.');
    }

    await updateDoc(doc(db, 'memberships', membershipId), {
      role: newRole,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Remove a member from group (Owner or Admin)
 */
export async function removeMember(
  membershipId: string,
  callerRole: UserRole
): Promise<void> {
  const path = `memberships/${membershipId}`;
  try {
    const memSnap = await getDoc(doc(db, 'memberships', membershipId));
    if (!memSnap.exists()) return;

    const target = memSnap.data() as Membership;
    if (target.role === 'owner') {
      throw new Error('Cannot remove the Group Owner.');
    }
    if (target.role === 'admin' && callerRole !== 'owner') {
      throw new Error('Only the Group Owner can remove an Admin.');
    }

    await deleteDoc(doc(db, 'memberships', membershipId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

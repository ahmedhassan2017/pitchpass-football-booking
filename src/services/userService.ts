import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  DESIGNATED_OWNER_EMAIL,
  DEFAULT_GROUP_ID,
} from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, Membership, Group } from '../types';

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  // Check localStorage for any cached custom photo/name
  let cached: { displayName?: string; photoURL?: string | null } | null = null;
  try {
    const raw = localStorage.getItem(`pitchpass_profile_${user.uid}`);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {
    // Ignore storage errors
  }

  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!snap.exists()) {
      const initialPhoto = (cached && cached.photoURL !== undefined)
        ? cached.photoURL
        : (user.photoURL || null);
      const initialName = (cached && cached.displayName)
        ? cached.displayName
        : (user.displayName || user.email?.split('@')[0] || 'لاعب');

      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: initialName,
        photoURL: initialPhoto,
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newProfile);
      try {
        localStorage.setItem(`pitchpass_profile_${user.uid}`, JSON.stringify({
          displayName: initialName,
          photoURL: initialPhoto,
        }));
      } catch (e) {}
      return newProfile;
    } else {
      const data = snap.data() as UserProfile;

      // Preserve custom user-chosen profile photo & displayName!
      // NEVER overwrite custom avatar with Google's old photoURL on reload
      let resolvedPhotoURL = user.photoURL || null;
      if (data.photoURL !== undefined && data.photoURL !== null && data.photoURL !== '') {
        resolvedPhotoURL = data.photoURL;
      } else if (cached && cached.photoURL !== undefined) {
        resolvedPhotoURL = cached.photoURL;
      }

      // Priority for displayName: existing custom profile name > cached name > Google name
      let resolvedDisplayName = user.displayName || user.email?.split('@')[0] || 'لاعب';
      if (data.displayName && data.displayName.trim() !== '') {
        resolvedDisplayName = data.displayName.trim();
      } else if (cached && cached.displayName && cached.displayName.trim() !== '') {
        resolvedDisplayName = cached.displayName.trim();
      }

      await updateDoc(userRef, {
        displayName: resolvedDisplayName,
        photoURL: resolvedPhotoURL,
        lastLoginAt: now,
      });

      // Keep membership in sync as well so squad list reflects custom avatar immediately
      const memRef = doc(db, 'memberships', `${DEFAULT_GROUP_ID}_${user.uid}`);
      try {
        await setDoc(
          memRef,
          {
            displayName: resolvedDisplayName,
            photoURL: resolvedPhotoURL,
          },
          { merge: true }
        );
      } catch (memErr) {
        // Safe to ignore if membership doc doesn't exist yet
      }

      try {
        localStorage.setItem(`pitchpass_profile_${user.uid}`, JSON.stringify({
          displayName: resolvedDisplayName,
          photoURL: resolvedPhotoURL,
        }));
      } catch (e) {}

      return {
        ...data,
        id: user.uid,
        email: user.email || data.email || '',
        displayName: resolvedDisplayName,
        photoURL: resolvedPhotoURL,
        lastLoginAt: now,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update user display name and profile picture
 */
export async function updateUserProfile(
  user: FirebaseUser,
  updates: { displayName: string; photoURL?: string | null }
): Promise<UserProfile> {
  const currentAuthUser = auth.currentUser || user;
  const uid = currentAuthUser.uid;
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  try {
    const cleanName = updates.displayName.trim() || 'لاعب';
    const cleanPhoto = updates.photoURL ?? null;

    // 1. Save immediately in local cache
    try {
      localStorage.setItem(
        `pitchpass_profile_${uid}`,
        JSON.stringify({
          displayName: cleanName,
          photoURL: cleanPhoto,
        })
      );
    } catch (e) {}

    // 2. Safely update Firebase Auth user profile if native method available
    // Note: Firebase Auth updateProfile only accepts HTTP/HTTPS URLs under 2048 chars, not long data URLs
    const liveAuthUser = auth.currentUser;
    if (liveAuthUser && typeof liveAuthUser.getIdToken === 'function') {
      try {
        const isHttpUrl = cleanPhoto && (cleanPhoto.startsWith('http://') || cleanPhoto.startsWith('https://')) && cleanPhoto.length <= 2048;
        await updateProfile(liveAuthUser, {
          displayName: cleanName,
          photoURL: isHttpUrl ? cleanPhoto : (liveAuthUser.photoURL || undefined),
        });
      } catch (authErr) {
        console.warn('Firebase Auth updateProfile notice (persisting in Firestore):', authErr);
      }
    }

    // 3. Persist in Firestore user doc using setDoc with merge: true
    const updatedUserData = {
      id: uid,
      email: currentAuthUser.email || '',
      displayName: cleanName,
      photoURL: cleanPhoto,
      updatedAt: now,
      lastLoginAt: now,
    };
    await setDoc(userRef, updatedUserData, { merge: true });

    // 4. Update Membership record if present so squad roster immediately displays new name and avatar
    const membershipId = `${DEFAULT_GROUP_ID}_${uid}`;
    const membershipRef = doc(db, 'memberships', membershipId);
    try {
      await setDoc(
        membershipRef,
        {
          displayName: cleanName,
          photoURL: cleanPhoto,
        },
        { merge: true }
      );
    } catch (memErr) {
      console.warn('Membership update skipped or notice:', memErr);
    }

    return {
      id: uid,
      email: currentAuthUser.email || '',
      displayName: cleanName,
      photoURL: cleanPhoto,
      createdAt: now,
      lastLoginAt: now,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Bootstrap designated owner and default private group
 */
export async function bootstrapOwnerAndGroup(user: FirebaseUser): Promise<{
  group: Group;
  membership: Membership;
}> {
  const isOwner = user.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();
  const groupRef = doc(db, 'groups', DEFAULT_GROUP_ID);
  const membershipId = `${DEFAULT_GROUP_ID}_${user.uid}`;
  const membershipRef = doc(db, 'memberships', membershipId);

  // Check local cache for custom profile avatar
  let currentPhoto = user.photoURL || null;
  let currentName = user.displayName || 'Ahmed (Owner)';
  try {
    const raw = localStorage.getItem(`pitchpass_profile_${user.uid}`);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.displayName) currentName = p.displayName;
      if (p.photoURL !== undefined) currentPhoto = p.photoURL;
    }
  } catch (e) {}

  try {
    // 1. Ensure Group document exists
    const groupSnap = await getDoc(groupRef);
    let groupData: Group;

    if (!groupSnap.exists()) {
      groupData = {
        id: DEFAULT_GROUP_ID,
        name: 'PitchPass FC',
        ownerId: user.uid,
        ownerEmail: user.email || DESIGNATED_OWNER_EMAIL,
        inviteCode: 'PITCHPASS-V1',
        createdAt: new Date().toISOString(),
      };
      await setDoc(groupRef, groupData);
    } else {
      groupData = groupSnap.data() as Group;
    }

    // 2. Ensure Owner Membership exists
    const memSnap = await getDoc(membershipRef);
    let membershipData: Membership;

    if (!memSnap.exists()) {
      membershipData = {
        id: membershipId,
        groupId: DEFAULT_GROUP_ID,
        userId: user.uid,
        email: user.email || '',
        displayName: currentName,
        photoURL: currentPhoto,
        role: isOwner ? 'owner' : 'member',
        status: isOwner ? 'approved' : 'pending',
        requestedAt: new Date().toISOString(),
        reviewedAt: isOwner ? new Date().toISOString() : null,
        reviewedBy: isOwner ? user.uid : null,
      };
      await setDoc(membershipRef, membershipData);
    } else {
      membershipData = memSnap.data() as Membership;
      // If designated owner logged in, guarantee owner & approved role
      if (isOwner && (membershipData.role !== 'owner' || membershipData.status !== 'approved')) {
        await updateDoc(membershipRef, {
          role: 'owner',
          status: 'approved',
          reviewedAt: new Date().toISOString(),
        });
        membershipData.role = 'owner';
        membershipData.status = 'approved';
      }
    }

    return { group: groupData, membership: membershipData };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${DEFAULT_GROUP_ID}`);
  }
}

/**
 * Fetch existing membership for an authenticated user
 */
export async function fetchUserMembership(userId: string): Promise<Membership | null> {
  const membershipId = `${DEFAULT_GROUP_ID}_${userId}`;
  const path = `memberships/${membershipId}`;
  try {
    const snap = await getDoc(doc(db, 'memberships', membershipId));
    if (snap.exists()) {
      return snap.data() as Membership;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

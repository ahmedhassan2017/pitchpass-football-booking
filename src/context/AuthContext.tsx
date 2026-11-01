import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, DESIGNATED_OWNER_EMAIL, DEFAULT_GROUP_ID } from '../firebase/config';
import {
  syncUserProfile,
  bootstrapOwnerAndGroup,
  fetchUserMembership,
  loginWithGoogle,
  logoutUser,
  updateUserProfile,
} from '../services/userService';
import {
  subscribeToUserMembership,
  getGroupDetails,
  submitJoinRequest,
} from '../services/groupService';
import { UserProfile, Membership, Group } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  membership: Membership | null;
  group: Group | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  requestJoinWithCode: (code: string) => Promise<Membership>;
  refreshMembership: () => Promise<void>;
  refreshGroup: () => Promise<void>;
  updateProfileData: (displayName: string, photoURL?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check URL query parameters for invite code
  const getInviteCodeFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || params.get('invite') || null;
  };

  const refreshGroup = async () => {
    try {
      const g = await getGroupDetails(DEFAULT_GROUP_ID);
      if (g) setGroup(g);
    } catch (e) {
      console.warn('Error fetching group:', e);
    }
  };

  // Auth observer
  useEffect(() => {
    let unsubscribeMembership: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const isDesignatedOwner =
          currentUser.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();

        // 1. Check local cache first so initial baseline state preserves custom avatar & nickname
        let cachedDisplayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'لاعب';
        let cachedPhotoURL = currentUser.photoURL || null;
        try {
          const raw = localStorage.getItem(`pitchpass_profile_${currentUser.uid}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.displayName) cachedDisplayName = parsed.displayName;
            if (parsed.photoURL !== undefined) cachedPhotoURL = parsed.photoURL;
          }
        } catch (e) {}

        const initialProfile: UserProfile = {
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: cachedDisplayName,
          photoURL: cachedPhotoURL,
          createdAt: new Date().toISOString(),
        };
        setProfile(initialProfile);

        if (isDesignatedOwner) {
          setMembership({
            id: `${DEFAULT_GROUP_ID}_${currentUser.uid}`,
            groupId: DEFAULT_GROUP_ID,
            userId: currentUser.uid,
            email: currentUser.email || '',
            displayName: cachedDisplayName,
            photoURL: cachedPhotoURL,
            role: 'owner',
            status: 'approved',
            requestedAt: new Date().toISOString(),
          });
        }

        const syncData = async () => {
          // 2. Sync User Profile in Firestore
          try {
            const syncedProfile = await syncUserProfile(currentUser);
            if (syncedProfile) {
              setProfile(syncedProfile);
            }
          } catch (err) {
            console.warn('Profile sync notice (will retry when online):', err);
          }

          // 3. Fetch group
          try {
            const g = await getGroupDetails(DEFAULT_GROUP_ID);
            if (g) setGroup(g);
          } catch (err) {
            console.warn('Group fetch notice:', err);
          }

          // 4. Owner bootstrap or check invite
          try {
            if (isDesignatedOwner) {
              const { group: bootstrappedGroup, membership: ownerMem } =
                await bootstrapOwnerAndGroup(currentUser);
              if (bootstrappedGroup) setGroup(bootstrappedGroup);
              if (ownerMem) setMembership(ownerMem);
            } else {
              const existingMem = await fetchUserMembership(currentUser.uid);
              const urlCode = getInviteCodeFromUrl();

              if (!existingMem && urlCode) {
                try {
                  const newMem = await submitJoinRequest(currentUser, urlCode);
                  setMembership(newMem);
                } catch (inviteErr) {
                  console.warn('Invite code request error:', inviteErr);
                }
              } else if (existingMem) {
                setMembership(existingMem);
              }
            }
          } catch (err) {
            console.warn('Bootstrap or membership notice:', err);
          }

          // 5. Attach real-time listener to current user's membership
          try {
            unsubscribeMembership = subscribeToUserMembership(
              currentUser.uid,
              DEFAULT_GROUP_ID,
              (mem) => {
                if (mem) {
                  setMembership(mem);
                }
              }
            );
          } catch (err) {
            console.warn('Membership subscription notice:', err);
          }
        };

        await syncData();
      } else {
        setProfile(null);
        setMembership(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMembership) unsubscribeMembership();
    };
  }, []);

  const refreshMembership = async () => {
    if (!user) return;
    try {
      const isDesignatedOwner =
        user.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();

      if (isDesignatedOwner) {
        const { group: bootstrappedGroup, membership: ownerMem } =
          await bootstrapOwnerAndGroup(user);
        if (bootstrappedGroup) setGroup(bootstrappedGroup);
        if (ownerMem) setMembership(ownerMem);
      } else {
        const mem = await fetchUserMembership(user.uid);
        if (mem) setMembership(mem);
      }
    } catch (err) {
      console.warn('Error refreshing membership:', err);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
      setLoading(false);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
      setMembership(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const handleRequestJoinWithCode = async (code: string) => {
    if (!user) throw new Error('You must be signed in to join.');
    const newMem = await submitJoinRequest(user, code, DEFAULT_GROUP_ID);
    setMembership(newMem);
    return newMem;
  };

  const isOwner = useMemo(() => {
    return (
      membership?.role === 'owner' ||
      user?.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase()
    );
  }, [membership, user]);

  const isAdmin = useMemo(() => {
    return isOwner || (membership?.role === 'admin' && membership?.status === 'approved');
  }, [isOwner, membership]);

  const isApproved = useMemo(() => {
    return isOwner || membership?.status === 'approved';
  }, [isOwner, membership]);

  const handleUpdateProfileData = async (displayName: string, photoURL?: string | null) => {
    const targetUser = auth.currentUser || user;
    if (!targetUser) return;
    const cleanPhoto = photoURL ?? null;

    // Optimistically update profile and membership immediately
    setProfile((prev) =>
      prev
        ? { ...prev, displayName, photoURL: cleanPhoto }
        : {
            id: targetUser.uid,
            email: targetUser.email || '',
            displayName,
            photoURL: cleanPhoto,
            createdAt: new Date().toISOString(),
          }
    );
    setMembership((prev) => (prev ? { ...prev, displayName, photoURL: cleanPhoto } : null));

    try {
      localStorage.setItem(
        `pitchpass_profile_${targetUser.uid}`,
        JSON.stringify({
          displayName,
          photoURL: cleanPhoto,
        })
      );
    } catch (e) {}

    const updated = await updateUserProfile(targetUser, { displayName, photoURL: cleanPhoto });
    if (updated) {
      setProfile(updated);
      setMembership((prev) =>
        prev ? { ...prev, displayName: updated.displayName, photoURL: updated.photoURL ?? null } : null
      );
      if (auth.currentUser) {
        setUser(auth.currentUser);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        membership,
        group,
        loading,
        isOwner,
        isAdmin,
        isApproved,
        signIn: handleSignIn,
        signOut: handleSignOut,
        requestJoinWithCode: handleRequestJoinWithCode,
        refreshMembership,
        refreshGroup,
        updateProfileData: handleUpdateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

# PitchPass - Implementation Plan & Progress

## 1. Objectives & Overview
PitchPass is an exclusive Egyptian football match reservation and squad management platform with Firebase authentication and Firestore persistence, featuring Egyptian Arabic localization, dual Dark/Light mode, and real-time squad roster and match booking capabilities.

---

## 2. Issues Addressed & Resolved

### Issue 1: Mobile Header Profile Circular Avatar Layout
- **Root Cause**:
  In RTL mode on mobile screens (≤390px), horizontal header contents (brand name, live badge, theme toggle, language toggle, notifications bell, and profile button) exceeded the viewport width. Because the profile button was located at the far left end of the flex container without `flex-shrink-0`, it was pushed off the screen margin and clipped to a 4px sliver. Furthermore, avatar elements used square `rounded-lg` borders rather than circular `rounded-full` styling.
- **Solution**:
  - Enforced `flex-shrink-0` on the profile button and controls container.
  - Styled the user avatar as a clean circular element (`rounded-full ring-2 ring-emerald-500/50`).
  - Optimized mobile header horizontal footprint by rendering compact language indicators (`EN` / `عربي`) and displaying the `مباشر` live badge on screens `sm` and wider.
  - Bound avatar display to `profile?.photoURL || user.photoURL` so avatar updates reflect immediately in the header.

### Issue 2: Profile Photo Update `i.getIdToken is not a function` Error
- **Root Cause**:
  `AuthContext.tsx` previously re-set the user state via shallow spreading `setUser({ ...user })`. In JavaScript, shallow-spreading an instantiated class instance (`FirebaseUser`) strips all class prototype methods, specifically `getIdToken(forceRefresh)`. When `updateProfile` from `firebase/auth` or subsequent Firestore operations attempted to retrieve a token via `util.getModularInstance(user).getIdToken()`, the call threw `i.getIdToken is not a function`. Additionally, base64 image uploads exceed Firebase Auth's photoURL length limit (<2048 chars).
- **Solution**:
  - Removed `{ ...user }` shallow spreading in `AuthContext.tsx`, preserving the native `FirebaseUser` prototype.
  - Refactored `updateUserProfile` in `userService.ts` to prioritize `auth.currentUser` and safely invoke `updateProfile` with valid URL validation.
  - Used `setDoc(..., { merge: true })` for both `users/{uid}` and `memberships/{groupId}_{uid}` in Firestore, ensuring image uploads and preset avatar choices persist reliably and update across the roster and UI immediately.

---

## 3. Verification & Build
- `lint_applet` passed (`tsc --noEmit`).
- `compile_applet` passed (`vite build`).

# Football Match Booking App — Product Requirements & Implementation Roadmap

## Working instructions for Lovable
- Act as a senior full-stack engineer, software architect, and premium mobile UI/UX designer.
- This document is the source of truth for the project. Review ALL sections before proposing changes.
- **Do not start building yet.** First produce a technical plan, architecture, database schema, risks, dependencies, and acceptance criteria for each phase.
- Use Lovable Cloud for backend, persistent data, and Google authentication if supported; identify any configuration I must perform.
- Proceed **one phase at a time, only after explicit approval**. Start with Phase 1 after I approve its plan.
- Do not claim a feature is working unless you have implemented and verified it; report any limitations honestly.

## Product vision
A premium, mobile-first web app/PWA for a **private group of friends** to organize and reserve football matches on **any date or time**. Replace informal WhatsApp polls with real-time capacity-limited bookings. Multiple matches may coexist. Avoid unnecessary cost and complexity.

## 1. Accounts, invitations, and membership
- Sign in with Google; no SMS or phone OTP. Each user has a persistent profile, unique Google-linked identity, display name, and optional avatar.
- The **Owner** creates a private group and shares an invite link in WhatsApp. Invitees sign in and request access.
- An Owner/Admin approves or rejects access once; approved members remain members for future matches.
- Unapproved users cannot see private matches, members, reservations, or group details.
- Bootstrap the **first Owner securely** through an explicit verified setup/configuration step, not by letting any visitor claim the role.

## 2. Authorization and roles (enforced in backend/database)
- **Owner:** full control; approve/reject members; create/edit/cancel matches; promote members to Admin; demote Admins; manage group settings.
- **Admin:** approve/reject members; create/edit/cancel matches; manage bookings where authorized; **cannot** assign/remove Admins or change Owner status.
- **Member:** see matches and players, book an available spot, cancel **only their own** booking, receive notifications; cannot create/edit/cancel matches.
- Provide a Manage Members screen for the Owner. Never treat hidden UI controls as security; enforce RBAC and group isolation at the backend/database level.

## 3. Match administration
- Owner/Admin creates a match with title, date, time, location, optional notes, and maximum players (**default 12**).
- Booking opens immediately after match creation; **no fixed Friday schedule** and no mandatory recurring sessions.
- Support multiple upcoming matches at once, independent booking lists, and the same user joining multiple **different** matches.
- Owner/Admin can edit or cancel a match, manually close/reopen booking before its start, and see participation.
- Do not lower a match's capacity below its confirmed bookings without a deliberate, safe resolution process.
- Do not allow new reservations after the match has started or if a match is canceled.
- Home: Upcoming Matches, My Bookings, Past Matches, Match Details, and Admin screens.

## 4. Booking rules — business-critical
- **First come, first served. No waiting list.** One confirmed reservation per user per match.
- A match must **never exceed its maximum player limit** (normally 12), even with simultaneous requests.
- 11/12 -> one successful booking -> 12/12 FULL; further booking attempts are rejected by the server.
- If someone cancels: 12/12 -> 11/12, reopen the slot instantly. The first eligible person to book it wins.
- Enforce concurrency with atomic backend/database transactions and appropriate unique constraints; do not trust client-side counts.
- Return clear success/error messages and synchronize counts and participant lists in real time across devices.
- An existing participant cannot make a second reservation for the same match through another page or repeated taps.

## 5. Notifications
- **On every player booking cancellation**, generate an in-app notification for **ALL approved group members**, including those **already booked** in that match.
- Example: "Ahmed canceled Friday's match. A spot is now open — 11/12 players." Include match identity, who canceled, and action to view the match.
- Push the alert to **every approved member who has enabled push** (including booked players), subject to device/browser support.
- Keep a persistent Notification Center with timestamps, read/unread state, and associated match.
- Also notify affected members when an Admin cancels a match or changes important details.
- Don't promise guaranteed push delivery: document permissions, iPhone/PWA limitations, and needed external setup.

## 6. Design and platform
- Premium dark sports aesthetic: deep navy/black, electric green accents, refined typography, polished cards, player avatars, subtle transitions.
- Mobile-first and touch-friendly, with high quality responsive desktop/tablet UI; **not** a basic form or generic dashboard.
- Clear match cards with date, time, venue, 8/12 capacity, full/available status, names, Join/Cancel action.
- PWA installation support including manifest, icons, service worker, and compatible push notifications.
- Accessible loading/error/empty states, clear user feedback, and localization-ready components.

## 7. Security, data, and reliability
- Persistent real backend and database (not localStorage as source of truth).
- Plan data entities: users/profiles, groups, memberships/roles, invite links, matches, reservations, notifications, push subscriptions.
- Enforce unique membership and unique active reservation per (user, match); protect private data and sensitive operations.
- Prevent Owner privilege escalation and cross-group data access, and validate all server-side permissions.
- Handle two simultaneous claims on the final spot correctly. Maintain auditability for admin actions.

## 8. Phased roadmap — implement ONLY on approval
- **Phase 1 — Foundation & UI:** Lovable Cloud setup, database baseline, Google sign-in, secure Owner setup, premium app shell/navigation. Verify sign-in, persisted session, and Owner access.
- **Phase 2 — Private group & permissions:** Invite links, pending approvals, member list, Owner/Admin/Member roles, promotion/demotion. Verify direct-API access denial for unauthorized actions.
- **Phase 3 — Match management:** Create/edit/cancel matches at any date/time; match cards, details, upcoming and past listings. Verify storage and role checks.
- **Phase 4 — Bookings & realtime:** One booking/user/match, capacity limit, cancellation, auto-reopen, live updates. Verify concurrency using two users competing for the last slot.
- **Phase 5 — Notifications & PWA:** Persistent in-app alerts to ALL approved members on cancellation, push to opted-in devices, install support. Verify Android/iPhone scenarios and report platform limitations.
- **Phase 6 — Hardening:** Test end-to-end flows, security and DB policies, responsiveness, accessibility, performance, production deployment readiness, and critical regression cases.

## 9. Mandatory verification cases
- A user cannot access private group content before approval.
- A Member cannot create/edit/cancel matches; Admin cannot grant Admin roles; only Owner can.
- One user cannot book the same match twice; the 13th player never gets a spot in a 12-player match.
- Two users clicking the last spot simultaneously result in **exactly one** successful reservation.
- Canceling opens a place immediately; any eligible unbooked member can claim it, with no waitlist.
- A cancellation creates in-app notifications for **every** approved member, booked or unbooked; push works for opted-in compatible devices.
- Multiple matches and their reservations remain independent; no fixed weekly-day assumptions.
- An Admin can edit/cancel a match; users cannot book canceled or already-started matches.

## 10. Out of scope
No waiting lists, payment systems, tournament brackets, automatic weekly recurring matches, or OTP/SMS.

## 11. What to return BEFORE any coding
1. Confirm you read this whole document and summarize all six phases and the non-negotiable booking/notification rules.
2. Propose the architecture, database schema and constraints, authorization/RLS design, and concurrency mechanism.
3. State which services/configuration/costs depend on my actions and list any uncertainties.
4. Provide detailed tasks and acceptance tests **for Phase 1 only**, while keeping Phases 2–6 as an overview.
5. Ask for my explicit approval **before implementing Phase 1**. Do not implement the other phases automatically.

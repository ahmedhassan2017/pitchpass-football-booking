export type UserRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type MatchStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type ReservationStatus = 'confirmed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  inviteCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Membership {
  id: string; // ${groupId}_${userId}
  groupId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  status: MembershipStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface Match {
  id: string;
  groupId: string;
  title: string;
  location: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  notes?: string | null;
  maxPlayers: number; // Default 12
  confirmedCount: number;
  status: MatchStatus;
  createdById: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string; // ${matchId}_${userId}
  matchId: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  bookedAt: string;
  status: ReservationStatus;
}

export interface AppNotification {
  id: string;
  groupId: string;
  type: 'cancellation_opened' | 'match_updated' | 'match_cancelled' | 'member_approved' | 'general';
  matchId?: string | null;
  actorId?: string | null;
  actorName: string;
  title: string;
  message: string;
  createdAt: string;
  readBy: string[];
}

export type ActiveTab = 'matches' | 'bookings' | 'squad' | 'notifications';

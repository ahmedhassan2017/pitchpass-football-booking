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
  arrayUnion,
} from 'firebase/firestore';
import { db, DEFAULT_GROUP_ID } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AppNotification } from '../types';

/**
 * Dispatch an in-app notification to ALL squad members
 */
export async function createBroadcastNotification(
  data: {
    type: 'cancellation_opened' | 'match_updated' | 'match_cancelled' | 'member_approved' | 'general';
    matchId?: string | null;
    actorId?: string;
    actorName: string;
    title: string;
    message: string;
    groupId?: string;
  }
): Promise<AppNotification> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `notifications/${notifId}`;
  const now = new Date().toISOString();

  const newNotif: AppNotification = {
    id: notifId,
    groupId: data.groupId || DEFAULT_GROUP_ID,
    type: data.type || 'general',
    matchId: data.matchId || null,
    actorId: data.actorId || null,
    actorName: data.actorName || 'لاعب',
    title: data.title || 'إشعار جديد',
    message: data.message || '',
    createdAt: now,
    readBy: [],
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), newNotif);

    // Also trigger local device notification if permitted
    triggerDeviceNotification(newNotif.title, newNotif.message);

    return newNotif;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Real-time subscription to group notifications
 */
export function subscribeToGroupNotifications(
  groupId: string = DEFAULT_GROUP_ID,
  callback: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'notifications';
  const q = query(collection(db, 'notifications'), where('groupId', '==', groupId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AppNotification);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Error fetching notifications:', err);
    }
  );
}

/**
 * Mark a single notification as read by the current user
 */
export async function markNotificationAsRead(notifId: string, userId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      readBy: arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Mark all visible notifications as read by user
 */
export async function markAllNotificationsAsRead(notifIds: string[], userId: string): Promise<void> {
  try {
    const promises = notifIds.map((id) =>
      updateDoc(doc(db, 'notifications', id), {
        readBy: arrayUnion(userId),
      })
    );
    await Promise.allSettled(promises);
  } catch (e) {
    console.warn('Error marking all notifications as read:', e);
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete all notifications from Firestore
 */
export async function deleteAllNotifications(notifIds: string[]): Promise<void> {
  try {
    const promises = notifIds.map((id) => deleteDoc(doc(db, 'notifications', id)));
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
  }
}

/**
 * Request Browser Push / Notification Permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop/device notifications.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Trigger Native Browser / Device Notification
 */
export function triggerDeviceNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (e) {
      // In service worker contexts or restricted iframes, Notification constructor can fail gracefully
      console.warn('Native notification failed:', e);
    }
  }
}

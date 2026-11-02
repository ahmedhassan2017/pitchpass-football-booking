import type { User } from 'firebase/auth';
import { getDocFromServer, type DocumentReference } from 'firebase/firestore';

/** Check the server before starting a write that could otherwise wait offline. */
export async function requireFirestoreConnection(user: User, reference: DocumentReference): Promise<void> {
  try {
    await user.getIdToken();
    await getDocFromServer(reference);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (/securetoken\.googleapis\.com|token-service-api-has-not-been-used/i.test(message)) {
      throw new Error('Firebase Authentication is unavailable: enable the Secure Token API for this Google Cloud project, then sign in again.');
    }
    if (/client is offline|unavailable|failed to fetch|network-request-failed/i.test(message)) {
      throw new Error('Cannot reach Firebase right now. Check the connection and try again.');
    }
    if (/permission-denied|missing or insufficient permissions/i.test(message)) {
      throw new Error('Firebase denied access. Check the deployed Firestore rules for this project.');
    }
    throw error;
  }
}

export function getWriteErrorMessage(error: unknown, isArabic: boolean): string {
  const message = error instanceof Error ? error.message : String(error);
  if (!isArabic) return message;
  if (message.includes('Secure Token API')) {
    return 'خدمة تسجيل الدخول في Firebase متوقفة. فعّل Secure Token API في مشروع Google Cloud، وبعدها سجّل دخول من جديد.';
  }
  if (message.includes('Cannot reach Firebase')) {
    return 'تعذر الاتصال بـ Firebase الآن. تحقق من الاتصال وحاول مرة أخرى.';
  }
  if (message.includes('Firebase denied access')) {
    return 'Firebase رفض العملية. راجع قواعد Firestore المنشورة لهذا المشروع.';
  }
  return message;
}

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

type PushNotification = {
  userId: string;
  title: string;
  message: string;
  orderId?: string | null;
};

let vapidConfigured = false;

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

function isExpiredSubscription(reason: unknown) {
  if (!reason || typeof reason !== 'object' || !('statusCode' in reason)) return false;
  const statusCode = Number(reason.statusCode);
  return statusCode === 404 || statusCode === 410;
}

export async function sendPushNotification(notification: PushNotification) {
  if (!configureVapid()) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: notification.userId } });
    if (!subscriptions.length) return;

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      url: notification.orderId ? `/orders/${encodeURIComponent(notification.orderId)}` : '/orders',
    });

    const results = await Promise.allSettled(subscriptions.map((subscription) =>
      webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payload),
    ));

    const expiredIds = results.flatMap((result, index) =>
      result.status === 'rejected' && isExpiredSubscription(result.reason) ? [subscriptions[index].id] : [],
    );
    if (expiredIds.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: expiredIds } } });
  } catch (error) {
    console.error('[push] send failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
  }
}

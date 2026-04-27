// apps/player-web/lib/utils/push-notifications.ts

import { config } from '@/lib/config';
import api from '@/lib/api';

const VAPID_PUBLIC_KEY = config.push.vapidKey;

/**
 * Converts a VAPID key from a URL-safe base64 string to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the service worker.
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  console.error('Service Worker not supported in this browser.');
  return null;
}

/**
 * Requests notification permission from the user.
 */
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  console.error('Notifications not supported in this browser.');
  return 'denied';
}

/**
 * Subscribes the user to push notifications.
 */
export async function subscribeUserToPush() {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key is not defined.');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  return subscription;
}

/**
 * Sends the push subscription to the backend server.
 */
export async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    await api.post('/notifications/subscribe', {
        type: 'web-push',
        subscription: subscription.toJSON(),
    }, {
        headers: {
            'Content-Type': 'application/json',
            // Assuming an auth token is handled by an Axios interceptor or similar
        }
    });
    console.log('Push subscription sent to server.');
  } catch (error) {
    console.error('Failed to send push subscription to server:', error);
  }
}

/**
 * Main function to handle the full subscription process.
 */
export async function handleSubscription() {
    await registerServiceWorker();
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
        const subscription = await subscribeUserToPush();
        if (subscription) {
            await sendSubscriptionToServer(subscription);
        }
    }
}

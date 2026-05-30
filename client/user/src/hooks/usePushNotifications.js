import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export const usePushNotifications = (isLoggedIn) => {
  useEffect(() => {
    if (!isLoggedIn || !Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const setupPushNotifications = async () => {
      try {
        // Request permissions
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('User denied push notification permissions.');
          return;
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', (token) => {
          if (!isMounted) return;
          console.log('Push registration success, token: ' + token.value);
          // TODO: Send token to your backend API here
        });

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          if (!isMounted) return;
          console.log('Push received: ', notification);
          toast.success(notification.title || 'New Notification');
        });

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          if (!isMounted) return;
          console.log('Push action performed: ', notification);
        });

      } catch (error) {
        console.error('Failed to setup push notifications:', error);
      }
    };

    setupPushNotifications();

    return () => {
      isMounted = false;
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isLoggedIn]);
};

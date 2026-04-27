// apps/player-web/public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Owl Turf', body: 'You have a new notification.' };

  const options = {
    body: data.body,
    icon: '/favicon.ico', // Default icon
    badge: '/badge.png', // A smaller icon for the notification bar
    data: {
      url: data.url || '/', // URL to open on click
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(c => c.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', (event) => {
  // Perform install steps
  self.skipWaiting();
});

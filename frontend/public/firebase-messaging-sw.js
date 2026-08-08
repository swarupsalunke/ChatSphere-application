importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAJHKUFULvj-OZy0ar1_os7WWQH6QXQQm4",
  authDomain: "chatsphere-181823.firebaseapp.com",
  projectId: "chatsphere-181823",
  storageBucket: "chatsphere-181823.firebasestorage.app",
  messagingSenderId: "67792947645",
  appId: "1:67792947645:web:5aa698132eb2cb97136ad4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || "ChatSphere";
  const body = payload.data?.body || "New message";
  const unreadCount = Number(payload.data?.unreadCount || 1);

  // Set app icon badge
  if ("setAppBadge" in self.registration) {
    self.registration.setAppBadge(unreadCount).catch(() => {});
  }

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "chatsphere-message",
    data: {
      url: payload.data?.url || "/chat",
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    event.notification.data?.url || "/chat";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
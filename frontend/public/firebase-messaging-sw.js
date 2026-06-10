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
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});
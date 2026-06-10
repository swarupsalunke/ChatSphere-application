import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAJHKUFULvj-OZy0ar1_os7WWQH6QXQQm4",
  authDomain: "chatsphere-181823.firebaseapp.com",
  projectId: "chatsphere-181823",
  storageBucket: "chatsphere-181823.firebasestorage.app",
  messagingSenderId: "67792947645",
  appId: "1:67792947645:web:5aa698132eb2cb97136ad4",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);
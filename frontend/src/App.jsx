import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        const token = await getToken(messaging, {
          vapidKey:
            "BFbKEXjcEV5y3SMbSDd6f0Zv7Z59M7vVhE9OXPifAtSwdJ-m-1ZgIA9FMQdYRnDzaMTZ6i6xbsKVVinJD3kchwQ",
        });

        console.log("FCM TOKEN:", token);

        // Foreground notification listener
        onMessage(messaging, (payload) => {
          console.log("FCM RECEIVED:", payload);

          if (payload.notification) {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: "/logo192.png",
            });
          }
        });
      } catch (err) {
        console.error("FCM Error:", err);
      }
    };

    setupFCM();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}

export default App;
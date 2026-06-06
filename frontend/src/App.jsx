import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  useEffect(() => {
    const errorHandler = (e) => {
      alert("ERROR: " + e.message);
    };

    const rejectionHandler = (e) => {
      alert("PROMISE ERROR: " + e.reason);
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
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
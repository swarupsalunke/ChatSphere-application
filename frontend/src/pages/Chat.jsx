import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import API from "../api/api";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

import {
  Settings, Search, Send, Mic, Paperclip, Smile, X,
  CornerUpLeft, CheckCheck, Check, Phone, Video,
  MoreVertical, ChevronLeft, Moon, Sun, LogOut, Camera,
  MessageCircle, Download, StopCircle, Film,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

// ── SLICES ──
import { updateUser, logout } from "../store/slices/authSlice";
import {
  setUsers, updateUserInList,
  setSelectedUser, clearSelectedUser,
  setMessages, addMessage,
  deleteMessageById, deleteMessagesByIds,
  updateMessageStatus,
  setOnlineUsers, incrementUnread, clearUnread,
  setLastMessages, updateLastMessage,
  setIsTyping, resetChat,
} from "../store/slices/chatSlice";
import {
  toggleTheme, openSettings, closeSettings,
  openProfileModal, closeProfileModal,
  toggleEmojiPicker, toggleGifPicker,
  setReplyMessage, clearReplyMessage,
  setPreviewUrl, clearPreviewUrl,
  showMobileChat as showMobileChatAction, hideMobileChat,
  exitSelectionMode, toggleMessageSelection,
  openStatusViewer, closeStatusViewer,
  setViewerIndex, removeFromViewerGroup,
  openStatusUpload, closeStatusUpload,
  setStatusCaption, resetUI,
  setChatTheme,   // ← NEW
} from "../store/slices/uiSlice";
import { setStatuses, addStatus, removeStatus } from "../store/slices/statusSlice";

import { getPhoneContacts } from "../utils/contactPicker";

// 🔑 Apni Giphy API key yahan dalo
const gf = new GiphyFetch("2wRT5NpcbdhP1SMRIwnF6EtAi7Usawnx");

const socket = io("https://chatsphere-application-2.onrender.com");

// ── CHAT THEME PRESETS ──
const COLOR_PRESETS = [
  { label: "Default", value: "" },
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Forest", value: "#1b2f1b" },
  { label: "Rose", value: "#2d1b1b" },
  { label: "Ocean", value: "#0d2137" },
  { label: "Violet", value: "#1e1030" },
  { label: "Sand", value: "#f5e6c8" },
  { label: "Lavender", value: "#e8e0f0" },
  { label: "Mint", value: "#d4f1e4" },
  { label: "Blush", value: "#fde8e8" },
];

const PATTERN_PRESETS = [
  {
    label: "Dots",
    type: "css",
    value: "radial-gradient(circle, #ffffff22 1px, transparent 1px)",
    size: "20px 20px",
    base: "#1a1a2e",
  },
  {
    label: "Grid",
    type: "css",
    value:
      "linear-gradient(#ffffff11 1px, transparent 1px), linear-gradient(90deg, #ffffff11 1px, transparent 1px)",
    size: "24px 24px",
    base: "#0d2137",
  },
  {
    label: "Diagonal",
    type: "css",
    value:
      "repeating-linear-gradient(45deg, #ffffff0a 0px, #ffffff0a 1px, transparent 1px, transparent 10px)",
    size: "auto",
    base: "#1b2f1b",
  },
  {
    label: "Crosses",
    type: "css",
    value:
      "radial-gradient(circle, #ffffff18 2px, transparent 2px), radial-gradient(circle, #ffffff18 2px, transparent 2px)",
    size: "20px 20px, 30px 30px",
    base: "#2d1b1b",
  },
  {
    label: "Cubes",
    type: "url",
    value: "https://www.transparenttextures.com/patterns/cubes.png",
    base: "#1a1a2e",
  },
  {
    label: "Flowers",
    type: "url",
    value: "https://www.transparenttextures.com/patterns/flowers.png",
    base: "#1b2f1b",
  },
  {
    label: "Waves",
    type: "url",
    value: "https://www.transparenttextures.com/patterns/worn-dots.png",
    base: "#0d2137",
  },
  {
    label: "Leaf",
    type: "url",
    value: "https://www.transparenttextures.com/patterns/leaf.png",
    base: "#1b2f1b",
  },
];

/** Build a CSS background string from a chatTheme object */
const buildChatBackground = (chatTheme) => {
  if (!chatTheme || !chatTheme.value) return "var(--bg-chat)";

  if (chatTheme.type === "color") return chatTheme.value;

  if (chatTheme.type === "css") {
    const size = chatTheme.size !== "auto" ? `, ${chatTheme.size}` : "";
    return `${chatTheme.value}${size ? ` ${chatTheme.size}` : ""}, ${chatTheme.base || "#1a1a2e"}`;
  }

  if (chatTheme.type === "url") {
    return `url(${chatTheme.value}) center/auto, ${chatTheme.base || "#1a1a2e"}`;
  }

  return "var(--bg-chat)";
};

const Chat = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── SELECTORS ──
  const { user } = useSelector((s) => s.auth);
  const {
    users, selectedUser, messages,
    onlineUsers, unreadMessages, lastMessages, isTyping,
  } = useSelector((s) => s.chat);
  const {
    theme,
    showSettings, showProfileModal, profileUser,
    showEmojiPicker, showGifPicker,
    replyMessage, previewUrl,
    showMobileChat,
    selectionMode, selectedMessages,
    showStatusViewer, viewerGroup, viewerIndex,
    showStatusUpload, statusFile, statusPreview, statusCaption,
    chatTheme,   // ← NEW
  } = useSelector((s) => s.ui);
  const { statuses } = useSelector((s) => s.status);

  // ── REFS ──
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioChunksRef = useRef([]);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ── LOCAL STATE ──
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [settingsName, setSettingsName] = useState("");
  const [settingsFile, setSettingsFile] = useState(null);
  const [settingsPreview, setSettingsPreview] = useState(null);
  const [search, setSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [gifSearch, setGifSearch] = useState("");
  const [themeTab, setThemeTab] = useState("color"); // ← NEW: "color" | "pattern"
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingSignal, setIncomingSignal] = useState(null);

  // ── THEME SYNC ──
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ── LOGIN CHECK ──
  useEffect(() => {
    if (!user) navigate("/");
  }, []);

  // ── AUTO SCROLL ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── SETTINGS OPEN ──
  useEffect(() => {
    if (showSettings && user) {
      setSettingsName(user.name);
      setSettingsPreview(user.profilePic);
    }
  }, [showSettings, user]);

  // ── FETCH USERS ──
  // useEffect(() => {
  //   if (!user) return;
  //   API.get("/api/user").then(({ data }) => {
  //     dispatch(setUsers(data.filter((u) => u._id !== user._id)));
  //   });
  // }, [user]);

  // ── ONLINE USERS ──
  useEffect(() => {
    socket.on("getOnlineUsers", (list) => dispatch(setOnlineUsers(list)));
    return () => socket.off("getOnlineUsers");
  }, []);

  const servers = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  // ── JOIN ROOM ──
  useEffect(() => {
    if (user) socket.emit("join", user._id);
  }, [user]);

  // ── FETCH MESSAGES ──
  useEffect(() => {
    if (!selectedUser || !user) return;
    API.get(`/api/message/${selectedUser._id}?senderId=${user._id}`)
      .then(({ data }) => dispatch(setMessages(data)));
  }, [selectedUser, user]);

  // ── NOTIFICATION PERMISSION ──
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, []);

  // ── PROFILE UPDATED (socket) ──
  useEffect(() => {
    socket.on("profileUpdated", (updatedUser) => {
      dispatch(updateUserInList(updatedUser));
      if (user?._id === updatedUser._id) dispatch(updateUser(updatedUser));
    });
    return () => socket.off("profileUpdated");
  }, [user]);

  // ── RECEIVE MESSAGE ──
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      const isCurrentChat =
        selectedUser &&
        (msg.sender === selectedUser._id || msg.receiver === selectedUser._id);

      if (isCurrentChat) {
        dispatch(addMessage(msg));
        const preview =
          msg.content ||
          (msg.file?.endsWith(".webm") ? "🎤 Voice message" : msg.file ? "📎 File" : "");
        dispatch(updateLastMessage({
          userId: msg.sender === user._id ? msg.receiver : msg.sender,
          msg: { ...msg, preview },
        }));
        socket.emit("messageDelivered", msg);
      }

      if (
        msg.sender !== user._id &&
        (!selectedUser || selectedUser._id !== msg.sender)
      ) {
        dispatch(incrementUnread(msg.sender));

        // Safe notification check
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("New Message", {
            body: msg.content || "📎 File / Voice message",
          });
        }

        toast(`New message from ${msg.senderName || "Someone"}`, {
          icon: "💬",
          duration: 3000,
        });
      }
    });
    return () => socket.off("receiveMessage");
  }, [selectedUser, user]);

  // ── FETCH LAST MESSAGES ──
  useEffect(() => {
    if (!user) return;
    API.get("/api/message/last/all")
      .then(({ data }) => dispatch(setLastMessages(data)))
      .catch(console.log);
  }, [user]);

  // ── SEEN ──
  useEffect(() => {
    messages.forEach(async (msg) => {
      if (msg.receiver === user?._id && msg.status !== "seen") {
        await API.put(`/api/message/seen/${msg._id}`);
        socket.emit("messageSeen", msg._id);
      }
    });
  }, [messages]);

  // ── DELIVERED / SEEN SOCKET ──
  useEffect(() => {
    socket.on("messageDelivered", (id) =>
      dispatch(updateMessageStatus({ id, status: "delivered" }))
    );
    socket.on("messageSeen", (id) =>
      dispatch(updateMessageStatus({ id, status: "seen" }))
    );
    return () => {
      socket.off("messageDelivered");
      socket.off("messageSeen");
    };
  }, []);

  // ── FETCH STATUSES ──
  useEffect(() => {
    API.get("/api/status")
      .then(({ data }) => dispatch(setStatuses(data)))
      .catch(console.log);
  }, []);

  // ── TYPING ──
  useEffect(() => {
    socket.on("typing", (id) => {
      if (selectedUser?._id === id) dispatch(setIsTyping(true));
    });
    socket.on("stopTyping", (id) => {
      if (selectedUser?._id === id) dispatch(setIsTyping(false));
    });
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [selectedUser]);

  // ── MESSAGE DELETED ──
  useEffect(() => {
    socket.on("messageDeleted", (id) => dispatch(deleteMessageById(id)));
    return () => socket.off("messageDeleted");
  }, []);

  // ══════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════

  const filteredUsers = users
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aTime = lastMessages[a._id]?.createdAt
        ? new Date(lastMessages[a._id].createdAt).getTime() : 0;
      const bTime = lastMessages[b._id]?.createdAt
        ? new Date(lastMessages[b._id].createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const handleSelectUser = (u) => {
    dispatch(setSelectedUser(u));
    dispatch(clearUnread(u._id));
    dispatch(exitSelectionMode());
    dispatch(showMobileChatAction());
  };

  const handleBack = () => {
    dispatch(hideMobileChat());
    dispatch(clearSelectedUser());
  };



  // ── BROWSER / ANDROID BACK BUTTON ──
  useEffect(() => {
    const handleBrowserBack = () => {
      // If settings is open, close settings first
      if (showSettings) {
        dispatch(closeSettings());
        window.history.pushState(null, "", window.location.href);
        return;
      }

      // If a chat is open, go back to contacts
      if (selectedUser) {
        handleBack();
        window.history.pushState(null, "", window.location.href);
        return;
      }

      // If already on contacts, allow normal browser back
      window.history.back();
    };

    // Create a history entry so Back can be handled inside ChatSphere
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handleBrowserBack);

    return () => {
      window.removeEventListener("popstate", handleBrowserBack);
    };
  }, [selectedUser, showSettings]);




  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetChat());
    dispatch(resetUI());
    toast.success("Logged out");
    navigate("/");
  };

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith("image")) {
      dispatch(setPreviewUrl(URL.createObjectURL(selected)));
    }
    e.target.value = "";
  };

  const handleSettingsFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setSettingsFile(selected);
    setSettingsPreview(URL.createObjectURL(selected));
  };

  // ── SAVE PROFILE ──
  const saveProfile = async () => {
    const toastId = toast.loading("Saving profile...");
    try {
      let profilePic = user.profilePic;
      if (settingsFile) {
        const formData = new FormData();
        formData.append("file", settingsFile);
        const uploadRes = await API.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        profilePic = uploadRes.data.fileUrl;
      }
      const { data } = await API.put(`/api/user/profile/${user._id}`, {
        name: settingsName,
        profilePic,
      });
      dispatch(updateUser(data));
      dispatch(updateUserInList(data));
      socket.emit("profileUpdated", data);
      dispatch(closeSettings());
      toast.success("Profile updated!", { id: toastId });
    } catch (err) {
      toast.error("Failed to update profile", { id: toastId });
    }
  };

  // ── UPLOAD STATUS ──
  const uploadStatus = async () => {
    if (!statusFile) return;
    const toastId = toast.loading("Uploading status...");
    try {
      const formData = new FormData();
      formData.append("file", statusFile);
      const uploadRes = await API.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const statusRes = await API.post("/api/status", {
        user: user._id,
        media: uploadRes.data.fileUrl,
        caption: statusCaption,
      });
      dispatch(addStatus(statusRes.data));
      dispatch(closeStatusUpload());
      toast.success("Status uploaded!", { id: toastId });
    } catch (err) {
      toast.error("Failed to upload status", { id: toastId });
    }
  };

  // ── DELETE STATUS ──
  const deleteStatus = async (statusId) => {
    try {
      await API.delete(`/api/status/${statusId}`);
      dispatch(removeStatus(statusId));
      dispatch(removeFromViewerGroup(statusId));
      toast.success("Status deleted");
    } catch (err) {
      toast.error("Failed to delete status");
    }
  };

  // ── RECORDING ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast("Recording started...", { icon: "🎙️", duration: 2000 });
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        if (audioBlob.size === 0) return;
        const audioFile = new File(
          [audioBlob], `voice-${Date.now()}.webm`,
          { type: "audio/webm;codecs=opus" }
        );
        const formData = new FormData();
        formData.append("file", audioFile);
        const uploadRes = await API.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const msgRes = await API.post("/api/message", {
          sender: user._id,
          receiver: selectedUser._id,
          content: "",
          file: uploadRes.data.fileUrl,
        });
        socket.emit("sendMessage", msgRes.data);
        setIsRecording(false);
        toast.success("Voice message sent!");
      } catch (err) {
        toast.error("Failed to send voice message");
      }
    };
  };

  // ── DELETE SELECTED MESSAGES ──
  const deleteSelectedMessages = async () => {
    if (!window.confirm("Delete selected messages?")) return;
    for (let id of selectedMessages) {
      await API.delete(`/api/message/${id}`);
      socket.emit("deleteMessage", id);
    }
    dispatch(deleteMessagesByIds(selectedMessages));
    dispatch(exitSelectionMode());
    toast.success("Messages deleted");
  };

  // ── SEND MESSAGE ──
  const sendMessage = async () => {
    if (!message && !file) return;
    try {
      let fileUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await API.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileUrl = uploadRes.data.fileUrl;
      }
      const msgRes = await API.post("/api/message", {
        sender: user._id,
        receiver: selectedUser._id,
        content: message,
        file: fileUrl,
        replyTo: replyMessage?._id || null,
      });

      // 👇 Immediately show message
      dispatch(addMessage(msgRes.data));

      const preview =
        msgRes.data.content ||
        (msgRes.data.file?.endsWith(".webm")
          ? "🎤 Voice message"
          : msgRes.data.file
            ? "📎 File"
            : "");

      dispatch(
        updateLastMessage({
          userId: selectedUser._id,
          msg: { ...msgRes.data, preview },
        })
      );

      // 👇 Send to socket
      socket.emit("sendMessage", msgRes.data);

      setMessage("");
      setFile(null);
      dispatch(clearPreviewUrl());
      dispatch(clearReplyMessage());
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  // ── SEND GIF ──
  const sendGif = async (gif) => {
    try {
      const gifUrl = gif.images.original.url;
      const msgRes = await API.post("/api/message", {
        sender: user._id,
        receiver: selectedUser._id,
        content: "",
        file: gifUrl,
        replyTo: replyMessage?._id || null,
      });
      socket.emit("sendMessage", msgRes.data);
      dispatch(toggleGifPicker());
      dispatch(clearReplyMessage());
      toast.success("GIF sent!", { duration: 1500 });
    } catch (err) {
      toast.error("Failed to send GIF");
    }
  };

  const fetchGifs = (offset) =>
    gifSearch.trim()
      ? gf.search(gifSearch, { offset, limit: 10 })
      : gf.trending({ offset, limit: 10 });

  // ── EMOJI ──
  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  // ── TYPING ──
  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!selectedUser) return;
    socket.emit("typing", { sender: user._id, receiver: selectedUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { sender: user._id, receiver: selectedUser._id });
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── HELPERS ──
  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDateSeparator = (date) => {
    const today = new Date();
    const msgDate = new Date(date);
    if (today.toDateString() === msgDate.toDateString()) return "TODAY";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (yesterday.toDateString() === msgDate.toDateString()) return "YESTERDAY";
    return msgDate.toLocaleDateString();
  };

  // call use effect........................................................
  useEffect(() => {
    socket.on("incomingCall", ({ from }) => {
      setIncomingCall(from);

      toast(`${from.name} is calling you...`, {
        icon: "📞",
        duration: 4000,
      });
    });

    return () => socket.off("incomingCall");
  }, []);



  useEffect(() => {
    socket.on("callAccepted", ({ by }) => {
      toast.success(`${by.name} accepted the call`);

      setIsCalling(false);
    });

    socket.on("callRejected", ({ by }) => {
      toast.error(`${by.name} rejected the call`);

      setIsCalling(false);
    });

    return () => {
      socket.off("callAccepted");
      socket.off("callRejected");
    };
  }, []);


  useEffect(() => {
    socket.on("callSignal", async (signal) => {

      // OFFER RECEIVED
      if (signal.offer) {
        setIncomingSignal(signal.offer);
      }

      // ANSWER RECEIVED
      if (signal.answer && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(signal.answer)
        );
      }

      // ICE CANDIDATE
      if (signal.candidate && peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(signal.candidate)
          );
        } catch (err) {
          console.log(err);
        }
      }
    });

    return () => socket.off("callSignal");
  }, []);

  // call button.................................................................
  const handleAudioCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(servers);

      peerConnection.current = pc;

      // add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // receive remote audio
      pc.ontrack = (event) => {
        remoteAudioRef.current.srcObject = event.streams[0];
      };

      // send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("callSignal", {
            to: selectedUser._id,
            signal: {
              candidate: event.candidate,
            },
          });
        }
      };

      // create offer
      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      // send offer
      socket.emit("callSignal", {
        to: selectedUser._id,
        signal: {
          offer,
        },
      });

      // notify incoming call
      socket.emit("callUser", {
        to: selectedUser._id,
        from: {
          _id: user._id,
          name: user.name,
          profilePic: user.profilePic,
        },
      });

      setIsCalling(true);

    } catch (err) {
      console.log(err);
      toast.error("Microphone permission denied");
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(servers);

      peerConnection.current = pc;

      // local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // remote audio
      pc.ontrack = (event) => {
        remoteAudioRef.current.srcObject = event.streams[0];
      };

      // ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("callSignal", {
            to: incomingCall._id,
            signal: {
              candidate: event.candidate,
            },
          });
        }
      };

      // set offer
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingSignal)
      );

      // create answer
      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      // send answer
      socket.emit("callSignal", {
        to: incomingCall._id,
        signal: {
          answer,
        },
      });

      socket.emit("acceptCall", {
        to: incomingCall._id,
        by: user,
      });

      setIncomingCall(null);

      toast.success("Call connected");

    } catch (err) {
      console.log(err);
    }
  };

  const rejectCall = () => {
    socket.emit("rejectCall", {
      to: incomingCall._id,
      by: user,
    });

    toast.error("Call rejected");

    setIncomingCall(null);
  };

  // call ending ...............................................................

  // ── 24H STATUS FILTER + GROUPING ──
  const is24hValid = (createdAt) =>
    Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

  const validStatuses = statuses.filter((s) => is24hValid(s.createdAt));

  const myStatuses = validStatuses
    .filter((s) => s.user && s.user._id === user?._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const otherStatusGroups = (() => {
    const map = {};
    validStatuses
      .filter((s) => s.user && s.user._id !== user?._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((s) => {
        if (!map[s.user._id]) map[s.user._id] = [];
        map[s.user._id].push(s);
      });
    return Object.values(map);
  })();

  // ── CHAT THEME HELPERS ──
  const handleColorPreset = (preset) => {
    dispatch(setChatTheme(
      preset.value
        ? { type: "color", value: preset.value }
        : { type: "color", value: "" }
    ));
  };

  const handlePatternPreset = (preset) => {
    dispatch(setChatTheme({
      type: preset.type,
      value: preset.value,
      size: preset.size || "auto",
      base: preset.base || "#1a1a2e",
    }));
  };

  const chatBgStyle = buildChatBackground(chatTheme);

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-modal)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            fontSize: "14px",
            fontFamily: "var(--font)",
          },
          success: { iconTheme: { primary: "#25d366", secondary: "#fff" } },
        }}
      />

      <div className="chat-app">

        {/* ══════════════════════════════
            SIDEBAR
        ══════════════════════════════ */}
        <div className={`sidebar ${showMobileChat ? "hidden-mobile" : ""}`}>

          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-header-left">
              <img
                src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="" className="header-avatar"
                onClick={() => dispatch(openProfileModal(user))}
              />
              <span className="header-name">{user?.name}</span>
            </div>
            <div className="sidebar-header-right">
              <button className="icon-btn theme-toggle" onClick={() => dispatch(toggleTheme())} title="Toggle theme">
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>
              <button className="icon-btn" onClick={() => dispatch(openSettings())} title="Settings">
                <Settings />
              </button>
              <button className="icon-btn" onClick={handleLogout} title="Logout">
                <LogOut />
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-label">Status</div>
            <div className="status-scroll">

              {/* My Status */}
              <div className="status-item">
                <label className="status-add-label" title="Add status">
                  <div className="status-avatar-wrap">
                    <img
                      src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      className="status-avatar" alt=""
                      style={{
                        border: myStatuses.length > 0
                          ? "2.5px solid var(--accent)"
                          : "2.5px dashed var(--text-muted)",
                      }}
                    />
                    <div className="add-btn">+</div>
                  </div>
                  <span className="status-name">My Status</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      dispatch(openStatusUpload({
                        file: f,
                        preview: URL.createObjectURL(f),
                      }));
                      e.target.value = "";
                    }}
                  />
                </label>
                {myStatuses.length > 0 && (
                  <button
                    style={{ fontSize: 10, color: "var(--accent)", marginTop: 2, background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => dispatch(openStatusViewer({ group: myStatuses }))}
                  >
                    View ({myStatuses.length})
                  </button>
                )}
              </div>

              {/* Other users */}
              {otherStatusGroups.map((group) => {
                const latest = group[0];
                return (
                  <div
                    key={latest.user._id}
                    className="status-item"
                    onClick={() => dispatch(openStatusViewer({ group }))}
                    title={`${latest.user.name} — ${group.length} status${group.length > 1 ? "es" : ""}`}
                  >
                    <div className="status-avatar-wrap" style={{ position: "relative" }}>
                      <img
                        src={latest.user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        className="status-avatar" alt=""
                      />
                      {group.length > 1 && (
                        <div style={{
                          position: "absolute", top: 0, right: 0,
                          background: "var(--accent)", color: "#fff",
                          borderRadius: "50%", width: 18, height: 18,
                          fontSize: 10, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "2px solid var(--bg-sidebar)",
                        }}>
                          {group.length}
                        </div>
                      )}
                    </div>
                    <span className="status-name">{latest.user.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <div className="search-inner">
              <Search />
              <input
                type="text" className="search-input"
                placeholder="Search or start new chat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>


<button
  onClick={async () => {
    try {
      const result = await getPhoneContacts();

      if (!result.supported) {
        alert("Contact picker is not supported on this device/browser.");
        return;
      }

      if (!result.phoneNumbers.length) {
        alert("No phone numbers selected.");
        return;
      }

      const { data } = await API.post("/api/user/find-contacts", {
        phoneNumbers: result.phoneNumbers,
      });

      console.log("Matched ChatSphere users:", data);

      dispatch(
        setUsers(
          data.filter((u) => u._id !== user._id)
        )
      );

      toast.success(
        `${data.length} ChatSphere contact${
          data.length !== 1 ? "s" : ""
        } found`
      );
    } catch (error) {
      console.error("Find contacts error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to find contacts"
      );
    }
  }}
>
  Find Contacts
</button>
          

          {/* User List */}
          <div className="user-list">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
                onClick={() => handleSelectUser(u)}
              >
                <div className="user-item-left">
                  <div className="user-dp-wrap">
                    <img
                      src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt="" className="user-dp"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(openProfileModal(u));
                      }}
                    />
                    {onlineUsers.includes(u._id) && <span className="online-dot" />}
                  </div>
                  <div className="user-info">
                    <div className="user-name-row">
                      <span className="user-name">{u.name}</span>
                      <span className="user-time">
                        {lastMessages[u._id]?.createdAt
                          ? formatTime(lastMessages[u._id].createdAt) : ""}
                      </span>
                    </div>
                    <div className="user-preview">
                      {lastMessages[u._id]?.preview ||
                        lastMessages[u._id]?.content ||
                        "No messages yet"}
                    </div>
                  </div>
                </div>
                <div className="user-item-right">
                  {unreadMessages[u._id] > 0 && (
                    <span className="unread-badge">{unreadMessages[u._id]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════
            CHAT AREA
        ══════════════════════════════ */}
        <div className={`chat-area ${showMobileChat ? "visible-mobile" : ""}`}>

          {/* Chat Header */}
          {selectionMode ? (
            <div className="selection-header">
              <span className="selection-count">{selectedMessages.length} selected</span>
              <div className="selection-actions">
                <button
                  className="icon-btn" style={{ color: "#e53e3e" }}
                  onClick={deleteSelectedMessages} title="Delete selected"
                >
                  <X />
                </button>
                <button className="icon-btn" onClick={() => dispatch(exitSelectionMode())}>
                  <X />
                </button>
              </div>
            </div>
          ) : selectedUser ? (
            <div className="chat-header">
              <div className="chat-header-left">
                <button className="back-btn" onClick={handleBack}>
                  <ChevronLeft />
                </button>
                <img
                  src={selectedUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="" className="user-dp"
                  style={{ width: 40, height: 40, cursor: "pointer" }}
                  onClick={() => dispatch(openProfileModal(selectedUser))}
                />
                <div className="chat-user-info">
                  <div className="chat-user-name">{selectedUser?.name}</div>
                  <div className={`chat-user-status ${isTyping ? "typing-text" : ""}`}>
                    {isTyping
                      ? "typing..."
                      : onlineUsers.includes(selectedUser?._id) ? "online" : "offline"}
                  </div>
                </div>
              </div>
              <div className="chat-header-right">
                <button
                  className="icon-btn"
                  title="Voice call"
                  onClick={() => handleAudioCall()}
                >
                  <Phone />
                </button>
                <button className="icon-btn" title="Video call"><Video /></button>
                <button className="icon-btn" title="More"><MoreVertical /></button>
              </div>
            </div>
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-icon"><MessageCircle /></div>
              <div className="empty-chat-title">ChatApp</div>
              <div className="empty-chat-subtitle">Select a contact to start chatting</div>
            </div>
          )}

          {/* Messages — chat background applied here */}
          {selectedUser && (
            <div
              className="messages-wrap"
              style={{ background: chatBgStyle }}
            >
              {messages.map((msg, index) => {
                const currentDate = new Date(msg.createdAt).toDateString();
                const previousDate = index > 0
                  ? new Date(messages[index - 1].createdAt).toDateString()
                  : null;
                const showDateSeparator = currentDate !== previousDate;
                const isOut = msg.sender === user?._id;

                return (
                  <div key={msg._id}>
                    {showDateSeparator && (
                      <div className="date-separator">
                        <span className="date-pill">
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`msg-row ${isOut ? "out" : "in"}`}
                      onClick={() =>
                        selectionMode && dispatch(toggleMessageSelection(msg._id))
                      }
                      onContextMenu={(e) => {
                        e.preventDefault();
                        dispatch(toggleMessageSelection(msg._id));
                      }}
                    >
                      <div className={`msg-bubble ${selectedMessages.includes(msg._id) ? "selected" : ""}`}>

                        {/* Reply preview inside bubble */}
                        {msg.replyTo && (
                          <div className="msg-reply-preview">
                            <div className="msg-reply-name">
                              {msg.replyTo.sender?.name || "User"}
                            </div>
                            <div className="msg-reply-text">
                              {msg.replyTo?.content
                                ? msg.replyTo.content
                                : msg.replyTo?.file?.endsWith(".webm")
                                  ? "🎤 Voice Message"
                                  : msg.replyTo?.file ? "📎 File" : "Message"}
                            </div>
                          </div>
                        )}

                        {/* Text */}
                        {msg.content && <div className="msg-text">{msg.content}</div>}

                        {/* Audio */}
                        {msg.file && msg.file.endsWith(".webm") && (
                          <audio className="msg-audio" controls preload="metadata">
                            <source src={msg.file} type='audio/webm; codecs="opus"' />
                          </audio>
                        )}

                        {/* Image / GIF */}
                        {msg.file &&
                          (/\.(jpeg|jpg|png|gif)$/i.test(msg.file) ||
                            msg.file.includes("giphy.com")) && (
                            <img
                              src={msg.file}
                              className={`msg-image ${msg.file.includes("giphy.com") ? "msg-gif" : ""}`}
                              alt="attachment"
                            />
                          )}

                        {/* File download */}
                        {msg.file &&
                          !msg.file.endsWith(".webm") &&
                          !/\.(jpeg|jpg|png|gif)$/i.test(msg.file) &&
                          !msg.file.includes("giphy.com") && (
                            <a href={msg.file} target="_blank" rel="noreferrer" className="msg-file-link">
                              <Download size={14} /> Download File
                            </a>
                          )}

                        {/* Reply button */}
                        <button
                          className="msg-reply-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(setReplyMessage(msg));
                          }}
                          title="Reply"
                        >
                          <CornerUpLeft />
                        </button>

                        {/* Time + ticks */}
                        <div className="msg-meta">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isOut && (
                            <span className={`msg-tick ${msg.status === "seen" ? "seen" : ""}`}>
                              {msg.status === "sent"
                                ? <Check size={15} />
                                : <CheckCheck size={15} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Image Preview Overlay */}
          {previewUrl && (
            <div className="preview-overlay">
              <img src={previewUrl} alt="preview" />
              <div className="preview-actions">
                <button
                  className="preview-btn cancel"
                  onClick={() => { dispatch(clearPreviewUrl()); setFile(null); }}
                >
                  Cancel
                </button>
                <button className="preview-btn send-img" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          {selectedUser && (
            <div className="input-bar-wrap">

              {/* Reply preview */}
              {replyMessage && (
                <div className="reply-bar">
                  <div className="reply-bar-content">
                    <div className="reply-bar-label">Replying to</div>
                    <div className="reply-bar-text">
                      {replyMessage.content || "📎 Media"}
                    </div>
                  </div>
                  <button
                    className="reply-bar-close icon-btn"
                    onClick={() => dispatch(clearReplyMessage())}
                  >
                    <X />
                  </button>
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker-wrap">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={theme === "dark" ? "dark" : "light"}
                    height={350}
                  />
                </div>
              )}

              {/* GIF Picker */}
              {showGifPicker && (
                <div className="gif-picker-wrap">
                  <div className="gif-picker-header">
                    <span className="gif-picker-title">
                      <Film size={15} /> GIFs
                    </span>
                    <input
                      className="gif-search-input"
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="icon-btn"
                      onClick={() => { dispatch(toggleGifPicker()); setGifSearch(""); }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="gif-grid-wrap">
                    <Grid
                      key={gifSearch}
                      fetchGifs={fetchGifs}
                      width={340}
                      columns={2}
                      gutter={6}
                      onGifClick={(gif, e) => { e.preventDefault(); sendGif(gif); }}
                      noLink
                    />
                  </div>
                </div>
              )}

              <div className="input-bar">
                <input
                  type="file" id="fileInput"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />

                {/* Emoji */}
                <button
                  className="icon-btn"
                  onClick={() => dispatch(toggleEmojiPicker())}
                  title="Emoji"
                >
                  <Smile />
                </button>

                {/* GIF */}
                <button
                  className={`icon-btn gif-btn ${showGifPicker ? "active" : ""}`}
                  onClick={() => dispatch(toggleGifPicker())}
                  title="Send GIF"
                >
                  <Film size={18} />
                </button>

                {/* Attach */}
                <button
                  className="icon-btn"
                  onClick={() => document.getElementById("fileInput").click()}
                  title="Attach file"
                >
                  <Paperclip />
                </button>

                {/* Text input */}
                <input
                  className="input-field"
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message"
                />

                {/* Send / Mic */}
                {message ? (
                  <button className="send-btn" onClick={sendMessage} title="Send">
                    <Send />
                  </button>
                ) : isRecording ? (
                  <button className="mic-btn recording" onClick={stopRecording} title="Stop">
                    <StopCircle />
                  </button>
                ) : (
                  <button className="mic-btn" onClick={startRecording} title="Record">
                    <Mic />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          PROFILE MODAL
      ══════════════════════════════════════ */}
      {showProfileModal && profileUser && (
        <div className="modal-overlay" onClick={() => dispatch(closeProfileModal())}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Profile</span>
              <button className="icon-btn" onClick={() => dispatch(closeProfileModal())}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-avatar-center">
                <img
                  src={profileUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="" className="modal-avatar large"
                />
              </div>
              <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
                {profileUser.name}
              </h2>
              <p className="modal-email">{profileUser.email}</p>
              <p style={{
                textAlign: "center", fontSize: 13,
                color: onlineUsers.includes(profileUser._id)
                  ? "var(--accent)" : "var(--text-muted)",
              }}>
                {onlineUsers.includes(profileUser._id) ? "● Online" : "● Offline"}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => dispatch(closeProfileModal())}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SETTINGS MODAL
      ══════════════════════════════════════ */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => dispatch(closeSettings())}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Settings</span>
              <button className="icon-btn" onClick={() => dispatch(closeSettings())}>
                <X />
              </button>
            </div>
            <div className="modal-body">

              {/* Avatar */}
              <div className="modal-avatar-center">
                <img
                  src={settingsPreview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="" className="modal-avatar large"
                />
              </div>
              <label className="modal-file-label">
                <Camera /> Change Profile Photo
                <input type="file" onChange={handleSettingsFile} />
              </label>

              {/* Name */}
              <div>
                <div className="settings-section-label">Name</div>
                <input
                  className="modal-input"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <div className="settings-section-label">Email</div>
                <input className="modal-input" value={user?.email || ""} readOnly />
              </div>

              {/* App Theme toggle */}
              <div>
                <div className="settings-section-label">Theme</div>
                <button
                  className="theme-toggle"
                  onClick={() => dispatch(toggleTheme())}
                  style={{ width: "100%", justifyContent: "center", gap: 10 }}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
              </div>

              {/* ── CHAT THEME ── */}
              <div>
                <div className="settings-section-label">Chat Theme</div>

                {/* Tab switcher */}
                <div style={{
                  display: "flex", gap: 0, marginBottom: 12,
                  border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
                }}>
                  {["color", "pattern"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setThemeTab(tab)}
                      style={{
                        flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 600,
                        border: "none", cursor: "pointer",
                        background: themeTab === tab ? "var(--accent)" : "transparent",
                        color: themeTab === tab ? "#fff" : "var(--text-muted)",
                        transition: "background 0.2s",
                        textTransform: "capitalize",
                      }}
                    >
                      {tab === "color" ? "🎨 Colors" : "🖼️ Patterns"}
                    </button>
                  ))}
                </div>

                {/* Color tab */}
                {themeTab === "color" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {COLOR_PRESETS.map((preset) => (
                      <div
                        key={preset.label}
                        title={preset.label}
                        onClick={() => handleColorPreset(preset)}
                        style={{
                          width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                          background: preset.value || "var(--bg-chat)",
                          border: (chatTheme?.value === preset.value && chatTheme?.type === "color")
                            ? "3px solid var(--accent)"
                            : "2px solid var(--border)",
                          boxSizing: "border-box",
                          boxShadow: (chatTheme?.value === preset.value && chatTheme?.type === "color")
                            ? "0 0 0 2px var(--accent)44"
                            : "none",
                          transition: "box-shadow 0.2s, border 0.2s",
                          position: "relative",
                        }}
                      >
                        {/* checkmark for selected */}
                        {chatTheme?.value === preset.value && chatTheme?.type === "color" && (
                          <span style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, color: preset.value ? "#fff" : "var(--accent)",
                            textShadow: "0 1px 2px #0006",
                          }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pattern tab */}
                {themeTab === "pattern" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {PATTERN_PRESETS.map((preset) => {
                      const bg = preset.type === "css"
                        ? `${preset.value}${preset.size !== "auto" ? ` ${preset.size}` : ""}, ${preset.base}`
                        : `url(${preset.value}) center/auto, ${preset.base}`;
                      const isSelected = chatTheme?.value === preset.value;
                      return (
                        <div
                          key={preset.label}
                          title={preset.label}
                          onClick={() => handlePatternPreset(preset)}
                          style={{
                            width: 68, height: 48,
                            borderRadius: 10, cursor: "pointer",
                            background: bg,
                            border: isSelected
                              ? "3px solid var(--accent)"
                              : "2px solid var(--border)",
                            boxSizing: "border-box",
                            boxShadow: isSelected ? "0 0 0 2px var(--accent)44" : "none",
                            display: "flex", alignItems: "flex-end",
                            justifyContent: "center",
                            paddingBottom: 4,
                            transition: "box-shadow 0.2s, border 0.2s",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: "#fff",
                            textShadow: "0 1px 3px #000a",
                            background: "rgba(0,0,0,0.35)",
                            borderRadius: 4, padding: "1px 5px",
                          }}>
                            {preset.label}
                          </span>
                          {isSelected && (
                            <span style={{
                              position: "absolute", top: 4, right: 6,
                              fontSize: 13, color: "#fff",
                              textShadow: "0 1px 3px #0008",
                            }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reset button */}
                {chatTheme?.value && (
                  <button
                    onClick={() => dispatch(setChatTheme({ type: "color", value: "" }))}
                    style={{
                      marginTop: 10, fontSize: 12,
                      color: "var(--text-muted)", background: "none",
                      border: "1px solid var(--border)", borderRadius: 6,
                      padding: "4px 12px", cursor: "pointer",
                    }}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
              {/* ── END CHAT THEME ── */}

              <div className="divider" />
              <button
                className="logout-btn"
                onClick={handleLogout}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LogOut /> Logout
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => dispatch(closeSettings())}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STATUS UPLOAD MODAL
      ══════════════════════════════════════ */}
      {showStatusUpload && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Add Status</span>
              <button className="icon-btn" onClick={() => dispatch(closeStatusUpload())}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              {statusPreview && (
                /\.(jpeg|jpg|png|gif)$/i.test(statusFile?.name) ? (
                  <img src={statusPreview} className="status-preview-img" alt="status" />
                ) : (
                  <video src={statusPreview} controls className="status-preview-vid" />
                )
              )}
              <input
                type="text" className="modal-input"
                placeholder="Add a caption..."
                value={statusCaption}
                onChange={(e) => dispatch(setStatusCaption(e.target.value))}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => dispatch(closeStatusUpload())}>
                Cancel
              </button>
              <button className="btn-primary" onClick={uploadStatus}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STATUS VIEWER
      ══════════════════════════════════════ */}
      {showStatusViewer && viewerGroup && viewerGroup[viewerIndex] && (() => {
        const current = viewerGroup[viewerIndex];
        const isOwn = current.user._id === user?._id;
        const total = viewerGroup.length;

        return (
          <div
            className="status-viewer-overlay"
            onClick={() => dispatch(closeStatusViewer())}
          >
            {/* Progress bars */}
            <div
              style={{
                position: "absolute", top: 12, left: 12, right: 12,
                display: "flex", gap: 4, zIndex: 10,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {viewerGroup.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 3, borderRadius: 2, cursor: "pointer",
                    background:
                      i < viewerIndex ? "#fff"
                        : i === viewerIndex ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.35)",
                  }}
                  onClick={() => dispatch(setViewerIndex(i))}
                />
              ))}
            </div>

            {/* Top bar */}
            <div
              className="status-viewer-top"
              style={{ top: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={current.user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="" className="status-viewer-avatar"
              />
              <div>
                <div className="status-viewer-name">{current.user?.name}</div>
                <div className="status-viewer-time">
                  {formatTime(current.createdAt)}
                  {total > 1 && (
                    <span style={{ marginLeft: 8, opacity: 0.75 }}>
                      {viewerIndex + 1}/{total}
                    </span>
                  )}
                </div>
              </div>

              {isOwn && (
                <button
                  style={{
                    marginLeft: 12, color: "#ff6b6b",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 8, padding: "5px 12px",
                    fontSize: 13, fontWeight: 600,
                    border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this status?")) deleteStatus(current._id);
                  }}
                >
                  Delete
                </button>
              )}

              <button
                className="icon-btn"
                style={{ marginLeft: "auto", color: "#fff" }}
                onClick={(e) => { e.stopPropagation(); dispatch(closeStatusViewer()); }}
              >
                <X />
              </button>
            </div>

            {/* Tap zones */}
            <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
              <div
                style={{ flex: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewerIndex > 0) dispatch(setViewerIndex(viewerIndex - 1));
                  else dispatch(closeStatusViewer());
                }}
              />
              <div
                style={{ flex: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewerIndex < total - 1) dispatch(setViewerIndex(viewerIndex + 1));
                  else dispatch(closeStatusViewer());
                }}
              />
            </div>

            {/* Media */}
            <div style={{ position: "relative", zIndex: 2 }}>
              {/\.(jpeg|jpg|png|gif)$/i.test(current.media) ? (
                <img
                  src={current.media}
                  className="status-viewer-img" alt="status"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <video
                  src={current.media}
                  controls autoPlay
                  className="status-viewer-vid"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {current.caption && (
              <div className="status-viewer-caption">{current.caption}</div>
            )}
          </div>
        );
      })()}

      {/* ════════════════════════════════
    INCOMING CALL MODAL
════════════════════════════════ */}
      {incomingCall && (
        <div className="modal-overlay">
          <div
            className="modal-box"
            style={{
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <img
              src={
                incomingCall.profilePic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt=""
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 15,
              }}
            />

            <h2 style={{ color: "var(--text-primary)" }}>
              {incomingCall.name}
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                marginTop: 8,
                marginBottom: 20,
              }}
            >
              Incoming voice call...
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 15,
              }}
            >
              <button
                onClick={rejectCall}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>

              <button
                onClick={acceptCall}
                style={{
                  background: "#25d366",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay />
    </>
  );
};

export default Chat;
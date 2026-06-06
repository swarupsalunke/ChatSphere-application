import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  selectedUser: null,
  messages: [],
  onlineUsers: [],
  unreadMessages: {},   // { userId: count }
  lastMessages: {},     // { userId: msgObject }
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // ── USERS ──
    setUsers: (state, action) => {
      state.users = action.payload;
    },

    updateUserInList: (state, action) => {
      const updated = action.payload;
      state.users = state.users.map((u) =>
        u._id === updated._id ? updated : u
      );
      if (state.selectedUser?._id === updated._id) {
        state.selectedUser = updated;
      }
    },

    // ── SELECTED USER ──
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      // clear unread for this user
      if (action.payload) {
        state.unreadMessages[action.payload._id] = 0;
      }
    },

    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },

    // ── MESSAGES ──
    setMessages: (state, action) => {
      state.messages = action.payload;
    },

   addMessage: (state, action) => {
  const exists = state.messages.some(
    (msg) => msg._id === action.payload._id
  );

  if (!exists) {
    state.messages.push(action.payload);
  }
},

    deleteMessageById: (state, action) => {
      state.messages = state.messages.filter(
        (m) => m._id !== action.payload
      );
    },

    deleteMessagesByIds: (state, action) => {
      const ids = action.payload; // array
      state.messages = state.messages.filter(
        (m) => !ids.includes(m._id)
      );
    },

    updateMessageStatus: (state, action) => {
      const { id, status } = action.payload;
      state.messages = state.messages.map((m) =>
        m._id === id ? { ...m, status } : m
      );
    },

    // ── ONLINE USERS ──
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },

    // ── UNREAD ──
    incrementUnread: (state, action) => {
      const userId = action.payload;
      state.unreadMessages[userId] =
        (state.unreadMessages[userId] || 0) + 1;
    },

    clearUnread: (state, action) => {
      state.unreadMessages[action.payload] = 0;
    },

    // ── LAST MESSAGES ──
    setLastMessages: (state, action) => {
      state.lastMessages = action.payload;
    },

    updateLastMessage: (state, action) => {
      const { userId, msg } = action.payload;
      state.lastMessages[userId] = msg;
    },

    // ── TYPING ──
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },

    // ── RESET CHAT (on logout) ──
    resetChat: (state) => {
      state.users = [];
      state.selectedUser = null;
      state.messages = [];
      state.onlineUsers = [];
      state.unreadMessages = {};
      state.lastMessages = {};
      state.isTyping = false;
    },
  },
});

export const {
  setUsers,
  updateUserInList,
  setSelectedUser,
  clearSelectedUser,
  setMessages,
  addMessage,
  deleteMessageById,
  deleteMessagesByIds,
  updateMessageStatus,
  setOnlineUsers,
  incrementUnread,
  clearUnread,
  setLastMessages,
  updateLastMessage,
  setIsTyping,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
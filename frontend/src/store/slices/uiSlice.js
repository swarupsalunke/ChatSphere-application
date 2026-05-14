
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: localStorage.getItem("chat-theme") || "light",

  // custom chat theme
  chatTheme: { type: "color", value: "" },

  // modals
  showSettings: false,
  showProfileModal: false,
  profileUser: null,

  // input bar pickers
  showEmojiPicker: false,
  showGifPicker: false,

  // reply
  replyMessage: null,

  // file preview
  previewUrl: null,

  // mobile
  showMobileChat: false,

  // selection mode
  selectionMode: false,
  selectedMessages: [],

  // status
  showStatusViewer: false,
  viewerGroup: null,
  viewerIndex: 0,
  showStatusUpload: false,
  statusFile: null,
  statusPreview: null,
  statusCaption: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,

  reducers: {
    // ── THEME ──
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";

      localStorage.setItem("chat-theme", state.theme);

      document.documentElement.setAttribute(
        "data-theme",
        state.theme
      );
    },

    setTheme: (state, action) => {
      state.theme = action.payload;

      localStorage.setItem(
        "chat-theme",
        action.payload
      );

      document.documentElement.setAttribute(
        "data-theme",
        action.payload
      );
    },

    // ── CHAT THEME ──
    setChatTheme: (state, action) => {
      state.chatTheme = action.payload;
    },

    // ── MODALS ──
    openSettings: (state) => {
      state.showSettings = true;
    },

    closeSettings: (state) => {
      state.showSettings = false;
    },

    openProfileModal: (state, action) => {
      state.profileUser = action.payload;
      state.showProfileModal = true;
    },

    closeProfileModal: (state) => {
      state.showProfileModal = false;
      state.profileUser = null;
    },

    // ── PICKERS ──
    toggleEmojiPicker: (state) => {
      state.showEmojiPicker = !state.showEmojiPicker;
      state.showGifPicker = false;
    },

    closeEmojiPicker: (state) => {
      state.showEmojiPicker = false;
    },

    toggleGifPicker: (state) => {
      state.showGifPicker = !state.showGifPicker;
      state.showEmojiPicker = false;
    },

    closeGifPicker: (state) => {
      state.showGifPicker = false;
    },

    closeAllPickers: (state) => {
      state.showEmojiPicker = false;
      state.showGifPicker = false;
    },

    // ── REPLY ──
    setReplyMessage: (state, action) => {
      state.replyMessage = action.payload;
    },

    clearReplyMessage: (state) => {
      state.replyMessage = null;
    },

    // ── FILE PREVIEW ──
    setPreviewUrl: (state, action) => {
      state.previewUrl = action.payload;
    },

    clearPreviewUrl: (state) => {
      state.previewUrl = null;
    },

    // ── MOBILE ──
    showMobileChat: (state) => {
      state.showMobileChat = true;
    },

    hideMobileChat: (state) => {
      state.showMobileChat = false;
    },

    // ── SELECTION MODE ──
    enterSelectionMode: (state) => {
      state.selectionMode = true;
    },

    exitSelectionMode: (state) => {
      state.selectionMode = false;
      state.selectedMessages = [];
    },

    toggleMessageSelection: (state, action) => {
      const id = action.payload;

      state.selectionMode = true;

      if (state.selectedMessages.includes(id)) {
        state.selectedMessages =
          state.selectedMessages.filter(
            (m) => m !== id
          );

        if (state.selectedMessages.length === 0) {
          state.selectionMode = false;
        }
      } else {
        state.selectedMessages.push(id);
      }
    },

    // ── STATUS VIEWER ──
    openStatusViewer: (state, action) => {
      state.viewerGroup = action.payload.group;
      state.viewerIndex =
        action.payload.index || 0;

      state.showStatusViewer = true;
    },

    closeStatusViewer: (state) => {
      state.showStatusViewer = false;
      state.viewerGroup = null;
      state.viewerIndex = 0;
    },

    setViewerIndex: (state, action) => {
      state.viewerIndex = action.payload;
    },

    removeFromViewerGroup: (state, action) => {
      const id = action.payload;

      if (!state.viewerGroup) return;

      const newGroup =
        state.viewerGroup.filter(
          (s) => s._id !== id
        );

      if (newGroup.length === 0) {
        state.showStatusViewer = false;
        state.viewerGroup = null;
        state.viewerIndex = 0;
      } else {
        state.viewerGroup = newGroup;

        state.viewerIndex = Math.min(
          state.viewerIndex,
          newGroup.length - 1
        );
      }
    },

    // ── STATUS UPLOAD ──
    openStatusUpload: (state, action) => {
      state.statusFile = action.payload.file;
      state.statusPreview =
        action.payload.preview;

      state.showStatusUpload = true;
    },

    closeStatusUpload: (state) => {
      state.showStatusUpload = false;
      state.statusFile = null;
      state.statusPreview = null;
      state.statusCaption = "";
    },

    setStatusCaption: (state, action) => {
      state.statusCaption = action.payload;
    },

    // ── RESET UI ──
    resetUI: (state) => {
      state.showSettings = false;
      state.showProfileModal = false;
      state.profileUser = null;
      state.showEmojiPicker = false;
      state.showGifPicker = false;
      state.replyMessage = null;
      state.previewUrl = null;
      state.showMobileChat = false;
      state.selectionMode = false;
      state.selectedMessages = [];
      state.showStatusViewer = false;
      state.viewerGroup = null;
      state.viewerIndex = 0;
      state.showStatusUpload = false;
      state.statusFile = null;
      state.statusPreview = null;
      state.statusCaption = "";
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setChatTheme,
  openSettings,
  closeSettings,
  openProfileModal,
  closeProfileModal,
  toggleEmojiPicker,
  closeEmojiPicker,
  toggleGifPicker,
  closeGifPicker,
  closeAllPickers,
  setReplyMessage,
  clearReplyMessage,
  setPreviewUrl,
  clearPreviewUrl,
  showMobileChat,
  hideMobileChat,
  enterSelectionMode,
  exitSelectionMode,
  toggleMessageSelection,
  openStatusViewer,
  closeStatusViewer,
  setViewerIndex,
  removeFromViewerGroup,
  openStatusUpload,
  closeStatusUpload,
  setStatusCaption,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;


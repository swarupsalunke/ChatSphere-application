import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";
import statusReducer from "./slices/statusSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ui: uiReducer,
    status: statusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // GIF File objects are non-serializable — allow them
      serializableCheck: {
        ignoredPaths: [
          "ui.statusFile",
        ],
        ignoredActionPaths: [
          "payload.file",
          "payload.statusFile",
        ],
      },
    }),
});

export default store;
import { createSlice } from "@reduxjs/toolkit";

const userFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const initialState = {
  user: userFromStorage,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ── SET USER (after login / register) ──
    setUser: (state, action) => {
      state.user = action.payload;
      state.error = null;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },

    // ── UPDATE USER (profile update) ──
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ ...state.user, ...action.payload })
      );
    },

    // ── LOGOUT ──
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.removeItem("userInfo");
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, updateUser, logout, setLoading, setError } =
  authSlice.actions;

export default authSlice.reducer;
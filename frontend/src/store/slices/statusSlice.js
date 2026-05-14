import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  statuses: [],
};

const statusSlice = createSlice({
  name: "status",
  initialState,
  reducers: {
    setStatuses: (state, action) => {
      state.statuses = action.payload;
    },

    addStatus: (state, action) => {
      state.statuses.unshift(action.payload);
    },

    removeStatus: (state, action) => {
      state.statuses = state.statuses.filter(
        (s) => s._id !== action.payload
      );
    },
  },
});

export const { setStatuses, addStatus, removeStatus } = statusSlice.actions;

export default statusSlice.reducer;
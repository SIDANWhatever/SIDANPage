import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "landing"
}

export const pageSlice = createSlice({
  name: 'page',
  initialState,
  reducers: {
    landingPage: (state) => {
      state.mode = "landing";
    },
    plutusPage: (state) => {
      state.mode = "plutus";
    },
    fullstackPage: (state) => {
      state.mode = "fullstack";
    },
    poolPage: (state) => {
      state.mode = "pool";
    },
    uiuxPage: (state) => {
      state.mode = "uiux";
    }
  }
});

export const { landingPage, plutusPage, fullstackPage, poolPage, uiuxPage } = pageSlice.actions;

export default pageSlice.reducer;
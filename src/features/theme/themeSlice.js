import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "dark"
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    lightTheme: (state) => {
      state.mode = "light";
    },
    darkTheme: (state) => {
      state.mode = "dark";
    }
  }
});

export const { lightTheme, darkTheme } = themeSlice.actions;

export default themeSlice.reducer;
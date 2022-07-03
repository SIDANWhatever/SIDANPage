import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/theme/themeSlice';
import pageReducer from '../features/page/pageSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    page: pageReducer
  },

});
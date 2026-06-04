import { configureStore } from "@reduxjs/toolkit";
import calibrationReducer from "@/store/slices/calibrationSlice";
import tanksReducer from "@/store/slices/tanksSlice";
import calculationReducer, { hydrate } from "@/store/slices/calculationSlice";
import { loadPersistedState, persistMiddleware } from "@/store/persist";

export const store = configureStore({
  reducer: {
    calibration: calibrationReducer,
    tanks: tanksReducer,
    calculation: calculationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["calibration.map"],
        ignoredActions: ["calibration/load/fulfilled"],
      },
    }).prepend(persistMiddleware.middleware),
});

const persisted = typeof window !== "undefined" ? loadPersistedState() : null;
if (persisted) {
  store.dispatch(hydrate(persisted));
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  addRow,
  archiveBatch,
  clearBatch,
  deleteHistoryBatch,
  deleteRow,
  setBatchMeta,
  updateRow,
} from "@/store/slices/calculationSlice";
import type { RootState } from "@/store";

export const STORAGE_KEY = "oil-volume-mass-calc:state:v1";
const DEBOUNCE_MS = 3000;

let timer: ReturnType<typeof setTimeout> | null = null;

export const persistMiddleware = createListenerMiddleware();

persistMiddleware.startListening({
  matcher: (action) =>
    addRow.match(action) ||
    updateRow.match(action) ||
    deleteRow.match(action) ||
    setBatchMeta.match(action) ||
    archiveBatch.match(action) ||
    clearBatch.match(action) ||
    deleteHistoryBatch.match(action),
  effect: async (_action, api) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const state = api.getState() as RootState;
      const snapshot = {
        currentBatch: state.calculation.currentBatch,
        history: state.calculation.history,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn("Не вдалося зберегти стан у localStorage:", err);
      }
    }, DEBOUNCE_MS);
  },
});

export function loadPersistedState():
  | { currentBatch?: import("@/types").ReportBatch; history?: import("@/types").ReportBatch[] }
  | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Не вдалося прочитати збережений стан:", err);
    return null;
  }
}

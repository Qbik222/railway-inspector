import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { ReportBatch, ReportRow } from "@/types";

export interface CalculationState {
  /** Поточна партія, з якою працює користувач. */
  currentBatch: ReportBatch;
  /** Історія раніше збережених звітів. */
  history: ReportBatch[];
  /** Чи відбулася гідратація зі сховища. */
  hydrated: boolean;
}

const createEmptyBatch = (): ReportBatch => ({
  id: nanoid(),
  date: new Date().toISOString(),
  product: "",
  supplier: "",
  receiver: "",
  invoiceNumber: "",
  rows: [],
});

const initialState: CalculationState = {
  currentBatch: createEmptyBatch(),
  history: [],
  hydrated: false,
};

type RowUpdate = Partial<Omit<ReportRow, "id" | "result" | "updatedAt">>;

const calculationSlice = createSlice({
  name: "calculation",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<CalculationState>>) {
      if (action.payload.currentBatch) {
        state.currentBatch = action.payload.currentBatch;
      }
      if (action.payload.history) {
        state.history = action.payload.history;
      }
      state.hydrated = true;
    },
    setBatchMeta(
      state,
      action: PayloadAction<Partial<Pick<ReportBatch, "product" | "supplier" | "receiver" | "invoiceNumber" | "date">>>,
    ) {
      state.currentBatch = { ...state.currentBatch, ...action.payload };
    },
    addRow(state, action: PayloadAction<Omit<ReportRow, "id" | "result" | "updatedAt"> & { result: ReportRow["result"] }>) {
      const row: ReportRow = {
        ...action.payload,
        id: nanoid(),
        updatedAt: new Date().toISOString(),
      };
      state.currentBatch.rows.push(row);
    },
    updateRow(
      state,
      action: PayloadAction<{ id: string; changes: RowUpdate; result: ReportRow["result"] }>,
    ) {
      const idx = state.currentBatch.rows.findIndex((r) => r.id === action.payload.id);
      if (idx < 0) return;
      const current = state.currentBatch.rows[idx];
      state.currentBatch.rows[idx] = {
        ...current,
        ...action.payload.changes,
        result: action.payload.result,
        updatedAt: new Date().toISOString(),
      };
    },
    deleteRow(state, action: PayloadAction<string>) {
      state.currentBatch.rows = state.currentBatch.rows.filter((r) => r.id !== action.payload);
    },
    clearBatch(state) {
      state.currentBatch = createEmptyBatch();
    },
    archiveBatch(state) {
      if (state.currentBatch.rows.length === 0) return;
      state.history.push(state.currentBatch);
      state.currentBatch = createEmptyBatch();
    },
    deleteHistoryBatch(state, action: PayloadAction<string>) {
      state.history = state.history.filter((b) => b.id !== action.payload);
    },
  },
});

export const {
  hydrate,
  setBatchMeta,
  addRow,
  updateRow,
  deleteRow,
  clearBatch,
  archiveBatch,
  deleteHistoryBatch,
} = calculationSlice.actions;

export default calculationSlice.reducer;

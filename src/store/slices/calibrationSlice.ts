import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import calibrationCsv from "@csv/calibration.csv?raw";
import { parseCalibrationCSV } from "@/utils/csvParser";
import { buildCalibrationMap, type CalibrationMap } from "@/utils/calculations";
import type { CalibrationRecord } from "@/types";

export interface CalibrationState {
  records: CalibrationRecord[];
  tankTypes: string[];
  /** Мапа для швидкого доступу при інтерполяції — не серіалізується. */
  map: CalibrationMap | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const initialState: CalibrationState = {
  records: [],
  tankTypes: [],
  map: null,
  loading: false,
  loaded: false,
  error: null,
};

/**
 * Завантажуємо калібрувальну таблицю один раз при старті додатку.
 * CSV-файл інлайнено через Vite (`?raw`), тому fetch не потрібен.
 */
export const loadCalibrations = createAsyncThunk("calibration/load", async () => {
  const { records, tankTypes } = parseCalibrationCSV(calibrationCsv);
  return { records, tankTypes };
});

const calibrationSlice = createSlice({
  name: "calibration",
  initialState,
  reducers: {
    setRecords(
      state,
      action: PayloadAction<{ records: CalibrationRecord[]; tankTypes: string[] }>,
    ) {
      state.records = action.payload.records;
      state.tankTypes = action.payload.tankTypes;
      state.map = buildCalibrationMap(action.payload.records);
      state.loaded = true;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadCalibrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCalibrations.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.records = action.payload.records;
        state.tankTypes = action.payload.tankTypes;
        state.map = buildCalibrationMap(action.payload.records);
      })
      .addCase(loadCalibrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Не вдалося завантажити калібровки";
      });
  },
});

export const { setRecords } = calibrationSlice.actions;
export default calibrationSlice.reducer;

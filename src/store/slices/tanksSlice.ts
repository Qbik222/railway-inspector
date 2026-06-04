import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import tanksCsv from "@csv/tanks.csv?raw";
import { parseTanksCSV } from "@/utils/csvParser";
import type { TankData } from "@/types";

export interface TanksState {
  list: TankData[];
  byNumber: Record<string, TankData>;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const initialState: TanksState = {
  list: [],
  byNumber: {},
  loading: false,
  loaded: false,
  error: null,
};

export const loadTanks = createAsyncThunk("tanks/load", async () => {
  return parseTanksCSV(tanksCsv);
});

const tanksSlice = createSlice({
  name: "tanks",
  initialState,
  reducers: {
    upsertTank(state, action: PayloadAction<TankData>) {
      const idx = state.list.findIndex((t) => t.number === action.payload.number);
      if (idx >= 0) {
        state.list[idx] = action.payload;
      } else {
        state.list.push(action.payload);
      }
      state.byNumber[action.payload.number] = action.payload;
    },
    removeTank(state, action: PayloadAction<string>) {
      state.list = state.list.filter((t) => t.number !== action.payload);
      delete state.byNumber[action.payload];
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadTanks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTanks.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.list = action.payload;
        state.byNumber = Object.fromEntries(action.payload.map((t) => [t.number, t]));
      })
      .addCase(loadTanks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Не вдалося завантажити довідник вагонів";
      });
  },
});

export const { upsertTank, removeTank } = tanksSlice.actions;
export default tanksSlice.reducer;

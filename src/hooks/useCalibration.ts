import { useMemo } from "react";
import { useAppSelector } from "@/hooks/redux";
import type { CalibrationMap } from "@/utils/calculations";

export interface UseCalibrationResult {
  map: CalibrationMap | null;
  tankTypes: string[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

/** Зручний доступ до калібрувальної мапи для розрахунків. */
export function useCalibration(): UseCalibrationResult {
  const state = useAppSelector((s) => s.calibration);
  return useMemo(
    () => ({
      map: state.map,
      tankTypes: state.tankTypes,
      loaded: state.loaded,
      loading: state.loading,
      error: state.error,
    }),
    [state.map, state.tankTypes, state.loaded, state.loading, state.error],
  );
}

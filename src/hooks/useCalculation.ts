import { useCallback } from "react";
import { performCalculation } from "@/utils/calculations";
import { useCalibration } from "@/hooks/useCalibration";
import type { CalculationParams, CalculationResult } from "@/types";

const EMPTY_RESULT: CalculationResult = {
  volumeLiters: Number.NaN,
  volumeM3: Number.NaN,
  densityAt15: Number.NaN,
  massT: Number.NaN,
  errorT: Number.NaN,
};

/** Обгортка над `performCalculation`: бере поточну калібрувальну мапу зі store. */
export function useCalculation() {
  const { map } = useCalibration();

  const calculate = useCallback(
    (params: CalculationParams): CalculationResult => {
      if (!map) return EMPTY_RESULT;
      return performCalculation(params, map);
    },
    [map],
  );

  return { calculate, ready: map !== null };
}

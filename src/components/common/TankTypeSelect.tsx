import { useMemo } from "react";
import { useCalibration } from "@/hooks/useCalibration";

interface TankTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}

/**
 * Селектор типу вагона з повного списку 114 типів калібрувальної таблиці.
 * Типи групуємо: спершу числові (зростання), потім з літерним суфіксом, далі `*G`.
 */
export function TankTypeSelect({
  value,
  onChange,
  className,
  ariaLabel = "Тип вагона",
  autoFocus,
}: TankTypeSelectProps) {
  const { tankTypes } = useCalibration();

  const sorted = useMemo(() => {
    return [...tankTypes].sort((a, b) => {
      const aNum = Number.parseInt(a, 10);
      const bNum = Number.parseInt(b, 10);
      const aIsNum = Number.isFinite(aNum) && /^\d+[а-яА-Яa-z]?$/.test(a);
      const bIsNum = Number.isFinite(bNum) && /^\d+[а-яА-Яa-z]?$/.test(b);

      if (aIsNum && bIsNum) {
        if (aNum !== bNum) return aNum - bNum;
        return a.localeCompare(b);
      }
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.localeCompare(b);
    });
  }, [tankTypes]);

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    >
      <option value="">— оберіть тип —</option>
      {sorted.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}

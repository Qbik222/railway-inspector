import { useEffect, useRef } from "react";

/**
 * Універсальний хук для debounced-збереження.
 * Зберігання у Redux-store вже виконує `persistMiddleware`, цей хук — допоміжний
 * для випадків, коли треба зберегти локальний стан компонента.
 */
export function useAutoSave<T>(value: T, save: (value: T) => void, delayMs = 3000): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, save, delayMs]);
}

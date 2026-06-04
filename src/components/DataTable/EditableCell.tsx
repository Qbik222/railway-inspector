import { useEffect, useRef, useState } from "react";
import styles from "./DataTable.module.css";

interface EditableCellProps {
  value: string;
  onCommit: (value: string) => void;
  type?: "text" | "number";
  step?: string;
  min?: number;
  placeholder?: string;
  align?: "left" | "right" | "center";
  ariaLabel?: string;
}

/**
 * Клітинка з режимом редагування через подвійний клік:
 * - подвійний клік → input
 * - Enter / Blur → зберегти
 * - Escape → скасувати
 */
export function EditableCell({
  value,
  onCommit,
  type = "text",
  step,
  min,
  placeholder,
  align = "left",
  ariaLabel,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <td
      className={styles.editableCell}
      data-align={align}
      onDoubleClick={() => setEditing(true)}
      role="gridcell"
    >
      {editing ? (
        <input
          ref={inputRef}
          className={styles.editableInput}
          value={draft}
          type={type}
          step={step}
          min={min}
          placeholder={placeholder}
          aria-label={ariaLabel}
          data-align={align}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      ) : (
        <span className={styles.cellValue} data-align={align}>
          {value || <span className={styles.placeholder}>{placeholder ?? "—"}</span>}
        </span>
      )}
    </td>
  );
}

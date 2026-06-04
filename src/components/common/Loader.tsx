interface LoaderProps {
  message?: string;
}

export function Loader({ message = "Завантаження…" }: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: 32,
        color: "#6b7280",
        fontSize: 14,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #d1d5db",
          borderTopColor: "#1f2a44",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

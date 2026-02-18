import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "../styles/toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "info", options = {}) => {
      const id = crypto.randomUUID();
      const duration = typeof options.duration === "number" ? options.duration : 2000;

      const toast = {
        id,
        message,
        type,
        duration,
        actionLabel: options.actionLabel || "",
        onAction: typeof options.onAction === "function" ? options.onAction : null,
      };

      setToasts((prev) => [toast, ...prev].slice(0, 4));
      window.setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-body">
              <p className="toast-text">{t.message}</p>

              <div className="toast-actions">
                {t.actionLabel && t.onAction && (
                  <button
                    type="button"
                    className="toast-action"
                    onClick={() => {
                      t.onAction();
                      remove(t.id);
                    }}
                  >
                    {t.actionLabel}
                  </button>
                )}

                <button
                  type="button"
                  className="toast-close"
                  onClick={() => remove(t.id)}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="toast-bar" style={{ animationDuration: `${t.duration}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
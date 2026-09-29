import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function notify(message, type = 'success') {
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 6000);
  }
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
          <button aria-label="Cerrar notificación" onClick={() => setToast(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

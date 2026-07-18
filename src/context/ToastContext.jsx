import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastColors = {
  success: 'var(--spine-movies)', // #00D9C0
  info: 'var(--spine-books)',    // #4EA8DE
  warning: 'var(--spine-manga)',  // #FFC94D
  error: 'var(--spine-anime)'     // #FF4D6D
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Add toast to active queue
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);

    // Schedule exit slide-out animation (300ms before total duration ends)
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, duration - 300);

    // Schedule final removal
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global CSS Inject for responsive styling and slide transitions */}
      <style>{`
        @keyframes toast-in-desktop {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-out-desktop {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes toast-in-mobile {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes toast-out-mobile {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .toast-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 11000; /* Above hamburger/mobile drawers */
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          pointer-events: none;
          max-width: 350px;
          width: calc(100% - 4rem);
        }
        .toast-item {
          display: flex;
          align-items: center;
          background: var(--panel-raised);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 0.9rem 1.25rem;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          position: relative;
          pointer-events: auto;
          cursor: pointer;
          word-break: break-word; /* Wrap text on small viewports */
        }
        .toast-item-enter {
          animation: toast-in-desktop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .toast-item-exit {
          animation: toast-out-desktop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 480px) {
          .toast-container {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            width: auto;
            max-width: none;
          }
          .toast-item {
            font-size: 0.8rem;
            padding: 0.75rem 1rem;
          }
          .toast-item-enter {
            animation: toast-in-mobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .toast-item-exit {
            animation: toast-out-mobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>

      {/* Viewport Anchor Container */}
      <div className="toast-container">
        {toasts.map((toast) => {
          const accentColor = toastColors[toast.type] || toastColors.info;
          return (
            <div
              key={toast.id}
              className={`toast-item ${toast.isExiting ? 'toast-item-exit' : 'toast-item-enter'}`}
              style={{
                borderLeft: `4px solid ${accentColor}`
              }}
              onClick={() => {
                // Instantly mark exiting on click to slide out early
                setToasts((prev) =>
                  prev.map((t) => (t.id === toast.id ? { ...t, isExiting: true } : t))
                );
              }}
            >
              <div style={{ flexGrow: 1, paddingRight: '0.5rem', lineHeight: '1.4' }}>
                {toast.message}
              </div>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '14px',
                width: '14px'
              }}>&times;</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
export default ToastContext;

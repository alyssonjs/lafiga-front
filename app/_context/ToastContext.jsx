"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import ToastList from "../_components/UI/toast/ToastList";

const ToastContext = createContext({ show: () => {}, success: () => {}, error: () => {}, warning: () => {} });

export function ToastProvider({ children, position = "bottom-right", autoClose = true, durationMs = 4000 }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast = { id, message, type };
    setToasts((list) => [...list, toast]);
    if (autoClose) {
      setTimeout(() => removeToast(id), durationMs);
    }
  }, [autoClose, durationMs, removeToast]);

  const api = useMemo(() => ({
    show: (msg, type = "success") => push(msg, type),
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "failure"),
    warning: (msg) => push(msg, "warning"),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', zIndex: 10000, inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
          <ToastList data={toasts} position={position} removeToast={removeToast} />
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}


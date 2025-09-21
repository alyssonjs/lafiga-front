"use client";

import { useEffect, useState } from "react";

export default function Loader({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") { setReady(true); return; }
    if (document.readyState === "complete") return setReady(true);
    const onLoad = () => setReady(true);
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <>
      {!ready && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            gap: "0.5rem",
            background: "#0e0e10",
            zIndex: 9999,
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <img src="/loader-d20.gif" width={128} height={128} alt="Carregando…" />
          <p style={{ color: "#fff", opacity: 0.8 }}>Carregando…</p>
        </div>
      )}
      <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
    </>
  );
}


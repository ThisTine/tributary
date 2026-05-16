import React from "react";

export const Toast: React.FC<{ msg: string; accent: string }> = ({ msg, accent }) => (
  <div style={{
    position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
    padding: "9px 16px", borderRadius: 10,
    background: "rgba(28,28,32,0.92)", color: "#fff",
    fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em",
    display: "inline-flex", alignItems: "center", gap: 8,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.1)",
    animation: "toastIn 200ms cubic-bezier(0.3,0.7,0.4,1)",
    zIndex: 1000, whiteSpace: "nowrap",
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
    {msg}
  </div>
);

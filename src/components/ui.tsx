import React, { useState } from "react";
import type { PipelineStatus } from "../types";
import { IcCheck, IcSpinner, IcThumb, IcChat, IcAlert } from "./icons";

// ── Pipeline ──────────────────────────────────────────────────────────────────

export const PIPELINE_META: Record<PipelineStatus, { label: string; color: string; bg: string; icon: string }> = {
  success:  { label: "Passed",   color: "#1dad5e", bg: "rgba(29,173,94,0.15)",   icon: "check" },
  failed:   { label: "Failed",   color: "#e3445a", bg: "rgba(227,68,90,0.15)",   icon: "x" },
  running:  { label: "Running",  color: "#2f80ed", bg: "rgba(47,128,237,0.15)",  icon: "spin" },
  manual:   { label: "Manual",   color: "#9a6cd5", bg: "rgba(154,108,213,0.16)", icon: "pause" },
  canceled: { label: "Canceled", color: "#7a8497", bg: "rgba(122,132,151,0.15)", icon: "dash" },
};

const PipelineGlyph: React.FC<{ status: PipelineStatus; size?: number }> = ({ status, size = 11 }) => {
  const m = PIPELINE_META[status] ?? PIPELINE_META.canceled;
  if (m.icon === "spin") return <IcSpinner size={size} color={m.color} />;
  const d: Record<string, string> = {
    check: "M3 7l3 3 6-6", x: "M3 3l9 9M12 3l-9 9",
    pause: "M5 3v9M10 3v9", dash: "M3 7.5h9",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none"
         stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ display: "block" }}>
      <path d={d[m.icon] ?? ""} />
    </svg>
  );
};

export const PipelineBadge: React.FC<{ status: PipelineStatus; dense?: boolean }> = ({ status, dense = false }) => {
  const m = PIPELINE_META[status] ?? PIPELINE_META.canceled;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: dense ? "2px 8px 2px 6px" : "3px 10px 3px 7px",
      borderRadius: 4, fontSize: 10.5, fontWeight: 700,
      color: m.color, background: m.bg,
      border: `0.5px solid ${m.color}35`,
      letterSpacing: "0.01em", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)",
      textTransform: "uppercase",
    }}>
      <PipelineGlyph status={status} />
      {m.label}
    </span>
  );
};

// ── MetricChip ────────────────────────────────────────────────────────────────

type ChipTone = "normal" | "warn" | "good" | "bad";
const CHIP_PALETTE: Record<ChipTone, { fg: string; bg: string; border: string }> = {
  normal: { fg: "var(--fg-secondary)", bg: "var(--bg-subtle)",         border: "var(--border-subtle)" },
  warn:   { fg: "#a05b00",             bg: "rgba(214,128,0,0.14)",      border: "rgba(214,128,0,0.22)" },
  good:   { fg: "#117a3f",             bg: "rgba(29,173,94,0.14)",      border: "rgba(29,173,94,0.22)" },
  bad:    { fg: "#a8273c",             bg: "rgba(227,68,90,0.14)",      border: "rgba(227,68,90,0.22)" },
};

export const MetricChip: React.FC<{ icon: React.ReactNode; label: string; color?: string; tone?: ChipTone }> = ({
  icon, label, color, tone = "normal",
}) => {
  const p = CHIP_PALETTE[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px 2px 6px", borderRadius: 4,
      fontSize: 10.5, fontWeight: 700, color: color ?? p.fg,
      background: p.bg, border: `0.5px solid ${p.border}`,
      letterSpacing: "0.01em", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)", textTransform: "uppercase",
    }}>
      {icon}{label}
    </span>
  );
};

export const ApprovalsChip: React.FC<{ n: number; required: number }> = ({ n, required }) => (
  <MetricChip icon={<IcThumb size={11}/>} label={`${n}/${required}`}
    tone={n >= required ? "good" : n === 0 ? "normal" : "warn"} />
);

export const ThreadsChip: React.FC<{ unresolved: number }> = ({ unresolved }) => (
  <MetricChip icon={<IcChat size={11}/>}
    label={unresolved === 0 ? "All resolved" : `${unresolved} unresolved`}
    tone={unresolved === 0 ? "good" : unresolved > 4 ? "bad" : "warn"} />
);

export const ConflictChip: React.FC = () => (
  <MetricChip icon={<IcAlert size={11}/>} label="Conflicts" tone="bad" />
);

// ── LabelPill ─────────────────────────────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  "release-blocker": "#e3445a", security: "#e07b00", backend: "#2f80ed",
  frontend: "#9a6cd5", bug: "#e3445a", a11y: "#1dad5e",
  infra: "#5b6cff", mobile: "#ff6b9d", "breaking-change": "#a8273c",
  onboarding: "#9a6cd5",
};

export const LabelPill: React.FC<{ label: string; color?: string; small?: boolean }> = ({
  label, color, small = false,
}) => {
  const c = color ?? LABEL_COLORS[label] ?? "#7a8497";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "1px 6px" : "2px 8px",
      borderRadius: 3, fontSize: small ? 9.5 : 10, fontWeight: 700,
      background: `${c}18`, color: c, border: `0.5px solid ${c}38`,
      fontFamily: "var(--font-mono)", letterSpacing: "0.02em",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
};

// ── Buttons ───────────────────────────────────────────────────────────────────

export const IconBtn: React.FC<{ icon: React.ReactNode; label: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; danger?: boolean; size?: number }> = ({
  icon, label, onClick, active = false, danger = false, size = 28,
}) => {
  const [hover, setHover] = useState(false);
  const fg = active ? "var(--fg-primary)" : (danger ? "#a8273c" : "var(--fg-icon)");
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={label} aria-label={label}
      style={{
        width: size, height: size, borderRadius: 8,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--bg-subtle)" : (hover ? "var(--bg-subtle)" : "transparent"),
        border: "none", color: fg, cursor: "pointer", padding: 0,
        transition: "background 120ms ease",
      }}>
      {icon}
    </button>
  );
};

export const PrimaryBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; accent?: string; icon?: React.ReactNode; disabled?: boolean }> = ({
  children, onClick, accent = "#5b6cff", icon, disabled,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "0 13px", height: 28, borderRadius: 6,
        background: disabled ? `${accent}55` : hover ? accent : `${accent}e8`,
        color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em",
        border: "none", cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : `0 1px 4px ${accent}45`,
        transition: "background 120ms ease, box-shadow 120ms ease",
        fontFamily: "var(--font-sans)",
      }}>
      {icon}{children}
    </button>
  );
};

export const SecondaryBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; dense?: boolean }> = ({
  children, onClick, icon, dense = false,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: dense ? "0 9px" : "0 12px", height: dense ? 24 : 28,
        borderRadius: 6,
        background: hover ? "var(--bg-input)" : "var(--bg-subtle)",
        color: "var(--fg-primary)", fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em",
        border: "0.5px solid var(--border-subtle)", cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        transition: "background 120ms ease",
        fontFamily: "var(--font-sans)",
      }}>
      {icon}{children}
    </button>
  );
};

// ── GlassInput ────────────────────────────────────────────────────────────────

export const GlassInput: React.FC<{
  icon?: React.ReactNode; placeholder?: string; value: string;
  onChange: (v: string) => void; width?: number | string; kbd?: string; autoFocus?: boolean;
}> = ({ icon, placeholder, value, onChange, width, kbd, autoFocus }) => (
  <div style={{
    position: "relative", width, height: 28,
    display: "flex", alignItems: "center", gap: 6,
    padding: "0 10px", borderRadius: 6,
    background: "var(--bg-input)",
    border: "0.5px solid var(--border-input)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  }}>
    {icon && <span style={{ color: "var(--fg-muted)", display: "flex" }}>{icon}</span>}
    <input value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      style={{
        flex: 1, border: "none", background: "transparent", outline: "none",
        font: "inherit", fontSize: 12, color: "var(--fg-primary)",
        letterSpacing: "-0.01em", padding: 0, minWidth: 0,
      }} />
    {kbd && (
      <span style={{
        fontSize: 9.5, padding: "1px 4px", borderRadius: 3,
        background: "var(--bg-subtle)", color: "var(--fg-muted)",
        fontWeight: 700, letterSpacing: "0.04em",
        fontFamily: "var(--font-mono)",
      }}>{kbd}</span>
    )}
  </div>
);

// ── ApprovalDots ──────────────────────────────────────────────────────────────

export const ApprovalDots: React.FC<{ count: number; required: number }> = ({ count, required }) => (
  <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
    {Array.from({ length: required }).map((_, i) => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: "50%",
        background: i < count ? "#1dad5e" : "transparent",
        border: i < count ? "0.5px solid #1dad5e" : "1px solid var(--fg-muted)",
      }} />
    ))}
  </span>
);

// ── Overlay backdrop ──────────────────────────────────────────────────────────

export const Overlay: React.FC<{ onClose: () => void; children: React.ReactNode; align?: "center" | "right" }> = ({
  onClose, children, align = "center",
}) => (
  <div onClick={onClose} style={{
    position: "absolute", inset: 0, zIndex: 50,
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: align === "center" ? "center" : "stretch",
    justifyContent: align === "right" ? "flex-end" : "center",
    animation: "fadeIn 180ms ease",
  }}>
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

// ── Field helpers ─────────────────────────────────────────────────────────────

export const fieldStyle: React.CSSProperties = {
  width: "100%", height: 34, padding: "0 12px", borderRadius: 8,
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  fontSize: 12.5, color: "var(--fg-primary)", outline: "none",
  font: "inherit", boxSizing: "border-box",
};

export const FieldLabel: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-secondary)", letterSpacing: "-0.005em" }}>{label}</span>
    {children}
    {hint && <span style={{ fontSize: 10.5, color: "var(--fg-tertiary)", lineHeight: 1.4 }}>{hint}</span>}
  </label>
);

export const Checkbox: React.FC<{ checked: boolean; onChange: () => void; accent: string }> = ({ checked, onChange, accent }) => (
  <span onClick={(e) => { e.preventDefault(); onChange(); }} style={{
    width: 18, height: 18, borderRadius: 5,
    background: checked ? accent : "var(--bg-input)",
    border: checked ? "none" : "0.5px solid var(--border-input)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: checked ? `0 1px 4px ${accent}55` : "none",
    cursor: "pointer",
  }}>
    {checked && <IcCheck size={11} stroke="#fff" />}
  </span>
);

export const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void; accent: string }> = ({ label, value, onChange, accent }) => (
  <label style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 0", borderBottom: "0.5px solid var(--border-divider)", cursor: "pointer",
  }}>
    <span style={{ fontSize: 12.5, color: "var(--fg-primary)", fontWeight: 500 }}>{label}</span>
    <span onClick={() => onChange(!value)} style={{
      position: "relative", width: 38, height: 22, borderRadius: 999,
      background: value ? accent : "var(--bg-subtle)",
      border: `0.5px solid ${value ? accent + "60" : "var(--border-subtle)"}`,
      boxShadow: value ? `0 1px 4px ${accent}55` : "none",
      transition: "background 160ms ease",
      cursor: "pointer", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 18 : 2,
        width: 17, height: 17, borderRadius: "50%",
        background: "#fff",
        transition: "left 160ms cubic-bezier(0.3,0.7,0.4,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </span>
  </label>
);

export const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>{title}</div>
    {children}
  </div>
);

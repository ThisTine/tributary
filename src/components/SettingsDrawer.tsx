import React, { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import type { Settings } from "../types";
import { Overlay, IconBtn, ToggleRow } from "./ui";
import { IcX, IcSpinner } from "./icons";

interface Props {
  onClose: () => void;
  onSetup: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  accent: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.10em",
        textTransform: "uppercase", color: "var(--fg-muted)",
        fontFamily: "var(--font-mono)",
        paddingBottom: 6,
        borderBottom: "0.5px solid var(--border-divider)",
      }}>{title}</div>
      {children}
    </div>
  );
}

function InputField({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-secondary)", letterSpacing: "-0.005em" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ fontSize: 10.5, color: "var(--fg-muted)", lineHeight: 1.45 }}>{hint}</span>
      )}
    </label>
  );
}

type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; version: string; body: string | null | undefined }
  | { kind: "downloading"; pct: number }
  | { kind: "ready" }
  | { kind: "up_to_date" }
  | { kind: "error"; msg: string };

export const SettingsDrawer: React.FC<Props> = ({ onClose, onSetup, settings, onChange, accent }) => {
  const [tokenInput, setTokenInput] = useState("");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ kind: "idle" });
  const notif = settings.notifications;
  const ws = settings.workspace;

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 11px", borderRadius: 6,
    background: "var(--bg-input)", border: "0.5px solid var(--border-input)",
    fontSize: 12.5, color: "var(--fg-primary)", outline: "none",
    fontFamily: "var(--font-sans)", boxSizing: "border-box",
  };

  async function checkForUpdate() {
    setUpdateStatus({ kind: "checking" });
    try {
      const update = await check();
      if (!update?.available) {
        setUpdateStatus({ kind: "up_to_date" });
        return;
      }
      setUpdateStatus({ kind: "available", version: update.version, body: update.body });
    } catch (e) {
      setUpdateStatus({ kind: "error", msg: String(e) });
    }
  }

  async function downloadAndInstall() {
    setUpdateStatus({ kind: "downloading", pct: 0 });
    try {
      const update = await check();
      if (!update?.available) { setUpdateStatus({ kind: "up_to_date" }); return; }
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((progress) => {
        if (progress.event === "Started") {
          total = progress.data.contentLength ?? 0;
        } else if (progress.event === "Progress") {
          downloaded += progress.data.chunkLength;
          const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0;
          setUpdateStatus({ kind: "downloading", pct });
        } else if (progress.event === "Finished") {
          setUpdateStatus({ kind: "ready" });
        }
      });
    } catch (e) {
      setUpdateStatus({ kind: "error", msg: String(e) });
    }
  }

  return (
    <Overlay onClose={onClose} align="right">
      <div style={{
        width: 400, height: "100%",
        background: "var(--bg-panel)",
        borderLeft: "0.5px solid var(--border-subtle)",
        boxShadow: "-12px 0 50px rgba(0,0,0,0.10)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 240ms cubic-bezier(0.3,0.7,0.4,1)",
      }}>

        {/* Header */}
        <div style={{
          padding: "14px 18px",
          borderBottom: "0.5px solid var(--border-divider)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontSize: 20, fontWeight: 600,
              color: "var(--fg-primary)", letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>Settings</div>
            <div style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.10em",
              textTransform: "uppercase", color: "var(--fg-muted)",
              fontFamily: "var(--font-mono)", marginTop: 2,
            }}>TRIBUTARY CONFIG</div>
          </div>
          <IconBtn icon={<IcX size={13}/>} label="Close" onClick={onClose} />
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "18px 18px 28px",
          display: "flex", flexDirection: "column", gap: 22,
        }}>

          {/* Connection */}
          <Section title="Connection">
            <InputField label="GitLab instance">
              <input
                value={settings.instance}
                onChange={(e) => onChange({ instance: e.target.value })}
                placeholder="https://gitlab.com"
                style={inputStyle}
              />
            </InputField>

            <InputField
              label="Personal access token"
              hint="Stored in OS keychain. Needs api + read_user scope."
            >
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={settings.token_present ? "glpat-••••••••••••••••••••" : tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="glpat-••••••••••••••••••••"
                  style={inputStyle}
                />
                {settings.token_present && (
                  <span style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700,
                    letterSpacing: "0.06em", color: "#0f9d5a",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0f9d5a" }} />
                    VERIFIED
                  </span>
                )}
              </div>
            </InputField>

            <button onClick={onSetup} style={{
              width: "100%", padding: "8px 12px", borderRadius: 6,
              background: "var(--bg-subtle)",
              border: "0.5px solid var(--border-subtle)",
              fontSize: 12, fontWeight: 600,
              color: "var(--fg-secondary)", cursor: "pointer",
              textAlign: "center",
              fontFamily: "var(--font-sans)",
              transition: "background 120ms ease",
            }}>
              Re-run setup wizard
            </button>
          </Section>

          {/* Polling */}
          <Section title="Polling">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "var(--fg-secondary)", fontWeight: 500 }}>Check every</span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
                  color: "var(--fg-primary)", fontVariantNumeric: "tabular-nums",
                }}>
                  {settings.poll_interval_minutes === 1 ? "1 min" : `${settings.poll_interval_minutes} min`}
                </span>
              </div>
              <input
                type="range" min={1} max={30} step={1}
                value={settings.poll_interval_minutes}
                onChange={(e) => onChange({ poll_interval_minutes: Number(e.target.value) })}
                style={{ width: "100%", accentColor: accent, margin: 0 }}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "var(--font-mono)", fontSize: 9.5,
                color: "var(--fg-muted)", letterSpacing: "0.04em",
              }}>
                <span>1m</span><span>5m</span><span>15m</span><span>30m</span>
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <ToggleRow
              label="Pipeline failed on tracked MR"
              value={notif.pipeline_failed} accent={accent}
              onChange={(v) => onChange({ notifications: { ...notif, pipeline_failed: v } })}
            />
            <ToggleRow
              label="Review requested or changes pushed"
              value={notif.review_requested} accent={accent}
              onChange={(v) => onChange({ notifications: { ...notif, review_requested: v } })}
            />
            <ToggleRow
              label="I am @mentioned in a discussion"
              value={notif.mentioned} accent={accent}
              onChange={(v) => onChange({ notifications: { ...notif, mentioned: v } })}
            />
            <ToggleRow
              label="My MR was approved"
              value={notif.approved} accent={accent}
              onChange={(v) => onChange({ notifications: { ...notif, approved: v } })}
            />
          </Section>

          {/* Workspace */}
          <Section title="Workspace">
            <ToggleRow label="Launch at login" value={ws.launch_at_login} accent={accent}
              onChange={(v) => onChange({ workspace: { ...ws, launch_at_login: v } })} />
            <ToggleRow label="Close to tray"   value={ws.close_to_tray}   accent={accent}
              onChange={(v) => onChange({ workspace: { ...ws, close_to_tray: v } })} />
            <ToggleRow label="Reduce motion"   value={ws.reduce_motion}   accent={accent}
              onChange={(v) => onChange({ workspace: { ...ws, reduce_motion: v } })} />
          </Section>

          {/* Updates */}
          <Section title="Updates">
            <ToggleRow
              label="Automatically install updates"
              value={ws.auto_update} accent={accent}
              onChange={(v) => onChange({ workspace: { ...ws, auto_update: v } })}
            />

            <UpdatePanel status={updateStatus} accent={accent}
              onCheck={checkForUpdate} onInstall={downloadAndInstall} />
          </Section>

          {/* Version footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)",
            letterSpacing: "0.04em", paddingTop: 4,
          }}>
            <span>Tributary v0.1.2</span>
            <span>Tokens never leave your machine.</span>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

// ── Update panel ──────────────────────────────────────────────────────────────

function UpdatePanel({ status, accent, onCheck, onInstall }: {
  status: UpdateStatus;
  accent: string;
  onCheck: () => void;
  onInstall: () => void;
}) {
  const btnBase: React.CSSProperties = {
    height: 30, padding: "0 14px", borderRadius: 6,
    fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em",
    fontFamily: "var(--font-sans)", cursor: "pointer", border: "none",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "opacity 120ms ease",
  };

  if (status.kind === "checking") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-muted)" }}>
        <IcSpinner size={13} color="var(--fg-muted)" />
        Checking for updates…
      </div>
    );
  }

  if (status.kind === "up_to_date") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#0f9d5a", fontWeight: 500 }}>You're up to date.</span>
        <button onClick={onCheck} style={{ ...btnBase, background: "var(--bg-subtle)", color: "var(--fg-secondary)", border: "0.5px solid var(--border-subtle)" }}>
          Check again
        </button>
      </div>
    );
  }

  if (status.kind === "available") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          padding: "10px 12px", borderRadius: 6,
          background: `${accent}10`, border: `0.5px solid ${accent}30`,
          fontSize: 12, color: "var(--fg-primary)", lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600 }}>v{status.version} available</span>
          {status.body && (
            <div style={{ marginTop: 4, color: "var(--fg-tertiary)", fontSize: 11.5 }}>{status.body}</div>
          )}
        </div>
        <button onClick={onInstall} style={{ ...btnBase, background: accent, color: "#fff", boxShadow: `0 2px 10px ${accent}40` }}>
          Download &amp; install
        </button>
      </div>
    );
  }

  if (status.kind === "downloading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--fg-secondary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IcSpinner size={13} color="var(--fg-muted)" />
            Downloading…
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{status.pct}%</span>
        </div>
        <div style={{ height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${status.pct}%`, background: accent, borderRadius: 2, transition: "width 200ms ease" }} />
        </div>
      </div>
    );
  }

  if (status.kind === "ready") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--fg-secondary)" }}>Installed — restart to apply.</span>
        <button onClick={() => relaunch()} style={{ ...btnBase, background: accent, color: "#fff" }}>
          Restart now
        </button>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          padding: "8px 10px", borderRadius: 6,
          background: "rgba(217,50,81,0.07)", border: "0.5px solid rgba(217,50,81,0.25)",
          fontSize: 11.5, color: "#d93251", lineHeight: 1.4,
        }}>{status.msg}</div>
        <button onClick={onCheck} style={{ ...btnBase, background: "var(--bg-subtle)", color: "var(--fg-secondary)", border: "0.5px solid var(--border-subtle)", alignSelf: "flex-start" }}>
          Try again
        </button>
      </div>
    );
  }

  // idle
  return (
    <button onClick={onCheck} style={{ ...btnBase, background: "var(--bg-subtle)", color: "var(--fg-secondary)", border: "0.5px solid var(--border-subtle)", alignSelf: "flex-start" }}>
      Check for updates
    </button>
  );
}

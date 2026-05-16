import React from "react";
import { open } from "@tauri-apps/plugin-shell";
import type { MergeRequest } from "../types";
import { Avatar } from "./Glass";
import { PipelineBadge, IconBtn, SecondaryBtn } from "./ui";
import { IcX, IcBell, IcBellOff, IcArchive, IcLink, IcMerge } from "./icons";
import { useUIStore, NOTIF_KINDS, ALL_NOTIF_IDS } from "../store";

interface MRDetailProps {
  mr: MergeRequest;
  accent: string;
  onClose: () => void;
  onMute: (mr: MergeRequest) => void;
  onArchive: (mr: MergeRequest) => void;
}

function Divider() {
  return <div style={{ height: "0.5px", background: "var(--border-divider)" }} />;
}

function Toggle({ on, onChange, accent }: { on: boolean; onChange: () => void; accent: string }) {
  return (
    <div onClick={onChange} style={{
      width: 30, height: 17, borderRadius: 999, flexShrink: 0, cursor: "pointer",
      background: on ? accent : "var(--bg-subtle)",
      border: `0.5px solid ${on ? accent : "var(--border-input)"}`,
      position: "relative",
      transition: "background 160ms ease, border-color 160ms ease",
    }}>
      <div style={{
        position: "absolute",
        top: 2.5, left: on ? 15 : 2.5,
        width: 10, height: 10, borderRadius: "50%",
        background: on ? "#fff" : "var(--fg-muted)",
        transition: "left 160ms cubic-bezier(0.4,0,0.2,1), background 160ms ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
      }} />
    </div>
  );
}

function Section({ title, right, children }: {
  title: string; right?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--fg-muted)",
          fontFamily: "var(--font-mono)",
        }}>{title}</span>
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {children}
    </div>
  );
}


export const MRDetail: React.FC<MRDetailProps> = ({ mr, accent, onClose, onMute, onArchive }) => {
  const { getMrNotifPrefs, setMrNotifPrefs } = useUIStore();
  const enabledKinds = getMrNotifPrefs(mr.iid);

  const toggleKind = (id: string) => {
    const next = enabledKinds.includes(id)
      ? enabledKinds.filter((k) => k !== id)
      : [...enabledKinds, id];
    setMrNotifPrefs(mr.iid, next);
  };

  const enabledCount = enabledKinds.length;
  const allOn = enabledCount === ALL_NOTIF_IDS.length;

  const groups = [...new Set(NOTIF_KINDS.map((k) => k.group))];

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 372,
      background: "var(--bg-panel)",
      borderLeft: "0.5px solid var(--border-subtle)",
      boxShadow: "-12px 0 40px rgba(0,0,0,0.07)",
      display: "flex", flexDirection: "column",
      animation: "slideInRight 180ms cubic-bezier(0.3,0.7,0.4,1)",
      zIndex: 10,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Top row: path, iid, actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 10, fontFamily: "var(--font-mono)",
            color: "var(--fg-tertiary)", letterSpacing: "0.02em",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: mr.project_color, flexShrink: 0 }} />
            <span style={{ textTransform: "uppercase", fontSize: 9.5 }}>{mr.project_path}</span>
            <span style={{ color: "var(--fg-muted)" }}>·</span>
            <span style={{ color: "var(--fg-secondary)", fontWeight: 600 }}>!{mr.iid}</span>
          </div>
          <div style={{ flex: 1 }} />
          <IconBtn icon={mr.muted ? <IcBellOff size={13}/> : <IcBell size={13}/>}
            label={mr.muted ? "Unmute" : "Mute"} active={mr.muted} onClick={() => onMute(mr)} />
          <IconBtn icon={<IcArchive size={13}/>} label="Unsubscribe" onClick={() => onArchive(mr)} />
          <IconBtn icon={<IcX size={13}/>} label="Close" onClick={onClose} />
        </div>

        {/* MR title */}
        <div style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 19,
          fontWeight: 600,
          color: "var(--fg-primary)",
          letterSpacing: "-0.015em",
          lineHeight: 1.3,
        }}>{mr.title}</div>

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--fg-tertiary)" }}>
          <Avatar person={mr.author} size={18} />
          <span style={{ fontFamily: "var(--font-sans)" }}>
            <b style={{ color: "var(--fg-primary)", fontWeight: 600 }}>{mr.author.name}</b>
            {" · updated "}{mr.updated_relative} ago
          </span>
        </div>
      </div>

      <Divider />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Pipeline */}
        <Section title="Pipeline" right={<PipelineBadge status={mr.pipeline} dense />}>
          <div style={{ fontSize: 11, color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>
            {mr.pipeline_detail}
          </div>
          {mr.pipeline === "canceled" && (
            <div style={{
              padding: "8px 10px", borderRadius: 5,
              background: "var(--bg-subtle)", border: "0.5px solid var(--border-subtle)",
              fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)",
              letterSpacing: "0.02em",
            }}>NO PIPELINE DATA</div>
          )}
        </Section>

        <Divider />

        {/* Approvals */}
        <Section title="Approvals" right={
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
            color: mr.approvals >= mr.approvals_required ? "#0f9d5a" : "var(--fg-secondary)",
          }}>{mr.approvals}/{mr.approvals_required}</span>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {mr.reviewers.map((r, i) => {
              const approved = i < mr.approvals;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 6,
                  background: "var(--bg-subtle)",
                  border: "0.5px solid var(--border-subtle)",
                }}>
                  <Avatar person={r} size={18} />
                  <span style={{ fontSize: 12, color: "var(--fg-primary)", fontWeight: 500 }}>{r.name}</span>
                  <div style={{ flex: 1 }} />
                  {approved
                    ? <span style={{
                        fontSize: 10.5, fontWeight: 700, color: "#0f9d5a",
                        fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                      }}>APPROVED</span>
                    : <span style={{
                        fontSize: 10.5, fontWeight: 500, color: "var(--fg-tertiary)",
                        fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                      }}>PENDING</span>}
                </div>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* Discussions */}
        <Section title="Discussions" right={
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
            color: mr.unresolved_threads === 0 ? "var(--pipeline-success-fg)" : "#c47a00",
          }}>{mr.unresolved_threads} open</span>
        }>
          {mr.unresolved_threads > 0 ? (
            <div style={{
              padding: "10px 12px", borderRadius: 6,
              background: "var(--bg-subtle)",
              border: "0.5px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <span style={{ fontSize: 11.5, color: "var(--fg-secondary)" }}>
                {mr.unresolved_threads} unresolved {mr.unresolved_threads === 1 ? "thread" : "threads"}
              </span>
              <button onClick={() => open(`${mr.web_url}#notes`)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "2px 0", fontSize: 11, fontWeight: 600,
                color: accent, fontFamily: "var(--font-mono)",
                letterSpacing: "0.02em",
              }}>View on GitLab →</button>
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--fg-muted)", fontStyle: "italic", padding: "4px 0" }}>
              No unresolved threads.
            </div>
          )}
        </Section>

        {/* Activity */}
        {mr.activity.length > 0 && (
          <>
            <Divider />
            <Section title="Activity">
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {mr.activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    <Avatar person={a.who} size={14} />
                    <span style={{ color: "var(--fg-secondary)" }}>
                      <b style={{ color: "var(--fg-primary)", fontWeight: 600 }}>{a.who.name}</b> {a.what}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10.5, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                      {a.time}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Notifications */}
        <Divider />
        <Section title="Notifications" right={
          <button onClick={() => setMrNotifPrefs(mr.iid, allOn ? [] : ALL_NOTIF_IDS)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 600, color: accent,
            fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
            textTransform: "uppercase", padding: 0,
          }}>
            {allOn ? "Mute all" : "Enable all"}
          </button>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((group) => (
              <div key={group} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "var(--fg-muted)",
                  fontFamily: "var(--font-mono)", paddingBottom: 5,
                }}>
                  {group}
                </div>
                {NOTIF_KINDS.filter((k) => k.group === group).map((kind) => {
                  const on = enabledKinds.includes(kind.id);
                  return (
                    <div key={kind.id} onClick={() => toggleKind(kind.id)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                      background: "var(--bg-subtle)",
                      border: "0.5px solid transparent",
                      transition: "background 100ms ease",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    >
                      <span style={{
                        fontSize: 12, color: on ? "var(--fg-primary)" : "var(--fg-tertiary)",
                        fontWeight: on ? 500 : 400,
                        transition: "color 160ms ease",
                      }}>
                        {kind.label}
                      </span>
                      <Toggle on={on} onChange={() => toggleKind(kind.id)} accent={accent} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 4, fontSize: 10.5, color: "var(--fg-muted)",
            fontFamily: "var(--font-mono)", letterSpacing: "0.02em",
          }}>
            {enabledCount === 0
              ? "All notifications muted for this MR"
              : enabledCount === ALL_NOTIF_IDS.length
              ? "All notifications enabled"
              : `${enabledCount} of ${ALL_NOTIF_IDS.length} types enabled`}
          </div>
        </Section>
      </div>

      {/* Footer */}
      <Divider />
      <div style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
        <SecondaryBtn icon={<IcLink size={11}/>} onClick={() => open(mr.web_url)}>
          Open in GitLab
        </SecondaryBtn>
        <div style={{ flex: 1 }} />
        <SecondaryBtn icon={<IcMerge size={11}/>} dense onClick={() => open(`${mr.web_url}/diffs`)}>
          View diff
        </SecondaryBtn>
      </div>
    </div>
  );
};

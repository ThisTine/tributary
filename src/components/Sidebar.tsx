import React, { useState } from "react";
import type { User, ViewId } from "../types";
import { Avatar } from "./Glass";
import { IconBtn } from "./ui";
import { IcSettings } from "./icons";
import { startDrag } from "../drag";
import { Logo } from "./Logo";

const VIEWS: { id: ViewId; label: string; short: string }[] = [
  { id: "inbox",    label: "Inbox",          short: "IB" },
  { id: "activity", label: "Activity",       short: "AC" },
  { id: "reviews",  label: "My reviews",     short: "RV" },
  { id: "assigned", label: "Assigned to me", short: "AS" },
  { id: "authored", label: "Authored",       short: "AU" },
  { id: "muted",    label: "Muted",          short: "MU" },
];

function NavItem({ label, active, onClick, accent, count }: {
  label: string; active: boolean; onClick: () => void; accent: string; count?: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center",
        padding: "6px 18px 6px 20px",
        cursor: "pointer", position: "relative",
        background: active
          ? `${accent}12`
          : hover ? "var(--bg-subtle)" : "transparent",
        transition: "background 130ms ease",
        userSelect: "none",
      }}>
      {active && (
        <div style={{
          position: "absolute", left: 0, top: "18%", bottom: "18%",
          width: 2.5, borderRadius: "0 2px 2px 0",
          background: accent,
        }} />
      )}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? "var(--fg-primary)" : "var(--fg-secondary)",
        letterSpacing: "-0.015em",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        fontFamily: "var(--font-sans)",
      }}>{label}</span>
      {(count ?? 0) > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: active ? accent : "var(--fg-muted)",
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 16, textAlign: "right",
          letterSpacing: "-0.02em",
        }}>{count}</span>
      )}
    </div>
  );
}

interface SidebarProps {
  view: ViewId;
  onView: (v: ViewId) => void;
  onSettings: () => void;
  accent: string;
  counts: Record<string, number>;
  currentUser: User | null;
  instance: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view, onView, onSettings, accent, counts, currentUser, instance,
}) => (
  <div style={{
    width: 220, height: "100%", flexShrink: 0,
    display: "flex", flexDirection: "column",
    background: "var(--bg-sidebar)",
    borderRight: "0.5px solid var(--border-subtle)",
    position: "relative", zIndex: 2,
  }}>
    <div onMouseDown={startDrag} style={{ height: 28, flexShrink: 0, cursor: "default" }} />

    {/* Brand */}
    <div style={{ padding: "2px 20px 18px", animation: "riseUp 300ms 60ms cubic-bezier(0.2,0.8,0.4,1) backwards" }}>
      <Logo accent={accent} markHeight={30} nameSize={22} showSub />
    </div>

    {/* Divider */}
    <div style={{ height: "0.5px", background: "var(--border-divider)", margin: "0 0 6px" }} />

    {/* Views */}
    <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingTop: 4, paddingBottom: 4 }}>
      {VIEWS.map((v, i) => (
        <div key={v.id} style={{
          animation: `navItemIn 280ms ${120 + i * 45}ms cubic-bezier(0.2,0.8,0.4,1) backwards`,
        }}>
          <NavItem label={v.label}
            active={view === v.id} onClick={() => onView(v.id)}
            accent={accent} count={counts[v.id]} />
        </div>
      ))}
    </div>

    {/* Divider */}
    <div style={{ height: "0.5px", background: "var(--border-divider)" }} />

    {/* User section */}
    <div style={{
      padding: "10px 14px 12px",
      display: "flex", alignItems: "center", gap: 9,
      animation: "riseUp 280ms 400ms cubic-bezier(0.2,0.8,0.4,1) backwards",
    }}>
      {currentUser
        ? <Avatar person={currentUser} size={28} />
        : <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--bg-subtle)",
            border: "0.5px solid var(--border-subtle)",
          }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600,
          color: "var(--fg-primary)",
          letterSpacing: "-0.015em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {currentUser?.name ?? "Not signed in"}
        </div>
        <div style={{
          fontSize: 10, color: "var(--fg-muted)",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {instance.replace(/^https?:\/\//, "")}
        </div>
      </div>
      <IconBtn icon={<IcSettings size={14}/>} label="Settings" onClick={onSettings} />
    </div>
  </div>
);

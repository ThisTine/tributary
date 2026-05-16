import React from "react";
import type { ViewId, FilterId } from "../types";
import { GlassInput, PrimaryBtn } from "./ui";
import { IcSearch, IcPlus } from "./icons";
import { startDrag } from "../drag";

const VIEW_LABELS: Record<ViewId, string> = {
  inbox: "Inbox", activity: "Activity", reviews: "My reviews",
  assigned: "Assigned", authored: "Authored", muted: "Muted",
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all",     label: "All"       },
  { id: "attn",    label: "Attention" },
  { id: "passing", label: "Passing"   },
  { id: "failing", label: "Failing"   },
];

interface TopBarProps {
  view: ViewId;
  count: number;
  search: string;
  onSearch: (v: string) => void;
  filter: FilterId;
  onFilter: (f: FilterId) => void;
  showFilters?: boolean;
  onSubscribe: () => void;
  accent: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  view, count, search, onSearch, filter, onFilter, showFilters = true, onSubscribe, accent,
}) => {
  const unit = view === "activity"
    ? (count === 1 ? "notification" : "notifications")
    : (count === 1 ? "request" : "requests");

  return (
    <div onMouseDown={startDrag} style={{
      padding: "12px 20px 0",
      borderBottom: "0.5px solid var(--border-subtle)",
      background: "var(--bg-topbar)",
      animation: "topBarIn 300ms 80ms cubic-bezier(0.2,0.8,0.4,1) backwards",
      cursor: "default",
      userSelect: "none",
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h1 style={{
            margin: 0, lineHeight: 1,
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--fg-primary)",
            letterSpacing: "-0.025em",
          }}>{VIEW_LABELS[view]}</h1>
          <span style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-muted)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
            paddingBottom: 2,
          }}>{count} {unit}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <GlassInput
            icon={<IcSearch size={12}/>}
            placeholder="Search…"
            value={search}
            onChange={onSearch}
            width={164}
            kbd="⌘K"
          />
          <PrimaryBtn accent={accent} icon={<IcPlus size={12}/>} onClick={onSubscribe}>Track</PrimaryBtn>
        </div>
      </div>

      {/* Filter tab row */}
      {showFilters && (
        <div style={{ display: "flex", gap: 0, marginBottom: -0.5 }}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button key={f.id} onClick={() => onFilter(f.id)} style={{
                padding: "6px 14px",
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--fg-primary)" : "var(--fg-tertiary)",
                letterSpacing: "-0.01em",
                transition: "color 130ms ease, border-color 130ms ease",
                fontFamily: "var(--font-sans)",
                marginBottom: 0,
                paddingBottom: 8,
              }}>{f.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
};

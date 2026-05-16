import React, { useState } from "react";
import type { Event, MergeRequest, ActivityFilter } from "../types";
import { Avatar } from "./Glass";
import { IcBell } from "./icons";

const EVENT_META: Record<string, { color: string; bg: string; verb: string }> = {
  pipeline_failed:   { color: "var(--pipeline-failed-fg)",  bg: "var(--pipeline-failed-bg)",  verb: "Pipeline failed" },
  pipeline_passed:   { color: "var(--pipeline-success-fg)", bg: "var(--pipeline-success-bg)", verb: "Pipeline passed" },
  review_requested:  { color: "#5b6cff",                    bg: "rgba(91,108,255,0.12)",       verb: "Review requested" },
  changes_requested: { color: "#c47a00",                    bg: "rgba(196,122,0,0.12)",        verb: "Changes requested" },
  approved:          { color: "var(--pipeline-success-fg)", bg: "var(--pipeline-success-bg)", verb: "Approved" },
  commented:         { color: "var(--fg-tertiary)",          bg: "var(--bg-subtle)",            verb: "Commented" },
  pushed:            { color: "#5b6cff",                    bg: "rgba(91,108,255,0.12)",       verb: "New commits" },
  mentioned:         { color: "#9a6cd5",                    bg: "rgba(154,108,213,0.12)",      verb: "Mentioned you" },
  conflict:          { color: "var(--pipeline-failed-fg)",  bg: "var(--pipeline-failed-bg)",  verb: "Conflicts" },
  merged:            { color: "#9a6cd5",                    bg: "rgba(154,108,213,0.12)",      verb: "Merged" },
};

const ICON_PATHS: Record<string, string> = {
  pipeline_failed:   "M4 4l8 8M12 4l-8 8",
  pipeline_passed:   "M3.5 7.5l3 3 6-6",
  review_requested:  "M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  changes_requested: "M8 2l6.5 11.5h-13L8 2z M8 6.5v3 M8 11.5v0.5",
  approved:          "M9.5 6.5V4a2 2 0 0 0-2-2L4.5 8v6.5h7.6a1.3 1.3 0 0 0 1.3-1.1l0.9-6a1.3 1.3 0 0 0-1.3-1.5h-3.5z M4.5 14.5H3a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1h1.5",
  commented:         "M14 9.5a1.5 1.5 0 0 1-1.5 1.5H5l-3 3V4a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 4z",
  pushed:            "M5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 14.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 4.5v8.5M5 8c0 2 3 1.5 6 1.5",
  mentioned:         "M11 8a3 3 0 1 1-3-3 M11 5v3.5a1.5 1.5 0 0 0 3 0V8a6 6 0 1 0-2 4.5",
  conflict:          "M8 2l6.5 11.5h-13L8 2z M8 6.5v3 M8 11.5v0.5",
  merged:            "M5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 14.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 4.5v8.5M5 8c0 2 3 1.5 6 1.5",
};

function EventIcon({ kind, size = 13 }: { kind: string; size?: number }) {
  const m = EVENT_META[kind] ?? EVENT_META.commented;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         stroke={m.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICON_PATHS[kind] ?? ICON_PATHS.commented} />
    </svg>
  );
}

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "unread",    label: "Unread"    },
  { id: "mentions",  label: "@ Mentions"},
  { id: "reviews",   label: "Reviews"   },
  { id: "pipelines", label: "Pipelines" },
];

function FilterTabs({ filter, onFilter, accent, unreadCount }: {
  filter: ActivityFilter; onFilter: (f: ActivityFilter) => void; accent: string; unreadCount: number;
}) {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {FILTERS.map((f) => {
        const active = filter === f.id;
        return (
          <button key={f.id} onClick={() => onFilter(f.id)} style={{
            padding: "6px 14px 8px",
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
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            {f.label}
            {f.id === "unread" && unreadCount > 0 && (
              <span style={{
                minWidth: 16, height: 14, padding: "0 4px", borderRadius: 4,
                background: active ? accent : "var(--bg-subtle)",
                color: active ? "#fff" : "var(--fg-secondary)",
                fontSize: 9.5, fontWeight: 700,
                fontFamily: "var(--font-mono)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EventRow({ event, mr, isLast, onOpen, accent }: {
  event: Event; mr?: MergeRequest; isLast: boolean; onOpen: (iid: number) => void; accent: string;
}) {
  const [hover, setHover] = useState(false);
  if (!mr) return null;
  const meta = EVENT_META[event.kind] ?? EVENT_META.commented;

  return (
    <div onClick={() => onOpen(mr.iid)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "grid", gridTemplateColumns: "20px 28px 1fr auto",
        alignItems: "flex-start", columnGap: 10, rowGap: 4,
        padding: "11px 16px",
        background: hover ? "var(--bg-card-hover)" : "transparent",
        borderBottom: isLast ? "none" : "0.5px solid var(--border-divider)",
        cursor: "pointer", transition: "background 100ms ease",
      }}>
      <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {event.unread && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 0 3px ${accent}2a`, flexShrink: 0 }} />
        )}
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: meta.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <EventIcon kind={event.kind} size={13} />
      </div>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: mr.project_color, flexShrink: 0 }} />
            <span style={{
              fontSize: 10, fontFamily: "var(--font-mono)",
              color: "var(--fg-secondary)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>{mr.project_path}</span>
          </span>
          <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>·</span>
          <span style={{
            fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 10,
            color: "var(--fg-tertiary)",
          }}>!{mr.iid}</span>
          <span style={{
            padding: "1px 6px", borderRadius: 4,
            background: meta.bg, color: meta.color,
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em",
            fontFamily: "var(--font-mono)", textTransform: "uppercase",
          }}>{meta.verb}</span>
        </div>
        <div style={{
          fontSize: 12.5, fontWeight: event.unread ? 600 : 400,
          color: "var(--fg-primary)", letterSpacing: "-0.015em", lineHeight: 1.35,
          fontFamily: "var(--font-sans)",
        }}>
          {event.who && <span style={{ fontWeight: 600 }}>{event.who.name} </span>}
          <span style={{ color: "var(--fg-secondary)", fontWeight: 400 }}>{event.body}</span>
        </div>
        <div style={{
          fontSize: 11, color: "var(--fg-tertiary)",
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{mr.title}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 52 }}>
        <span style={{
          fontSize: 10.5, color: "var(--fg-muted)",
          fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
        }}>{event.time_relative}</span>
        {event.who && <Avatar person={event.who} size={18} />}
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  events: Event[];
  mrs: MergeRequest[];
  filter: ActivityFilter;
  onFilter: (f: ActivityFilter) => void;
  onMarkAllRead: () => void;
  onOpen: (iid: number) => void;
  accent: string;
}

const BUCKETS: { id: string; label: string }[] = [
  { id: "today",     label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "earlier",   label: "Earlier this week" },
];

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, mrs, filter, onFilter, onMarkAllRead, onOpen, accent }) => {
  let visible = events;
  if (filter === "unread")    visible = visible.filter((e) => e.unread);
  if (filter === "mentions")  visible = visible.filter((e) => e.kind === "mentioned");
  if (filter === "pipelines") visible = visible.filter((e) => e.kind === "pipeline_failed" || e.kind === "pipeline_passed");
  if (filter === "reviews")   visible = visible.filter((e) => ["review_requested", "changes_requested", "approved"].includes(e.kind));

  const unreadCount = events.filter((e) => e.unread).length;
  const isEmpty = visible.length === 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 32px", display: "flex", flexDirection: "column" }}>
      {/* Filter bar — matches TopBar filter row */}
      <div style={{
        padding: "0 20px",
        display: "flex", alignItems: "center",
        borderBottom: "0.5px solid var(--border-subtle)",
        background: "var(--bg-topbar)",
        position: "sticky", top: 0, zIndex: 4,
        marginBottom: -0.5,
      }}>
        <FilterTabs filter={filter} onFilter={onFilter} accent={accent} unreadCount={unreadCount} />
        <div style={{ flex: 1 }} />
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} style={{
            background: "transparent", border: "none",
            padding: "4px 8px", fontSize: 11.5, fontWeight: 600,
            color: accent, cursor: "pointer",
            letterSpacing: "-0.01em", borderRadius: 6,
            fontFamily: "var(--font-sans)",
          }}>
            Mark all read
          </button>
        )}
      </div>

      {isEmpty && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, textAlign: "center", minHeight: 280 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-subtle)", border: "0.5px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)" }}>
            <IcBell size={18} sw={1.4} />
          </div>
          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 20, fontWeight: 600, color: "var(--fg-primary)", letterSpacing: "-0.02em",
          }}>
            {filter === "unread" ? "All caught up." : filter === "mentions" ? "No @-mentions." : "Nothing to see here."}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-tertiary)", lineHeight: 1.6 }}>You're up to date.</div>
        </div>
      )}

      {!isEmpty && (
        <div style={{ padding: "12px 0 0" }}>
          {BUCKETS.map((bucket) => {
            const items = visible.filter((e) => e.bucket === bucket.id);
            if (!items.length) return null;
            return (
              <div key={bucket.id} style={{ marginBottom: 20 }}>
                <div style={{
                  padding: "0 20px 6px",
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "var(--fg-muted)",
                  fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "baseline", gap: 8,
                }}>
                  <span>{bucket.label}</span>
                  <span style={{ fontWeight: 500, color: "var(--fg-muted)", opacity: 0.7 }}>
                    {items.length}
                  </span>
                </div>
                <div style={{
                  margin: "0 18px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border-card)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 16px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}>
                  {items.map((e, i) => (
                    <EventRow key={e.id} event={e} mr={mrs.find((m) => m.iid === e.mr_iid)}
                      isLast={i === items.length - 1} onOpen={onOpen} accent={accent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

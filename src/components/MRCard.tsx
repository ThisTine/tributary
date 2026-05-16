import React, { useState } from "react";
import type { MergeRequest } from "../types";
import { Avatar, AvatarStack } from "./Glass";
import { PipelineBadge, LabelPill, IconBtn } from "./ui";
import { IcBell, IcArchive, IcBellOff } from "./icons";

interface MRCardProps {
  mr: MergeRequest;
  accent: string;
  density?: "compact" | "regular" | "comfy";
  selected: boolean;
  index?: number;
  unreadCount?: number;
  onOpen: (mr: MergeRequest) => void;
  onMute: (mr: MergeRequest) => void;
  onArchive: (mr: MergeRequest) => void;
}

const ROLE_LABELS: Record<string, string> = {
  author: "Author", reviewer: "Reviewer", assignee: "Assignee",
};

export const MRCard: React.FC<MRCardProps> = ({
  mr, accent, density = "regular", selected, index = 0, unreadCount = 0, onOpen, onMute, onArchive,
}) => {
  const [hover, setHover] = useState(false);
  const delay = Math.min(index * 38, 300);
  const vPad = density === "compact" ? 10 : density === "comfy" ? 16 : 13;
  const hPad = density === "compact" ? 14 : density === "comfy" ? 18 : 16;
  const needsAttention = mr.pipeline === "failed"
    || (mr.role === "reviewer" && mr.approvals < mr.approvals_required);
  const railColor = needsAttention && mr.pipeline === "failed" ? "#d93251" : mr.project_color;
  const roleLabel = mr.role === "label"
    ? (mr.label_match ?? "Label")
    : (ROLE_LABELS[mr.role] ?? mr.role);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(mr)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 10,
        paddingTop: vPad,
        paddingBottom: vPad,
        paddingLeft: hPad + 4,
        paddingRight: hPad,
        animation: `cardIn 300ms ${delay}ms cubic-bezier(0.2,0.8,0.4,1) both`,
        background: selected
          ? "var(--bg-card-selected)"
          : hover
            ? "var(--bg-card-hover)"
            : "var(--bg-card)",
        border: selected
          ? `0.5px solid ${accent}45`
          : `0.5px solid var(--border-card)`,
        borderLeft: `3px solid ${railColor}${needsAttention && mr.pipeline === "failed" ? "" : ""}`,
        boxShadow: selected
          ? `0 2px 14px rgba(0,0,0,0.10), 0 0 0 1px ${accent}25`
          : hover
            ? "0 2px 10px rgba(0,0,0,0.08)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "background 130ms ease, box-shadow 130ms ease",
        display: "flex", flexDirection: "column", gap: density === "compact" ? 6 : 8,
      }}>

      {/* Attention pulse overlay on rail */}
      {needsAttention && (
        <div style={{
          position: "absolute", left: -3, top: 0, bottom: 0, width: 3,
          background: railColor, borderRadius: "10px 0 0 10px",
          animation: "attentionPulse 1.8s 400ms ease-in-out 4",
          pointerEvents: "none",
        }} />
      )}

      {/* Row 1: project · iid · role badge · time · actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 10, fontFamily: "var(--font-mono)",
        color: "var(--fg-muted)", letterSpacing: "0.02em",
      }}>
        <span style={{
          fontWeight: 500,
          color: "var(--fg-tertiary)",
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          fontSize: 9.5,
        }}>{mr.project_path}</span>
        <span>·</span>
        <span style={{ fontWeight: 600, color: "var(--fg-secondary)" }}>!{mr.iid}</span>
        <span style={{
          padding: "1px 6px", borderRadius: 3,
          background: "var(--bg-subtle)",
          color: "var(--fg-tertiary)",
          fontSize: 9, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
        }}>{roleLabel}</span>
        {mr.muted && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            color: "var(--fg-muted)", fontSize: 9.5, fontWeight: 600,
            fontFamily: "var(--font-sans)", letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            <IcBellOff size={10}/> MUTED
          </span>
        )}
        <div style={{ flex: 1 }} />
        {unreadCount > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "1.5px 6px", borderRadius: 999,
            background: accent, color: "#fff",
            fontSize: 9.5, fontWeight: 700,
            fontFamily: "var(--font-mono)", letterSpacing: "0.02em",
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
            {unreadCount}
          </span>
        )}
        <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--fg-muted)", fontSize: 10 }}>
          {mr.updated_relative}
        </span>
        <div style={{
          display: "flex", gap: 1, marginLeft: 2,
          opacity: hover ? 1 : 0,
          transition: "opacity 100ms ease",
          pointerEvents: hover ? "auto" : "none",
        }}>
          <IconBtn icon={<IcBell size={12}/>} label="Mute" size={22}
            onClick={(e) => { e.stopPropagation(); onMute(mr); }} />
          <IconBtn icon={<IcArchive size={12}/>} label="Unsubscribe" size={22}
            onClick={(e) => { e.stopPropagation(); onArchive(mr); }} />
        </div>
      </div>

      {/* Row 2: title (serif, headline style) */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Avatar person={mr.author} size={density === "compact" ? 22 : 24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: density === "compact" ? 16 : density === "comfy" ? 19 : 17.5,
            fontWeight: 600,
            color: "var(--fg-primary)",
            letterSpacing: "-0.01em",
            lineHeight: 1.28,
          }}>
            {mr.draft && (
              <span style={{
                display: "inline-block", marginRight: 7,
                padding: "1px 5px", borderRadius: 3,
                background: "var(--bg-subtle)",
                color: "var(--fg-muted)",
                fontSize: 9, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                fontFamily: "var(--font-sans)", fontStyle: "normal",
                verticalAlign: 2,
              }}>DRAFT</span>
            )}
            {mr.title}
          </div>
          <div style={{
            marginTop: 4, display: "flex", alignItems: "center", gap: 5,
            fontSize: 10.5, fontFamily: "var(--font-mono)",
            color: "var(--fg-tertiary)", letterSpacing: "-0.01em",
          }}>
            <span style={{ color: "var(--fg-secondary)", fontWeight: 500 }}>{mr.author.name}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{mr.branch}</span>
          </div>
        </div>
      </div>

      {/* Row 3: status indicators */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap",
        paddingLeft: density === "compact" ? 32 : 34,
      }}>
        <PipelineBadge status={mr.pipeline} dense />
        {mr.conflicts && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 4,
            fontSize: 10, fontWeight: 600, letterSpacing: "-0.01em",
            color: "#d93251", background: "rgba(217,50,81,0.10)",
            border: "0.5px solid rgba(217,50,81,0.22)",
          }}>Conflicts</span>
        )}
        <div style={{ flex: 1 }} />
        {(mr.additions > 0 || mr.deletions > 0) && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, display: "flex", gap: 5,
            color: "var(--fg-muted)",
          }}>
            <span style={{ color: "#0f9d5a" }}>+{mr.additions}</span>
            <span style={{ color: "#d93251" }}>−{mr.deletions}</span>
          </span>
        )}
        <AvatarStack people={mr.reviewers} size={16} max={3} />
      </div>

      {/* Row 4: labels */}
      {mr.labels.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingLeft: density === "compact" ? 32 : 34 }}>
          {mr.labels.map((lab) => <LabelPill key={lab} label={lab} small />)}
        </div>
      )}
    </div>
  );
};

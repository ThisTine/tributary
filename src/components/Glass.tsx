import React from "react";

type Tone = "neutral" | "warm" | "cool" | "deep";

interface GlassProps {
  radius?: number;
  opacity?: number;
  tone?: Tone;
  dark?: boolean;
  border?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

/* Liquid Glass — ultra-transparent + specular highlight */
export const Glass: React.FC<GlassProps> = ({
  radius = 18, opacity = 0.12, tone = "neutral", dark = false,
  border = true, children, style = {}, className = "", onClick,
}) => {
  const bg: Record<Tone, [string, string]> = {
    neutral: ["rgba(255,255,255,", "rgba(255,255,255,"],
    warm:    ["rgba(255,248,240,", "rgba(255,248,240,"],
    cool:    ["rgba(240,246,255,", "rgba(240,246,255,"],
    deep:    ["rgba(220,230,255,", "rgba(220,230,255,"],
  };
  const [top, bot] = bg[tone];
  const background = dark
    ? `linear-gradient(180deg, rgba(30,30,42,${opacity + 0.06}) 0%, rgba(20,20,32,${opacity}) 100%)`
    : `linear-gradient(180deg, ${top}${opacity + 0.08}) 0%, ${bot}${opacity}) 100%)`;

  return (
    <div onClick={onClick} className={className} style={{
      position: "relative", borderRadius: radius,
      background,
      border: border
        ? (dark ? "0.5px solid rgba(255,255,255,0.12)" : "0.5px solid rgba(255,255,255,0.45)")
        : "none",
      boxShadow: dark
        ? "0 1.5px 0 rgba(255,255,255,0.10) inset, 0 -1px 0 rgba(0,0,0,0.18) inset, 0 8px 32px rgba(0,0,0,0.40)"
        : "0 1.5px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 8px 32px rgba(0,0,0,0.10)",
      ...style,
    }}>{children}</div>
  );
};

export const Avatar: React.FC<{ person: { initials: string; color: string; name?: string }; size?: number }> = ({ person, size = 22 }) => {
  const fontSize = Math.max(9, size * 0.42);
  return (
    <div title={person.name} style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${person.color} 0%, ${person.color}cc 100%)`,
      color: "#fff", fontSize, fontWeight: 700, letterSpacing: "-0.02em",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 1.5px 0 rgba(255,255,255,0.45) inset, 0 2px 6px ${person.color}55`,
      flexShrink: 0, userSelect: "none",
    }}>{person.initials}</div>
  );
};

export const AvatarStack: React.FC<{ people: { initials: string; color: string; name: string }[]; size?: number; max?: number }> = ({
  people, size = 20, max = 3,
}) => {
  const shown = people.slice(0, max);
  return (
    <div style={{ display: "flex" }}>
      {shown.map((p, i) => (
        <div key={i} style={{
          marginLeft: i === 0 ? 0 : -size * 0.35,
          padding: 1.5, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>
          <Avatar person={p} size={size} />
        </div>
      ))}
    </div>
  );
};

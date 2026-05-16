
interface LogoMarkProps {
  height?: number;
  color?: string;
}

export function LogoMark({ height = 36, color = "currentColor" }: LogoMarkProps) {
  const width = Math.round(height * 40 / 58);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 58"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Source dots — three origins */}
      <circle cx="5"  cy="4" r="2"   fill={color} />
      <circle cx="20" cy="4" r="2"   fill={color} />
      <circle cx="35" cy="4" r="2"   fill={color} />

      {/* Left tributary — curves in from the left */}
      <path
        d="M5,4 C5,22 16,32 20,40"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />

      {/* Centre tributary — descends straight */}
      <path
        d="M20,4 L20,40"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />

      {/* Right tributary — curves in from the right */}
      <path
        d="M35,4 C35,22 24,32 20,40"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />

      {/* Convergence node */}
      <circle cx="20" cy="40" r="2.6" fill={color} />

      {/* Main stream — exits downward, slightly heavier */}
      <path
        d="M20,40 L20,56"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  accent?: string;
  markHeight?: number;
  nameSize?: number;
  showSub?: boolean;
}

export function Logo({
  accent = "#5b6cff",
  markHeight = 30,
  nameSize = 22,
  showSub = true,
}: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark height={markHeight} color={accent} />
      <div>
        <div style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: nameSize,
          fontWeight: 600,
          color: "var(--fg-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          Tributary
        </div>
        {showSub && (
          <div style={{
            fontSize: 9.5,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            marginTop: 3,
            fontFamily: "var(--font-mono)",
          }}>
            MR Feed
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import type { AuthResult, Settings } from "../types";
import { api } from "../ipc";
import { IcSpinner } from "./icons";
import { LogoMark } from "./Logo";

type Step = "welcome" | "connect" | "done";

interface Props {
  onComplete: (user: AuthResult["user"], settings: Settings) => void;
}

const ACCENT = "#5b6cff";

const FEATURES = [
  { n: "01", label: "Inbox that actually works", desc: "Pipeline failures, review requests, @mentions — each surfaced at the right moment." },
  { n: "02", label: "Token stays on your machine", desc: "Your PAT lives in the macOS Keychain and is never transmitted anywhere." },
  { n: "03", label: "Polled in the background", desc: "Tributary checks GitLab quietly so your inbox is always current." },
];

const ease = "cubic-bezier(0.2,0.8,0.4,1)";

function StepLabel({ step }: { step: Step }) {
  const map: Record<Step, string> = { welcome: "01 / 03", connect: "02 / 03", done: "03 / 03" };
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 500,
      letterSpacing: "0.10em", color: "var(--fg-muted)",
      transition: "opacity 200ms ease",
    }}>{map[step]}</span>
  );
}

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [instance, setInstance] = useState("https://gitlab.com");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResult["user"]>(undefined);

  async function handleConnect() {
    if (!token.trim()) { setError("Enter your personal access token."); return; }
    setLoading(true); setError(null);
    try {
      await api.setSettings({ instance: instance.trim().replace(/\/$/, "") });
      const result = await api.setToken(token.trim());
      if (!result.ok) {
        setError(result.error ?? "Connection failed. Check your token and instance URL.");
      } else {
        setUser(result.user);
        setStep("done");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleLaunch() {
    const settings: Settings = {
      instance: instance.trim().replace(/\/$/, ""),
      token_present: true,
      poll_interval_minutes: 5,
      notifications: { pipeline_failed: true, review_requested: true, mentioned: true, approved: false },
      workspace: { launch_at_login: false, close_to_tray: true, reduce_motion: false, auto_update: true,
        theme: { wallpaper: "dusk", accent: ACCENT, density: "regular", glass_strength: 0.55 } },
    };
    onComplete(user, settings);
  }

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      fontFamily: "var(--font-sans)",
      animation: `appIn 400ms ${ease}`,
    }}>
      <div data-tauri-drag-region style={{ position: "absolute", top: 0, left: 0, right: 0, height: 28 }} />

      {/* Card — dramatic entrance */}
      <div style={{
        width: 480,
        background: "var(--bg-modal)",
        borderRadius: 12,
        border: "0.5px solid var(--border-subtle)",
        boxShadow: "0 32px 100px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        animation: `modalIn 500ms ${ease}`,
      }}>

        {/* Top bar */}
        <div style={{
          padding: "14px 24px",
          borderBottom: "0.5px solid var(--border-divider)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          animation: `riseUp 400ms 180ms ${ease} backwards`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoMark height={20} color="#5b6cff" />
            <span style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontSize: 16, fontWeight: 600,
              color: "var(--fg-primary)", letterSpacing: "-0.015em",
            }}>Tributary</span>
          </div>
          <StepLabel step={step} />
        </div>

        {/* Step body — key causes full remount + fresh entrance animation on each step */}
        <div key={step} style={{
          padding: "28px 28px 32px",
          display: "flex", flexDirection: "column", gap: 20,
          animation: `stepIn 280ms ${ease} backwards`,
        }}>

          {step === "welcome" && (
            <>
              {/* Headline: each line reveals sequentially */}
              <div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{
                    fontFamily: "var(--font-serif)", fontStyle: "italic",
                    fontSize: 30, fontWeight: 600,
                    color: "var(--fg-primary)", letterSpacing: "-0.025em", lineHeight: 1.15,
                    animation: `wordReveal 520ms 60ms ${ease} backwards`,
                  }}>Your GitLab</div>
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{
                    fontFamily: "var(--font-serif)", fontStyle: "italic",
                    fontSize: 30, fontWeight: 600,
                    color: "var(--fg-primary)", letterSpacing: "-0.025em", lineHeight: 1.15,
                    animation: `wordReveal 520ms 180ms ${ease} backwards`,
                  }}>MR inbox.</div>
                </div>
                <div style={{
                  fontSize: 13, color: "var(--fg-tertiary)", lineHeight: 1.55,
                  maxWidth: 340, marginTop: 8,
                  animation: `riseUp 400ms 360ms ${ease} backwards`,
                }}>
                  Know exactly what needs your attention — without opening GitLab.
                </div>
              </div>

              {/* Feature list — each item staggers in from left */}
              <div style={{
                display: "flex", flexDirection: "column", gap: 0,
                borderTop: "0.5px solid var(--border-divider)",
              }}>
                {FEATURES.map((f, i) => (
                  <div key={f.n} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "13px 0",
                    borderBottom: "0.5px solid var(--border-divider)",
                    animation: `slideFromLeft 380ms ${460 + i * 100}ms ${ease} backwards`,
                  }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500,
                      color: "var(--fg-muted)", letterSpacing: "0.06em",
                      paddingTop: 2, flexShrink: 0,
                    }}>{f.n}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-primary)", letterSpacing: "-0.012em", marginBottom: 2 }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--fg-tertiary)", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA — arrives last */}
              <div style={{ animation: `riseUp 340ms 860ms ${ease} backwards` }}>
                <WizardBtn accent={ACCENT} onClick={() => setStep("connect")}>
                  Get started
                </WizardBtn>
              </div>
            </>
          )}

          {step === "connect" && (
            <>
              <div>
                <div style={{
                  fontFamily: "var(--font-serif)", fontStyle: "italic",
                  fontSize: 26, fontWeight: 600,
                  color: "var(--fg-primary)", letterSpacing: "-0.02em", lineHeight: 1.2,
                  marginBottom: 4,
                  animation: `wordReveal 380ms 40ms ${ease} backwards`,
                }}>Connect GitLab</div>
                <div style={{
                  fontSize: 12.5, color: "var(--fg-tertiary)", lineHeight: 1.5,
                  animation: `riseUp 320ms 140ms ${ease} backwards`,
                }}>
                  Add your instance URL and a personal access token.
                </div>
              </div>

              <div style={{ animation: `riseUp 300ms 180ms ${ease} backwards` }}>
                <WizardField label="GitLab instance">
                  <input
                    value={instance}
                    onChange={(e) => setInstance(e.target.value)}
                    placeholder="https://gitlab.com"
                    style={wizardInputStyle}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  />
                </WizardField>
              </div>

              <div style={{ animation: `riseUp 300ms 250ms ${ease} backwards` }}>
                <WizardField
                  label="Personal access token"
                  hint={
                    <>Needs{" "}
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, background: "var(--bg-subtle)", padding: "1px 4px", borderRadius: 3 }}>api</code>
                      {" "}+{" "}
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, background: "var(--bg-subtle)", padding: "1px 4px", borderRadius: 3 }}>read_user</code>
                      {" "}scope
                    </>
                  }
                >
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(null); }}
                    placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    style={{
                      ...wizardInputStyle,
                      ...(error ? { borderColor: "#d93251", background: "rgba(217,50,81,0.04)" } : {}),
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    autoFocus
                  />
                </WizardField>
              </div>

              {error && (
                <div style={{
                  padding: "9px 12px", borderRadius: 6,
                  background: "rgba(217,50,81,0.07)", border: "0.5px solid rgba(217,50,81,0.25)",
                  fontSize: 12, color: "#d93251", lineHeight: 1.45,
                  animation: `riseUp 200ms ${ease} backwards`,
                }}>{error}</div>
              )}

              <div style={{
                display: "flex", gap: 8,
                animation: `riseUp 280ms 320ms ${ease} backwards`,
              }}>
                <button onClick={() => setStep("welcome")} style={wizardSecondaryStyle}>Back</button>
                <WizardBtn accent={ACCENT} onClick={handleConnect} disabled={loading} flex>
                  {loading
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <IcSpinner size={14} color="#fff" />Connecting…
                      </span>
                    : "Connect"}
                </WizardBtn>
              </div>

              <div style={{
                textAlign: "center", marginTop: -8,
                animation: `riseUp 260ms 420ms ${ease} backwards`,
              }}>
                <button onClick={handleLaunch} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--fg-muted)",
                  fontFamily: "var(--font-sans)",
                  textDecoration: "underline", textDecorationColor: "var(--border-subtle)",
                  padding: 0,
                }}>Skip for now</button>
              </div>
            </>
          )}

          {step === "done" && (
            <>
              <div>
                <div style={{
                  fontFamily: "var(--font-serif)", fontStyle: "italic",
                  fontSize: 26, fontWeight: 600,
                  color: "var(--fg-primary)", letterSpacing: "-0.02em", lineHeight: 1.2,
                  marginBottom: 4,
                  animation: `wordReveal 400ms 40ms ${ease} backwards`,
                }}>You're all set.</div>
                <div style={{
                  fontSize: 12.5, color: "var(--fg-tertiary)", lineHeight: 1.5,
                  animation: `riseUp 340ms 160ms ${ease} backwards`,
                }}>
                  Tributary will check GitLab every 5 minutes. Adjust the interval in Settings anytime.
                </div>
              </div>

              <div style={{ animation: `slideFromLeft 340ms 280ms ${ease} backwards` }}>
                <div style={{
                  padding: "12px 14px", borderRadius: 6,
                  background: "rgba(15,157,90,0.07)",
                  border: "0.5px solid rgba(15,157,90,0.25)",
                  display: "flex", gap: 10, alignItems: "center",
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#0f9d5a", flexShrink: 0,
                    boxShadow: "0 0 0 3px rgba(15,157,90,0.20)",
                    animation: "attentionPulse 1.6s 600ms ease-in-out 3",
                  }} />
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-secondary)", letterSpacing: "0.01em" }}>
                    <span style={{ color: "#0f9d5a", fontWeight: 600 }}>CONNECTED</span>
                    {" · "}{instance.replace(/https?:\/\//, "")}
                    {user && <>{" · @"}{user.username}</>}
                  </div>
                </div>
              </div>

              <div style={{ animation: `riseUp 320ms 420ms ${ease} backwards` }}>
                <WizardBtn accent={ACCENT} onClick={handleLaunch}>
                  Launch Tributary
                </WizardBtn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WizardBtn({
  accent, onClick, disabled, children, flex,
}: {
  accent: string; onClick: () => void; disabled?: boolean;
  children: React.ReactNode; flex?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: flex ? 1 : undefined,
      width: flex ? undefined : "100%",
      height: 40, borderRadius: 7,
      background: disabled ? `${accent}66` : accent,
      color: "#fff",
      fontFamily: "var(--font-sans)",
      fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em",
      border: "none", cursor: disabled ? "default" : "pointer",
      boxShadow: disabled ? "none" : `0 2px 12px ${accent}45`,
      transition: "opacity 120ms ease, box-shadow 120ms ease",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      {children}
    </button>
  );
}

function WizardField({ label, hint, children }: {
  label: string; hint?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--fg-tertiary)",
        fontFamily: "var(--font-mono)",
      }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--fg-muted)", lineHeight: 1.5 }}>{hint}</span>}
    </label>
  );
}

const wizardInputStyle: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 11px", borderRadius: 6,
  background: "var(--bg-input)",
  border: "0.5px solid var(--border-input)",
  fontSize: 12.5, color: "var(--fg-primary)", outline: "none",
  fontFamily: "var(--font-sans)", boxSizing: "border-box",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

const wizardSecondaryStyle: React.CSSProperties = {
  height: 40, padding: "0 18px", borderRadius: 7, flexShrink: 0,
  background: "var(--bg-subtle)",
  color: "var(--fg-secondary)",
  fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em",
  border: "0.5px solid var(--border-subtle)", cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

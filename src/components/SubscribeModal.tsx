import React, { useState, useEffect, useRef } from "react";
import type { MergeRequest } from "../types";
import { api } from "../ipc";
import { Overlay, PrimaryBtn, SecondaryBtn, IconBtn, fieldStyle, FieldLabel, Checkbox } from "./ui";
import { IcPlus, IcX, IcLink, IcFilter, IcTag, IcSearch } from "./icons";

interface Project { id: number; path_with_namespace: string; name_with_namespace: string }

interface Props { onClose: () => void; onSubscribe: (mr: MergeRequest) => void; accent: string }

export const SubscribeModal: React.FC<Props> = ({ onClose, onSubscribe, accent }) => {
  const [tab, setTab] = useState<"link" | "rules" | "labels">("link");
  const [url, setUrl] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectResults, setProjectResults] = useState<Project[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [roles, setRoles] = useState({ assignee: true, reviewer: true, author: false });
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [labelMatchMode, setLabelMatchMode] = useState<"all" | "any" | "min">("all");
  const [labelMinCount, setLabelMinCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch projects whenever search changes
  useEffect(() => {
    if (tab !== "rules" && tab !== "labels") return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setProjectLoading(true);
      try {
        const results = await api.searchProjects(projectSearch);
        setProjectResults(results);
        if (results.length > 0 && !project) setProject(results[0]);
      } catch {
        setProjectResults([]);
      } finally {
        setProjectLoading(false);
      }
    }, 300);
  }, [projectSearch, tab]);

  const addLabel = () => {
    const v = labelInput.trim();
    if (v && !labels.includes(v)) setLabels([...labels, v]);
    setLabelInput("");
  };

  const handleAdd = async () => {
    setError(null);
    if (tab === "link") {
      if (!url.trim()) { setError("Please paste an MR URL."); return; }
      setLoading(true);
      try {
        const mr = await api.addLink(url.trim());
        onSubscribe(mr);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    } else {
      // rules/labels not yet backed by API — just close for now
      onClose();
    }
  };

  const TABS = [
    { id: "link" as const,   label: "Direct link", icon: <IcLink size={12}/> },
    { id: "rules" as const,  label: "Rules",       icon: <IcFilter size={12}/> },
    { id: "labels" as const, label: "Labels",      icon: <IcTag size={12}/> },
  ];

  return (
    <Overlay onClose={onClose}>
      <div style={{
        width: 500, borderRadius: 12,
        background: "var(--bg-modal)",
        border: "0.5px solid var(--border-subtle)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
        overflow: "hidden", animation: "modalIn 220ms cubic-bezier(0.3,0.7,0.4,1)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 18px 14px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: "0.5px solid var(--border-divider)" }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontSize: 20, fontWeight: 600,
              color: "var(--fg-primary)", letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}>Track merge requests</div>
            <div style={{ fontSize: 11, color: "var(--fg-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
              ADD BY LINK, ROLE, OR LABEL
            </div>
          </div>
          <IconBtn icon={<IcX size={13}/>} label="Close" onClick={onClose} />
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 18px", display: "flex", gap: 0, borderBottom: "0.5px solid var(--border-divider)" }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => {
                setTab(t.id); setError(null);
                // Trigger project load on first switch to rules/labels
                if ((t.id === "rules" || t.id === "labels") && projectResults.length === 0) {
                  setProjectSearch("");
                }
              }} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "9px 14px",
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
                color: active ? "var(--fg-primary)" : "var(--fg-tertiary)",
                fontSize: 12, fontWeight: active ? 600 : 400,
                letterSpacing: "-0.01em", cursor: "pointer",
                transition: "color 130ms ease",
                marginBottom: -0.5,
              }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px 18px", minHeight: 200 }}>
          {tab === "link" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <FieldLabel label="GitLab MR URL" hint="We'll resolve the project and fetch metadata automatically.">
                <input value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }} autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                  placeholder="https://gitlab.com/group/project/-/merge_requests/123"
                  style={fieldStyle} />
              </FieldLabel>
              {error && (
                <div style={{
                  padding: "8px 12px", borderRadius: 6,
                  background: "rgba(217,50,81,0.07)", border: "0.5px solid rgba(217,50,81,0.25)",
                  fontSize: 11.5, color: "#d93251", lineHeight: 1.45,
                }}>{error}</div>
              )}
              <div style={{
                padding: "10px 12px", borderRadius: 6,
                background: "var(--bg-subtle)", border: "0.5px solid var(--border-subtle)",
                fontSize: 11, color: "var(--fg-tertiary)", lineHeight: 1.5,
              }}>
                <span style={{ color: "var(--fg-secondary)", fontWeight: 600 }}>Tip:</span>
                {" "}If the MR is private, ensure your token has{" "}
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, background: "var(--bg-subtle)", padding: "1px 4px", borderRadius: 3 }}>api</code>
                {" "}scope for that group.
              </div>
            </div>
          )}

          {tab === "rules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FieldLabel label="Project">
                <ProjectSearch
                  search={projectSearch} onSearch={setProjectSearch}
                  results={projectResults} selected={project}
                  onSelect={setProject} loading={projectLoading} accent={accent}
                />
              </FieldLabel>
              <FieldLabel label="Track MRs where I am">
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 2 }}>
                  {([
                    { k: "assignee" as const, label: "Assignee",  hint: "MRs assigned to me" },
                    { k: "reviewer" as const, label: "Reviewer",  hint: "MRs awaiting my review" },
                    { k: "author"   as const, label: "Author",    hint: "MRs I created" },
                  ]).map((r) => (
                    <label key={r.k} style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                      padding: "8px 10px", borderRadius: 6,
                      background: roles[r.k] ? `${accent}0e` : "var(--bg-subtle)",
                      border: `0.5px solid ${roles[r.k] ? `${accent}40` : "var(--border-subtle)"}`,
                      transition: "background 120ms ease, border-color 120ms ease",
                    }}>
                      <Checkbox checked={roles[r.k]} onChange={() => setRoles({ ...roles, [r.k]: !roles[r.k] })} accent={accent} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-primary)" }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{r.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </FieldLabel>
            </div>
          )}

          {tab === "labels" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FieldLabel label="Project">
                <ProjectSearch
                  search={projectSearch} onSearch={setProjectSearch}
                  results={projectResults} selected={project}
                  onSelect={setProject} loading={projectLoading} accent={accent}
                />
              </FieldLabel>

              {/* Match mode */}
              <FieldLabel label="Match condition" hint="When should an MR appear in your feed?">
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {([
                    { id: "all" as const,  label: "All labels match",   desc: "MR must have every label you list" },
                    { id: "any" as const,  label: "Any label matches",  desc: "MR needs at least one of your labels" },
                    { id: "min" as const,  label: "Minimum match",      desc: "MR needs at least N of your labels" },
                  ] as const).map((opt) => {
                    const on = labelMatchMode === opt.id;
                    return (
                      <label key={opt.id} onClick={() => setLabelMatchMode(opt.id)} style={{
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        padding: "8px 10px", borderRadius: 6,
                        background: on ? `${accent}0e` : "var(--bg-subtle)",
                        border: `0.5px solid ${on ? `${accent}40` : "var(--border-subtle)"}`,
                        transition: "background 120ms ease, border-color 120ms ease",
                      }}>
                        {/* Radio dot */}
                        <div style={{
                          width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                          border: `1.5px solid ${on ? accent : "var(--border-input)"}`,
                          background: on ? accent : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 140ms ease",
                        }}>
                          {on && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-primary)" }}>
                            {opt.label}
                            {opt.id === "min" && on && (
                              <span style={{ marginLeft: 8 }}>
                                <input
                                  type="number" min={1} max={labels.length || 10}
                                  value={labelMinCount}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setLabelMinCount(Math.max(1, Number(e.target.value)))}
                                  style={{
                                    width: 38, height: 22, borderRadius: 4,
                                    border: `1.5px solid ${accent}`,
                                    background: "var(--bg-input)", color: "var(--fg-primary)",
                                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                                    textAlign: "center", outline: "none", padding: "0 4px",
                                  }}
                                />
                                <span style={{ fontSize: 11, color: "var(--fg-tertiary)", marginLeft: 5, fontWeight: 400 }}>
                                  of {labels.length || "?"} labels
                                </span>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--fg-tertiary)", marginTop: 1 }}>{opt.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </FieldLabel>

              {/* Label chips input */}
              <FieldLabel label="Labels" hint={
                labelMatchMode === "all" ? "MR must have all of these labels." :
                labelMatchMode === "any" ? "MR must have at least one of these labels." :
                `MR must have at least ${labelMinCount} of these ${labels.length} labels.`
              }>
                <div style={{
                  ...fieldStyle, height: "auto", minHeight: 36,
                  padding: 5, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center",
                }}>
                  {labels.map((l) => (
                    <span key={l} style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 4px 2px 7px", borderRadius: 3,
                      background: `${accent}18`, color: accent,
                      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                      letterSpacing: "0.02em", textTransform: "uppercase",
                    }}>
                      {l}
                      <button onClick={() => setLabels(labels.filter((x) => x !== l))} style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: 0, width: 14, height: 14,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        color: accent, opacity: 0.6,
                      }}>
                        <IcX size={8}/>
                      </button>
                    </span>
                  ))}
                  <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addLabel(); }
                      if (e.key === "Backspace" && !labelInput && labels.length) setLabels(labels.slice(0, -1));
                    }}
                    placeholder={labels.length ? "" : "type a label and press Enter…"}
                    style={{ flex: 1, minWidth: 80, border: "none", background: "transparent", outline: "none", fontSize: 12, padding: "3px 4px", color: "var(--fg-primary)" }} />
                </div>
              </FieldLabel>

              {/* Suggestions */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10.5, color: "var(--fg-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>SUGGEST</span>
                {["release-blocker", "security", "bug", "a11y"].map((s) => (
                  <button key={s} onClick={() => labels.includes(s) || setLabels([...labels, s])} style={{
                    background: "var(--bg-subtle)", border: "0.5px solid var(--border-subtle)",
                    padding: "2px 7px", borderRadius: 3, cursor: "pointer",
                    fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-secondary)",
                    letterSpacing: "0.02em",
                  }}>{s}</button>
                ))}
              </div>

              {/* Live summary */}
              {labels.length > 0 && (
                <div style={{
                  padding: "8px 12px", borderRadius: 6,
                  background: `${accent}08`, border: `0.5px solid ${accent}25`,
                  fontSize: 11, color: "var(--fg-secondary)", lineHeight: 1.5,
                  fontFamily: "var(--font-mono)", letterSpacing: "0.01em",
                }}>
                  Track MRs in <b style={{ color: accent }}>{project?.path_with_namespace ?? "…"}</b>
                  {labelMatchMode === "all" && <> with <b>all</b> labels: {labels.join(", ")}</>}
                  {labelMatchMode === "any" && <> with <b>any</b> of: {labels.join(", ")}</>}
                  {labelMatchMode === "min" && <> with <b>at least {labelMinCount}</b> of: {labels.join(", ")}</>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "0.5px solid var(--border-divider)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", letterSpacing: "0.04em" }}>
            {tab === "link"   && "TRACKS ONE SPECIFIC MR"}
            {tab === "rules"  && "AUTO-TRACKS FUTURE MRs"}
            {tab === "labels" && (
              labelMatchMode === "all" ? "MATCHES MRs WITH ALL LABELS" :
              labelMatchMode === "any" ? "MATCHES MRs WITH ANY LABEL" :
              `MATCHES MRs WITH ≥ ${labelMinCount} LABELS`
            )}
          </div>
          <div style={{ flex: 1 }} />
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn accent={accent} icon={<IcPlus size={12}/>} onClick={handleAdd} disabled={loading}>
            {loading ? "Adding…" : "Add subscription"}
          </PrimaryBtn>
        </div>
      </div>
    </Overlay>
  );
};

// ── ProjectSearch ─────────────────────────────────────────────────────────────

function ProjectSearch({ search, onSearch, results, selected, onSelect, loading, accent }: {
  search: string; onSearch: (v: string) => void;
  results: Project[]; selected: Project | null;
  onSelect: (p: Project) => void; loading: boolean; accent: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        height: 34, padding: "0 10px", borderRadius: 6,
        background: "var(--bg-input)", border: "0.5px solid var(--border-input)",
      }}>
        <span style={{ color: "var(--fg-muted)", display: "flex", flexShrink: 0 }}>
          <IcSearch size={12}/>
        </span>
        <input
          value={search}
          onChange={(e) => { onSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={selected ? selected.path_with_namespace : "Search your projects…"}
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 12, color: "var(--fg-primary)", fontFamily: "var(--font-mono)",
            letterSpacing: "0.01em", padding: 0, minWidth: 0,
          }}
        />
        {loading && (
          <span style={{ fontSize: 9.5, color: "var(--fg-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>…</span>
        )}
      </div>

      {/* Selected badge */}
      {selected && !open && (
        <div style={{
          marginTop: 5, display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 4,
          background: `${accent}12`, border: `0.5px solid ${accent}35`,
          fontFamily: "var(--font-mono)", fontSize: 10, color: accent, letterSpacing: "0.02em",
        }}>
          {selected.path_with_namespace}
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "var(--bg-modal)",
          border: "0.5px solid var(--border-subtle)",
          borderRadius: 7, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
          maxHeight: 180, overflowY: "auto",
        }}>
          {results.map((p) => {
            const isSelected = selected?.id === p.id;
            return (
              <div key={p.id}
                onMouseDown={() => { onSelect(p); setOpen(false); onSearch(""); }}
                style={{
                  padding: "8px 12px", cursor: "pointer",
                  background: isSelected ? `${accent}12` : "transparent",
                  borderBottom: "0.5px solid var(--border-divider)",
                  transition: "background 80ms ease",
                }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
                  color: isSelected ? accent : "var(--fg-primary)",
                  letterSpacing: "0.01em",
                }}>{p.path_with_namespace}</div>
              </div>
            );
          })}
        </div>
      )}

      {open && !loading && results.length === 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "var(--bg-modal)", border: "0.5px solid var(--border-subtle)",
          borderRadius: 7, padding: "10px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
          fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-muted)",
        }}>No projects found</div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { check } from "@tauri-apps/plugin-updater";
import { useUIStore } from "./store";
import type { MergeRequest, Event, Settings, User } from "./types";
import { api, onAuthReady } from "./ipc";
import { SetupWizard } from "./components/SetupWizard";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MRCard } from "./components/MRCard";
import { MRDetail } from "./components/MRDetail";
import { ActivityFeed } from "./components/ActivityFeed";
import { SubscribeModal } from "./components/SubscribeModal";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { Toast } from "./components/Toast";
import { IcSpinner } from "./components/icons";

const UNSET_SETTINGS: Settings = {
  instance: "https://gitlab.com",
  token_present: false,
  poll_interval_minutes: 5,
  notifications: { pipeline_failed: true, review_requested: true, mentioned: true, approved: false },
  workspace: { launch_at_login: false, close_to_tray: true, reduce_motion: false, auto_update: true,
    theme: { wallpaper: "dusk", accent: "#5b6cff", density: "regular", glass_strength: 0.55 } },
};

// ── App ───────────────────────────────────────────────────────────────────────

function EmptyState({ loading, filter, search }: { loading: boolean; filter: string; search: string }) {
  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
        <IcSpinner size={24} color="rgba(0,0,0,0.3)" />
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, textAlign: "center", minHeight: 320 }}>
      <div style={{
        fontFamily: "var(--font-serif)", fontStyle: "italic",
        fontSize: 22, fontWeight: 600, color: "var(--fg-primary)", letterSpacing: "-0.02em",
      }}>
        {search ? `No results for "${search}"` : filter === "attn" ? "All clear." : filter === "failing" ? "No failures." : "Nothing to track yet."}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-tertiary)", maxWidth: 280, lineHeight: 1.6 }}>
        Paste an MR URL or set up a subscription rule to start.
      </div>
    </div>
  );
}

export default function App() {
  const { view, filter, activityFilter, search, selectedIid, showSubscribe, showSettings, toast, theme,
    setView, setFilter, setActivityFilter, setSearch, selectMr, openSubscribe, closeSubscribe,
    openSettings, closeSettings, showToast, dismissToast } = useUIStore();

  const [mrs, setMrs] = useState<MergeRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Settings>(UNSET_SETTINGS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const accent = theme.accent;

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [fetchedMrs, fetchedEvents] = await Promise.all([
        api.listMrs({ view: "inbox" }),
        api.listEvents(),
      ]);
      setMrs(fetchedMrs ?? []);
      setEvents(fetchedEvents ?? []);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getSettings().then((s) => {
      if (!s) return;
      setSettings(s);
      if (s.token_present) fetchData();
      // Background update check — runs once on launch if auto_update enabled
      if (s.workspace.auto_update) {
        check().then((update) => {
          if (update?.available) {
            showToast(`Update available: v${update.version}`);
          }
        }).catch(() => { /* ignore network errors on startup */ });
      }
    });
  }, []);

  function handleSetupComplete(user: User | null | undefined, completedSettings: Settings) {
    setCurrentUser(user ?? null);
    setSettings(completedSettings);
    fetchData();
  }

  // Restore user from keychain on startup (auth-ready fires after token validation)
  useEffect(() => {
    const unlisten = onAuthReady((user) => setCurrentUser(user));
    return () => { unlisten.then((f) => f()); };
  }, []);

  // Tray "Quick Add MR" → open subscribe modal
  useEffect(() => {
    const unlisten = listen("open-subscribe", () => openSubscribe());
    return () => { unlisten.then((f) => f()); };
  }, []);

  // ⌘K focus / Esc dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (document.querySelector("input[placeholder='Search MRs…']") as HTMLInputElement)?.focus();
      }
      if (e.key === "Escape") {
        if (showSubscribe) closeSubscribe();
        else if (showSettings) closeSettings();
        else if (selectedIid) selectMr(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSubscribe, showSettings, selectedIid]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => ({
    inbox:    mrs.filter((m) => !m.muted).length,
    activity: events.filter((e) => e.unread).length,
    reviews:  mrs.filter((m) => m.role === "reviewer").length,
    assigned: mrs.filter((m) => m.role === "assignee").length,
    authored: mrs.filter((m) => m.role === "author").length,
    muted:    mrs.filter((m) => m.muted).length,
  }), [mrs, events]);

  const feed = useMemo(() => {
    let list = mrs;
    if (view === "inbox")    list = list.filter((m) => !m.muted);
    if (view === "reviews")  list = list.filter((m) => m.role === "reviewer");
    if (view === "assigned") list = list.filter((m) => m.role === "assignee");
    if (view === "authored") list = list.filter((m) => m.role === "author");
    if (view === "muted")    list = list.filter((m) => m.muted);
    if (filter === "attn")    list = list.filter((m) => m.pipeline === "failed" || (m.role === "reviewer" && m.approvals < m.approvals_required));
    if (filter === "passing") list = list.filter((m) => m.pipeline === "success");
    if (filter === "failing") list = list.filter((m) => m.pipeline === "failed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.title.toLowerCase().includes(q) || m.project_path.toLowerCase().includes(q) ||
        m.author.name.toLowerCase().includes(q) || String(m.iid).includes(q) ||
        m.labels.some((l) => l.toLowerCase().includes(q))
      );
    }
    return list;
  }, [mrs, view, filter, search]);

  const selected = mrs.find((m) => m.iid === selectedIid);

  const handleMute = (mr: MergeRequest) => {
    setMrs((prev) => prev.map((m) => m.iid === mr.iid ? { ...m, muted: !m.muted } : m));
    showToast(mr.muted ? `Unmuted !${mr.iid}` : `Muted !${mr.iid}`, accent);
  };
  const handleArchive = (mr: MergeRequest) => {
    setMrs((prev) => prev.filter((m) => m.iid !== mr.iid));
    if (selectedIid === mr.iid) selectMr(null);
    showToast(`Unsubscribed from !${mr.iid}`, accent);
  };
  const handleSubscribe = (mr: MergeRequest) => {
    setMrs((prev) => prev.some((m) => m.iid === mr.iid) ? prev : [mr, ...prev]);
    closeSubscribe();
    showToast(`Tracking !${mr.iid} · ${mr.project_path}`, accent);
  };

  if (!settings.token_present) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden", position: "relative",
      display: "flex", fontFamily: "var(--font-sans)",
      background: "transparent",
      animation: "appIn 360ms cubic-bezier(0.2,0.8,0.4,1)",
    }}>
      <Sidebar view={view} onView={(v) => { setView(v); selectMr(null); }}
        onSettings={openSettings} accent={accent} counts={counts}
        currentUser={currentUser} instance={settings.instance} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <TopBar view={view} count={view === "activity" ? events.length : feed.length}
          search={search} onSearch={setSearch}
          filter={filter} onFilter={setFilter}
          showFilters={view !== "activity"}
          onSubscribe={openSubscribe} accent={accent} />

        {view === "activity" ? (
          <ActivityFeed events={events} mrs={mrs}
            filter={activityFilter} onFilter={setActivityFilter}
            onMarkAllRead={() => setEvents((prev) => prev.map((e) => ({ ...e, unread: false })))}
            onOpen={(iid) => selectMr(iid)} accent={accent} />
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
            {feed.length === 0
              ? <EmptyState loading={dataLoading} filter={filter} search={search} />
              : feed.map((mr, index) => (
                  <MRCard key={mr.iid} mr={mr} accent={accent} density={theme.density}
                    index={index}
                    unreadCount={events.filter((e) => e.mr_iid === mr.iid && e.unread).length}
                    selected={mr.iid === selectedIid}
                    onOpen={(m) => selectMr(m.iid)}
                    onMute={handleMute} onArchive={handleArchive} />
                ))}
          </div>
        )}

        {selected && (
          <MRDetail mr={selected} accent={accent}
            onClose={() => selectMr(null)}
            onMute={handleMute} onArchive={handleArchive} />
        )}
      </div>

      {showSubscribe && <SubscribeModal accent={accent} onClose={closeSubscribe} onSubscribe={handleSubscribe} />}
      {showSettings  && <SettingsDrawer accent={accent} settings={settings} onChange={(p) => setSettings({ ...settings, ...p })} onClose={closeSettings}
        onSetup={() => { closeSettings(); setSettings((s) => ({ ...s, token_present: false })); }} />}
      {toast && <Toast msg={toast.msg} accent={toast.accent} />}
    </div>
  );
}

import create from "zustand";
import type {
  ViewId, FilterId, ActivityFilter, Density, Wallpaper, PollerStatus,
} from "../types";

interface ThemeState {
  wallpaper: Wallpaper;
  accent: string;
  density: Density;
  glassStrength: number;
}

export interface NotifKind {
  id: string;
  label: string;
  group: string;
}

export const NOTIF_KINDS: NotifKind[] = [
  { id: "pipeline_failed",   label: "Pipeline failed",   group: "Pipeline" },
  { id: "pipeline_passed",   label: "Pipeline passed",   group: "Pipeline" },
  { id: "review_requested",  label: "Review requested",  group: "Reviews"  },
  { id: "changes_requested", label: "Changes requested", group: "Reviews"  },
  { id: "approved",          label: "Approved",          group: "Reviews"  },
  { id: "commented",         label: "Someone commented", group: "Comments" },
  { id: "replied",           label: "Someone replied",   group: "Comments" },
  { id: "mentioned",         label: "Mentioned you",     group: "Comments" },
  { id: "pushed",            label: "New commits",       group: "Activity" },
  { id: "conflict",          label: "Conflicts",         group: "Activity" },
  { id: "merged",            label: "Merged",            group: "Activity" },
];

export const ALL_NOTIF_IDS = NOTIF_KINDS.map((k) => k.id);

interface UIState {
  view: ViewId;
  filter: FilterId;
  activityFilter: ActivityFilter;
  search: string;
  selectedIid: number | null;
  showSubscribe: boolean;
  showSettings: boolean;
  toast: { msg: string; accent: string } | null;
  pollerStatus: PollerStatus;
  theme: ThemeState;
  mrNotifPrefs: Record<number, string[]>;

  setView: (view: ViewId) => void;
  setFilter: (filter: FilterId) => void;
  setActivityFilter: (filter: ActivityFilter) => void;
  setSearch: (search: string) => void;
  selectMr: (iid: number | null) => void;
  openSubscribe: () => void;
  closeSubscribe: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (msg: string, accent?: string) => void;
  dismissToast: () => void;
  setPollerStatus: (status: PollerStatus) => void;
  setTheme: (patch: Partial<ThemeState>) => void;
  setMrNotifPrefs: (iid: number, kinds: string[]) => void;
  getMrNotifPrefs: (iid: number) => string[];
}

export const useUIStore = create<UIState>((set, get) => ({
  view: "inbox",
  filter: "all",
  activityFilter: "all",
  search: "",
  selectedIid: null,
  showSubscribe: false,
  showSettings: false,
  toast: null,
  pollerStatus: { state: "idle" },
  theme: {
    wallpaper: "dusk",
    accent: "#5b6cff",
    density: "regular",
    glassStrength: 0.55,
  },
  mrNotifPrefs: {},

  setView: (view) => set({ view, selectedIid: null }),
  setFilter: (filter) => set({ filter }),
  setActivityFilter: (activityFilter) => set({ activityFilter }),
  setSearch: (search) => set({ search }),
  selectMr: (selectedIid) => set({ selectedIid }),
  openSubscribe: () => set({ showSubscribe: true }),
  closeSubscribe: () => set({ showSubscribe: false }),
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  showToast: (msg, accent = "#5b6cff") => set({ toast: { msg, accent } }),
  dismissToast: () => set({ toast: null }),
  setPollerStatus: (pollerStatus) => set({ pollerStatus }),
  setTheme: (patch) => set((s) => ({ theme: { ...s.theme, ...patch } })),
  setMrNotifPrefs: (iid, kinds) =>
    set((s) => ({ mrNotifPrefs: { ...s.mrNotifPrefs, [iid]: kinds } })),
  getMrNotifPrefs: (iid) => get().mrNotifPrefs[iid] ?? ALL_NOTIF_IDS,
}));

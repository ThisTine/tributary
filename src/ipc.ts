import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  MergeRequest, Event, Settings, SubscriptionRule,
  ViewId, FilterId, ActivityFilter, AuthResult, PollerStatus,
} from "./types";

// ── Commands ─────────────────────────────────────────────────────────────────

export const api = {
  listMrs: (params: { view: ViewId; filter?: FilterId; search?: string }) =>
    invoke<MergeRequest[]>("list_mrs", params),

  getMr: (iid: number) =>
    invoke<MergeRequest>("get_mr", { iid }),

  listEvents: (filter?: ActivityFilter) =>
    invoke<Event[]>("list_events", { filter }),

  markEventsRead: (ids?: string[]) =>
    invoke<void>("mark_events_read", { ids }),

  addLink: (url: string) =>
    invoke<MergeRequest>("add_subscription_link", { url }),

  searchProjects: (query: string) =>
    invoke<{ id: number; path_with_namespace: string; name_with_namespace: string; web_url: string }[]>("search_projects", { query }),

  saveRule: (rule: Omit<SubscriptionRule, "id">) =>
    invoke<SubscriptionRule>("save_rule", { rule }),

  listRules: () =>
    invoke<SubscriptionRule[]>("list_rules"),

  deleteRule: (id: string) =>
    invoke<void>("delete_rule", { id }),

  toggleMute: (iid: number) =>
    invoke<boolean>("toggle_mute", { iid }),

  unsubscribeMr: (iid: number) =>
    invoke<void>("unsubscribe_mr", { iid }),

  getSettings: () =>
    invoke<Settings>("get_settings"),

  setSettings: (patch: Partial<Settings>) =>
    invoke<Settings>("set_settings", { patch }),

  setToken: (token: string) =>
    invoke<AuthResult>("set_token", { token }),

  triggerPoll: () =>
    invoke<void>("trigger_poll"),

  openInGitlab: (iid: number) =>
    invoke<void>("open_in_gitlab", { iid }),

  getViewCounts: () =>
    invoke<Record<ViewId, number>>("get_view_counts"),
};

// ── Event listeners ───────────────────────────────────────────────────────────

export function onPollerUpdated(cb: (changedIids: number[]) => void): Promise<UnlistenFn> {
  return listen<{ changed_iids: number[] }>("poller://updated", (e) => cb(e.payload.changed_iids));
}

export function onPollerStatus(cb: (status: PollerStatus) => void): Promise<UnlistenFn> {
  return listen<PollerStatus>("poller://status", (e) => cb(e.payload));
}

export function onAuthInvalid(cb: () => void): Promise<UnlistenFn> {
  return listen("auth://invalid", () => cb());
}

export function onDeepLink(cb: (project: string, iid: number) => void): Promise<UnlistenFn> {
  return listen<{ project: string; iid: number }>("deeplink://mr", (e) =>
    cb(e.payload.project, e.payload.iid),
  );
}

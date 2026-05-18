// Shared types matching the Rust data model

export type PipelineStatus = "success" | "failed" | "running" | "manual" | "canceled";
export type TrackingRole = "author" | "reviewer" | "assignee" | "label";
export type EventKind =
  | "pipeline_failed" | "pipeline_passed" | "review_requested"
  | "changes_requested" | "approved" | "commented" | "replied" | "pushed"
  | "mentioned" | "conflict" | "merged";
export type ActivityBucket = "today" | "yesterday" | "earlier";
export type ViewId = "inbox" | "activity" | "reviews" | "assigned" | "authored" | "muted";
export type FilterId = "all" | "attn" | "passing" | "failing";
export type ActivityFilter = "all" | "unread" | "mentions" | "reviews" | "pipelines";
export type Density = "compact" | "regular" | "comfy";
export type Wallpaper = "dusk" | "forest" | "copper" | "graphite";

export interface User {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
  /** Derived client-side: initials from name */
  initials: string;
  /** Derived client-side: stable hue color */
  color: string;
}

export interface Pipeline {
  id: number;
  status: PipelineStatus;
  sha: string;
  detail: string;
}

export interface MergeRequest {
  iid: number;
  project_path: string;
  project_color: string;
  title: string;
  author: User;
  role: TrackingRole;
  label_match?: string;
  draft: boolean;
  conflicts: boolean;
  pipeline: PipelineStatus;
  pipeline_detail: string;
  approvals: number;
  approvals_required: number;
  unresolved_threads: number;
  resolved_threads: number;
  reviewers: User[];
  labels: string[];
  additions: number;
  deletions: number;
  branch: string;
  updated_at: string;
  updated_relative: string;
  muted: boolean;
  web_url: string;
  activity: MRActivity[];
}

export interface MRActivity {
  who: User;
  what: string;
  time: string;
}

export interface Event {
  id: string;
  mr_iid: number;
  mr_project: string;
  mr_title: string;
  kind: EventKind;
  who: User | null;
  body: string;
  time_relative: string;
  timestamp: string;
  bucket: ActivityBucket;
  unread: boolean;
  web_url: string;
}

export interface SubscriptionRule {
  id: string;
  kind: "link" | "role" | "label";
  payload: LinkPayload | RolePayload | LabelPayload;
  enabled: boolean;
}

export interface LinkPayload { url: string }
export interface RolePayload { roles: string[]; project_path?: string }
export interface LabelPayload { project_path: string; labels: string[]; match_mode?: "all" | "any" | "min"; min_count?: number }

export interface Subscriptions {
  rules: SubscriptionRule[];
  label_subs: { project: string; label: string; color: string }[];
  link_subs: { iid: number; project: string; web_url: string }[];
}

export interface Settings {
  instance: string;
  token_present: boolean;
  poll_interval_minutes: number;
  notifications: {
    pipeline_failed: boolean;
    review_requested: boolean;
    mentioned: boolean;
    approved: boolean;
  };
  workspace: {
    launch_at_login: boolean;
    close_to_tray: boolean;
    reduce_motion: boolean;
    auto_update: boolean;
    theme: ThemeSettings;
  };
}

export interface ThemeSettings {
  wallpaper: Wallpaper;
  accent: string;
  density: Density;
  glass_strength: number;
}

export interface PollerStatus {
  state: "idle" | "polling" | "offline" | "error";
  message?: string;
}

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export interface ViewCounts {
  inbox: number;
  activity: number;
  reviews: number;
  assigned: number;
  authored: number;
  muted: number;
}

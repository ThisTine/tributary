# Tributary

**Your GitLab MR inbox — without opening GitLab.**

Tributary is a native macOS menu bar app that surfaces the merge requests and activity that actually need your attention. Pipeline failures, review requests, @mentions, approvals — each one at the right moment, not buried in a tab you forgot to check.

---

## Features

### Inbox that actually works
Tributary aggregates every MR you're involved in — as author, reviewer, or assignee — into a single feed. Filter by what needs attention, search across titles and projects, and open directly in GitLab with one click.

### Five views, one sidebar
| View | What it shows |
|------|---------------|
| **Inbox** | All active MRs across your roles |
| **Activity** | Events from GitLab todos — pipeline results, comments, reviews |
| **My reviews** | MRs where you are a reviewer |
| **Assigned to me** | MRs assigned to you |
| **Authored** | MRs you opened |
| **Muted** | MRs you've silenced |

### Menu bar tray
Tributary lives in your menu bar. Click the icon to see your 10 most recent activity events, read/unread at a glance, with direct links that open the exact GitLab page. Unread count badge updates automatically.

Quick actions from the tray:
- **Open Tributary** — bring the main window to front
- **Quick Add MR** — subscribe to any MR by pasting its URL
- **Mark All Read** — clear the unread badge instantly
- **Quit Tributary** — fully exits the app

### Per-MR notification control
Every MR has its own notification panel. Choose exactly which events you care about for that MR — pipeline failures, pipeline passes, review requested, changes requested, approved, someone commented, someone replied, @mentioned, new commits, conflicts, merged.

### Label subscriptions
Subscribe to an entire project's MRs by label, with three match modes:
- **Match all** — MR must have every label you specify
- **Match any** — MR has at least one of your labels
- **Minimum N** — MR has at least N of your labels

### Activity feed
A chronological event stream bucketed by Today / Yesterday / Earlier. Filter to Unread, @Mentions, Reviews, or Pipelines. Each row shows who did what to which MR and links directly to GitLab.

### Token stays on your machine
Your personal access token is stored in the macOS Keychain and never transmitted anywhere other than your GitLab instance. The app requires `api` + `read_user` scope.

### Auto-update
Tributary checks for updates on launch and installs them in the background. Updates are cryptographically signed — only official releases are accepted. You can disable auto-update in Settings at any time.

---

## Installation

1. Download `Tributary_x.x.x_aarch64.dmg` from the [latest release](../../releases/latest)
2. Open the DMG and drag **Tributary.app** to `/Applications`
3. On first launch macOS may show **"Tributary is damaged and can't be opened"** — this is Gatekeeper rejecting an unsigned app. Run the following command to clear the quarantine flag, then open normally:
   ```bash
   xattr -cr /Applications/Tributary.app
   ```
4. Complete the two-step setup wizard — enter your GitLab instance URL and a personal access token

> **Self-hosted GitLab?** Enter your instance URL (e.g. `https://gitlab.yourcompany.com`) in the setup wizard or Settings → Connection.

---

## Requirements

- macOS 13 Ventura or later (Apple Silicon native)
- A GitLab personal access token with `api` + `read_user` scope

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| GitLab instance | `https://gitlab.com` | Your GitLab host |
| Poll interval | 5 min | How often Tributary checks for new activity |
| Pipeline failed | On | Notify when a tracked MR's pipeline fails |
| Review requested | On | Notify when someone requests your review |
| @Mentioned | On | Notify when you're mentioned in a discussion |
| Approved | Off | Notify when your MR is approved |
| Launch at login | On | Start Tributary when you log in |
| Close to tray | On | Closing the window keeps the app running in the menu bar |
| Auto-update | On | Automatically download and install new versions |

---

## Building from source

```bash
# Prerequisites: Rust stable, Node 20+, pnpm

git clone https://github.com/thistine/tributary
cd tributary
pnpm install

# Development (hot-reload)
pnpm tauri dev

# Production build
TAURI_SIGNING_PRIVATE_KEY=<key> \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<password> \
pnpm tauri build
```

The `.app` and `.dmg` land in `src-tauri/target/release/bundle/`.

---

## Releasing

Releases are built automatically by GitHub Actions on every `v*` tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The workflow builds a signed `.app`, wraps it in a `.dmg`, generates the `latest.json` update manifest, and publishes a GitHub Release. Connected installs receive the update automatically on next launch.

**Required repository secrets:**

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/tributary.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password set when generating the key |

---

## Release notes

### v0.1.1 — May 2025

Bug fixes.

**Fixed**
- Profile avatar and username now restore correctly after relaunch — no more "not logged in" state on startup
- Read/unread status on the Activity feed now persists across relaunches; marking events read syncs to GitLab Todos so they stay read after reload
- Label subscription rules now fetch and display MRs correctly; subscribing via the Labels tab in the Subscribe modal saves the rule to disk
- MR approval count updates correctly when reviewers approve

---

### v0.1.0 — May 2025

Initial release.

**Core**
- MR inbox aggregating author, reviewer, and assignee roles from your GitLab instance
- Six sidebar views: Inbox, Activity, My reviews, Assigned to me, Authored, Muted
- Real-time search across title, project path, author, IID, and labels
- Quick-subscribe to any MR by pasting its URL
- Label subscription rules with All / Any / Minimum-N match modes

**Activity**
- Full activity feed driven by GitLab Todos API
- Bucketed by Today / Yesterday / Earlier
- Filter tabs: All · Unread · @Mentions · Reviews · Pipelines
- Events link directly to the relevant GitLab page

**Notifications**
- Per-MR notification preferences — 11 event types across 4 groups
- Mute individual MRs
- Unread count badge on MR cards

**Menu bar tray**
- Live activity feed in the tray dropdown (up to 10 events)
- Unread badge on the tray icon
- Quick Add MR and Mark All Read actions
- Clicking an event opens GitLab directly and marks it read

**Settings & persistence**
- Settings (instance, poll interval, theme, toggles) persisted to disk across launches
- Token stored in macOS Keychain, validated on every startup
- Auto-update with cryptographic signature verification
- Disable auto-update toggle

**Design**
- Cormorant Garamond + DM Mono typography
- Vibrancy sidebar with dark/light mode support
- Tributary logomark: three converging streams
- Gradient app icon with rounded rectangle, indigo → violet

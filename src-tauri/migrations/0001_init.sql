-- MR cache
CREATE TABLE IF NOT EXISTS mrs (
    iid          INTEGER NOT NULL,
    project_id   INTEGER NOT NULL,
    payload      TEXT    NOT NULL,   -- JSON blob: full MergeRequest
    etag         TEXT,
    fetched_at   TEXT    NOT NULL,
    muted        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (project_id, iid)
);

-- Event log
CREATE TABLE IF NOT EXISTS events (
    id           TEXT    PRIMARY KEY,       -- hash(kind, mr_project, mr_iid, anchor)
    mr_project   INTEGER NOT NULL,
    mr_iid       INTEGER NOT NULL,
    kind         TEXT    NOT NULL,
    actor        TEXT,                      -- username, null for system events
    body         TEXT    NOT NULL,
    unread       INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS events_by_mr   ON events(mr_project, mr_iid);
CREATE INDEX IF NOT EXISTS events_by_time ON events(created_at DESC);

-- Subscription rules
CREATE TABLE IF NOT EXISTS rules (
    id       TEXT    PRIMARY KEY,
    kind     TEXT    NOT NULL,   -- 'link' | 'role' | 'label'
    payload  TEXT    NOT NULL,   -- JSON
    enabled  INTEGER NOT NULL DEFAULT 1
);

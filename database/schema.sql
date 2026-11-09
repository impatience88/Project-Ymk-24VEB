CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL CHECK (course IN ('english', 'chinese', 'italian', 'spanish')),
    consent INTEGER NOT NULL CHECK (consent = 1),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_created_at
ON applications(created_at);

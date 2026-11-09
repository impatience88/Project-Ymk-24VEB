"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const projectRoot = path.resolve(__dirname, "..");
const databaseDirectory = path.join(projectRoot, "database");
const databaseFile = path.join(databaseDirectory, "applications.sqlite");
const schemaFile = path.join(databaseDirectory, "schema.sql");

// Создаём папку для базы данных, если её ещё нет.
fs.mkdirSync(databaseDirectory, { recursive: true });

// Открываем файл SQLite. При первом запуске файл создаётся автоматически.
const database = new DatabaseSync(databaseFile);
const schema = fs.readFileSync(schemaFile, "utf8");
database.exec(schema);

// Подготовленный запрос защищает данные от SQL-инъекций.
const insertApplication = database.prepare(`
    INSERT INTO applications (full_name, phone, email, course, consent)
    VALUES (?, ?, ?, ?, ?)
`);

function saveApplication(application) {
    const result = insertApplication.run(
        application.fullName,
        application.phone,
        application.email,
        application.course,
        application.consent ? 1 : 0
    );

    return Number(result.lastInsertRowid);
}

function getDatabaseStats() {
    const total = database.prepare(
        "SELECT COUNT(*) AS total FROM applications"
    ).get();

    const latest = database.prepare(`
        SELECT course, created_at
        FROM applications
        ORDER BY id DESC
        LIMIT 1
    `).get();

    return {
        total: Number(total.total),
        latest: latest || null
    };
}

module.exports = {
    saveApplication,
    getDatabaseStats,
    databaseFile
};

"use strict";

const { getDatabaseStats, databaseFile } = require("./db");
const stats = getDatabaseStats();

console.log("Проверка базы данных Языкового портала");
console.log(`Файл базы данных: ${databaseFile}`);
console.log(`Всего сохранённых заявок: ${stats.total}`);

if (stats.latest) {
    console.log(`Курс в последней заявке: ${stats.latest.course}`);
    console.log(`Дата последней заявки: ${stats.latest.created_at}`);
} else {
    console.log("Пока нет сохранённых заявок.");
}

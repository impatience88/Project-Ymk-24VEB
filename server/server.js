"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { saveApplication } = require("./db");

const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 3000;
const maxBodySize = 16 * 1024;

const allowedCourses = new Set([
    "english",
    "chinese",
    "italian",
    "spanish"
]);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
};

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });
    response.end(JSON.stringify(data));
}

function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        let tooLarge = false;

        request.on("data", (chunk) => {
            if (tooLarge) return;

            body += chunk.toString("utf8");

            if (Buffer.byteLength(body, "utf8") > maxBodySize) {
                tooLarge = true;
            }
        });

        request.on("end", () => {
            if (tooLarge) {
                reject(new Error("Размер отправленных данных превышает допустимый."));
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Не удалось прочитать данные формы."));
            }
        });

        request.on("error", reject);
    });
}

function validateApplication(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return { error: "Проверь данные формы и попробуй ещё раз." };
    }

    const fullName = typeof data.fullName === "string"
        ? data.fullName.trim().replace(/\s+/g, " ")
        : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const course = typeof data.course === "string" ? data.course : "";

    // Фамилия и имя обязательны, отчество можно добавить.
    const fullNamePattern = /^[А-ЯЁа-яё]+(?:\s+[А-ЯЁа-яё]+){1,2}$/u;
    const phonePattern = /^\+7\([0-9]{3}\)-[0-9]{3}-[0-9]{2}-[0-9]{2}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!fullNamePattern.test(fullName)) {
        return { error: "Укажи фамилию и имя кириллицей. Отчество можно добавить." };
    }

    if (!phonePattern.test(phone)) {
        return { error: "Телефон должен быть в формате +7(XXX)-XXX-XX-XX." };
    }

    if (email.length > 254 || !emailPattern.test(email)) {
        return { error: "Укажи действующий адрес электронной почты." };
    }

    if (!allowedCourses.has(course)) {
        return { error: "Выбери один из доступных языковых курсов." };
    }

    if (data.consent !== true) {
        return { error: "Для отправки заявки необходимо согласие на обработку персональных данных." };
    }

    return {
        value: {
            fullName,
            phone,
            email,
            course,
            consent: true
        }
    };
}

function serveStaticFile(request, response, pathname) {
    let decodedPath;

    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        sendJson(response, 400, { ok: false, message: "Некорректный адрес страницы." });
        return;
    }

    if (decodedPath.includes("\\")) {
        sendJson(response, 400, { ok: false, message: "Некорректный адрес страницы." });
        return;
    }

    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
    const filePath = path.resolve(projectRoot, relativePath);
    const relativeCheck = path.relative(projectRoot, filePath);

    // Не разрешаем выходить из папки проекта и открывать служебные папки.
    if (
        relativeCheck.startsWith("..") ||
        path.isAbsolute(relativeCheck) ||
        relativeCheck.split(path.sep).some((part) =>
            part.startsWith(".") || ["server", "database", "node_modules", ".git"].includes(part)
        )
    ) {
        sendJson(response, 404, { ok: false, message: "Страница не найдена." });
        return;
    }

    const extension = path.extname(filePath).toLowerCase();
    if (!mimeTypes[extension]) {
        sendJson(response, 404, { ok: false, message: "Файл не найден." });
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            sendJson(response, 404, { ok: false, message: "Файл не найден." });
            return;
        }

        response.writeHead(200, {
            "Content-Type": mimeTypes[extension],
            "Content-Length": stats.size,
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        });

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        fs.createReadStream(filePath).pipe(response);
    });
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = requestUrl.pathname;

    if (pathname === "/api/health" && request.method === "GET") {
        sendJson(response, 200, { ok: true, message: "Сервер и база данных работают." });
        return;
    }

    if (pathname === "/api/applications" && request.method === "POST") {
        const contentType = request.headers["content-type"] || "";

        if (!contentType.toLowerCase().includes("application/json")) {
            sendJson(response, 415, {
                ok: false,
                message: "Сервер ожидает данные формы в формате JSON."
            });
            return;
        }

        try {
            const body = await readJsonBody(request);
            const validation = validateApplication(body);

            if (validation.error) {
                sendJson(response, 400, { ok: false, message: validation.error });
                return;
            }

            const applicationId = saveApplication(validation.value);

            sendJson(response, 201, {
                ok: true,
                applicationId,
                message: "Заявка сохранена. Менеджер школы свяжется с тобой."
            });
        } catch (error) {
            const isBadRequest = error.message.includes("данные формы") ||
                error.message.includes("Размер отправленных данных");

            sendJson(response, isBadRequest ? 400 : 500, {
                ok: false,
                message: isBadRequest
                    ? error.message
                    : "Не удалось сохранить заявку. Попробуй ещё раз."
            });

            if (!isBadRequest) {
                console.error("Ошибка сохранения заявки:", error.message);
            }
        }

        return;
    }

    if (pathname.startsWith("/api/")) {
        sendJson(response, 404, { ok: false, message: "Метод API не найден." });
        return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
        serveStaticFile(request, response, pathname);
        return;
    }

    sendJson(response, 405, { ok: false, message: "Метод запроса не поддерживается." });
});

server.listen(port, () => {
    console.log("Языковой портал запущен.");
    console.log(`Адрес сайта: http://localhost:${port}`);
    console.log("Для остановки нажми Ctrl + C.");
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Порт ${port} уже занят. Закрой другой сервер или выбери другой порт.`);
    } else {
        console.error("Ошибка запуска сервера:", error.message);
    }
    process.exitCode = 1;
});

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const publicDirectory = join(appDirectory, "public");
const port = Number(process.env.PORT || 8787);
// The tool page is a self-contained document and may use inline styles and scripts.
const selfContainedPages = new Set(["index.html"]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function sendError(response, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError ? error.message : "The page could not be served.";
  const body = `${message}\n`;
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = normalize(resolve(publicDirectory, `.${pathname}`));

  if (filePath !== publicDirectory && !filePath.startsWith(`${publicDirectory}${sep}`)) {
    throw new HttpError("Not found.", 404);
  }

  let file;
  try {
    file = await stat(filePath);
  } catch {
    throw new HttpError("Not found.", 404);
  }
  if (!file.isFile()) throw new HttpError("Not found.", 404);

  const extension = extname(filePath).toLowerCase();
  const allowInline = selfContainedPages.has(basename(filePath));
  const contentSecurityPolicy = [
    "default-src 'self'",
    `style-src 'self'${allowInline ? " 'unsafe-inline'" : ""}`,
    `script-src 'self'${allowInline ? " 'unsafe-inline'" : ""}`,
    "img-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ");

  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Content-Length": file.size,
    "Cache-Control": "no-store",
    "Content-Security-Policy": contentSecurityPolicy,
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) sendError(response, new HttpError("The page could not be served.", 500));
    else response.destroy();
  });
  stream.pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }

    response.writeHead(405, {
      "Content-Type": "text/plain; charset=utf-8",
      "Allow": "GET, HEAD",
      "Cache-Control": "no-store"
    });
    response.end("Method not allowed.\n");
  } catch (error) {
    if (!response.headersSent) sendError(response, error);
    else response.destroy();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI Label Tool is ready at http://127.0.0.1:${port}`);
});

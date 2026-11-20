import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { readFile } from "node:fs/promises";
import { createPortfolio } from "../src/worker.mjs";

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const port = Number(process.env.PORTFOLIO_PORT || 4173);
const host = "127.0.0.1";
const origin = "http://" + host + ":" + port;
const portfolio = createPortfolio(async path => {
  try {
    return await readFile(new URL("../public" + path, import.meta.url));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
});

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, origin);
    if (url.origin !== origin) return outgoing.writeHead(400).end();
    const headers = new Headers(incoming.headers);
    headers.set("cf-connecting-ip", incoming.socket.remoteAddress ?? "127.0.0.1");
    const method = incoming.method;
    const body = ["GET", "HEAD"].includes(method) ? undefined : Readable.toWeb(incoming);
    const request = new Request(url, { method, headers, body, duplex: body ? "half" : undefined });
    const response = await portfolio.fetch(request, process.env);
    const responseHeaders = Object.fromEntries(response.headers);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) responseHeaders["set-cookie"] = cookies;
    outgoing.writeHead(response.status, responseHeaders);
    if (response.body) await pipeline(Readable.fromWeb(response.body), outgoing);
    else outgoing.end();
  } catch (error) {
    if (outgoing.headersSent) outgoing.destroy();
    else outgoing.writeHead(500, { "Content-Type": "text/plain" }).end("Unable to serve the portfolio.");
    console.error(error.name + ": " + error.message);
  }
}).listen(port, host, () => console.log("Local: " + origin));

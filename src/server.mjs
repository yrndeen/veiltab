import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VeilTabRuntime, createSalt } from "./simulator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, "../web");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function createVeilTabServer() {
  let rt = await new VeilTabRuntime().init();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/api/state") {
        return sendJson(res, 200, {
          ok: true,
          contractAddress: rt.contractAddress,
          publicLedger: rt.getPublicLedger(),
          privateLocal: rt.getPrivateSummary(),
        });
      }

      if (req.method === "POST" && url.pathname === "/api/reset") {
        rt = await new VeilTabRuntime().init();
        return sendJson(res, 200, {
          ok: true,
          contractAddress: rt.contractAddress,
          publicLedger: rt.getPublicLedger(),
          privateLocal: rt.getPrivateSummary(),
        });
      }

      if (req.method === "POST" && url.pathname === "/api/open") {
        const { totalCents, capacity } = await readJson(req);
        const pub = await rt.openTab(BigInt(totalCents), BigInt(capacity));
        return sendJson(res, 200, { ok: true, publicLedger: pub, privateLocal: rt.getPrivateSummary() });
      }

      if (req.method === "POST" && url.pathname === "/api/commit") {
        const { slot, shareCents, saltSeed } = await readJson(req);
        const salt = createSalt(saltSeed || `slot-${slot}-${Date.now()}`);
        const pub = await rt.commitShare(Number(slot), BigInt(shareCents), salt);
        return sendJson(res, 200, { ok: true, publicLedger: pub, privateLocal: rt.getPrivateSummary() });
      }

      if (req.method === "POST" && url.pathname === "/api/seal") {
        const pub = await rt.sealAndProve();
        return sendJson(res, 200, { ok: true, publicLedger: pub, privateLocal: rt.getPrivateSummary() });
      }

      if (req.method === "POST" && url.pathname === "/api/disclose") {
        const { slot } = await readJson(req);
        const idx = Number(slot);
        const amt = rt.privateState.shares[idx];
        const salt = rt.privateState.salts[idx];
        const pub = await rt.discloseMyShare(idx, amt, salt);
        return sendJson(res, 200, { ok: true, publicLedger: pub, privateLocal: rt.getPrivateSummary() });
      }

      // Static web UI
      const rel = url.pathname === "/" ? "/index.html" : url.pathname;
      const safePath = path.normalize(path.join(WEB_DIR, rel));
      if (!safePath.startsWith(WEB_DIR) || !fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const ext = path.extname(safePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(safePath).pipe(res);
    } catch (err) {
      return sendJson(res, 400, {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return { server };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8795);
  const { server } = await createVeilTabServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`[veiltab] Compact 0.36.1 runtime + UI listening at http://127.0.0.1:${port}`);
  });
}

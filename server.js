const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  const lines = contents.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) return;

    process.env[key] = value.replace(/^['"]|['"]$/g, "");
  });
};

loadEnvFile(path.join(rootDir, ".env.local"));

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
};

const normalizeList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.replace(/^[-*0-9.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return fallback;
};

const sanitizeIdea = (payload, fallbackIdea = {}, debug = {}) => ({
  title: String(payload.title || fallbackIdea.title || "Hackathon Idea").trim(),
  summary: String(payload.summary || fallbackIdea.summary || "").trim(),
  track: String(payload.track || fallbackIdea.track || "Open Track (Wildcard)").trim(),
  format: String(payload.format || fallbackIdea.format || "Working prototype").trim(),
  plan: normalizeList(payload.plan, fallbackIdea.plan || []),
  inputs: normalizeList(payload.inputs, fallbackIdea.inputs || []),
  debug: {
    model: debug.model || "gpt-5-mini",
    input: debug.input || "No prompt captured.",
    output: debug.output || "No raw model output.",
  },
});

const getResponseText = (payload) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  const textParts = [];

  payload.output.forEach((item) => {
    if (item.type !== "message" || !Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((contentItem) => {
      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
    });
  });

  return textParts.join("\n").trim();
};

const execFileAsync = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve(stdout);
    });
  });

const createOpenAIBody = (model, promptInput) =>
  JSON.stringify({
    model,
    reasoning: {
      effort: "minimal",
    },
    input: promptInput,
    text: {
      format: {
        type: "text",
      },
    },
  });

const fetchOpenAIWithCurl = async (apiKey, body) => {
  const stdout = await execFileAsync(
    "curl",
    [
      "-sS",
      "--max-time",
      "20",
      "https://api.openai.com/v1/responses",
      "-H",
      `Authorization: Bearer ${apiKey}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      body,
    ],
    {
      maxBuffer: 1024 * 1024 * 4,
    }
  );

  return JSON.parse(stdout);
};

const generateIdea = async ({
  discipline,
  problem,
  fallbackIdea,
}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = "gpt-5-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing from .env.local.");
  }

  const promptInput = `You create concise, strong hackathon ideas for a university event.
Return valid JSON only with keys title, summary, track, format, plan, inputs.
The values for plan and inputs must be arrays of short bullet strings.
Keep each value concise, concrete, and demo-ready.
Do not use markdown or code fences.
Track must be one of: AI for Productivity & Workflow, AI for Social Impact, AI for Business & Innovation, AI for Creativity & Communication, Open Track (Wildcard).
Format should be "Working prototype".

Discipline: ${discipline}
Problem: ${problem}
Fallback idea for tone reference: ${JSON.stringify(fallbackIdea)}`;

  const requestBody = createOpenAIBody(model, promptInput);
  let payload;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    payload = await response.json();

    if (!response.ok) {
      const message =
        payload?.error?.message || "OpenAI request failed during local test.";
      throw new Error(message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (!message.includes("ENOTFOUND") && !message.includes("fetch failed")) {
      throw error;
    }

    payload = await fetchOpenAIWithCurl(apiKey, requestBody);

    if (payload?.error) {
      throw new Error(payload.error.message || "OpenAI curl fallback failed.");
    }
  }

  const outputText = getResponseText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    const cleaned = outputText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");
    parsed = JSON.parse(cleaned);
  }

  return sanitizeIdea(parsed, fallbackIdea, {
    model,
    input: promptInput,
    output: outputText,
  });
};

const serveFile = (req, res) => {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(res, 404, { error: "Not found." });
        return;
      }

      sendJson(res, 500, { error: "Unable to read requested file." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });
    res.end(contents);
  });
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/idea") {
      const body = await readJsonBody(req);
      const idea = await generateIdea(body);
      sendJson(res, 200, idea);
      return;
    }

    if (req.method === "GET") {
      serveFile(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    sendJson(res, 500, { error: message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`UU Hack local server running at http://127.0.0.1:${port}/`);
});

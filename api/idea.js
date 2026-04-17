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

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { discipline, problem, fallbackIdea = {} } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  const model = "gpt-5-mini";

  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
    return;
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

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload?.error?.message || "OpenAI request failed during Vercel execution.";
      res.status(500).json({ error: message });
      return;
    }

    const outputText = getResponseText(payload);

    if (!outputText) {
      res.status(500).json({ error: "OpenAI returned an empty response." });
      return;
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

    res.status(200).json(
      sanitizeIdea(parsed, fallbackIdea, {
        model,
        input: promptInput,
        output: outputText,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    res.status(500).json({ error: message });
  }
};

const reveals = document.querySelectorAll(
  ".story-card, .track, .principles-grid article, .gallery-copy, .schedule-grid article, .register-panel, .info-rail, .faq-list details, .poster-panel"
);

const countdownLabel = document.querySelector("#countdown-label");
const countdownValue = document.querySelector("#countdown-value");
const deadlineCountdownValue = document.querySelector("#deadline-countdown-value");
const ideaForm = document.querySelector("#idea-form");
const ideaDiscipline = document.querySelector("#idea-discipline");
const ideaProblem = document.querySelector("#idea-problem");
const ideaStatus = document.querySelector("#idea-status");
const ideaOverline = document.querySelector("#idea-overline");
const ideaOutput = document.querySelector("#idea-output");
const ideaTitle = document.querySelector("#idea-title");
const ideaSummary = document.querySelector("#idea-summary");
const ideaTrack = document.querySelector("#idea-track");
const ideaFormat = document.querySelector("#idea-format");
const ideaPlan = document.querySelector("#idea-plan");
const ideaInputs = document.querySelector("#idea-inputs");
const ideaModel = document.querySelector("#idea-model");
const ideaDebugInput = document.querySelector("#idea-debug-input");
const ideaDebugOutput = document.querySelector("#idea-debug-output");

const hackathonStart = new Date("2026-04-17T18:00:00Z");
const submissionDeadline = new Date("2026-04-18T18:00:00Z");

const trackMap = {
  "Higher Education": "AI for Social Impact",
  Healthcare: "AI for Social Impact",
  Research: "AI for Productivity & Workflow",
  "Business Operations": "AI for Business & Innovation",
  "Creative Media": "AI for Creativity & Communication",
  "Community Services": "Open Track (Wildcard)",
};

const disciplineAssets = {
  "Higher Education": {
    noun: "student support assistant",
    title: "Campus Compass",
    audience: "students, advisors, and staff",
    sources: "public campus resource pages, FAQs, office hours, and deadline links",
  },
  Healthcare: {
    noun: "care navigation assistant",
    title: "Care Guide",
    audience: "patients, coordinators, and clinic staff",
    sources: "public care instructions, clinic workflows, intake forms, and service directories",
  },
  Research: {
    noun: "research workflow copilot",
    title: "Lab Navigator",
    audience: "researchers, analysts, and project teams",
    sources: "study notes, protocol summaries, public references, and process checklists",
  },
  "Business Operations": {
    noun: "operations assistant",
    title: "Ops Relay",
    audience: "teams, managers, and operators",
    sources: "process docs, SOPs, internal FAQs, and request examples",
  },
  "Creative Media": {
    noun: "creative brief generator",
    title: "Story Sprint",
    audience: "designers, communicators, and content teams",
    sources: "brand guidelines, content examples, campaign briefs, and review notes",
  },
  "Community Services": {
    noun: "community resource guide",
    title: "Local Link",
    audience: "residents, volunteers, and program coordinators",
    sources: "public service directories, eligibility guidance, event details, and intake questions",
  },
};

const toTitleCase = (value) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildIdea = (discipline, rawProblem) => {
  const trimmedProblem = rawProblem.trim() || "helping people complete an important task faster";
  const asset = disciplineAssets[discipline] || disciplineAssets["Higher Education"];
  const track = trackMap[discipline] || "Open Track (Wildcard)";
  const coreProblem = trimmedProblem.replace(/[.?!]+$/, "");
  const shortProblem = toTitleCase(coreProblem.split(" ").slice(0, 3).join(" "));

  return {
    title: `${asset.title}: ${shortProblem}`,
    summary: `Prototype a ${asset.noun} for ${asset.audience} focused on ${coreProblem.toLowerCase()}. The experience should turn a vague request into one useful next step in under a minute.`,
    track,
    format: "Working prototype",
    plan: [
      `Define the top 8 user questions around ${coreProblem.toLowerCase()}.`,
      "Map the best answer path for each one.",
      "Prototype the core flow.",
      "Test it with 3 realistic scenarios before polishing the demo.",
    ],
    inputs: [
      toTitleCase(coreProblem),
      asset.sources,
      "8 to 10 representative prompts that show what success should look like.",
    ],
    debug: {
      model: "gpt-5-mini",
      input: "Starter version generated locally before the live model returns.",
      output: "Starter version only. No raw model output yet.",
    },
  };
};

const renderList = (element, items) => {
  if (!element) return;

  const normalizedItems = Array.isArray(items)
    ? items
    : String(items || "")
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

  element.innerHTML = normalizedItems
    .map((item) => `<li>${item}</li>`)
    .join("");
};

const renderDebug = (debug) => {
  if (ideaModel) {
    ideaModel.textContent = debug?.model || "gpt-5-mini";
  }

  if (ideaDebugInput) {
    ideaDebugInput.textContent = debug?.input || "No generation yet.";
  }

  if (ideaDebugOutput) {
    ideaDebugOutput.textContent = debug?.output || "No generation yet.";
  }
};

const setGeneratedState = (isGenerated) => {
  if (ideaOutput) {
    ideaOutput.dataset.state = isGenerated ? "generated" : "placeholder";
  }

  if (ideaOverline) {
    ideaOverline.textContent = isGenerated ? "Suggested concept" : "Ready when you are";
  }

  [ideaTrack, ideaFormat].forEach((element) => {
    if (!element) return;
    element.classList.toggle("idea-pill-placeholder", !isGenerated);
  });
};

const renderIdea = (idea) => {
  if (
    !ideaDiscipline ||
    !ideaProblem ||
    !ideaTitle ||
    !ideaSummary ||
    !ideaTrack ||
    !ideaFormat ||
    !ideaPlan ||
    !ideaInputs
  ) {
    return;
  }

  const nextIdea =
    idea || buildIdea(ideaDiscipline.value, ideaProblem.value);

  ideaTitle.textContent = nextIdea.title;
  ideaSummary.textContent = nextIdea.summary;
  ideaTrack.textContent = nextIdea.track;
  ideaFormat.textContent = nextIdea.format;
  renderList(ideaPlan, nextIdea.plan);
  renderList(ideaInputs, nextIdea.inputs);
  renderDebug(nextIdea.debug);
  setGeneratedState(true);
};

const setIdeaStatus = (message) => {
  if (!ideaStatus) return;
  ideaStatus.textContent = message;
};

const requestIdea = async () => {
  if (!ideaDiscipline || !ideaProblem) {
    return;
  }

  const fallbackIdea = buildIdea(ideaDiscipline.value, ideaProblem.value);

  setIdeaStatus("Generating a live idea...");

  const response = await fetch("/api/idea", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      discipline: ideaDiscipline.value,
      problem: ideaProblem.value,
      fallbackIdea,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to generate idea right now.");
  }

  renderIdea(payload);
  setIdeaStatus("Live idea generated from OpenAI.");
};

const formatRemaining = (ms) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const updateCountdown = () => {
  if (!countdownLabel || !countdownValue) return;
  if (!deadlineCountdownValue) return;

  const now = new Date();
  const startDiff = hackathonStart.getTime() - now.getTime();
  const deadlineDiff = submissionDeadline.getTime() - now.getTime();

  deadlineCountdownValue.textContent = formatRemaining(deadlineDiff);
  countdownLabel.textContent = "Hackathon Countdown";

  if (startDiff > 0) {
    countdownValue.textContent = formatRemaining(startDiff);
    return;
  }

  if (deadlineDiff > 0) {
    countdownLabel.textContent = "Hackathon Live";
    countdownValue.textContent = "00:00";
    return;
  }

  countdownLabel.textContent = "Hackathon Ended";
  countdownValue.textContent = "00:00";
};

reveals.forEach((element) => {
  element.setAttribute("data-reveal", "");
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
  }
);

reveals.forEach((element) => observer.observe(element));

if (ideaForm) {
  ideaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    renderIdea(buildIdea(ideaDiscipline.value, ideaProblem.value));

    try {
      await requestIdea();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate idea right now.";
      setIdeaStatus(`${message} Showing the starter version instead.`);
    }
  });
}

setGeneratedState(false);
setIdeaStatus("Local mode ready.");
updateCountdown();
window.setInterval(updateCountdown, 1000);

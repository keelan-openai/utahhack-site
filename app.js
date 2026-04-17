const reveals = document.querySelectorAll(
  ".story-card, .track, .principles-grid article, .gallery-copy, .schedule-grid article, .register-panel, .info-rail, .faq-list details, .poster-panel"
);

const countdownLabel = document.querySelector("#countdown-label");
const countdownValue = document.querySelector("#countdown-value");
const deadlineCountdownValue = document.querySelector("#deadline-countdown-value");

const hackathonStart = new Date("2026-04-17T18:00:00Z");
const submissionDeadline = new Date("2026-04-18T18:00:00Z");

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

updateCountdown();
window.setInterval(updateCountdown, 1000);

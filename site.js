const INQUIRY_EMAIL = "you@example.com";
const LEAVE_MS = 480;
const ENTER_MS = 920;
const UNROLL_MS = 1000;
const LIFT_MS = 1400;
const LOGO_MS = 800;
const CARD_MS = 900;

let current = "home";
let viewBusy = false;
let viewQueued = null;
let websiteToken = 0;
let designToken = 0;
let homeToken = 0;
let designFace = "index";

const DESIGN_LABELS = {
  animation: "Animation",
  waffle: "Waffle",
  cookie: "Cookie",
  cake: "Cake"
};

function motion(el, frames, duration, easing) {
  const anim = el.animate(frames, { duration, easing, fill: "forwards" });
  return anim.finished.then(() => {
    anim.cancel();
  });
}

function rise(el, delay) {
  const anim = el.animate(
    [
      { opacity: 0, transform: "scale(0.78)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    {
      duration: CARD_MS,
      delay,
      easing: "cubic-bezier(0.22, 0.7, 0.2, 1)",
      fill: "forwards"
    }
  );
  return anim.finished.then(() => {
    anim.cancel();
    el.style.transform = "";
    el.classList.add("is-in");
  });
}

function handoff(prev, next) {
  prev.classList.remove("is-on");
  prev.classList.add("is-leaving");
  const prevPane = prev.dataset.view === "home" ? null : prev.querySelector(".pane");
  const jobs = [motion(prev, [{ opacity: 1 }, { opacity: 0 }], LEAVE_MS, "ease-in")];
  if (prevPane) {
    jobs.push(motion(prevPane, [{ transform: "scale(1)" }, { transform: "scale(0.94)" }], LEAVE_MS, "ease-in"));
  }
  return Promise.all(jobs).then(() => {
    prev.classList.remove("is-leaving");
    prev.hidden = true;
    if (next.dataset.view === "home") primeHome(next);
    next.hidden = false;
    next.classList.add("is-on");
    if (next.dataset.view === "home") return revealHome();
    if (next.dataset.view === "website") {
      playWebsite();
      return;
    }
    if (next.dataset.view === "design") {
      playDesign();
      return;
    }
    const pane = next.querySelector(".pane");
    if (!pane) return;
    return motion(
      pane,
      [
        { opacity: 0, transform: "scale(0.78)" },
        { opacity: 1, transform: "scale(1)" }
      ],
      ENTER_MS,
      "cubic-bezier(0.22, 0.7, 0.2, 1)"
    );
  });
}

function primeHome(view) {
  const veil = view.querySelector(".home-veil");
  const card = view.querySelector(".home-logo");
  if (veil) veil.style.opacity = "1";
  if (card) {
    card.style.opacity = "0";
    card.classList.remove("is-in");
  }
}

function revealHome() {
  const token = ++homeToken;
  const veil = document.querySelector(".home-veil");
  const card = document.querySelector(".home-logo");
  const video = document.querySelector(".home-film video");
  if (video) video.play().catch(() => {});
  if (!veil || !card) return;
  veil.style.opacity = "1";
  card.style.opacity = "0";
  card.classList.remove("is-in");
  const lift = veil.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: LIFT_MS, easing: "ease-in-out", fill: "forwards" }
  );
  return lift.finished.then(() => {
    if (token !== homeToken || current !== "home") return;
    lift.cancel();
    veil.style.opacity = "0";
    const fade = card.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: LOGO_MS, easing: "ease", fill: "forwards" }
    );
    return fade.finished.then(() => {
      if (token !== homeToken) return;
      fade.cancel();
      card.style.opacity = "";
      card.classList.add("is-in");
    });
  });
}

function syncHome() {
  const homeVideo = document.querySelector(".home-film video");
  if (!homeVideo) return;
  if (current === "home") homeVideo.play().catch(() => {});
  else homeVideo.pause();
}

function pauseReels() {
  document.querySelectorAll(".set video").forEach((video) => video.pause());
}

function showSet(name) {
  document.querySelectorAll("#design-sheet .set").forEach((set) => {
    const on = set.dataset.set === name;
    set.hidden = !on;
    set.classList.toggle("is-shown", on);
    set.querySelectorAll("video").forEach((video) => {
      if (on) video.play().catch(() => {});
      else video.pause();
    });
  });
}

function playWebsite() {
  const board = document.querySelector("#view-website .menu-board");
  if (!board) return;
  const cards = [...board.querySelectorAll(".site-card")];
  const token = ++websiteToken;
  board.classList.remove("is-open");
  cards.forEach((card) => {
    card.classList.remove("is-in");
    card.style.transform = "";
  });
  void board.offsetWidth;
  board.classList.add("is-open");
  window.setTimeout(() => {
    if (token !== websiteToken || current !== "website") return;
    cards.forEach((card, index) => rise(card, index * 80));
  }, UNROLL_MS);
}

function playDesign() {
  const board = document.querySelector("#design-board");
  const index = board.querySelector('[data-face="index"]');
  const detail = board.querySelector('[data-face="detail"]');
  const sheet = document.querySelector("#design-sheet");
  const kicker = document.querySelector("#design-kicker");
  const cards = [...board.querySelectorAll(".pick-card")];
  const token = ++designToken;
  designFace = "index";
  detail.hidden = true;
  index.hidden = false;
  sheet.classList.remove("is-open");
  kicker.textContent = "Design";
  pauseReels();
  document.querySelectorAll("#design-sheet .set").forEach((set) => {
    set.hidden = true;
    set.classList.remove("is-shown");
  });
  board.classList.remove("is-open");
  cards.forEach((card) => card.classList.remove("is-in"));
  void board.offsetWidth;
  board.classList.add("is-open");
  window.setTimeout(() => {
    if (token !== designToken || current !== "design" || designFace !== "index") return;
    cards.forEach((card, index) => rise(card, index * 80));
  }, UNROLL_MS);
}

function openDesignSet(name) {
  const board = document.querySelector("#design-board");
  const index = board.querySelector('[data-face="index"]');
  const detail = board.querySelector('[data-face="detail"]');
  const sheet = document.querySelector("#design-sheet");
  const kicker = document.querySelector("#design-kicker");
  if (name === "index") {
    designToken += 1;
    designFace = "index";
    sheet.classList.remove("is-open");
    detail.hidden = true;
    index.hidden = false;
    kicker.textContent = "Design";
    pauseReels();
    return;
  }
  if (!DESIGN_LABELS[name] || designFace === name) return;
  designFace = name;
  designToken += 1;
  index.hidden = true;
  detail.hidden = false;
  kicker.textContent = DESIGN_LABELS[name];
  showSet(name);
  sheet.classList.remove("is-open");
  void sheet.offsetWidth;
  sheet.classList.add("is-open");
}

function markNav(name) {
  document.querySelectorAll("nav [data-go]").forEach((link) => {
    if (link.dataset.go === name) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function finishView() {
  viewBusy = false;
  syncHome();
  if (viewQueued && viewQueued !== current) {
    const queued = viewQueued;
    viewQueued = null;
    showView(queued);
  } else {
    viewQueued = null;
  }
}

function showView(name) {
  if (!name || !document.querySelector(`[data-view="${name}"]`)) return;
  if (name === current && !viewBusy) return;
  if (viewBusy) {
    viewQueued = name;
    return;
  }
  const next = document.querySelector(`[data-view="${name}"]`);
  const prev = document.querySelector(`[data-view="${current}"]`);
  if (!next || !prev || next === prev) return;
  viewBusy = true;
  markNav(name);
  current = name;
  if (location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
  if (name !== "home") homeToken += 1;
  pauseReels();
  handoff(prev, next).then(finishView, finishView);
}

document.querySelectorAll("[data-go]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.go);
  });
});

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => openDesignSet(button.dataset.open));
});

const start = (location.hash || "#home").replace("#", "");
if (start !== "home" && document.querySelector(`[data-view="${start}"]`)) {
  const home = document.querySelector('[data-view="home"]');
  home.classList.remove("is-on");
  home.hidden = true;
  const first = document.querySelector(`[data-view="${start}"]`);
  first.hidden = false;
  first.classList.add("is-on");
  current = start;
  if (start === "website") playWebsite();
  if (start === "design") playDesign();
} else {
  revealHome();
}
markNav(current);
syncHome();

const form = document.querySelector("#inquiry-form");
const formError = document.querySelector("#form-error");
const formReady = document.querySelector("#form-ready");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const contact = form.contact.value.trim();
  const message = form.message.value.trim();
  formReady.hidden = true;
  if (!contact || !message) {
    formError.hidden = false;
    formError.textContent = "Add a way to reply, and a short note about what you'd like.";
    return;
  }
  formError.hidden = true;
  formReady.hidden = false;
  const subject = encodeURIComponent("Studio Skye inquiry");
  const body = encodeURIComponent(`Reply: ${contact}\n\n${message}`);
  window.location.href = `mailto:${INQUIRY_EMAIL}?subject=${subject}&body=${body}`;
});

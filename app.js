/* ==========================================================================
   AQUA PC SOLUTIONS — INTERACTIVE 3D PC BUILDER, VIDEO & REDIRECT CONTROLLER
   Target Base URL: https://aquapcsolutions.yyth.workers.dev/
   ========================================================================== */

const TARGET_BASE_URL = "https://aquapcsolutions.yyth.workers.dev";
const WHATSAPP_PHONE = "94788194535";

(function () {
  "use strict";

  // ── 1. Procedural Web Audio SFX ─────────────────────────────────────────
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
    }
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    toggle() {
      this.init();
      this.enabled = !this.enabled;
      if (this.enabled) this.tone(520, 880, 0.14);
      return this.enabled;
    }
    tone(f1 = 480, f2 = 760, dur = 0.12) {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + dur);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    }
  }

  const sfx = new SoundEngine();
  const sfxBtn = document.getElementById("sfx-toggle-btn");
  if (sfxBtn) {
    sfxBtn.addEventListener("click", () => {
      const on = sfx.toggle();
      sfxBtn.classList.toggle("active", on);
      const icon = sfxBtn.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = on ? "volume_up" : "volume_off";
    });
  }

  // ── 2. Warp Redirection Handler ─────────────────────────────────────────
  let isRedirecting = false;

  function triggerPortalRedirect(pathOrUrl = "/") {
    if (isRedirecting) return;
    isRedirecting = true;

    const destination = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${TARGET_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl}`;

    const destLabel = document.getElementById("warp-destination-url");
    if (destLabel) destLabel.textContent = destination;

    sfx.tone(180, 1120, 0.65);
    const overlay = document.getElementById("warp-overlay");
    if (overlay) overlay.classList.add("active");

    setTimeout(() => {
      window.location.href = destination;
    }, 780);
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-portal-path]");
    if (!link) return;
    e.preventDefault();
    triggerPortalRedirect(link.getAttribute("data-portal-path") || "/");
  });

  // ── 3. Auto-Redirect Countdown (Auto-Pauses When Building a PC) ─────────
  const TOTAL_SECONDS = 45;
  let remainingSec = TOTAL_SECONDS;
  let countdownPaused = false;

  const countdownNumEl = document.getElementById("countdown-num");
  const countdownCircleEl = document.getElementById("countdown-circle-fg");
  const toggleCountdownBtn = document.getElementById("toggle-countdown-btn");
  const pillStatusText = document.getElementById("pill-status-text");
  const CIRCUMFERENCE = 69.1;

  function updateCountdownUI() {
    if (countdownNumEl) {
      countdownNumEl.textContent = countdownPaused ? "||" : `${remainingSec}s`;
    }
    if (countdownCircleEl) {
      const progress = (TOTAL_SECONDS - remainingSec) / TOTAL_SECONDS;
      countdownCircleEl.style.strokeDashoffset = `${progress * CIRCUMFERENCE}`;
    }
    if (toggleCountdownBtn) {
      toggleCountdownBtn.textContent = countdownPaused ? "RESUME" : "PAUSE";
    }
    if (pillStatusText) {
      pillStatusText.textContent = countdownPaused
        ? "BUILDER ACTIVE (PAUSED)"
        : `AUTO-LAUNCH ${remainingSec}S`;
    }
  }

  function pauseForBuilderInteraction() {
    if (!countdownPaused) {
      countdownPaused = true;
      updateCountdownUI();
    }
  }

  if (toggleCountdownBtn) {
    toggleCountdownBtn.addEventListener("click", () => {
      countdownPaused = !countdownPaused;
      sfx.tone(440, 660, 0.1);
      updateCountdownUI();
    });
  }

  setInterval(() => {
    if (countdownPaused || isRedirecting) return;
    remainingSec = Math.max(0, remainingSec - 1);
    updateCountdownUI();
    if (remainingSec === 0) triggerPortalRedirect("/");
  }, 1000);

  // ── 4. Hero Real HD Video Reel Switcher ─────────────────────────────────
  const heroReelVideo = document.getElementById("hero-reel-video");
  const heroReelTitle = document.getElementById("hero-reel-title");
  const heroReelSub = document.getElementById("hero-reel-sub");

  document.querySelectorAll("[data-reel-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-reel-src]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const src = btn.getAttribute("data-reel-src");
      const title = btn.getAttribute("data-reel-title");
      const sub = btn.getAttribute("data-reel-sub");
      if (heroReelVideo && src) {
        heroReelVideo.src = src;
        heroReelVideo.play().catch(() => {});
      }
      if (heroReelTitle && title) heroReelTitle.textContent = title;
      if (heroReelSub && sub) heroReelSub.textContent = sub;
      sfx.tone(520, 780, 0.12);
    });
  });

  // ── 5. Interactive 3D PC Builder & Step-by-Step Assembly Controller ─────
  const STEP_DESCRIPTIONS = {
    1: "Step 1/8 · Dual-Chamber Tempered Glass Chassis & ARGB Fans Ready",
    2: "Step 2/8 · ATX Hydro Motherboard Mounted on Brass Standoffs",
    3: "Step 3/8 · Processor Seated & LGA Zero-Insertion Socket Locked",
    4: "Step 4/8 · PCIe Gen4 NVMe M.2 SSD & Aluminum Heatsink Installed",
    5: "Step 5/8 · DDR5-6400 Low-Latency RGB Memory Modules Seated",
    6: "Step 6/8 · Liquid AIO Pump LCD & Radiator Loop Mounted",
    7: "Step 7/8 · Graphics Card Seated in Reinforced PCIe Gen5 x16 Slot",
    8: "Step 8/8 · 1000W Modular PSU Connected & System Powered ON (Click Any 3D Part)",
  };

  const stepStatusBadge = document.getElementById("builder-step-status");
  const stepPills = document.querySelectorAll("[data-build-step]");
  let autoBuildTimer = null;

  function syncStepPills(activeStep) {
    stepPills.forEach((pill) => {
      const s = parseInt(pill.getAttribute("data-build-step"), 10);
      pill.classList.toggle("active", s === activeStep);
      pill.classList.toggle("completed", s < activeStep);
    });
    if (stepStatusBadge) {
      stepStatusBadge.textContent = STEP_DESCRIPTIONS[activeStep] || STEP_DESCRIPTIONS[8];
    }
  }

  function goToStep(step) {
    pauseForBuilderInteraction();
    if (autoBuildTimer) {
      clearInterval(autoBuildTimer);
      autoBuildTimer = null;
      const autoBtn = document.getElementById("btn-auto-build");
      if (autoBtn) autoBtn.textContent = "▶ AUTO-BUILD";
    }
    const clamped = Math.max(1, Math.min(8, step));
    if (window.AquaBuilder3D) window.AquaBuilder3D.setBuildStep(clamped);
    syncStepPills(clamped);
    sfx.tone(420 + clamped * 45, 640 + clamped * 55, 0.14);
  }

  stepPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const step = parseInt(pill.getAttribute("data-build-step"), 10);
      goToStep(step);
    });
  });

  const prevStepBtn = document.getElementById("btn-prev-step");
  const nextStepBtn = document.getElementById("btn-next-step");
  if (prevStepBtn) {
    prevStepBtn.addEventListener("click", () => {
      const cur = (window.AquaBuilder3D && window.AquaBuilder3D.state.buildStep) || 8;
      goToStep(cur <= 1 ? 8 : cur - 1);
    });
  }
  if (nextStepBtn) {
    nextStepBtn.addEventListener("click", () => {
      const cur = (window.AquaBuilder3D && window.AquaBuilder3D.state.buildStep) || 8;
      goToStep(cur >= 8 ? 1 : cur + 1);
    });
  }

  const autoBuildBtn = document.getElementById("btn-auto-build");
  if (autoBuildBtn) {
    autoBuildBtn.addEventListener("click", () => {
      pauseForBuilderInteraction();
      if (autoBuildTimer) {
        clearInterval(autoBuildTimer);
        autoBuildTimer = null;
        autoBuildBtn.textContent = "▶ AUTO-BUILD";
        return;
      }

      let cur = 1;
      autoBuildBtn.textContent = "⏹ STOP BUILD";
      if (window.AquaBuilder3D) window.AquaBuilder3D.setBuildStep(cur);
      syncStepPills(cur);
      sfx.tone(440, 680, 0.14);

      autoBuildTimer = setInterval(() => {
        cur++;
        if (cur > 8) {
          clearInterval(autoBuildTimer);
          autoBuildTimer = null;
          autoBuildBtn.textContent = "▶ AUTO-BUILD";
          return;
        }
        if (window.AquaBuilder3D) window.AquaBuilder3D.setBuildStep(cur);
        syncStepPills(cur);
        sfx.tone(420 + cur * 50, 680 + cur * 60, 0.14);
      }, 1350);
    });
  }

  // ── 6. Component Selector, Quick-Swap HUD & Live FPS Calculator ─────────
  const CPU_SCORES = {
    "i9-14900k": { score: 1.0, watts: 253, label: "Intel Core i9-14900K (24C/32T)" },
    "i7-14700k": { score: 0.92, watts: 210, label: "Intel Core i7-14700K (20C/28T)" },
    "ryzen-7950x3d": { score: 1.02, watts: 162, label: "AMD Ryzen 9 7950X3D (16C/32T)" },
    "ryzen-7800x3d": { score: 0.96, watts: 120, label: "AMD Ryzen 7 7800X3D (8C/16T)" },
  };

  const GPU_SCORES = {
    rtx4090: { cp2077: 138, cs2: 540, render: 98, watts: 450, label: "NVIDIA RTX 4090 24GB" },
    rtx4080s: { cp2077: 108, cs2: 490, render: 84, watts: 320, label: "NVIDIA RTX 4080 SUPER 16GB" },
    rtx4070s: { cp2077: 86, cs2: 430, render: 70, watts: 220, label: "NVIDIA RTX 4070 SUPER 12GB" },
    rx7800xt: { cp2077: 78, cs2: 410, render: 64, watts: 263, label: "AMD Radeon RX 7800 XT 16GB" },
    rtx4060: { cp2077: 58, cs2: 340, render: 50, watts: 115, label: "NVIDIA RTX 4060 8GB" },
  };

  const COOLER_LABELS = {
    aio360: "Aqua Hydro 360mm LCD AIO",
    aio240: "Aqua Hydro 240mm LCD AIO",
    air: "Aqua Dual-Tower 6-Heatpipe Air",
  };

  function updateBenchmarks() {
    if (!window.AquaBuilder3D) return;
    const st = window.AquaBuilder3D.state;
    const cpu = CPU_SCORES[st.cpu] || CPU_SCORES["i9-14900k"];
    const gpu = GPU_SCORES[st.gpu] || GPU_SCORES.rtx4090;

    const cpFps = Math.round(gpu.cp2077 * cpu.score);
    const csFps = Math.round(gpu.cs2 * cpu.score);
    const watts = cpu.watts + gpu.watts + 85;

    const elCpVal = document.getElementById("fps-cp2077-val");
    const elCpBar = document.getElementById("fps-cp2077-bar");
    const elCsVal = document.getElementById("fps-cs2-val");
    const elCsBar = document.getElementById("fps-cs2-bar");
    const elWatt = document.getElementById("build-wattage-val");

    if (elCpVal) elCpVal.textContent = `${cpFps} FPS (4K DLSS/FSR)`;
    if (elCpBar) elCpBar.style.width = `${Math.min(100, Math.round((cpFps / 145) * 100))}%`;
    if (elCsVal) elCsVal.textContent = `${csFps} FPS (1440p Comp)`;
    if (elCsBar) elCsBar.style.width = `${Math.min(100, Math.round((csFps / 560) * 100))}%`;
    if (elWatt) elWatt.textContent = `EST. LOAD: ${watts}W`;

    if (window.AquaBuilder3D.updateTelemetryBench) {
      window.AquaBuilder3D.updateTelemetryBench(cpFps, csFps, watts);
    }
  }

  function syncPartButtonsFromState() {
    if (!window.AquaBuilder3D) return;
    const st = window.AquaBuilder3D.state;
    ["cpu", "cooler", "gpu", "gpuMount", "ram", "theme"].forEach((cat) => {
      document.querySelectorAll(`[data-part-cat="${cat}"]`).forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-part-val") === st[cat]);
      });
    });
  }

  function selectPartOption(cat, val, skipCameraFocus) {
    pauseForBuilderInteraction();
    if (window.AquaBuilder3D) {
      if (window.AquaBuilder3D.state.buildStep < 8) {
        window.AquaBuilder3D.setBuildStep(8);
        syncStepPills(8);
      }
      window.AquaBuilder3D.setPart(cat, val, skipCameraFocus);
    }
    syncPartButtonsFromState();
    updateBenchmarks();
    sfx.tone(500, 820, 0.12);
  }

  document.querySelectorAll("[data-part-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.getAttribute("data-part-cat");
      const val = btn.getAttribute("data-part-val");
      selectPartOption(cat, val, false);
    });
  });

  // ── 7. 1-Click Complete PC Build Presets Bar ────────────────────────────
  const RIG_PRESETS = {
    "flagship-4k": {
      cpu: "i9-14900k",
      cooler: "aio360",
      gpu: "rtx4090",
      gpuMount: "horizontal",
      ram: "64gb-4x16",
      theme: "black",
      rgb: "#00f2fe",
    },
    "esports-540": {
      cpu: "ryzen-7800x3d",
      cooler: "aio240",
      gpu: "rtx4080s",
      gpuMount: "horizontal",
      ram: "32gb-2x16",
      theme: "black",
      rgb: "#10b981",
    },
    "glacier-white": {
      cpu: "ryzen-7950x3d",
      cooler: "aio360",
      gpu: "rtx4090",
      gpuMount: "vertical",
      ram: "64gb-4x16",
      theme: "white",
      rgb: "#00f2fe",
    },
    "creator-ai": {
      cpu: "i7-14700k",
      cooler: "air",
      gpu: "rtx4070s",
      gpuMount: "horizontal",
      ram: "64gb-4x16",
      theme: "black",
      rgb: "#f59e0b",
    },
  };

  document.querySelectorAll("[data-rig-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pauseForBuilderInteraction();
      document.querySelectorAll("[data-rig-preset]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const key = btn.getAttribute("data-rig-preset");
      const p = RIG_PRESETS[key];
      if (!p || !window.AquaBuilder3D) return;

      if (window.AquaBuilder3D.state.buildStep < 8) {
        window.AquaBuilder3D.setBuildStep(8);
        syncStepPills(8);
      }

      window.AquaBuilder3D.setPart("cpu", p.cpu, true);
      window.AquaBuilder3D.setPart("cooler", p.cooler, true);
      window.AquaBuilder3D.setPart("gpuMount", p.gpuMount, true);
      window.AquaBuilder3D.setPart("gpu", p.gpu, true);
      window.AquaBuilder3D.setPart("ram", p.ram, true);
      window.AquaBuilder3D.setPart("theme", p.theme, true);
      window.AquaBuilder3D.setRGB(p.rgb);
      window.AquaBuilder3D.focusPreset("full");

      document.querySelectorAll("[data-rgb]").forEach((s) => {
        s.classList.toggle("active", s.getAttribute("data-rgb") === p.rgb);
      });

      syncPartButtonsFromState();
      updateBenchmarks();
      sfx.tone(440, 880, 0.18);
    });
  });

  // ── 8. Direct 3D Part Click -> In-Viewport Quick-Swap HUD Drawer ────────
  const quickSwapDrawer = document.getElementById("viewport-quick-swap");
  const quickSwapLabel = document.getElementById("quick-swap-label");
  const quickSwapOptions = document.getElementById("quick-swap-options");
  const quickSwapClose = document.getElementById("quick-swap-close");

  const QUICK_SWAP_CATALOG = {
    cpu: {
      title: "3D PROCESSOR SELECTED // CLICK TO SWAP CPU",
      items: [
        { cat: "cpu", val: "i9-14900k", label: "Core i9-14900K" },
        { cat: "cpu", val: "ryzen-7950x3d", label: "Ryzen 9 7950X3D" },
        { cat: "cpu", val: "i7-14700k", label: "Core i7-14700K" },
        { cat: "cpu", val: "ryzen-7800x3d", label: "Ryzen 7 7800X3D" },
      ],
    },
    cooler: {
      title: "3D COOLING LOOP SELECTED // CLICK TO SWAP COOLER",
      items: [
        { cat: "cooler", val: "aio360", label: "360mm Hydro LCD AIO" },
        { cat: "cooler", val: "aio240", label: "240mm Hydro LCD AIO" },
        { cat: "cooler", val: "air", label: "Dual-Tower Air Cooler" },
      ],
    },
    gpu: {
      title: "3D GRAPHICS CARD SELECTED // SWAP GPU OR MOUNT",
      items: [
        { cat: "gpu", val: "rtx4090", label: "RTX 4090 24GB" },
        { cat: "gpu", val: "rtx4080s", label: "RTX 4080 SUPER" },
        { cat: "gpu", val: "rtx4070s", label: "RTX 4070 SUPER" },
        { cat: "gpu", val: "rx7800xt", label: "RX 7800 XT" },
        { cat: "gpuMount", val: "horizontal", label: "Horizontal Slot" },
        { cat: "gpuMount", val: "vertical", label: "Vertical Showcase" },
      ],
    },
    ram: {
      title: "3D DDR5 MEMORY SELECTED // SWAP DIMM CONFIGURATION",
      items: [
        { cat: "ram", val: "64gb-4x16", label: "64GB (4×16GB Quad ARGB)" },
        { cat: "ram", val: "32gb-2x16", label: "32GB (2×16GB Dual ARGB)" },
      ],
    },
    theme: {
      title: "3D CHASSIS & PSU SELECTED // SWAP FINISH",
      items: [
        { cat: "theme", val: "black", label: "Obsidian Black Chassis" },
        { cat: "theme", val: "white", label: "Glacier White Chassis" },
      ],
    },
  };

  function openQuickSwapForCategory(catKey) {
    const normalized = catKey === "psu" || catKey === "ssd" ? "theme" : catKey;
    const entry = QUICK_SWAP_CATALOG[normalized];
    if (!entry || !quickSwapDrawer || !quickSwapOptions || !window.AquaBuilder3D) return;

    quickSwapLabel.textContent = entry.title;
    quickSwapOptions.innerHTML = "";

    entry.items.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className =
        "quick-swap-chip" +
        (window.AquaBuilder3D.state[item.cat] === item.val ? " active" : "");
      chip.textContent = item.label;
      chip.addEventListener("click", () => {
        selectPartOption(item.cat, item.val, false);
        openQuickSwapForCategory(normalized);
      });
      quickSwapOptions.appendChild(chip);
    });

    quickSwapDrawer.classList.add("visible");

    // Highlight matching section in the right-hand configurator panel
    const sec = document.querySelector(`[data-config-section="${normalized}"]`);
    if (sec) {
      sec.classList.add("highlight-flash");
      setTimeout(() => sec.classList.remove("highlight-flash"), 1400);
    }
  }

  if (quickSwapClose && quickSwapDrawer) {
    quickSwapClose.addEventListener("click", () => {
      quickSwapDrawer.classList.remove("visible");
    });
  }

  window.addEventListener("aqua:part-clicked-3d", (e) => {
    pauseForBuilderInteraction();
    const info = (e && e.detail) || {};
    if (info.cat === "glass") {
      const btnGlass = document.getElementById("btn-toggle-glass");
      if (btnGlass) btnGlass.click();
      return;
    }
    openQuickSwapForCategory(info.cat || "gpu");
    sfx.tone(540, 860, 0.12);
  });

  // ── 9. Camera Presets, Zoom Controls & Fullscreen 3D Toggle ─────────────
  document.querySelectorAll("[data-cam-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pauseForBuilderInteraction();
      document
        .querySelectorAll("[data-cam-preset]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const preset = btn.getAttribute("data-cam-preset");
      const quickCat = btn.getAttribute("data-quick-cat");
      if (window.AquaBuilder3D) window.AquaBuilder3D.focusPreset(preset);
      if (quickCat) openQuickSwapForCategory(quickCat);
      sfx.tone(460, 700, 0.1);
    });
  });

  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnResetCam = document.getElementById("btn-reset-cam");
  const btnFullscreen3D = document.getElementById("btn-fullscreen-3d");
  const stageCard = document.getElementById("builder-stage-card");

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      pauseForBuilderInteraction();
      if (window.AquaBuilder3D) window.AquaBuilder3D.zoom(-0.85);
      sfx.tone(520, 740, 0.08);
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      pauseForBuilderInteraction();
      if (window.AquaBuilder3D) window.AquaBuilder3D.zoom(0.85);
      sfx.tone(480, 620, 0.08);
    });
  }
  if (btnResetCam) {
    btnResetCam.addEventListener("click", () => {
      pauseForBuilderInteraction();
      if (window.AquaBuilder3D) window.AquaBuilder3D.focusPreset("full");
      if (quickSwapDrawer) quickSwapDrawer.classList.remove("visible");
      sfx.tone(440, 720, 0.1);
    });
  }
  if (btnFullscreen3D && stageCard) {
    btnFullscreen3D.addEventListener("click", () => {
      pauseForBuilderInteraction();
      stageCard.classList.toggle("fullscreen-3d");
      window.dispatchEvent(new Event("resize"));
      sfx.tone(500, 850, 0.12);
    });
  }

  // RGB Swatches
  document.querySelectorAll("[data-rgb]").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      pauseForBuilderInteraction();
      document.querySelectorAll("[data-rgb]").forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
      const color = swatch.getAttribute("data-rgb");
      if (window.AquaBuilder3D) window.AquaBuilder3D.setRGB(color);
      sfx.tone(600, 920, 0.1);
    });
  });

  // View Action Toggles (ESD Bench, Exploded, Glass, Airflow, Power)
  const btnBay = document.getElementById("btn-toggle-bay");
  if (btnBay) {
    btnBay.addEventListener("click", () => {
      pauseForBuilderInteraction();
      const on = window.AquaBuilder3D && window.AquaBuilder3D.toggleBayEnvironment();
      btnBay.classList.toggle("active", !!on);
      sfx.tone(440, 720, 0.12);
    });
  }

  const btnExploded = document.getElementById("btn-toggle-exploded");
  if (btnExploded) {
    btnExploded.addEventListener("click", () => {
      pauseForBuilderInteraction();
      const on = window.AquaBuilder3D && window.AquaBuilder3D.toggleExploded();
      btnExploded.classList.toggle("active", !!on);
      sfx.tone(420, 740, 0.14);
    });
  }

  const btnGlass = document.getElementById("btn-toggle-glass");
  if (btnGlass) {
    btnGlass.addEventListener("click", () => {
      pauseForBuilderInteraction();
      const on = window.AquaBuilder3D && window.AquaBuilder3D.toggleGlass();
      btnGlass.classList.toggle("active", !!on);
      sfx.tone(480, 680, 0.12);
    });
  }

  const btnAirflow = document.getElementById("btn-toggle-airflow");
  if (btnAirflow) {
    btnAirflow.addEventListener("click", () => {
      pauseForBuilderInteraction();
      const on = window.AquaBuilder3D && window.AquaBuilder3D.toggleAirflow();
      btnAirflow.classList.toggle("active", !!on);
      sfx.tone(540, 840, 0.12);
    });
  }

  const btnPower = document.getElementById("btn-toggle-power");
  if (btnPower) {
    btnPower.addEventListener("click", () => {
      pauseForBuilderInteraction();
      const on = window.AquaBuilder3D && window.AquaBuilder3D.togglePower();
      btnPower.classList.toggle("active", !!on);
      btnPower.textContent = on ? "⚡ POWER: ON" : "⚡ POWER: STANDBY";
      sfx.tone(on ? 320 : 680, on ? 780 : 260, 0.18);
    });
  }

  // WhatsApp Custom Build Order Generator
  const waBuildBtn = document.getElementById("btn-whatsapp-build");
  if (waBuildBtn) {
    waBuildBtn.addEventListener("click", () => {
      const st = (window.AquaBuilder3D && window.AquaBuilder3D.state) || {};
      const cpuLabel = (CPU_SCORES[st.cpu] && CPU_SCORES[st.cpu].label) || st.cpu;
      const gpuLabel = (GPU_SCORES[st.gpu] && GPU_SCORES[st.gpu].label) || st.gpu;
      const coolerLabel = COOLER_LABELS[st.cooler] || st.cooler;

      const msg = [
        "Hello Aqua PC Solutions! I configured a custom 3D PC build on your launch portal and would like a quote:",
        `• Processor: ${cpuLabel}`,
        `• Cooling: ${coolerLabel}`,
        `• Graphics Card: ${gpuLabel} (${st.gpuMount} mount)`,
        `• Memory: ${st.ram === "64gb-4x16" ? "64GB (4x16GB) DDR5-6400 RGB" : "32GB (2x16GB) DDR5-6400 RGB"}`,
        `• Storage: ${st.ssd}`,
        `• Power Supply: ${st.psu} Modular`,
        `• Chassis Theme: ${st.theme === "white" ? "Glacier White" : "Obsidian Black"}`,
      ].join("\n");

      window.open(
        `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener"
      );
    });
  }

  // ── 10. Interactive 3D Perspective Tilt Engine for Website Cards ────────
  document.querySelectorAll("[data-tilt-3d]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      const rotX = (-ny * 9).toFixed(2);
      const rotY = (nx * 9).toFixed(2);
      card.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  updateBenchmarks();
})();

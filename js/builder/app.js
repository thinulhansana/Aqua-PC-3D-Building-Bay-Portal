/* ==========================================================================
   AQUA PC SOLUTIONS — 3D PC BUILDING BAY CONTROLLER (ES MODULE)
   Connects catalog.js, scene.js (Three.js r160 PBR + Bloom + Mirror Floor),
   10 hardware/styling categories, compatibility analyzer & storefront warp.
   ========================================================================== */

import {
  ASSEMBLY_FEE,
  CATEGORIES,
  CPUS,
  MOBOS,
  COOLERS,
  GPUS,
  RAMS,
  SSDS,
  PSUS,
  THEMES,
  GLASS,
  GPU_FINISHES,
  GPU_MOUNTS,
  RAM_COLORS,
  CABLES,
  RGB_COLORS,
  RGB_MODES,
  FAN_PROFILES,
  ENVIRONMENTS,
  DEFAULT_BUILD,
  PRESETS,
  LOOKUP,
  formatPrice,
  analyzeBuild,
} from "./catalog.js";
import { createBuilderScene } from "./scene.js";

const TARGET_BASE_URL = "https://aquapcsolutions.yyth.workers.dev";
const WHATSAPP_PHONE = "94788194535";

/* ───────────────────────── Procedural Web Audio SFX ───────────────────────── */
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
    gain.gain.setValueAtTime(0.055, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }
}
const sfx = new SoundEngine();

/* ───────────────────────── Toast Helper ───────────────────────── */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast-banner");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}

/* ───────────────────────── Hyperspace Warp Redirection ───────────────────────── */
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
  }, 750);
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-portal-path]");
  if (!link) return;
  e.preventDefault();
  triggerPortalRedirect(link.getAttribute("data-portal-path") || "/");
});

/* ───────────────────────── Countdown Pill ───────────────────────── */
const TOTAL_SECONDS = 60;
let remainingSec = TOTAL_SECONDS;
let countdownPaused = true; // Paused by default on the interactive 3D Building Bay Home Page

function updateCountdownUI() {
  const numEl = document.getElementById("countdown-num");
  const circleEl = document.getElementById("countdown-circle-fg");
  const toggleBtn = document.getElementById("toggle-countdown-btn");
  const statusEl = document.getElementById("pill-status-text");
  if (numEl) numEl.textContent = countdownPaused ? "||" : `${remainingSec}s`;
  if (circleEl) {
    const progress = (TOTAL_SECONDS - remainingSec) / TOTAL_SECONDS;
    circleEl.style.strokeDashoffset = `${progress * 69.1}`;
  }
  if (toggleBtn) toggleBtn.textContent = countdownPaused ? "AUTO" : "PAUSE";
  if (statusEl) statusEl.textContent = countdownPaused ? "BAY ACTIVE" : `LAUNCH ${remainingSec}S`;
}

function pauseCountdown() {
  if (!countdownPaused) {
    countdownPaused = true;
    updateCountdownUI();
  }
}

/* ───────────────────────── Build State Persistence (#b=...) ───────────────────────── */
const BUILD_KEYS = [
  "cpu", "mobo", "cooler", "gpu", "gpuMount", "gpuFinish",
  "ram", "ramColor", "ssd", "psu", "theme", "glass", "cables",
  "rgb", "rgbMode", "brightness", "fan",
];

function decodeHashBuild() {
  try {
    const m = window.location.hash.match(/b=([^&]+)/);
    if (!m) return null;
    const raw = JSON.parse(decodeURIComponent(atob(m[1])));
    const out = Object.assign({}, DEFAULT_BUILD);
    BUILD_KEYS.forEach((k) => {
      if (raw && raw[k] !== undefined) out[k] = raw[k];
    });
    return out;
  } catch {
    return null;
  }
}

function encodeShareUrl(st) {
  const payload = {};
  BUILD_KEYS.forEach((k) => (payload[k] = st[k]));
  const hash = "b=" + btoa(encodeURIComponent(JSON.stringify(payload)));
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

/* ───────────────────────── Main Studio Bootstrap ───────────────────────── */
const canvas = document.getElementById("pc-builder-canvas");
const pinElements = Array.from(document.querySelectorAll("[data-pin-anchor]"));

const initialBuild = decodeHashBuild() || Object.assign({}, DEFAULT_BUILD);

const hoverTooltipEl = document.getElementById("viewport-hover-tooltip");
const hoverTitleEl = document.getElementById("hover-tooltip-title");
const hoverSubEl = document.getElementById("hover-tooltip-sub");

let activeCategory = "all";
let cpuBrandFilter = "all";
let gpuBrandFilter = "all";
let activePresetId = null;
let bomOpen = false;
let autoBuildTimer = null;

function describeHoveredPart(info, st) {
  if (!info) return null;
  switch (info.cat) {
    case "cpu": {
      const c = LOOKUP.cpu[st.cpu];
      return { title: c ? c.name : "Processor", sub: "Click to swap Intel Core or AMD Ryzen CPU" };
    }
    case "mobo": {
      const m = LOOKUP.mobo[st.mobo];
      return { title: m ? m.name : "Motherboard", sub: "Click to change chipset & VRM platform" };
    }
    case "cooler": {
      const cl = LOOKUP.cooler[st.cooler];
      return { title: cl ? cl.name : "CPU Cooler", sub: "Click to switch 360mm/240mm LCD AIO or Dual-Tower Air" };
    }
    case "gpu": {
      const g = LOOKUP.gpu[st.gpu];
      return { title: g ? `${g.name} ${g.vram}` : "Graphics Card", sub: "Click to swap GPU model, finish, or Horizontal/Vertical mount" };
    }
    case "ram": {
      const r = LOOKUP.ram[st.ram];
      return { title: r ? r.name : "DDR5 Memory", sub: "Click to change capacity (32GB–128GB) or heatspreader color" };
    }
    case "ssd": {
      const s = LOOKUP.ssd[st.ssd];
      return { title: s ? s.name : "NVMe Storage", sub: "Click to upgrade Gen4/Gen5 M.2 SSD capacity" };
    }
    case "psu": {
      const p = LOOKUP.psu[st.psu];
      return { title: p ? p.name : "Modular PSU", sub: "Click to change ATX 3.1 wattage (750W–1600W)" };
    }
    case "glass":
      return { title: "Tempered Glass Side Panel", sub: "Click to slide open/close glass · Customize tint in Case tab" };
    case "case":
    default: {
      const th = LOOKUP.theme[st.theme];
      return { title: `Aqua Vision Chassis · ${th ? th.name : "Custom"}`, sub: "Click to change chassis color, glass tint & braided cables" };
    }
  }
}

let scene = null;
if (canvas && window.AquaPCModel) {
  scene = createBuilderScene({
    canvas,
    quality: "high",
    pinElements,
    onHover(info, lx, ly) {
      if (!hoverTooltipEl || !hoverTitleEl || !hoverSubEl) return;
      if (!info || !scene) {
        hoverTooltipEl.classList.remove("visible");
        return;
      }
      const desc = describeHoveredPart(info, scene.state);
      if (!desc) return;
      hoverTitleEl.textContent = desc.title;
      hoverSubEl.textContent = desc.sub;
      const rect = canvas.getBoundingClientRect();
      const tx = Math.min(rect.width - 255, Math.max(12, lx + 16));
      const ty = Math.min(rect.height - 84, Math.max(12, ly - 18));
      hoverTooltipEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      hoverTooltipEl.classList.add("visible");
    },
    onPick(info) {
      pauseCountdown();
      if (!info) return;
      if (info.cat === "glass") {
        syncViewToggleButtons();
        sfx.tone(480, 680, 0.12);
        return;
      }
      openQuickSwapForCategory(info.cat);
      sfx.tone(540, 860, 0.12);
    },
    onQualityDrop(next, fps) {
      syncQualityButtons(next);
      showToast(`Auto-adjusted 3D quality to ${next.toUpperCase()} (${fps} FPS)`);
    },
  });

  scene.applyBuild(initialBuild, { animate: false });
  scene.start();
}

/* ───────────────────────── Smart Selection & Part Updater ───────────────────────── */
function setBuildOption(cat, val, { focus = true, animate = true } = {}) {
  if (!scene) return;
  pauseCountdown();
  activePresetId = null;

  if (scene.state.buildStep < 8) {
    scene.setBuildStep(8, { focus: false });
    syncStepPills(8);
  }

  scene.setPart(cat, val, { focus, animate });

  // Smart socket auto-matching when CPU is changed
  if (cat === "cpu") {
    const cpuObj = LOOKUP.cpu[val];
    const moboObj = LOOKUP.mobo[scene.state.mobo];
    if (cpuObj && moboObj && cpuObj.socket !== moboObj.socket) {
      const compatibleBoard = MOBOS.find((m) => m.socket === cpuObj.socket);
      if (compatibleBoard) {
        scene.setPart("mobo", compatibleBoard.id, { focus: false, animate: false });
        showToast(`Matched motherboard to ${compatibleBoard.name} (${cpuObj.socket})`);
      }
    }
  }

  sfx.tone(500, 820, 0.12);
  refreshAllUI();
}

/* ───────────────────────── Quick-Swap HUD Drawer ───────────────────────── */
const quickSwapDrawer = document.getElementById("viewport-quick-swap");
const quickSwapLabel = document.getElementById("quick-swap-label");
const quickSwapOptions = document.getElementById("quick-swap-options");
const quickSwapClose = document.getElementById("quick-swap-close");

function openQuickSwapForCategory(catKey) {
  if (!scene || !quickSwapDrawer || !quickSwapOptions || !quickSwapLabel) return;
  const st = scene.state;
  const cat = catKey === "style" ? "cables" : catKey;

  let title = "3D COMPONENT SELECTED";
  let items = [];

  if (cat === "cpu") {
    title = "PROCESSOR (3D SOCKET) // QUICK SWAP";
    items = CPUS.map((c) => ({ cat: "cpu", val: c.id, label: c.name.replace(/^(AMD |Intel )/, "") }));
  } else if (cat === "mobo") {
    const cpuSock = (LOOKUP.cpu[st.cpu] || {}).socket;
    title = `MOTHERBOARD (${cpuSock || "ATX"}) // QUICK SWAP`;
    items = MOBOS.filter((m) => !cpuSock || m.socket === cpuSock).map((m) => ({ cat: "mobo", val: m.id, label: m.chipset + " Hydro" }));
  } else if (cat === "cooler") {
    title = "CPU COOLING ARCHITECTURE // QUICK SWAP";
    items = COOLERS.map((c) => ({ cat: "cooler", val: c.id, label: c.name.replace("Aqua ", "") }));
  } else if (cat === "gpu") {
    title = "GRAPHICS ACCELERATOR & MOUNT // QUICK SWAP";
    items = [
      ...GPUS.slice(0, 7).map((g) => ({ cat: "gpu", val: g.id, label: g.name.replace(/^(NVIDIA GeForce |NVIDIA |AMD Radeon )/, "") })),
      ...GPU_MOUNTS.map((m) => ({ cat: "gpuMount", val: m.id, label: m.id === "vertical" ? "Vertical Mount" : "Horizontal Mount" })),
    ];
  } else if (cat === "ram") {
    title = "DDR5 MEMORY & FINISH // QUICK SWAP";
    items = [
      ...RAMS.map((r) => ({ cat: "ram", val: r.id, label: `${r.size}GB (${r.sticks} DIMMs)` })),
      ...RAM_COLORS.map((rc) => ({ cat: "ramColor", val: rc.id, label: rc.name.split(" ")[0] })),
    ];
  } else if (cat === "ssd") {
    title = "NVMe M.2 STORAGE // QUICK SWAP";
    items = SSDS.map((s) => ({ cat: "ssd", val: s.id, label: s.label }));
  } else if (cat === "psu") {
    title = "ATX 3.1 MODULAR PSU // QUICK SWAP";
    items = PSUS.map((p) => ({ cat: "psu", val: p.id, label: `${p.watts}W ${p.rating}` }));
  } else {
    title = "CHASSIS FINISH & CABLES // QUICK SWAP";
    items = [
      ...THEMES.map((t) => ({ cat: "theme", val: t.id, label: t.name })),
      ...CABLES.map((cb) => ({ cat: "cables", val: cb.id, label: cb.name.replace("Custom ", "") + " Cables" })),
    ];
  }

  quickSwapLabel.textContent = title;
  quickSwapOptions.innerHTML = "";
  items.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "quick-swap-chip" + (st[item.cat] === item.val ? " active" : "");
    chip.textContent = item.label;
    chip.addEventListener("click", () => {
      setBuildOption(item.cat, item.val, { focus: false, animate: true });
      openQuickSwapForCategory(catKey);
    });
    quickSwapOptions.appendChild(chip);
  });

  quickSwapDrawer.classList.add("visible");

  // Switch active category tab if desired or flash matching section
  const panelCat = cat === "cables" ? "style" : cat;
  const sec = document.querySelector(`[data-config-section="${panelCat}"]`);
  if (sec) {
    sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
    sec.classList.add("highlight-flash");
    setTimeout(() => sec.classList.remove("highlight-flash"), 1400);
  }
}

if (quickSwapClose && quickSwapDrawer) {
  quickSwapClose.addEventListener("click", () => quickSwapDrawer.classList.remove("visible"));
}

/* ───────────────────────── Presets Ribbon ───────────────────────── */
function renderPresets() {
  const container = document.getElementById("presets-list");
  if (!container) return;
  container.innerHTML = "";
  PRESETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-rig-btn" + (activePresetId === p.id ? " active" : "");
    btn.innerHTML = `
      <span class="preset-rig-icon"><span class="material-symbols-outlined" style="font-size:18px">${p.icon}</span></span>
      <div>
        <strong>${p.name}</strong>
        <small>${p.sub}</small>
      </div>
    `;
    btn.addEventListener("click", () => {
      pauseCountdown();
      activePresetId = p.id;
      if (scene) {
        if (scene.state.buildStep < 8) {
          scene.setBuildStep(8, { focus: false });
          syncStepPills(8);
        }
        scene.applyBuild(p.build, { animate: true });
        scene.focusPreset("full");
      }
      sfx.tone(440, 880, 0.16);
      refreshAllUI();
      showToast(`Loaded Preset: ${p.name}`);
    });
    container.appendChild(btn);
  });
}

document.getElementById("btn-randomize-build")?.addEventListener("click", () => {
  if (!scene) return;
  pauseCountdown();
  activePresetId = null;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const cpu = pick(CPUS);
  const compatMobos = MOBOS.filter((m) => m.socket === cpu.socket);
  const mobo = pick(compatMobos.length ? compatMobos : MOBOS);
  const gpu = pick(GPUS);
  const cooler = cpu.tdp > 220 ? COOLERS[0] : pick(COOLERS);
  const ram = pick(RAMS);
  const ssd = pick(SSDS);
  const minWatts = cpu.tdp + gpu.tbp + 180;
  const compatPsus = PSUS.filter((p) => p.watts >= minWatts);
  const psu = compatPsus.length ? compatPsus[0] : PSUS[PSUS.length - 1];

  const randBuild = {
    cpu: cpu.id,
    mobo: mobo.id,
    cooler: cooler.id,
    gpu: gpu.id,
    gpuMount: pick(GPU_MOUNTS).id,
    gpuFinish: pick(GPU_FINISHES).id,
    ram: ram.id,
    ramColor: pick(RAM_COLORS).id,
    ssd: ssd.id,
    psu: psu.id,
    theme: pick(THEMES).id,
    glass: pick(GLASS).id,
    cables: pick(CABLES).id,
    rgb: pick(RGB_COLORS).hex,
    rgbMode: pick(RGB_MODES.slice(0, 4)).id,
    fan: "balanced",
    brightness: 1,
  };
  if (scene.state.buildStep < 8) {
    scene.setBuildStep(8, { focus: false });
    syncStepPills(8);
  }
  scene.applyBuild(randBuild, { animate: true });
  scene.focusPreset("full");
  sfx.tone(360, 920, 0.2);
  refreshAllUI();
  showToast(`Randomized Build: ${cpu.name.split(" ").slice(-1)[0]} + ${gpu.name.replace(/^(NVIDIA GeForce |AMD Radeon )/, "")}`);
});

document.getElementById("btn-reset-build")?.addEventListener("click", () => {
  if (!scene) return;
  pauseCountdown();
  activePresetId = null;
  if (scene.state.buildStep < 8) {
    scene.setBuildStep(8, { focus: false });
    syncStepPills(8);
  }
  scene.applyBuild(DEFAULT_BUILD, { animate: true });
  scene.focusPreset("full");
  sfx.tone(440, 680, 0.14);
  refreshAllUI();
  showToast("Reset to Aqua Studio Default Build");
});

/* ───────────────────────── Category Tabs ───────────────────────── */
function renderCategoryTabs() {
  const bar = document.getElementById("cat-tabs-bar");
  if (!bar) return;
  bar.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "cat-tab-btn" + (activeCategory === "all" ? " active" : "");
  allBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px">apps</span><span>All Parts</span>`;
  allBtn.addEventListener("click", () => {
    activeCategory = "all";
    renderCategoryTabs();
    renderConfigSections();
  });
  bar.appendChild(allBtn);

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-tab-btn" + (activeCategory === cat.key ? " active" : "");
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px">${cat.icon}</span><span>${cat.short}</span>`;
    btn.addEventListener("click", () => {
      activeCategory = cat.key;
      renderCategoryTabs();
      renderConfigSections();
    });
    bar.appendChild(btn);
  });
}

/* ───────────────────────── Render All 10 Hardware & Styling Sections ───────────────────────── */
function renderOptionCards(list, currentVal, onSelect, extraFn) {
  const grid = document.createElement("div");
  grid.className = "part-options-grid";
  list.forEach((item) => {
    const extra = extraFn ? extraFn(item) : {};
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "part-option-btn" +
      (currentVal === item.id ? " active" : "") +
      (extra.dimmed ? " dimmed" : "");
    btn.innerHTML = `
      <div class="part-opt-top">
        <span class="part-opt-name">${item.name}</span>
        ${extra.tag ? `<span class="part-opt-tag ${extra.tagClass || ""}">${extra.tag}</span>` : item.tag ? `<span class="part-opt-tag">${item.tag}</span>` : ""}
      </div>
      <div class="part-opt-spec">${extra.spec || ""}</div>
      ${item.price !== undefined ? `<div class="part-opt-price">${item.price === 0 ? "INCLUDED" : formatPrice(item.price)}</div>` : ""}
    `;
    btn.addEventListener("click", () => onSelect(item.id));
    grid.appendChild(btn);
  });
  return grid;
}

function renderSwatchSubcontrol(title, rightHint, list, currentVal, onSelect, { isHex = false } = {}) {
  const block = document.createElement("div");
  block.className = "subcontrol-block";
  block.innerHTML = `<div class="subcontrol-title"><span>${title}</span><span style="color:var(--text-muted)">${rightHint || ""}</span></div>`;
  const grid = document.createElement("div");
  grid.className = "swatch-grid";
  list.forEach((item) => {
    const val = isHex ? item.hex : item.id;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "swatch-chip" + (currentVal === val ? " active" : "");
    const bg = isHex ? item.hex : item.swatch;
    const priceTxt = item.price ? ` (+${formatPrice(item.price)})` : "";
    chip.innerHTML = `${bg ? `<span class="swatch-dot" style="background:${bg}"></span>` : ""}<span>${item.name}${priceTxt}</span>`;
    chip.addEventListener("click", () => onSelect(val));
    grid.appendChild(chip);
  });
  block.appendChild(grid);
  return block;
}

function renderConfigSections() {
  const container = document.getElementById("config-sections-container");
  if (!container || !scene) return;
  const st = scene.state;
  const cpuObj = LOOKUP.cpu[st.cpu] || CPUS[0];
  const analysis = analyzeBuild(st);

  container.innerHTML = "";
  const shouldShow = (cat) => activeCategory === "all" || activeCategory === cat;

  // 01 // PROCESSOR
  if (shouldShow("cpu")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "cpu");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">memory</span> 01 // PROCESSOR (${CPUS.length} MODELS)</div>
        <div class="filter-pills-row" id="cpu-filter-pills"></div>
      </div>
    `;
    const fRow = sec.querySelector("#cpu-filter-pills");
    [
      { id: "all", label: "All" },
      { id: "amd", label: "AMD AM5" },
      { id: "intel", label: "Intel Core" },
    ].forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pill-toggle-btn" + (cpuBrandFilter === f.id ? " active" : "");
      b.textContent = f.label;
      b.addEventListener("click", () => {
        cpuBrandFilter = f.id;
        renderConfigSections();
      });
      fRow.appendChild(b);
    });
    const list = cpuBrandFilter === "all" ? CPUS : CPUS.filter((c) => c.brand === cpuBrandFilter);
    sec.appendChild(
      renderOptionCards(
        list,
        st.cpu,
        (id) => setBuildOption("cpu", id),
        (c) => ({ spec: `${c.socket} · ${c.cores}C/${c.threads}T · ${c.boost} GHz · ${c.tdp}W` })
      )
    );
    container.appendChild(sec);
  }

  // 02 // MOTHERBOARD
  if (shouldShow("mobo")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "mobo");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">developer_board</span> 02 // MOTHERBOARD</div>
        <span class="brand-badge">CPU SOCKET: ${cpuObj.socket}</span>
      </div>
    `;
    sec.appendChild(
      renderOptionCards(
        MOBOS,
        st.mobo,
        (id) => setBuildOption("mobo", id),
        (m) => {
          const mismatch = m.socket !== cpuObj.socket;
          return {
            spec: `${m.socket} · ${m.feat}`,
            dimmed: mismatch,
            tag: mismatch ? `${m.socket} MISMATCH` : m.chipset,
            tagClass: mismatch ? "socket-mismatch" : "",
          };
        }
      )
    );
    container.appendChild(sec);
  }

  // 03 // CPU COOLER
  if (shouldShow("cooler")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "cooler");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">mode_fan</span> 03 // THERMAL COOLING</div>
        <span class="brand-badge">CPU TDP: ${cpuObj.tdp}W</span>
      </div>
    `;
    sec.appendChild(
      renderOptionCards(
        COOLERS,
        st.cooler,
        (id) => setBuildOption("cooler", id),
        (c) => ({ spec: `${c.feat} · Up to ${c.capacity}W TDP` })
      )
    );
    container.appendChild(sec);
  }

  // 04 // GRAPHICS CARD
  if (shouldShow("gpu")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "gpu");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">videogame_asset</span> 04 // GRAPHICS CARD (${GPUS.length} MODELS)</div>
        <div class="filter-pills-row" id="gpu-filter-pills"></div>
      </div>
    `;
    const fRow = sec.querySelector("#gpu-filter-pills");
    [
      { id: "all", label: "All" },
      { id: "nvidia", label: "NVIDIA RTX" },
      { id: "amd", label: "AMD RX" },
      { id: "intel", label: "Intel Arc" },
    ].forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pill-toggle-btn" + (gpuBrandFilter === f.id ? " active" : "");
      b.textContent = f.label;
      b.addEventListener("click", () => {
        gpuBrandFilter = f.id;
        renderConfigSections();
      });
      fRow.appendChild(b);
    });
    const list = gpuBrandFilter === "all" ? GPUS : GPUS.filter((g) => g.brand === gpuBrandFilter);
    sec.appendChild(
      renderOptionCards(
        list,
        st.gpu,
        (id) => setBuildOption("gpu", id),
        (g) => ({ spec: `${g.vram} · ${g.tbp}W TBP · ~${g.perf.cp} FPS 4K` })
      )
    );
    sec.appendChild(
      renderSwatchSubcontrol("GPU MOUNT ORIENTATION", "PCIe 5.0 / Riser", GPU_MOUNTS, st.gpuMount, (id) =>
        setBuildOption("gpuMount", id)
      )
    );
    sec.appendChild(
      renderSwatchSubcontrol("GPU SHROUD FINISH", "Independent from Case", GPU_FINISHES, st.gpuFinish, (id) =>
        setBuildOption("gpuFinish", id)
      )
    );
    container.appendChild(sec);
  }

  // 05 // MEMORY (RAM)
  if (shouldShow("ram")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "ram");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">memory_alt</span> 05 // DDR5 ARGB MEMORY</div>
        <span class="brand-badge">DUAL / QUAD DIMM</span>
      </div>
    `;
    sec.appendChild(
      renderOptionCards(
        RAMS,
        st.ram,
        (id) => setBuildOption("ram", id),
        (r) => ({ spec: `${r.size}GB Total · ${r.sticks} ARGB DIMMs Populated` })
      )
    );
    sec.appendChild(
      renderSwatchSubcontrol("RAM HEATSPREADER FINISH", "Anodized Aluminum", RAM_COLORS, st.ramColor, (id) =>
        setBuildOption("ramColor", id)
      )
    );
    container.appendChild(sec);
  }

  // 06 // STORAGE (NVMe SSD)
  if (shouldShow("ssd")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "ssd");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">hard_drive</span> 06 // M.2 NVMe STORAGE</div>
        <span class="brand-badge">PCIe GEN4 / GEN5</span>
      </div>
    `;
    sec.appendChild(
      renderOptionCards(
        SSDS,
        st.ssd,
        (id) => setBuildOption("ssd", id),
        (s) => ({ spec: `Read Speed up to ${s.speed} · CNC Heatsink` })
      )
    );
    container.appendChild(sec);
  }

  // 07 // POWER SUPPLY (PSU)
  if (shouldShow("psu")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "psu");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">power</span> 07 // MODULAR ATX 3.1 PSU</div>
        <span class="brand-badge">REC: ${analysis.recommended}W+</span>
      </div>
    `;
    sec.appendChild(
      renderOptionCards(
        PSUS,
        st.psu,
        (id) => setBuildOption("psu", id),
        (p) => {
          const tooWeak = p.watts < analysis.watts;
          return {
            spec: `80+ ${p.rating} · 12VHPWR Native · ${Math.round((p.watts / analysis.watts - 1) * 100)}% Headroom`,
            dimmed: tooWeak,
            tag: tooWeak ? "INSUFFICIENT" : p.watts >= analysis.recommended ? "OPTIMAL" : "",
            tagClass: tooWeak ? "socket-mismatch" : "",
          };
        }
      )
    );
    container.appendChild(sec);
  }

  // 08 // CASE & TEMPERED GLASS
  if (shouldShow("case")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "case");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">desktop_windows</span> 08 // DUAL-CHAMBER CHASSIS &amp; GLASS</div>
        <span class="brand-badge">5 FINISHES · 3 GLASS TINTS</span>
      </div>
    `;
    sec.appendChild(
      renderSwatchSubcontrol("CHASSIS FINISH", "Includes Case Price", THEMES, st.theme, (id) =>
        setBuildOption("theme", id)
      )
    );
    sec.appendChild(
      renderSwatchSubcontrol("TEMPERED GLASS TINT", "4mm Beveled Edge", GLASS, st.glass, (id) =>
        setBuildOption("glass", id)
      )
    );
    container.appendChild(sec);
  }

  // 09 // CUSTOM STYLING & CABLES
  if (shouldShow("style")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "style");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">palette</span> 09 // BRAIDED CABLES &amp; ACCENTS</div>
        <span class="brand-badge">24-PIN + EPS + 12VHPWR</span>
      </div>
    `;
    sec.appendChild(
      renderSwatchSubcontrol("SLEEVED POWER CABLES", "With Acrylic Combs", CABLES, st.cables, (id) =>
        setBuildOption("cables", id)
      )
    );
    if (activeCategory === "style") {
      sec.appendChild(
        renderSwatchSubcontrol("GPU MOUNT & SHROUD", "Showcase Angle", GPU_MOUNTS, st.gpuMount, (id) =>
          setBuildOption("gpuMount", id)
        )
      );
      sec.appendChild(
        renderSwatchSubcontrol("GPU SHROUD FINISH", "Matched Accent", GPU_FINISHES, st.gpuFinish, (id) =>
          setBuildOption("gpuFinish", id)
        )
      );
      sec.appendChild(
        renderSwatchSubcontrol("RAM HEATSPREADER", "Matched Accent", RAM_COLORS, st.ramColor, (id) =>
          setBuildOption("ramColor", id)
        )
      );
    }
    container.appendChild(sec);
  }

  // 10 // RGB LIGHTING & FAN ACOUSTICS
  if (shouldShow("lighting")) {
    const sec = document.createElement("div");
    sec.className = "config-panel-box";
    sec.setAttribute("data-config-section", "lighting");
    sec.innerHTML = `
      <div class="config-panel-header">
        <div class="config-label"><span class="material-symbols-outlined" style="font-size:16px">light_mode</span> 10 // ARGB LIGHTING &amp; FAN CURVE</div>
        <span class="brand-badge">REAL-TIME BLOOM</span>
      </div>
    `;
    sec.appendChild(
      renderSwatchSubcontrol("ARGB COLOR PRESET", st.rgb, RGB_COLORS, st.rgb, (hex) => setBuildOption("rgb", hex, { focus: false }), {
        isHex: true,
      })
    );
    sec.appendChild(
      renderSwatchSubcontrol("LIGHTING EFFECT MODE", "Syncs Case, AIO & Pedestal", RGB_MODES, st.rgbMode, (id) =>
        setBuildOption("rgbMode", id, { focus: false })
      )
    );

    const brightBlock = document.createElement("div");
    brightBlock.className = "subcontrol-block";
    brightBlock.innerHTML = `
      <div class="subcontrol-title">
        <span>LED BRIGHTNESS</span>
        <span id="rgb-bright-val">${Math.round((st.brightness ?? 1) * 100)}%</span>
      </div>
      <input id="rgb-bright-slider" type="range" class="range-slider" min="0.2" max="1.4" step="0.05" value="${st.brightness ?? 1}" />
    `;
    const slider = brightBlock.querySelector("#rgb-bright-slider");
    const valLbl = brightBlock.querySelector("#rgb-bright-val");
    slider.addEventListener("input", () => {
      pauseCountdown();
      const v = parseFloat(slider.value);
      scene.state.brightness = v;
      valLbl.textContent = `${Math.round(v * 100)}%`;
    });
    sec.appendChild(brightBlock);

    sec.appendChild(
      renderSwatchSubcontrol("PWM FAN ACOUSTIC PROFILE", "Affects RPM & Thermals", FAN_PROFILES, st.fan, (id) =>
        setBuildOption("fan", id, { focus: false })
      )
    );

    container.appendChild(sec);
  }
}

/* ───────────────────────── Summary, Compatibility, FPS & BOM ───────────────────────── */
function renderAnalysis() {
  if (!scene) return;
  const st = scene.state;
  const a = analyzeBuild(st);

  // Update 3D telemetry monitor
  scene.updateBench({ cp: a.fps.cp, aaa: a.fps.aaa, esp: a.fps.esp, watts: a.watts });

  // Summary card
  const priceEl = document.getElementById("summary-total-price");
  const wattsEl = document.getElementById("summary-wattage-chip");
  const scoreEl = document.getElementById("summary-score-chip");
  const compatEl = document.getElementById("summary-compat-chip");

  if (priceEl) priceEl.textContent = formatPrice(a.total);
  if (wattsEl) {
    wattsEl.textContent = `${a.watts}W / ${a.psu.watts}W PSU`;
    wattsEl.className = "stat-chip " + (a.psu.watts < a.watts ? "err" : a.headroom < 1.25 ? "warn" : "ok");
  }
  if (scoreEl) scoreEl.textContent = `RIG SCORE: ${a.score}/100`;

  const hasErr = a.issues.some((i) => i.level === "error");
  const hasWarn = a.issues.some((i) => i.level === "warn");
  if (compatEl) {
    if (hasErr) {
      compatEl.textContent = "COMPATIBILITY ERROR";
      compatEl.className = "stat-chip err";
    } else if (hasWarn) {
      compatEl.textContent = "ADVISORY WARNING";
      compatEl.className = "stat-chip warn";
    } else {
      compatEl.textContent = "100% COMPATIBLE";
      compatEl.className = "stat-chip ok";
    }
  }

  // Compatibility alert items + 1-click Auto-Fix
  const alertsBox = document.getElementById("compat-alerts-box");
  if (alertsBox) {
    alertsBox.innerHTML = "";
    a.issues.forEach((iss) => {
      const row = document.createElement("div");
      row.className = `compat-alert ${iss.level}`;
      row.innerHTML = `<span>${iss.text}</span>`;

      if (iss.cat === "mobo" || iss.cat === "psu" || iss.cat === "cooler") {
        const fixBtn = document.createElement("button");
        fixBtn.type = "button";
        fixBtn.className = "compat-fix-btn";
        fixBtn.textContent = "AUTO-FIX";
        fixBtn.addEventListener("click", () => {
          if (iss.cat === "mobo") {
            const match = MOBOS.find((m) => m.socket === a.cpu.socket);
            if (match) setBuildOption("mobo", match.id);
          } else if (iss.cat === "psu") {
            const match = PSUS.find((p) => p.watts >= a.recommended) || PSUS[PSUS.length - 1];
            setBuildOption("psu", match.id);
          } else if (iss.cat === "cooler") {
            setBuildOption("cooler", "aio360");
          }
        });
        row.appendChild(fixBtn);
      }
      alertsBox.appendChild(row);
    });
  }

  // Live 3-Game FPS Bars
  const cpVal = document.getElementById("fps-cp2077-val");
  const cpBar = document.getElementById("fps-cp2077-bar");
  const aaaVal = document.getElementById("fps-aaa-val");
  const aaaBar = document.getElementById("fps-aaa-bar");
  const espVal = document.getElementById("fps-cs2-val");
  const espBar = document.getElementById("fps-cs2-bar");

  if (cpVal) cpVal.textContent = `${a.fps.cp} FPS (4K RT)`;
  if (cpBar) cpBar.style.width = `${Math.min(100, Math.round((a.fps.cp / 180) * 100))}%`;
  if (aaaVal) aaaVal.textContent = `${a.fps.aaa} FPS (1440p)`;
  if (aaaBar) aaaBar.style.width = `${Math.min(100, Math.round((a.fps.aaa / 250) * 100))}%`;
  if (espVal) espVal.textContent = `${a.fps.esp} FPS (1080p)`;
  if (espBar) espBar.style.width = `${Math.min(100, Math.round((a.fps.esp / 740) * 100))}%`;

  // BOM Itemized List
  const bomList = document.getElementById("bom-list");
  if (bomList) {
    bomList.innerHTML = "";
    a.lines.forEach((l) => {
      const row = document.createElement("div");
      row.className = "bom-row";
      row.innerHTML = `
        <div class="bom-row-left">
          <span class="bom-row-cat">${l.label.toUpperCase()}</span>
          <span class="bom-row-name">${l.name}</span>
        </div>
        <span class="bom-row-price">${formatPrice(l.price)}</span>
      `;
      bomList.appendChild(row);
    });
  }
}

function syncViewportRgbBar() {
  if (!scene) return;
  document.querySelectorAll("[data-rgb]").forEach((s) => {
    const val = s.getAttribute("data-rgb");
    const isMatch = val === "rainbow" ? scene.state.rgbMode === "wave" : scene.state.rgbMode !== "wave" && scene.state.rgb === val;
    s.classList.toggle("active", isMatch);
  });
}

function syncViewToggleButtons() {
  if (!scene) return;
  const st = scene.state;
  document.getElementById("btn-toggle-exploded")?.classList.toggle("active", !!st.exploded);
  document.getElementById("btn-toggle-glass")?.classList.toggle("active", !!st.glassOpen);
  document.getElementById("btn-toggle-airflow")?.classList.toggle("active", !!st.airflow);
  document.getElementById("btn-autorotate-cam")?.classList.toggle("active", !!st.autoRotate);
  document.getElementById("btn-toggle-pins")?.classList.toggle("active", !!st.pins);
  const pBtn = document.getElementById("btn-toggle-power");
  if (pBtn) {
    pBtn.classList.toggle("active", !!st.powerOn);
    pBtn.textContent = st.powerOn ? "⚡ POWER: ON" : "⚡ POWER: STANDBY";
  }
}

function refreshAllUI() {
  renderPresets();
  renderConfigSections();
  renderAnalysis();
  syncViewportRgbBar();
  syncViewToggleButtons();
}

/* ───────────────────────── 8-Step Physical Assembly Wizard ───────────────────────── */
const STEP_DESCRIPTIONS = {
  1: "Step 1/8 · Dual-Chamber Showcase Chassis & ARGB Fans Mounted",
  2: "Step 2/8 · ATX Hydro Motherboard Mounted on Brass Standoffs",
  3: "Step 3/8 · Processor Seated & LGA Zero-Insertion Socket Locked",
  4: "Step 4/8 · PCIe NVMe M.2 SSD & Aluminum Thermal Guard Installed",
  5: "Step 5/8 · DDR5 ARGB Memory Modules Seated in Dual/Quad Slots",
  6: "Step 6/8 · Thermal Cooling Loop / Dual-Tower Cooler Mounted",
  7: "Step 7/8 · Graphics Accelerator Seated & 12VHPWR Connected",
  8: "Step 8/8 · Modular PSU Connected & System Powered ON (Click Any 3D Part)",
};

const stepStatusBadge = document.getElementById("builder-step-status");
const stepPills = document.querySelectorAll("[data-build-step]");

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
  pauseCountdown();
  if (autoBuildTimer) {
    clearInterval(autoBuildTimer);
    autoBuildTimer = null;
    const autoBtn = document.getElementById("btn-auto-build");
    if (autoBtn) autoBtn.textContent = "▶ AUTO-BUILD";
  }
  const clamped = Math.max(1, Math.min(8, step));
  if (scene) scene.setBuildStep(clamped, { focus: true });
  syncStepPills(clamped);
  sfx.tone(420 + clamped * 45, 640 + clamped * 55, 0.14);
}

stepPills.forEach((pill) => {
  pill.addEventListener("click", () => goToStep(parseInt(pill.getAttribute("data-build-step"), 10)));
});

document.getElementById("btn-prev-step")?.addEventListener("click", () => {
  const cur = (scene && scene.state.buildStep) || 8;
  goToStep(cur <= 1 ? 8 : cur - 1);
});

document.getElementById("btn-next-step")?.addEventListener("click", () => {
  const cur = (scene && scene.state.buildStep) || 8;
  goToStep(cur >= 8 ? 1 : cur + 1);
});

const autoBuildBtn = document.getElementById("btn-auto-build");
autoBuildBtn?.addEventListener("click", () => {
  pauseCountdown();
  if (autoBuildTimer) {
    clearInterval(autoBuildTimer);
    autoBuildTimer = null;
    autoBuildBtn.textContent = "▶ AUTO-BUILD";
    return;
  }
  let cur = 1;
  autoBuildBtn.textContent = "⏹ STOP BUILD";
  if (scene) scene.setBuildStep(cur, { focus: true });
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
    if (scene) scene.setBuildStep(cur, { focus: true });
    syncStepPills(cur);
    sfx.tone(420 + cur * 50, 680 + cur * 60, 0.14);
  }, 1350);
});

/* ───────────────────────── Environment & Quality Controls ───────────────────────── */
document.querySelectorAll("[data-env]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const env = btn.getAttribute("data-env");
    document.querySelectorAll("[data-env]").forEach((b) => b.classList.toggle("active", b === btn));
    if (scene) scene.setEnvironment(env);
    sfx.tone(460, 760, 0.1);
  });
});

function syncQualityButtons(q) {
  document.querySelectorAll("[data-quality]").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-quality") === q);
  });
}

document.querySelectorAll("[data-quality]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const q = btn.getAttribute("data-quality");
    syncQualityButtons(q);
    if (scene) scene.setQuality(q);
    sfx.tone(520, 820, 0.1);
    showToast(`Graphics Quality: ${q.toUpperCase()}`);
  });
});

/* ───────────────────────── Camera Presets & Viewport Actions ───────────────────────── */
document.querySelectorAll("[data-cam-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pauseCountdown();
    document.querySelectorAll("[data-cam-preset]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const preset = btn.getAttribute("data-cam-preset");
    const quickCat = btn.getAttribute("data-quick-cat");
    if (scene) scene.focusPreset(preset);
    if (quickCat) openQuickSwapForCategory(quickCat);
    sfx.tone(460, 700, 0.1);
  });
});

document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
  scene?.zoom(0.84);
  sfx.tone(520, 740, 0.08);
});
document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
  scene?.zoom(1.18);
  sfx.tone(480, 620, 0.08);
});
document.getElementById("btn-reset-cam")?.addEventListener("click", () => {
  scene?.focusPreset("full");
  quickSwapDrawer?.classList.remove("visible");
  sfx.tone(440, 720, 0.1);
});
document.getElementById("btn-autorotate-cam")?.addEventListener("click", () => {
  scene?.toggleAutoRotate();
  syncViewToggleButtons();
  sfx.tone(480, 720, 0.08);
});
document.getElementById("btn-toggle-pins")?.addEventListener("click", () => {
  scene?.togglePins();
  syncViewToggleButtons();
  sfx.tone(500, 740, 0.08);
});

const stageCard = document.getElementById("builder-stage-card");
document.getElementById("btn-fullscreen-3d")?.addEventListener("click", () => {
  stageCard?.classList.toggle("fullscreen-3d");
  window.dispatchEvent(new Event("resize"));
  sfx.tone(500, 850, 0.12);
});

function capturePngSnapshot() {
  if (!scene) return;
  const dataUrl = scene.snapshot();
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `aqua-pc-3d-build-${Date.now()}.png`;
  a.click();
  sfx.tone(620, 960, 0.15);
  showToast("Saved 3D Build Snapshot (PNG)");
}
document.getElementById("btn-snapshot-3d")?.addEventListener("click", capturePngSnapshot);
document.getElementById("btn-snapshot-build")?.addEventListener("click", capturePngSnapshot);

document.getElementById("btn-toggle-exploded")?.addEventListener("click", () => {
  scene?.toggleExploded();
  syncViewToggleButtons();
  sfx.tone(420, 740, 0.14);
});
document.getElementById("btn-toggle-glass")?.addEventListener("click", () => {
  scene?.toggleGlass();
  syncViewToggleButtons();
  sfx.tone(480, 680, 0.12);
});
document.getElementById("btn-toggle-airflow")?.addEventListener("click", () => {
  scene?.toggleAirflow();
  syncViewToggleButtons();
  sfx.tone(540, 840, 0.12);
});
document.getElementById("btn-toggle-power")?.addEventListener("click", () => {
  const on = scene?.togglePower();
  syncViewToggleButtons();
  sfx.tone(on ? 320 : 680, on ? 780 : 260, 0.18);
});

document.querySelectorAll("[data-rgb]").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const val = swatch.getAttribute("data-rgb");
    if (val === "rainbow") setBuildOption("rgbMode", "wave", { focus: false });
    else setBuildOption("rgb", val, { focus: false });
  });
});

/* ───────────────────────── BOM, Share & WhatsApp Order ───────────────────────── */
document.getElementById("bom-toggle-btn")?.addEventListener("click", () => {
  bomOpen = !bomOpen;
  document.getElementById("bom-list")?.classList.toggle("collapsed", !bomOpen);
  const icon = document.getElementById("bom-chevron");
  if (icon) icon.textContent = bomOpen ? "expand_less" : "expand_more";
});

document.getElementById("btn-share-build")?.addEventListener("click", async () => {
  if (!scene) return;
  const url = encodeShareUrl(scene.state);
  window.history.replaceState(null, "", url);
  try {
    await navigator.clipboard.writeText(url);
    showToast("Copied Custom 3D Build Share Link to Clipboard!");
  } catch {
    showToast("Build URL updated in address bar!");
  }
  sfx.tone(560, 880, 0.14);
});

document.getElementById("btn-whatsapp-build")?.addEventListener("click", () => {
  if (!scene) return;
  const st = scene.state;
  const a = analyzeBuild(st);
  const msg = [
    "Hello Aqua PC Solutions! I built this custom 3D PC on your Building Bay Home Page:",
    `• Processor: ${a.cpu.name}`,
    `• Motherboard: ${a.mobo.name}`,
    `• Cooling: ${a.cooler.name}`,
    `• Graphics Card: ${a.gpu.name} ${a.gpu.vram} (${st.gpuMount} mount, ${st.gpuFinish})`,
    `• Memory: ${a.ram.name} (${st.ramColor})`,
    `• Storage: ${a.ssd.name}`,
    `• Power Supply: ${a.psu.name}`,
    `• Case & Glass: ${a.theme.name} / ${st.glass} glass / ${st.cables} cables`,
    `• Estimated Total (incl. Assembly & 6M Warranty): ${formatPrice(a.total)}`,
  ].join("\n");

  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

/* ───────────────────────── Sound & Countdown Wiring ───────────────────────── */
const sfxBtn = document.getElementById("sfx-toggle-btn");
sfxBtn?.addEventListener("click", () => {
  const on = sfx.toggle();
  sfxBtn.classList.toggle("active", on);
  const icon = sfxBtn.querySelector(".material-symbols-outlined");
  if (icon) icon.textContent = on ? "volume_up" : "volume_off";
});

document.getElementById("toggle-countdown-btn")?.addEventListener("click", () => {
  countdownPaused = !countdownPaused;
  sfx.tone(440, 660, 0.1);
  updateCountdownUI();
});

setInterval(() => {
  if (countdownPaused || isRedirecting) return;
  remainingSec = Math.max(0, remainingSec - 1);
  updateCountdownUI();
  if (remainingSec === 0) triggerPortalRedirect("/");
}, 1000);

/* ───────────────────────── Live Thermal Telemetry Ticker ───────────────────────── */
const thermalsTextEl = document.getElementById("live-thermals-text");
setInterval(() => {
  if (!scene || !thermalsTextEl) return;
  const { cpu, gpu } = scene.getTemps();
  thermalsTextEl.textContent = `CPU ${Math.round(cpu)}°C · GPU ${Math.round(gpu)}°C · ${(scene.state.fan || "balanced").toUpperCase()}`;
}, 500);

/* ───────────────────────── Initial Hydration ───────────────────────── */
updateCountdownUI();
renderCategoryTabs();
refreshAllUI();
syncStepPills(8);

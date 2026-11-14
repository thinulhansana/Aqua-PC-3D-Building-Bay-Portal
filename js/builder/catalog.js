/* ==========================================================================
   AQUA PC SOLUTIONS — 3D PC BUILDER PARTS CATALOG
   Prices are INDICATIVE (LKR) for the on-screen estimate only.
   Edit this file to update stock, prices or add new parts.
   ========================================================================== */

export const CURRENCY = "LKR";
export const ASSEMBLY_FEE = 15000; // Lab assembly, cable management, 24h stress test

export const CATEGORIES = [
  { key: "cpu", label: "Processor", short: "CPU", icon: "memory", step: 3 },
  { key: "mobo", label: "Motherboard", short: "Board", icon: "developer_board", step: 2 },
  { key: "cooler", label: "CPU Cooler", short: "Cooler", icon: "mode_fan", step: 6 },
  { key: "gpu", label: "Graphics Card", short: "GPU", icon: "videogame_asset", step: 7 },
  { key: "ram", label: "Memory", short: "RAM", icon: "memory_alt", step: 5 },
  { key: "ssd", label: "Storage", short: "SSD", icon: "hard_drive", step: 4 },
  { key: "psu", label: "Power Supply", short: "PSU", icon: "power", step: 8 },
  { key: "case", label: "Case & Glass", short: "Case", icon: "desktop_windows", step: 1 },
  { key: "style", label: "Styling", short: "Style", icon: "palette", step: 8 },
  { key: "lighting", label: "RGB & Fans", short: "RGB", icon: "light_mode", step: 8 },
];

/* ───────────────────────── Processors ───────────────────────── */
export const CPUS = [
  {
    id: "r7-9800x3d", name: "AMD Ryzen 7 9800X3D", brand: "amd", socket: "AM5",
    cores: 8, threads: 16, boost: 5.2, tdp: 120, game: 1.1, mt: 0.64, price: 168000,
    ihs: ["AMD RYZEN™ 7", "9800X3D"], tag: "Fastest Gaming CPU",
  },
  {
    id: "r9-9950x3d", name: "AMD Ryzen 9 9950X3D", brand: "amd", socket: "AM5",
    cores: 16, threads: 32, boost: 5.7, tdp: 170, game: 1.09, mt: 1.12, price: 248000,
    ihs: ["AMD RYZEN™ 9", "9950X3D"], tag: "Gaming + Creator",
  },
  {
    id: "ryzen-7950x3d", name: "AMD Ryzen 9 7950X3D", brand: "amd", socket: "AM5",
    cores: 16, threads: 32, boost: 5.7, tdp: 120, game: 1.03, mt: 1.0, price: 192000,
    ihs: ["AMD RYZEN™ 9", "7950X3D"],
  },
  {
    id: "ryzen-7800x3d", name: "AMD Ryzen 7 7800X3D", brand: "amd", socket: "AM5",
    cores: 8, threads: 16, boost: 5.0, tdp: 120, game: 1.0, mt: 0.56, price: 128000,
    ihs: ["AMD RYZEN™ 7", "7800X3D"], tag: "Best Value Gaming",
  },
  {
    id: "r5-7600x", name: "AMD Ryzen 5 7600X", brand: "amd", socket: "AM5",
    cores: 6, threads: 12, boost: 5.3, tdp: 105, game: 0.86, mt: 0.42, price: 64000,
    ihs: ["AMD RYZEN™ 5", "7600X"], tag: "Budget King",
  },
  {
    id: "ultra9-285k", name: "Intel Core Ultra 9 285K", brand: "intel", socket: "LGA1851",
    cores: 24, threads: 24, boost: 5.7, tdp: 250, game: 0.97, mt: 1.1, price: 218000,
    ihs: ["INTEL® CORE™", "ULTRA 9 285K"], tag: "Newest Intel",
  },
  {
    id: "i9-14900k", name: "Intel Core i9-14900K", brand: "intel", socket: "LGA1700",
    cores: 24, threads: 32, boost: 6.0, tdp: 253, game: 1.0, mt: 1.0, price: 186000,
    ihs: ["INTEL® CORE™", "i9-14900K"],
  },
  {
    id: "i7-14700k", name: "Intel Core i7-14700K", brand: "intel", socket: "LGA1700",
    cores: 20, threads: 28, boost: 5.6, tdp: 253, game: 0.95, mt: 0.87, price: 136000,
    ihs: ["INTEL® CORE™", "i7-14700K"],
  },
  {
    id: "i5-14600k", name: "Intel Core i5-14600K", brand: "intel", socket: "LGA1700",
    cores: 14, threads: 20, boost: 5.3, tdp: 181, game: 0.9, mt: 0.62, price: 96000,
    ihs: ["INTEL® CORE™", "i5-14600K"],
  },
];

/* ───────────────────────── Motherboards ───────────────────────── */
export const MOBOS = [
  { id: "x870e-hydro", name: "Aqua Hydro X870E WiFi 7", socket: "AM5", chipset: "X870E", price: 142000, feat: "PCIe 5.0 · USB4 · 20+2 VRM" },
  { id: "x670e-pro", name: "Aqua X670E Pro WiFi", socket: "AM5", chipset: "X670E", price: 106000, feat: "PCIe 5.0 · 18+2 VRM" },
  { id: "b650e-gaming", name: "Aqua B650E Gaming WiFi", socket: "AM5", chipset: "B650E", price: 69000, feat: "PCIe 5.0 GPU · 14+2 VRM" },
  { id: "z890-hydro", name: "Aqua Hydro Z890 Extreme", socket: "LGA1851", chipset: "Z890", price: 138000, feat: "Thunderbolt 5 · WiFi 7" },
  { id: "z790-hydro", name: "Aqua Hydro Z790 WiFi 7", socket: "LGA1700", chipset: "Z790", price: 112000, feat: "PCIe 5.0 · 20+1 VRM" },
  { id: "b760-gaming", name: "Aqua B760 Gaming WiFi", socket: "LGA1700", chipset: "B760", price: 63000, feat: "DDR5 · 12+1 VRM" },
];

/* ───────────────────────── CPU Coolers ───────────────────────── */
export const COOLERS = [
  { id: "aio360", name: "Aqua Hydro 360mm LCD AIO", capacity: 320, price: 58000, feat: "Triple 120mm ARGB · 2.1\" Live LCD" },
  { id: "aio240", name: "Aqua Hydro 240mm LCD AIO", capacity: 250, price: 39000, feat: "Dual 120mm ARGB · Braided Loop" },
  { id: "air", name: "Aqua Dual-Tower 6-Heatpipe Air", capacity: 220, price: 22000, feat: "Nickel Copper Pipes · Silent 120mm" },
];

/* ───────────────────────── Graphics Cards ─────────────────────────
   perf: cp = Cyberpunk 2077 4K RT (upscaling), aaa = AAA 1440p Ultra,
         esp = CS2 / Valorant 1080p competitive
   dims: 3D model size (L length, H height, T thickness, fans)           */
export const GPUS = [
  {
    id: "rtx5090", name: "NVIDIA GeForce RTX 5090", brand: "nvidia", vram: "32GB GDDR7", tbp: 575, price: 1150000,
    perf: { cp: 176, aaa: 245, esp: 730 }, dims: { L: 3.45, H: 1.46, T: 0.72, fans: 3, label: "RTX 5090" }, tag: "Ultimate 4K",
  },
  {
    id: "rtx5080", name: "NVIDIA GeForce RTX 5080", brand: "nvidia", vram: "16GB GDDR7", tbp: 360, price: 525000,
    perf: { cp: 126, aaa: 202, esp: 650 }, dims: { L: 3.3, H: 1.38, T: 0.64, fans: 3, label: "RTX 5080" },
  },
  {
    id: "rtx5070ti", name: "NVIDIA GeForce RTX 5070 Ti", brand: "nvidia", vram: "16GB GDDR7", tbp: 300, price: 335000,
    perf: { cp: 101, aaa: 176, esp: 590 }, dims: { L: 3.1, H: 1.3, T: 0.6, fans: 3, label: "RTX 5070 Ti" }, tag: "Sweet Spot",
  },
  {
    id: "rtx4090", name: "NVIDIA GeForce RTX 4090", brand: "nvidia", vram: "24GB GDDR6X", tbp: 450, price: 820000,
    perf: { cp: 138, aaa: 215, esp: 660 }, dims: null,
  },
  {
    id: "rtx4080s", name: "NVIDIA RTX 4080 SUPER", brand: "nvidia", vram: "16GB GDDR6X", tbp: 320, price: 405000,
    perf: { cp: 108, aaa: 186, esp: 605 }, dims: null,
  },
  {
    id: "rtx4070s", name: "NVIDIA RTX 4070 SUPER", brand: "nvidia", vram: "12GB GDDR6X", tbp: 220, price: 232000,
    perf: { cp: 86, aaa: 156, esp: 525 }, dims: null,
  },
  {
    id: "rtx4060", name: "NVIDIA GeForce RTX 4060", brand: "nvidia", vram: "8GB GDDR6", tbp: 115, price: 112000,
    perf: { cp: 52, aaa: 104, esp: 410 }, dims: null, tag: "1080p Starter",
  },
  {
    id: "rx9070xt", name: "AMD Radeon RX 9070 XT", brand: "amd", vram: "16GB GDDR6", tbp: 304, price: 258000,
    perf: { cp: 93, aaa: 171, esp: 565 }, dims: { L: 3.05, H: 1.3, T: 0.58, fans: 3, label: "RX 9070 XT" }, tag: "Best Value",
  },
  {
    id: "rx7900xtx", name: "AMD Radeon RX 7900 XTX", brand: "amd", vram: "24GB GDDR6", tbp: 355, price: 385000,
    perf: { cp: 95, aaa: 182, esp: 600 }, dims: { L: 3.25, H: 1.38, T: 0.66, fans: 3, label: "RX 7900 XTX" },
  },
  {
    id: "rx7800xt", name: "AMD Radeon RX 7800 XT", brand: "amd", vram: "16GB GDDR6", tbp: 263, price: 186000,
    perf: { cp: 72, aaa: 141, esp: 485 }, dims: null,
  },
  {
    id: "arc-b580", name: "Intel Arc B580", brand: "intel", vram: "12GB GDDR6", tbp: 190, price: 92000,
    perf: { cp: 46, aaa: 96, esp: 365 }, dims: { L: 2.55, H: 1.18, T: 0.45, fans: 2, label: "ARC B580" },
  },
];

/* ───────────────────────── Memory ───────────────────────── */
export const RAMS = [
  { id: "32gb-2x16", name: "32GB (2×16GB) DDR5-6000 CL30", sticks: 2, size: 32, price: 39000, boost: 1.0, tag: "Gaming Sweet Spot" },
  { id: "48gb-2x24", name: "48GB (2×24GB) DDR5-7200 CL34", sticks: 2, size: 48, price: 59000, boost: 1.02 },
  { id: "64gb-4x16", name: "64GB (4×16GB) DDR5-6400 CL32", sticks: 4, size: 64, price: 79000, boost: 1.01 },
  { id: "96gb-2x48", name: "96GB (2×48GB) DDR5-6400 CL32", sticks: 2, size: 96, price: 99000, boost: 1.01 },
  { id: "128gb-4x32", name: "128GB (4×32GB) DDR5-5600 CL40", sticks: 4, size: 128, price: 136000, boost: 0.99, tag: "AI / 3D Workstation" },
];

/* ───────────────────────── Storage ───────────────────────── */
export const SSDS = [
  { id: "1tb-gen4", name: "Aqua 1TB NVMe Gen4", speed: "7,000 MB/s", label: "AQUA 1TB GEN4", price: 28000 },
  { id: "2tb-gen4", name: "Aqua 2TB NVMe Gen4 Pro", speed: "7,450 MB/s", label: "AQUA 2TB PRO", price: 48000 },
  { id: "2tb-gen5", name: "Aqua 2TB NVMe Gen5", speed: "12,400 MB/s", label: "AQUA 2TB GEN5", price: 79000 },
  { id: "4tb-gen5", name: "Aqua 4TB NVMe Gen5 Extreme", speed: "14,500 MB/s", label: "AQUA 4TB GEN5", price: 138000 },
  { id: "8tb-gen4", name: "Aqua 8TB NVMe Gen4 Vault", speed: "7,000 MB/s", label: "AQUA 8TB VAULT", price: 182000 },
];

/* ───────────────────────── Power Supplies ───────────────────────── */
export const PSUS = [
  { id: "750w", name: "Aqua 750W 80+ Gold", watts: 750, rating: "GOLD", price: 33000 },
  { id: "850w", name: "Aqua 850W 80+ Gold", watts: 850, rating: "GOLD", price: 41000 },
  { id: "1000w", name: "Aqua 1000W 80+ Platinum", watts: 1000, rating: "PLATINUM", price: 63000 },
  { id: "1200w", name: "Aqua 1200W 80+ Titanium", watts: 1200, rating: "TITANIUM", price: 89000 },
  { id: "1600w", name: "Aqua 1600W 80+ Titanium", watts: 1600, rating: "TITANIUM", price: 136000 },
];

/* ───────────────────────── Case finishes ───────────────────────── */
export const THEMES = [
  { id: "black", name: "Obsidian Black", swatch: "#0b0e14", price: 46000 },
  { id: "white", name: "Glacier White", swatch: "#e6ebf0", price: 48000 },
  { id: "gunmetal", name: "Gunmetal Titanium", swatch: "#4a505a", price: 48000 },
  { id: "midnight", name: "Midnight Blue", swatch: "#14254a", price: 48000 },
  { id: "sakura", name: "Sakura Pink", swatch: "#f2c4d2", price: 52000 },
];

export const GLASS = [
  { id: "clear", name: "Crystal Clear Glass", swatch: "linear-gradient(135deg,#e0f7ff55,#ffffff22)" },
  { id: "smoked", name: "Smoked Tint Glass", swatch: "linear-gradient(135deg,#1f2937,#0b1220)" },
  { id: "bronze", name: "Bronze Tint Glass", swatch: "linear-gradient(135deg,#7c5a2c,#3b2a14)" },
];

export const GPU_FINISHES = [
  { id: "stealth", name: "Stealth Black", swatch: "#181c24" },
  { id: "silver", name: "Founders Silver", swatch: "#b8c0cc" },
  { id: "white", name: "Arctic White", swatch: "#eef2f6" },
];

export const GPU_MOUNTS = [
  { id: "horizontal", name: "Horizontal PCIe Slot" },
  { id: "vertical", name: "Vertical Showcase (Riser)" },
];

export const RAM_COLORS = [
  { id: "black", name: "Black Heatspreader", swatch: "#202630" },
  { id: "white", name: "White Heatspreader", swatch: "#e5e9ef" },
  { id: "silver", name: "Brushed Silver", swatch: "#aeb6c2" },
  { id: "gold", name: "Champagne Gold", swatch: "#c9a45c" },
];

export const CABLES = [
  { id: "black", name: "Stock Black", swatch: "#222730", price: 0 },
  { id: "white", name: "Custom White Sleeved", swatch: "#f1f5f9", price: 12000 },
  { id: "aqua", name: "Custom Aqua Sleeved", swatch: "#00c6d4", price: 12000 },
  { id: "crimson", name: "Custom Crimson Sleeved", swatch: "#d01c3c", price: 12000 },
  { id: "violet", name: "Custom Violet Sleeved", swatch: "#8b5cf6", price: 12000 },
];

export const RGB_COLORS = [
  { hex: "#00f2fe", name: "Aqua Cyan" },
  { hex: "#3b82f6", name: "Cobalt Blue" },
  { hex: "#10b981", name: "Cryo Emerald" },
  { hex: "#a855f7", name: "Ultraviolet" },
  { hex: "#ec4899", name: "Sakura Pink" },
  { hex: "#f43f5e", name: "Cyber Crimson" },
  { hex: "#f59e0b", name: "Solar Amber" },
  { hex: "#e2e8f0", name: "Ice White" },
];

export const RGB_MODES = [
  { id: "static", name: "Static" },
  { id: "breathing", name: "Breathing" },
  { id: "wave", name: "Rainbow Wave" },
  { id: "spectrum", name: "Spectrum Cycle" },
  { id: "off", name: "Lights Off" },
];

export const FAN_PROFILES = [
  { id: "silent", name: "Silent", value: 0.3 },
  { id: "balanced", name: "Balanced", value: 0.6 },
  { id: "turbo", name: "Turbo", value: 1.0 },
];

export const ENVIRONMENTS = [
  { id: "showroom", name: "Showroom", icon: "museum" },
  { id: "lab", name: "ESD Lab Bay", icon: "construction" },
  { id: "void", name: "Studio Void", icon: "dark_mode" },
];

/* ───────────────────────── Default build & presets ───────────────────────── */
export const DEFAULT_BUILD = {
  cpu: "r7-9800x3d",
  mobo: "x870e-hydro",
  cooler: "aio360",
  gpu: "rtx5080",
  gpuMount: "horizontal",
  gpuFinish: "stealth",
  ram: "64gb-4x16",
  ramColor: "black",
  ssd: "2tb-gen5",
  psu: "1000w",
  theme: "black",
  glass: "clear",
  cables: "black",
  rgb: "#00f2fe",
  rgbMode: "static",
  brightness: 1,
  fan: "balanced",
};

export const PRESETS = [
  {
    id: "flagship", name: "Ultimate 4K Flagship", icon: "bolt", sub: "9950X3D · RTX 5090 · 360mm LCD",
    build: { cpu: "r9-9950x3d", mobo: "x870e-hydro", cooler: "aio360", gpu: "rtx5090", gpuMount: "horizontal", gpuFinish: "stealth", ram: "64gb-4x16", ramColor: "black", ssd: "4tb-gen5", psu: "1200w", theme: "black", glass: "smoked", cables: "black", rgb: "#00f2fe", rgbMode: "static" },
  },
  {
    id: "esports", name: "Esports 540Hz Pro", icon: "emoji_events", sub: "9800X3D · RTX 5070 Ti · 240mm",
    build: { cpu: "r7-9800x3d", mobo: "b650e-gaming", cooler: "aio240", gpu: "rtx5070ti", gpuMount: "horizontal", gpuFinish: "stealth", ram: "32gb-2x16", ramColor: "black", ssd: "2tb-gen4", psu: "850w", theme: "black", glass: "clear", cables: "black", rgb: "#10b981", rgbMode: "static" },
  },
  {
    id: "glacier", name: "Glacier White Showcase", icon: "ac_unit", sub: "9800X3D · Vertical RTX 5080 · White",
    build: { cpu: "r7-9800x3d", mobo: "x870e-hydro", cooler: "aio360", gpu: "rtx5080", gpuMount: "vertical", gpuFinish: "white", ram: "64gb-4x16", ramColor: "white", ssd: "2tb-gen5", psu: "1000w", theme: "white", glass: "clear", cables: "white", rgb: "#00f2fe", rgbMode: "wave" },
  },
  {
    id: "creator", name: "Creator & AI Studio", icon: "neurology", sub: "Ultra 9 285K · RTX 4090 · 128GB",
    build: { cpu: "ultra9-285k", mobo: "z890-hydro", cooler: "aio360", gpu: "rtx4090", gpuMount: "horizontal", gpuFinish: "silver", ram: "128gb-4x32", ramColor: "silver", ssd: "8tb-gen4", psu: "1200w", theme: "gunmetal", glass: "smoked", cables: "black", rgb: "#f59e0b", rgbMode: "static" },
  },
  {
    id: "sakura", name: "Sakura Dream", icon: "local_florist", sub: "i7-14700K · RX 9070 XT · Pink",
    build: { cpu: "i7-14700k", mobo: "z790-hydro", cooler: "aio360", gpu: "rx9070xt", gpuMount: "vertical", gpuFinish: "white", ram: "32gb-2x16", ramColor: "white", ssd: "2tb-gen4", psu: "850w", theme: "sakura", glass: "clear", cables: "white", rgb: "#ec4899", rgbMode: "breathing" },
  },
  {
    id: "starter", name: "1080p Starter", icon: "rocket_launch", sub: "Ryzen 5 7600X · RTX 4060 · Air",
    build: { cpu: "r5-7600x", mobo: "b650e-gaming", cooler: "air", gpu: "rtx4060", gpuMount: "horizontal", gpuFinish: "stealth", ram: "32gb-2x16", ramColor: "black", ssd: "1tb-gen4", psu: "750w", theme: "midnight", glass: "clear", cables: "black", rgb: "#a855f7", rgbMode: "spectrum" },
  },
];

/* ───────────────────────── Lookup helpers ───────────────────────── */
const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const LOOKUP = {
  cpu: byId(CPUS),
  mobo: byId(MOBOS),
  cooler: byId(COOLERS),
  gpu: byId(GPUS),
  ram: byId(RAMS),
  ssd: byId(SSDS),
  psu: byId(PSUS),
  theme: byId(THEMES),
  glass: byId(GLASS),
  gpuFinish: byId(GPU_FINISHES),
  gpuMount: byId(GPU_MOUNTS),
  ramColor: byId(RAM_COLORS),
  cables: byId(CABLES),
};

export function formatPrice(n) {
  return CURRENCY + " " + Math.round(n).toLocaleString("en-US");
}

/* ───────────────────────── Build analysis ───────────────────────── */
export function analyzeBuild(b) {
  const cpu = LOOKUP.cpu[b.cpu] || CPUS[0];
  const mobo = LOOKUP.mobo[b.mobo] || MOBOS[0];
  const cooler = LOOKUP.cooler[b.cooler] || COOLERS[0];
  const gpu = LOOKUP.gpu[b.gpu] || GPUS[0];
  const ram = LOOKUP.ram[b.ram] || RAMS[0];
  const ssd = LOOKUP.ssd[b.ssd] || SSDS[0];
  const psu = LOOKUP.psu[b.psu] || PSUS[0];
  const theme = LOOKUP.theme[b.theme] || THEMES[0];
  const cables = LOOKUP.cables[b.cables] || CABLES[0];

  const lines = [
    { cat: "cpu", label: "Processor", name: cpu.name, price: cpu.price },
    { cat: "mobo", label: "Motherboard", name: mobo.name, price: mobo.price },
    { cat: "cooler", label: "CPU Cooler", name: cooler.name, price: cooler.price },
    { cat: "gpu", label: "Graphics Card", name: gpu.name + " " + gpu.vram, price: gpu.price },
    { cat: "ram", label: "Memory", name: ram.name, price: ram.price },
    { cat: "ssd", label: "Storage", name: ssd.name, price: ssd.price },
    { cat: "psu", label: "Power Supply", name: psu.name, price: psu.price },
    { cat: "case", label: "Case", name: "Aqua Vision Dual-Chamber · " + theme.name, price: theme.price },
  ];
  if (cables.price) lines.push({ cat: "style", label: "Cables", name: cables.name, price: cables.price });
  lines.push({ cat: null, label: "Service", name: "Lab Assembly + 24h Stress Test + 6M Warranty", price: ASSEMBLY_FEE });
  const total = lines.reduce((s, l) => s + l.price, 0);

  // Power draw estimate (peak gaming load)
  const watts = Math.round(cpu.tdp * 0.85 + gpu.tbp + 65 + ram.sticks * 6 + 30);
  const recommended = Math.ceil((watts * 1.35) / 50) * 50;
  const headroom = psu.watts / watts;

  // FPS model
  const g = cpu.game * ram.boost;
  const fps = {
    cp: Math.round(gpu.perf.cp * (1 - (1 - g) * 0.25)),
    aaa: Math.round(gpu.perf.aaa * (1 - (1 - g) * 0.65)),
    esp: Math.round(gpu.perf.esp * Math.pow(g, 1.5)),
  };

  // Compatibility & advisories
  const issues = [];
  if (cpu.socket !== mobo.socket) {
    issues.push({ level: "error", cat: "mobo", text: `${cpu.name} (${cpu.socket}) does not fit the ${mobo.chipset} board (${mobo.socket}).` });
  }
  if (psu.watts < watts) {
    issues.push({ level: "error", cat: "psu", text: `PSU too weak: ${watts}W peak load on a ${psu.watts}W unit. Choose ${recommended}W+.` });
  } else if (headroom < 1.25) {
    issues.push({ level: "warn", cat: "psu", text: `Low PSU headroom (${Math.round((headroom - 1) * 100)}%). ${recommended}W recommended for transient spikes.` });
  }
  if (cpu.tdp > cooler.capacity) {
    issues.push({ level: "warn", cat: "cooler", text: `${cooler.name} may throttle a ${cpu.tdp}W ${cpu.name.split(" ").slice(-1)[0]} under all-core load. 360mm AIO recommended.` });
  }
  if ((gpu.id === "rtx5090" || gpu.id === "rtx4090") && cpu.game < 0.95) {
    issues.push({ level: "info", cat: "cpu", text: `The ${cpu.name} will bottleneck the ${gpu.name} at 1080p. Fine for 4K gaming.` });
  }
  if (ram.sticks === 4 && ram.size >= 128 && cpu.brand === "amd") {
    issues.push({ level: "info", cat: "ram", text: "4×32GB on AM5 typically runs at DDR5-5200–5600 (EXPO tuned by our lab)." });
  }
  if (mobo.chipset.startsWith("B") && (cpu.id === "i9-14900k" || cpu.id === "r9-9950x3d")) {
    issues.push({ level: "info", cat: "mobo", text: `A flagship CPU on a ${mobo.chipset} board limits overclocking. Consider an ${cpu.brand === "amd" ? "X870E" : "Z790"} board.` });
  }

  // Tier score 0–100 for gauge
  const score = Math.min(100, Math.round((gpu.perf.aaa / 245) * 70 + cpu.game * 22 + (ram.size >= 32 ? 8 : 4)));

  return { cpu, mobo, cooler, gpu, ram, ssd, psu, theme, lines, total, watts, recommended, headroom, fps, issues, score };
}


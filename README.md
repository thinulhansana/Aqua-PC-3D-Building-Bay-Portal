# Aqua PC Solutions — Interactive 3D PC Building Bay (Home) & Launch Portal

A photorealistic, standalone 3D WebGL PC configurator, showroom studio, and companion cinematic launch portal for **Aqua PC Solutions** (`https://aquapcsolutions.yyth.workers.dev/`).

![Aqua PC Solutions 3D Studio](assets/hero-rig.jpg)

## Pages Architecture

1. **`index.html` — Dedicated 3D PC Building Bay (Home Page)**
   - Built with Three.js r160 ES Modules (`EffectComposer`, `UnrealBloomPass`, custom `FilmShader` vignette/grain/chromatic aberration, `OutputPass`, and planar mirror `Reflector`).
   - **3 Switchable 3D Studio Environments**:
     - **Showroom**: Real-time mirror floor reflection, cyclorama dome, volumetric overhead light cone, and floating dust motes.
     - **ESD Lab**: Precision grounded workbench with CNC tools, 12VHPWR oscilloscope, and live 3D telemetry monitors.
     - **Void**: Minimal dark studio backdrop with soft contact shadows and blueprint grid.
   - **3 Quality Presets**: `Ultra`, `High`, and `Perf` (with automatic FPS adaptive downscaling if needed).
   - **10 Complete Hardware & Styling Categories**:
     - **CPUs (9)**: AMD Ryzen 7 9800X3D, Ryzen 9 9950X3D/7950X3D, Ryzen 7 7800X3D, Ryzen 5 7600X; Intel Core Ultra 9 285K, i9-14900K, i7-14700K, i5-14600K (with automatic socket matching).
     - **Motherboards (6)**: AM5 (`X870E`, `X670E`, `B650E`), LGA1851 (`Z890`), LGA1700 (`Z790`, `B760`).
     - **Coolers (3)**: 360mm Hydro LCD AIO, 240mm Hydro LCD AIO, Dual-Tower 6-Heatpipe Air Cooler.
     - **GPUs (11)**: NVIDIA RTX 5090, RTX 5080, RTX 5070 Ti, RTX 4090, RTX 4080 SUPER, RTX 4070 SUPER, RTX 4060; AMD Radeon RX 9070 XT, RX 7900 XTX, RX 7800 XT; Intel Arc B580 + Horizontal/Vertical Mount + Stealth/Silver/White finishes.
     - **RAM (5)**: 32GB up to 128GB DDR5 kits + 4 anodized heatspreader finishes (Black, White, Silver, Gold).
     - **Storage (5)**: 1TB–8TB PCIe Gen4/Gen5 NVMe SSDs.
     - **PSUs (5)**: 750W–1600W 80+ Gold/Platinum/Titanium ATX 3.1 units.
     - **Case & Glass**: 5 Chassis finishes (Obsidian Black, Glacier White, Gunmetal Titanium, Midnight Blue, Sakura Pink) + 3 Tempered Glass tints (Crystal Clear, Smoked, Bronze).
     - **Braided Cables**: Stock Black, White, Aqua, Crimson, Violet.
     - **RGB & Fans**: 8 ARGB colors, 5 effect modes (Static, Breathing, Rainbow Wave, Spectrum Cycle, Off), brightness slider, and Silent/Balanced/Turbo fan curves.
   - **Extras**: 6 1-Click Presets, Build Randomizer, 8-Step Assembly Wizard (`Auto-Build`), Exploded View, Open Glass, 3D Airflow particles, live CPU/GPU thermal telemetry, compatibility analyzer with 1-click `AUTO-FIX`, 3-game FPS estimator, shareable build URL (`#b=...`), PNG snapshot download, and WhatsApp order export.

2. **`portal.html` — Cinematic Video Showreel, Lab Gallery & Storefront Launchpad**
   - Full-page 3D spatial backdrop (`scene3d.js`), 8 local 720p hardware videos, macro lab gallery, and hyperspace warp deep-links to `/`, `/shop`, `/services`, `/pricing`, `/about`, and `/contact`.

## Zero-Build Static Deployment

This site uses native browser ES Modules + Import Maps with zero build tools or bundlers required:
- Open via any static HTTP server (e.g. **GitHub Pages**, **Cloudflare Pages**, **Vercel**, **Netlify**, or `npx http-server`).

## Author & Lab

- **Founder & Lead Hardware Engineer**: S.L.K Thinul Hansana
- **Location**: Embilipitiya, Sri Lanka
- **Hotline**: +94 78 819 4535
- **Official Storefront**: [https://aquapcsolutions.yyth.workers.dev/](https://aquapcsolutions.yyth.workers.dev/)

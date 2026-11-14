/* ==========================================================================
   AQUA PC SOLUTIONS — Photorealistic 3D PC & ESD Building Bay Model
   Includes: Procedural bump/roughness maps, ATX motherboard with 7-segment
   POST code display & Nichicon caps, CPU + retention lever, AIO LCD / Air
   coolers with tube clips, DDR5 ARGB DIMMs, GPU with vapor chamber & cable
   combs, NVMe SSD, modular PSU, and 3D ESD Workbench Bay props.
   ========================================================================== */
(function () {
  "use strict";

  function create(THREE, opts) {
    opts = opts || {};
    const ANISO = opts.anisotropy || 8;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const rgbZones = [];
    const fans = [];
    const geoCache = new Map();
    const FONT_MONO = '"JetBrains Mono", monospace';
    const FONT_DISPLAY = '"Syne", sans-serif';

    /* ───────────────────────── helpers ───────────────────────── */
    function rng(seed) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function canvasTexture(w, h, draw, o) {
      o = o || {};
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      draw(g, w, h);
      const t = new THREE.CanvasTexture(c);
      if (o.srgb !== false && THREE.SRGBColorSpace) {
        t.colorSpace = THREE.SRGBColorSpace;
      }
      t.anisotropy = ANISO;
      if (o.repeat) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(o.repeat[0], o.repeat[1]);
      }
      t.userData.canvas = c;
      t.userData.ctx = g;
      return t;
    }

    function redraw(tex, draw) {
      const c = tex.userData.canvas;
      draw(tex.userData.ctx, c.width, c.height);
      tex.needsUpdate = true;
    }

    function mesh(geo, mat, x, y, z, parent) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      m.receiveShadow = true;
      if (parent) parent.add(m);
      return m;
    }
    function box(w, h, d, mat, x, y, z, parent) {
      return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
    }
    function cylZ(r, h, mat, x, y, z, parent, seg) {
      const g = new THREE.CylinderGeometry(r, r, h, seg || 32);
      g.rotateX(Math.PI / 2);
      return mesh(g, mat, x, y, z, parent);
    }
    function roundedRectShape(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2,
        y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function extrudeRounded(w, h, depth, r) {
      const g = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
        depth,
        bevelEnabled: false,
        curveSegments: 10,
      });
      g.translate(0, 0, -depth / 2);
      return g;
    }
    function labelPlane(w, h, tex, parent, x, y, z, matOpts) {
      const m = new THREE.MeshStandardMaterial(
        Object.assign(
          {
            map: tex,
            transparent: true,
            roughness: 0.42,
            metalness: 0.25,
            depthWrite: false,
          },
          matOpts || {}
        )
      );
      const p = mesh(new THREE.PlaneGeometry(w, h), m, x, y, z, parent);
      p.castShadow = false;
      p.userData.noShadow = true;
      return p;
    }

    /* ───────────────────────── Procedural Bump & Surface Textures ───────────────────────── */
    // Brushed Hairline Metal Bump Map
    const brushedBumpTex = canvasTexture(
      256,
      256,
      (g, w, h) => {
        const r = rng(901);
        g.fillStyle = "#808080";
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y++) {
          const v = Math.floor(110 + r() * 36);
          g.fillStyle = `rgb(${v},${v},${v})`;
          g.fillRect(0, y, w, 1);
        }
      },
      { srgb: false, repeat: [3, 3] }
    );

    // Carbon / Micro-Knurl Bump Map
    const knurlBumpTex = canvasTexture(
      128,
      128,
      (g, w, h) => {
        g.fillStyle = "#707070";
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 8) {
          for (let x = 0; x < w; x += 8) {
            const odd = ((x + y) / 8) % 2 === 0;
            g.fillStyle = odd ? "#b0b0b0" : "#404040";
            g.fillRect(x, y, 6, 6);
          }
        }
      },
      { srgb: false, repeat: [12, 12] }
    );

    const BOARD = { w: 2.44, h: 3.05 };
    const PCB_PX = 420;
    const toPx = (lx, ly) => [
      (lx + BOARD.w / 2) * PCB_PX,
      (BOARD.h / 2 - ly) * PCB_PX,
    ];

    function drawPCB(g, w, h, chipset) {
      const r = rng(1337);
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0b0f17");
      bg.addColorStop(0.5, "#080b11");
      bg.addColorStop(1, "#05070b");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);

      // Subtle copper ground plane grid
      g.strokeStyle = "rgba(0, 242, 254, 0.035)";
      g.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }

      // High-density differential copper trace buses
      const dirs = [
        [1, 0],
        [0, 1],
        [0.7071, 0.7071],
        [0.7071, -0.7071],
        [-1, 0],
        [0, -1],
      ];
      g.lineCap = "round";
      g.lineJoin = "round";
      for (let b = 0; b < 130; b++) {
        const x0 = r() * w,
          y0 = r() * h,
          n = 3 + Math.floor(r() * 7);
        const segs = [];
        const sc = 3 + Math.floor(r() * 4);
        for (let s = 0; s < sc; s++)
          segs.push([dirs[Math.floor(r() * 6)], 22 + r() * 140]);
        const accent = r() < 0.18;
        const goldTrace = !accent && r() < 0.22;
        for (let k = 0; k < n; k++) {
          g.strokeStyle = accent
            ? "rgba(0,242,254,0.24)"
            : goldTrace
            ? "rgba(217,169,78,0.22)"
            : "rgba(148,163,184,0.16)";
          g.lineWidth = 1.4;
          g.beginPath();
          let px = x0 + k * 4.5,
            py = y0 + k * 4.5;
          g.moveTo(px, py);
          for (const [d, len] of segs) {
            px += d[0] * len;
            py += d[1] * len;
            g.lineTo(px, py);
          }
          g.stroke();
          g.fillStyle = goldTrace
            ? "rgba(235,195,95,0.45)"
            : "rgba(200,210,220,0.32)";
          g.beginPath();
          g.arc(px, py, 2.3, 0, Math.PI * 2);
          g.fill();
        }
      }

      // Hundreds of SMD resistors, MLCC capacitors & IC packages
      for (let i = 0; i < 620; i++) {
        const x = r() * w,
          y = r() * h,
          cw = 4 + r() * 9,
          ch = 2 + r() * 4.5;
        g.fillStyle = r() < 0.55 ? "#382e24" : "#1c2128";
        g.fillRect(x, y, cw, ch);
        g.fillStyle = "rgba(225,215,185,0.68)";
        g.fillRect(x, y, 1.6, ch);
        g.fillRect(x + cw - 1.6, y, 1.6, ch);
      }

      // Gold plated mounting standoff rings
      const holes = [
        [-1.12, 1.4],
        [1.12, 1.4],
        [-1.12, -0.2],
        [1.12, -0.2],
        [-1.12, -1.4],
        [1.12, -1.4],
        [0.1, 1.4],
        [0.1, -1.4],
        [0.1, 0.2],
      ];
      holes.forEach(([hx, hy]) => {
        const [px, py] = toPx(hx, hy);
        g.fillStyle = "#d4af37";
        g.beginPath();
        g.arc(px, py, 19, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#050505";
        g.beginPath();
        g.arc(px, py, 9, 0, Math.PI * 2);
        g.fill();
      });

      // Silkscreen markings
      const [sx, sy] = toPx(-0.25, 0.75);
      g.strokeStyle = "rgba(225,232,240,0.42)";
      g.lineWidth = 2;
      g.strokeRect(sx - 150, sy - 150, 300, 300);
      g.fillStyle = "rgba(225,232,240,0.65)";
      g.font = "600 26px " + FONT_MONO;
      g.save();
      g.translate(w - 42, h * 0.82);
      g.rotate(-Math.PI / 2);
      g.fillText("AQUA " + chipset + " HYDRO APEX  ·  PCIe 5.0", 0, 0);
      g.restore();
    }

    function drawChipset(g, w, h, chipset) {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#262c36");
      bg.addColorStop(0.5, "#12161d");
      bg.addColorStop(1, "#222832");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(0,242,254,0.25)";
      g.lineWidth = 3;
      g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = "#00f2fe";
      g.fillRect(22, h - 32, w - 44, 5);
      g.fillStyle = "#f8fafc";
      g.font = "800 62px " + FONT_DISPLAY;
      g.textAlign = "center";
      g.fillText(chipset, w / 2, h / 2 + 16);
      g.font = "600 19px " + FONT_MONO;
      g.fillStyle = "#38bdf8";
      g.fillText("AQUA HYDRO LAB", w / 2, 48);
      g.textAlign = "left";
    }

    function drawIHS(g, w, h, brand, model) {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#e2e6ec");
      bg.addColorStop(0.45, "#a2aab4");
      bg.addColorStop(0.55, "#c0c7d0");
      bg.addColorStop(1, "#e5e9ef");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(15,20,28,0.82)";
      g.font = "700 22px " + FONT_MONO;
      g.fillText(brand, 24, 62);
      g.font = "800 44px " + FONT_DISPLAY;
      g.fillText(model, 24, 120, w - 48);
      g.font = "600 16px " + FONT_MONO;
      g.fillText("AQUA BENCH CERTIFIED", 24, 168);
      g.fillText("BATCH #LK-2026-A9", 24, 194);
      g.fillStyle = "#d4af37";
      g.beginPath();
      g.moveTo(w - 24, h - 24);
      g.lineTo(w - 58, h - 24);
      g.lineTo(w - 24, h - 58);
      g.closePath();
      g.fill();
    }

    function drawLCD(g, w, h, s) {
      g.fillStyle = "#03060c";
      g.fillRect(0, 0, w, h);
      const cx = w / 2,
        cy = h / 2;
      if (s.power <= 0.01) return;
      g.globalAlpha = Math.min(1, s.power);

      // Outer telemetry tick marks
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2;
        const r1 = 108,
          r2 = i % 3 === 0 ? 116 : 112;
        g.strokeStyle =
          i % 3 === 0 ? "rgba(0,242,254,0.45)" : "rgba(255,255,255,0.12)";
        g.lineWidth = i % 3 === 0 ? 2 : 1;
        g.beginPath();
        g.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        g.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        g.stroke();
      }

      g.lineCap = "round";
      g.lineWidth = 13;
      g.strokeStyle = "rgba(255,255,255,0.08)";
      g.beginPath();
      g.arc(cx, cy, 92, Math.PI * 0.75, Math.PI * 2.25);
      g.stroke();

      const p = Math.max(0.05, Math.min(1, (s.temp - 20) / 55));
      g.strokeStyle = s.color;
      g.shadowColor = s.color;
      g.shadowBlur = 18;
      g.beginPath();
      g.arc(cx, cy, 92, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * p);
      g.stroke();
      g.shadowBlur = 0;

      const a = s.t * 1.8;
      g.fillStyle = "#10b981";
      g.beginPath();
      g.arc(cx + Math.cos(a) * 102, cy + Math.sin(a) * 102, 4.5, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = "#ffffff";
      g.textAlign = "center";
      g.font = "800 64px " + FONT_DISPLAY;
      g.fillText(Math.round(s.temp) + "°C", cx, cy + 18);
      g.font = "600 14px " + FONT_MONO;
      g.fillStyle = "rgba(255,255,255,0.65)";
      g.fillText("LIQUID LOOP · 2850 RPM", cx, cy + 48);
      g.fillStyle = s.color;
      g.font = "700 15px " + FONT_MONO;
      g.fillText("AQUA CRYO-LCD", cx, cy - 48);
      g.textAlign = "left";
      g.globalAlpha = 1;
    }

    const pcbTex = canvasTexture(1024, 1280, (g, w, h) =>
      drawPCB(g, w, h, "Z790")
    );
    const chipTex = canvasTexture(256, 256, (g, w, h) =>
      drawChipset(g, w, h, "Z790")
    );
    const ihsTex = canvasTexture(256, 256, (g, w, h) =>
      drawIHS(g, w, h, "INTEL® CORE™", "i9-14900K")
    );
    const lcdState = { t: 0, temp: 32, color: "#00f2fe", power: 1, boot: 1 };
    const lcdTex = canvasTexture(256, 256, (g, w, h) =>
      drawLCD(g, w, h, lcdState)
    );

    // 7-Segment Motherboard POST Code Texture ("A0")
    const postCodeTex = canvasTexture(128, 80, (g, w, h) => {
      g.fillStyle = "#080406";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#331219";
      g.lineWidth = 4;
      g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = "#ff2a55";
      g.shadowColor = "#ff2a55";
      g.shadowBlur = 10;
      g.font = "700 52px " + FONT_MONO;
      g.textAlign = "center";
      g.fillText("A0", w / 2, 58);
      g.shadowBlur = 0;
    });

    const hexTex = canvasTexture(
      256,
      224,
      (g, w, h) => {
        g.fillStyle = "#fff";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#000";
        const R = 16;
        for (let row = -1; row <= 8; row++) {
          for (let col = -1; col <= 8; col++) {
            const x = col * R * 2 + (row % 2 ? R : 0);
            const y = row * R * 1.75;
            g.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k * Math.PI) / 3 + Math.PI / 6;
              g.lineTo(
                x + Math.cos(a) * R * 0.8,
                y + Math.sin(a) * R * 0.8
              );
            }
            g.fill();
          }
        }
      },
      { srgb: false, repeat: [16, 8] }
    );

    const finTex = canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.fillStyle = "#3a4048";
        g.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 4) {
          g.fillStyle = "#b4bcc6";
          g.fillRect(x, 0, 1, h);
          g.fillStyle = "#101317";
          g.fillRect(x + 2, 0, 1, h);
        }
      },
      { repeat: [60, 1] }
    );

    const sleeveTex = canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.fillStyle = "#d0d4dc";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = "rgba(25,30,38,0.65)";
        g.lineWidth = 3;
        for (let i = -64; i < 128; i += 8) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i + 64, h);
          g.stroke();
          g.beginPath();
          g.moveTo(i + 64, 0);
          g.lineTo(i, h);
          g.stroke();
        }
      },
      { repeat: [32, 1] }
    );

    const capTex = canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = "#0a0d12";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#00f2fe";
      g.lineWidth = 5;
      g.beginPath();
      g.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#f1f5f9";
      g.font = "800 62px " + FONT_DISPLAY;
      g.textAlign = "center";
      g.fillText("A", w / 2, h / 2 + 22);
    });

    function textTex(w, h, lines, bg) {
      return canvasTexture(w, h, (g) => {
        g.clearRect(0, 0, w, h);
        if (bg) {
          g.fillStyle = bg;
          g.fillRect(0, 0, w, h);
        }
        lines.forEach((l) => {
          g.font = l.font;
          g.fillStyle = l.color || "#fff";
          g.textAlign = l.align || "center";
          g.fillText(l.t, l.x != null ? l.x : w / 2, l.y);
        });
      });
    }

    /* ───────────────────────── Physically Based Materials ───────────────────────── */
    const M = {
      chassis: new THREE.MeshPhysicalMaterial({
        color: 0x0b0e14,
        metalness: 0.62,
        roughness: 0.34,
        clearcoat: 0.45,
        clearcoatRoughness: 0.32,
      }),
      chassisInner: new THREE.MeshStandardMaterial({
        color: 0x0d1017,
        metalness: 0.55,
        roughness: 0.45,
      }),
      chassisMesh: new THREE.MeshStandardMaterial({
        color: 0x0b0e14,
        metalness: 0.6,
        roughness: 0.4,
        alphaMap: hexTex,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: 0x0e1116,
        roughness: 0.55,
        metalness: 0.08,
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: 0x050608,
        roughness: 0.9,
      }),
      alu: new THREE.MeshPhysicalMaterial({
        color: 0xd2d8e0,
        metalness: 0.96,
        roughness: 0.22,
        bumpMap: brushedBumpTex,
        bumpScale: 0.003,
        clearcoat: 0.25,
      }),
      darkAlu: new THREE.MeshPhysicalMaterial({
        color: 0x242a34,
        metalness: 0.92,
        roughness: 0.28,
        bumpMap: brushedBumpTex,
        bumpScale: 0.004,
        clearcoat: 0.35,
      }),
      ramSpreader: new THREE.MeshPhysicalMaterial({
        color: 0x202630,
        metalness: 0.92,
        roughness: 0.24,
        bumpMap: brushedBumpTex,
        bumpScale: 0.003,
        clearcoat: 0.5,
      }),
      nickel: new THREE.MeshStandardMaterial({
        color: 0xe2e7ee,
        metalness: 1.0,
        roughness: 0.12,
      }),
      chrome: new THREE.MeshPhysicalMaterial({
        color: 0xf4f7fb,
        metalness: 1.0,
        roughness: 0.05,
        clearcoat: 1.0,
      }),
      copper: new THREE.MeshStandardMaterial({
        color: 0xd47d42,
        metalness: 0.98,
        roughness: 0.18,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xe8bc52,
        metalness: 1.0,
        roughness: 0.16,
      }),
      pcbEdge: new THREE.MeshStandardMaterial({
        color: 0x10151c,
        roughness: 0.6,
        metalness: 0.15,
      }),
      pcbGreen: new THREE.MeshStandardMaterial({
        color: 0x0d281d,
        roughness: 0.5,
        metalness: 0.15,
      }),
      pcb: new THREE.MeshPhysicalMaterial({
        map: pcbTex,
        bumpMap: pcbTex,
        bumpScale: 0.004,
        roughness: 0.38,
        metalness: 0.32,
        clearcoat: 0.45,
        clearcoatRoughness: 0.28,
      }),
      chip: new THREE.MeshStandardMaterial({
        map: chipTex,
        roughness: 0.28,
        metalness: 0.85,
      }),
      gpuShroud: new THREE.MeshPhysicalMaterial({
        color: 0x181c24,
        metalness: 0.82,
        roughness: 0.26,
        bumpMap: brushedBumpTex,
        bumpScale: 0.003,
        clearcoat: 0.65,
        clearcoatRoughness: 0.2,
      }),
      silver: new THREE.MeshPhysicalMaterial({
        color: 0xe4e9f0,
        metalness: 1.0,
        roughness: 0.12,
      }),
      fanFrame: new THREE.MeshStandardMaterial({
        color: 0x0e1116,
        roughness: 0.45,
        metalness: 0.15,
      }),
      fanBlade: new THREE.MeshPhysicalMaterial({
        color: 0x181c22,
        roughness: 0.25,
        metalness: 0.12,
        clearcoat: 0.55,
      }),
      fanCap: new THREE.MeshStandardMaterial({
        map: capTex,
        roughness: 0.28,
        metalness: 0.5,
      }),
      fanBlur: new THREE.MeshBasicMaterial({
        color: 0x23272d,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xdcf4ff,
        metalness: 0.05,
        roughness: 0.03,
        transparent: true,
        opacity: 0.19,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 0.98,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      glassSmoke: new THREE.MeshPhysicalMaterial({
        color: 0x080c14,
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.5,
        clearcoat: 1.0,
        depthWrite: false,
      }),
      frit: new THREE.MeshStandardMaterial({
        color: 0x040507,
        roughness: 0.22,
        metalness: 0.35,
      }),
      sleeve: new THREE.MeshStandardMaterial({
        color: 0x222730,
        map: sleeveTex,
        bumpMap: sleeveTex,
        bumpScale: 0.006,
        roughness: 0.68,
        metalness: 0.1,
      }),
      psu: new THREE.MeshPhysicalMaterial({
        color: 0x0c0f15,
        roughness: 0.48,
        metalness: 0.5,
        bumpMap: knurlBumpTex,
        bumpScale: 0.002,
      }),
      ihs: new THREE.MeshStandardMaterial({
        map: ihsTex,
        metalness: 0.96,
        roughness: 0.18,
      }),
      radFins: new THREE.MeshStandardMaterial({
        map: finTex,
        bumpMap: finTex,
        bumpScale: 0.008,
        metalness: 0.78,
        roughness: 0.42,
        color: 0xa8b0ba,
      }),
      lcd: new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveMap: lcdTex,
        emissiveIntensity: 1.65,
        roughness: 0.08,
        metalness: 0,
      }),
      postLed: new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveMap: postCodeTex,
        emissiveIntensity: 1.8,
        roughness: 0.15,
      }),
      black: new THREE.MeshStandardMaterial({
        color: 0x050608,
        roughness: 0.38,
        metalness: 0.25,
      }),
      socket: new THREE.MeshStandardMaterial({
        color: 0x9c884e,
        roughness: 0.28,
        metalness: 0.92,
      }),
    };

    const THEMES = {
      black: {
        chassis: 0x0b0e14,
        chassisInner: 0x0d1017,
        chassisMesh: 0x0b0e14,
        plastic: 0x0e1116,
        fanFrame: 0x0e1116,
        fanBlade: 0x181c22,
        sleeve: 0x222730,
        psu: 0x0c0f15,
        ramSpreader: 0x202630,
        fanBlur: 0x23272d,
        gpuShroud: 0x181c24,
      },
      white: {
        chassis: 0xe6ebf0,
        chassisInner: 0xdce2e8,
        chassisMesh: 0xe6ebf0,
        plastic: 0xe8edf2,
        fanFrame: 0xf1f5f9,
        fanBlade: 0xf8fafc,
        sleeve: 0xf1f5f9,
        psu: 0xe2e8f0,
        ramSpreader: 0xe2e8f0,
        fanBlur: 0xd8dcdf,
        gpuShroud: 0xdde3ea,
      },
    };
    const THEME_PBR = {
      black: {
        chassis: [0.62, 0.34],
        gpuShroud: [0.82, 0.26],
        ramSpreader: [0.92, 0.24],
      },
      white: {
        chassis: [0.18, 0.32],
        gpuShroud: [0.25, 0.28],
        ramSpreader: [0.38, 0.24],
      },
    };

    // Volumetric Optical Bloom Halo Texture (Additive Blending)
    const ringGlowTex = canvasTexture(128, 128, (g, w, h) => {
      const cx = w / 2,
        cy = h / 2;
      const grad = g.createRadialGradient(cx, cy, w * 0.22, cx, cy, w * 0.5);
      grad.addColorStop(0.0, "rgba(255,255,255,0.0)");
      grad.addColorStop(0.45, "rgba(255,255,255,0.42)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.18)");
      grad.addColorStop(1.0, "rgba(255,255,255,0.0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });

    function rgbMat(x, y, intensity) {
      const base = intensity || 2.6;
      const m = new THREE.MeshStandardMaterial({
        color: 0x050505,
        emissive: 0x00f2fe,
        emissiveIntensity: base,
        roughness: 0.25,
        metalness: 0,
      });
      rgbZones.push({ mat: m, px: (x + 2.3) / 4.6, py: y / 5, base });
      return m;
    }

    function rgbHaloMat(x, y, opacity) {
      const baseOp = opacity || 0.38;
      const m = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        map: ringGlowTex,
        transparent: true,
        opacity: baseOp,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      rgbZones.push({
        mat: m,
        isHalo: true,
        px: (x + 2.3) / 4.6,
        py: y / 5,
        base: baseOp,
      });
      return m;
    }

    /* ───────────────────────── ARGB Fans ───────────────────────── */
    function fanGeometries(s, blades) {
      const key = s.toFixed(3) + "_" + blades;
      if (geoCache.has(key)) return geoCache.get(key);
      const depth = s * 0.2;
      const shape = roundedRectShape(s, s, s * 0.09);
      const hole = new THREE.Path();
      hole.absarc(0, 0, s * 0.47, 0, Math.PI * 2, false);
      shape.holes.push(hole);
      [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([sx, sy]) => {
        const p = new THREE.Path();
        p.absarc(sx * s * 0.415, sy * s * 0.415, s * 0.022, 0, Math.PI * 2, false);
        shape.holes.push(p);
      });
      const frame = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: s * 0.008,
        bevelSize: s * 0.008,
        bevelSegments: 2,
        curveSegments: 40,
      });
      frame.translate(0, 0, -depth / 2);
      const ring = new THREE.TorusGeometry(s * 0.472, s * 0.013, 10, 80);
      const hub = new THREE.CylinderGeometry(s * 0.15, s * 0.15, depth * 0.7, 40);
      hub.rotateX(Math.PI / 2);
      const cap = new THREE.CircleGeometry(s * 0.135, 40);
      const r0 = s * 0.13,
        r1 = s * 0.455;
      const bs = new THREE.Shape();
      bs.moveTo(r0, -s * 0.05);
      bs.quadraticCurveTo((r0 + r1) / 2, -s * 0.125, r1, -s * 0.06);
      bs.quadraticCurveTo(r1 + s * 0.02, s * 0.05, r1 - s * 0.035, s * 0.13);
      bs.quadraticCurveTo((r0 + r1) / 2, s * 0.09, r0, s * 0.07);
      bs.closePath();
      const bt = s * 0.008;
      const blade = new THREE.ExtrudeGeometry(bs, {
        depth: bt,
        bevelEnabled: true,
        bevelThickness: s * 0.004,
        bevelSize: s * 0.004,
        bevelSegments: 1,
        curveSegments: 14,
      });
      blade.translate(0, 0, -bt / 2);
      blade.rotateX(0.52);
      blade.computeVertexNormals();
      const strut = new THREE.BoxGeometry(s * 0.36, s * 0.022, depth * 0.25);
      const blur = new THREE.RingGeometry(s * 0.15, s * 0.455, 64);
      const set = { frame, ring, hub, cap, blade, strut, blur, depth };
      geoCache.set(key, set);
      return set;
    }

    function makeFan(s, o) {
      o = o || {};
      const nb = o.blades || 9;
      const G = fanGeometries(s, nb);
      const fan = new THREE.Group();
      if (o.frame !== false) {
        fan.add(new THREE.Mesh(G.frame, M.fanFrame));
        for (let i = 0; i < 4; i++) {
          const st = new THREE.Mesh(G.strut, M.fanFrame);
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          st.position.set(
            Math.cos(a) * s * 0.31,
            Math.sin(a) * s * 0.31,
            -G.depth * 0.38
          );
          st.rotation.z = a;
          fan.add(st);
        }
        const motor = new THREE.Mesh(G.hub, M.fanFrame);
        motor.position.z = -G.depth * 0.32;
        motor.scale.set(0.95, 0.95, 0.4);
        fan.add(motor);
      }
      if (o.rgb !== false) {
        const m = rgbMat(o.px || 0, o.py || 0, o.intensity || 2.6);
        const hm = rgbHaloMat(o.px || 0, o.py || 0, 0.36);
        const haloPlane = new THREE.PlaneGeometry(s * 1.18, s * 1.18);
        const zs =
          o.frame === false
            ? [G.depth * 0.3]
            : [G.depth / 2 + s * 0.006, -G.depth / 2 - s * 0.006];
        zs.forEach((z) => {
          const r = new THREE.Mesh(G.ring, m);
          r.position.z = z;
          r.userData.noShadow = true;
          fan.add(r);
          const halo = new THREE.Mesh(haloPlane, hm);
          halo.position.z = z;
          halo.userData.noShadow = true;
          fan.add(halo);
        });
      }
      const rotor = new THREE.Group();
      fan.add(rotor);
      rotor.add(new THREE.Mesh(G.hub, M.fanBlade));
      const cap = new THREE.Mesh(G.cap, M.fanCap);
      cap.position.z = G.depth * 0.35 + 0.002;
      rotor.add(cap);
      for (let i = 0; i < nb; i++) {
        const b = new THREE.Mesh(G.blade, M.fanBlade);
        b.rotation.z = (i / nb) * Math.PI * 2;
        rotor.add(b);
      }
      const blur = new THREE.Mesh(G.blur, M.fanBlur);
      blur.position.z = G.depth * 0.04;
      blur.userData.noShadow = true;
      fan.add(blur);
      fan.userData.rotor = rotor;
      fan.userData.dir = o.dir || 1;
      fan.userData.boost = 1;
      fan.userData.gpu = !!o.gpu;
      fans.push(fan);
      return fan;
    }

    /* ───────────────────────── Dual-Chamber Showcase Chassis ───────────────────────── */
    const caseShell = new THREE.Group();
    caseShell.name = "case";
    box(4.52, 4.94, 0.03, M.chassisInner, 0, 2.5, -1.125, caseShell);
    const gromGeo = extrudeRounded(0.14, 0.62, 0.02, 0.06);
    for (let i = 0; i < 3; i++)
      mesh(gromGeo, M.rubber, 0.66, 2.05 + i * 0.95, -1.106, caseShell);
    box(4.6, 0.05, 2.3, M.chassis, 0, 0.025, 0, caseShell);
    box(0.035, 4.94, 2.3, M.chassis, -2.283, 2.5, 0, caseShell);
    for (let k = 0; k < 7; k++)
      box(0.012, 0.15, 0.5, M.chassisInner, -2.258, 2.72 - k * 0.2032, -0.72, caseShell);
    box(0.012, 0.62, 0.22, M.black, -2.262, 4.02, -0.95, caseShell);
    box(0.06, 0.06, 2.3, M.chassis, 2.27, 4.965, 0, caseShell);
    box(0.06, 0.06, 2.3, M.chassis, 2.27, 0.06, 0, caseShell);
    box(0.06, 4.94, 0.06, M.chassis, -2.27, 2.5, 1.12, caseShell);
    box(4.6, 0.06, 0.06, M.chassis, 0, 4.965, 1.12, caseShell);
    box(4.6, 0.06, 0.06, M.chassis, 0, 0.06, 1.12, caseShell);
    // Machined aluminum case feet with gold accent rings
    [
      [-2.0, -0.9],
      [-2.0, 0.9],
      [2.0, -0.9],
      [2.0, 0.9],
    ].forEach(([x, z]) => {
      mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 32), M.darkAlu, x, -0.05, z, caseShell);
      mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.02, 32), M.gold, x, -0.02, z, caseShell);
    });

    // PSU shroud + ARGB edge diffuser
    const shroud = new THREE.Group();
    caseShell.add(shroud);
    box(2.75, 0.03, 2.2, M.chassis, -0.875, 1.165, 0, shroud);
    box(1.75, 0.03, 2.2, M.chassisMesh, 1.375, 1.165, 0, shroud);
    const spShape = new THREE.Shape();
    spShape.moveTo(-2.25, -0.55);
    spShape.lineTo(2.25, -0.55);
    spShape.lineTo(2.25, 0.55);
    spShape.lineTo(-2.25, 0.55);
    spShape.closePath();
    const win = new THREE.Path();
    win.moveTo(-2.05, -0.38);
    win.lineTo(-0.75, -0.38);
    win.lineTo(-0.75, 0.32);
    win.lineTo(-2.05, 0.32);
    win.closePath();
    spShape.holes.push(win);
    const spGeo = new THREE.ExtrudeGeometry(spShape, {
      depth: 0.03,
      bevelEnabled: false,
    });
    mesh(spGeo, M.chassis, 0, 0.6, 1.04, shroud);
    const smoke = mesh(
      new THREE.PlaneGeometry(1.3, 0.7),
      M.glassSmoke,
      -1.4,
      0.57,
      1.06,
      shroud
    );
    smoke.renderOrder = 5;
    smoke.userData.noShadow = true;
    const logoTex = textTex(512, 128, [
      {
        t: "AQUA LAB",
        font: "800 80px " + FONT_DISPLAY,
        y: 94,
        color: "#ffffff",
      },
    ]);
    const logoMat = rgbMat(1.1, 0.6, 3.2);
    logoMat.emissiveMap = logoTex;
    logoMat.alphaMap = logoTex;
    logoMat.transparent = true;
    logoMat.depthWrite = false;
    const logo = mesh(
      new THREE.PlaneGeometry(1.35, 0.32),
      logoMat,
      1.15,
      0.6,
      1.074,
      shroud
    );
    logo.userData.noShadow = true;
    box(4.4, 0.024, 0.03, rgbMat(0, 1.18, 2.8), 0, 1.19, 1.05, shroud);

    // Top panel with front I/O ports
    const topPanel = new THREE.Group();
    box(4.36, 0.03, 2.06, M.chassisMesh, 0, 4.985, 0, topPanel);
    box(4.6, 0.035, 0.12, M.chassis, 0, 4.985, 1.09, topPanel);
    box(4.6, 0.035, 0.12, M.chassis, 0, 4.985, -1.09, topPanel);
    box(0.12, 0.035, 2.06, M.chassis, 2.24, 4.985, 0, topPanel);
    box(0.12, 0.035, 2.06, M.chassis, -2.24, 4.985, 0, topPanel);
    mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 32),
      M.alu,
      1.75,
      5.012,
      1.09,
      topPanel
    );
    const pbRing = mesh(
      new THREE.TorusGeometry(0.052, 0.008, 8, 40),
      rgbMat(1.75, 5, 3),
      1.75,
      5.02,
      1.09,
      topPanel
    );
    pbRing.rotation.x = Math.PI / 2;
    box(0.11, 0.012, 0.04, M.black, 1.45, 5.005, 1.09, topPanel);
    box(0.11, 0.012, 0.04, M.black, 1.3, 5.005, 1.09, topPanel);

    // Tempered Glass Panels with Beveled Edges & Anodized Corner Thumbscrews
    const glassSide = new THREE.Group();
    const gs = box(4.56, 4.9, 0.018, M.glass, 0, 2.5, 1.142, glassSide);
    gs.renderOrder = 10;
    gs.castShadow = false;
    gs.userData.noShadow = true;
    box(4.56, 0.09, 0.004, M.frit, 0, 4.905, 1.132, glassSide);
    box(4.56, 0.09, 0.004, M.frit, 0, 0.095, 1.132, glassSide);
    box(0.09, 4.9, 0.004, M.frit, -2.235, 2.5, 1.132, glassSide);
    // Corner thumbscrews on glass
    [
      [-2.14, 4.82],
      [2.14, 4.82],
      [-2.14, 0.18],
      [2.14, 0.18],
    ].forEach(([tx, ty]) => {
      cylZ(0.038, 0.032, M.darkAlu, tx, ty, 1.158, glassSide, 20);
      cylZ(0.024, 0.036, M.chrome, tx, ty, 1.16, glassSide, 16);
    });

    const glassFront = new THREE.Group();
    const gf = box(0.018, 4.9, 2.27, M.glass, 2.292, 2.5, -0.01, glassFront);
    gf.renderOrder = 10;
    gf.castShadow = false;
    gf.userData.noShadow = true;
    box(0.004, 0.09, 2.27, M.frit, 2.282, 4.905, -0.01, glassFront);
    box(0.004, 0.09, 2.27, M.frit, 2.282, 0.095, -0.01, glassFront);
    box(0.004, 4.9, 0.09, M.frit, 2.282, 2.5, -1.1, glassFront);

    /* ───────────────────────── ATX Motherboard ───────────────────────── */
    const mobo = new THREE.Group();
    mobo.position.set(-0.95, 3.1, -1.09);
    const F = 0.015;
    mesh(
      new THREE.BoxGeometry(BOARD.w, BOARD.h, 0.03),
      [M.pcbEdge, M.pcbEdge, M.pcbEdge, M.pcbEdge, M.pcb, M.pcbEdge],
      0,
      0,
      0,
      mobo
    );

    // LGA Socket + Retention Lever
    const socket = new THREE.Group();
    socket.position.set(-0.25, 0.75, F);
    mobo.add(socket);
    box(0.62, 0.62, 0.025, M.plastic, 0, 0, 0.0125, socket);
    box(0.48, 0.48, 0.006, M.socket, 0, 0, 0.028, socket);
    [
      [0, 0.285, 0.6, 0.05],
      [0, -0.285, 0.6, 0.05],
      [0.285, 0, 0.05, 0.62],
      [-0.285, 0, 0.05, 0.62],
    ].forEach(([x, y, w, h]) => {
      box(w, h, 0.035, M.nickel, x, y, 0.03, socket);
    });
    const lever = new THREE.Group();
    lever.position.set(0.34, -0.3, 0.03);
    socket.add(lever);
    mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.62, 12),
      M.chrome,
      0,
      0.31,
      0,
      lever
    );
    box(0.05, 0.02, 0.02, M.chrome, -0.02, 0.62, 0, lever);

    // Finned VRM Heatsinks + Copper Cross-Heatpipe + Illuminated I/O Armor
    const vrmTop = box(1.15, 0.24, 0.22, M.darkAlu, -0.325, 1.27, F + 0.11, mobo);
    for (let i = 0; i < 11; i++)
      box(1.15, 0.01, 0.04, M.alu, -0.325, 1.16 + i * 0.02, F + 0.22, mobo);
    box(0.24, 1.0, 0.22, M.darkAlu, -0.78, 0.55, F + 0.11, mobo);
    for (let i = 0; i < 9; i++)
      box(0.01, 1.0, 0.04, M.alu, -0.88 + i * 0.024, 0.55, F + 0.22, mobo);
    const ioShroud = box(0.3, 1.32, 0.34, M.chassis, -1.06, 0.82, F + 0.17, mobo);
    box(0.024, 1.18, 0.024, rgbMat(-2.0, 3.9, 3.0), -0.91, 0.82, F + 0.32, mobo);
    const ioTex = textTex(512, 96, [
      {
        t: "AQUA  HYDRO",
        font: "800 54px " + FONT_DISPLAY,
        y: 68,
        color: "#f1f5f9",
      },
    ]);
    const ioLabel = labelPlane(
      1.04,
      0.2,
      ioTex,
      mobo,
      -1.06,
      0.82,
      F + 0.342
    );
    ioLabel.rotation.z = Math.PI / 2;
    vrmTop.userData.anchor = true;
    ioShroud.userData.anchor = true;

    // 7-Segment POST Debug Display ("A0") + Onboard Start Button on top-right of Mobo
    box(0.18, 0.12, 0.035, M.postLed, 1.04, 1.34, F + 0.018, mobo);
    cylZ(0.045, 0.025, M.chrome, 1.04, 1.14, F + 0.014, mobo, 20);
    cylZ(0.032, 0.028, rgbMat(0.1, 4.2, 2.5), 1.04, 1.14, F + 0.016, mobo, 20);

    // Nichicon Gold Audio Capacitors (bottom-left audio isolation zone)
    const audioCapGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.075, 16);
    audioCapGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 5; i++) {
      mesh(audioCapGeo, M.gold, -1.05, -0.95 - i * 0.09, F + 0.038, mobo);
    }

    // Solid VRM Capacitors & Chokes
    const capGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.085, 18);
    capGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 9; i++)
      mesh(capGeo, M.chrome, -0.85 + i * 0.12, 1.08, F + 0.042, mobo);
    for (let i = 0; i < 6; i++)
      mesh(capGeo, M.chrome, -0.6, 0.1 + i * 0.12, F + 0.042, mobo);

    // DDR5 DIMM Slots with Metal Shielding
    const DIMM_X = [0.5, 0.62, 0.78, 0.9];
    DIMM_X.forEach((x) => {
      box(0.07, 1.4, 0.07, M.plastic, x, 0.72, F + 0.035, mobo);
      box(0.076, 1.38, 0.03, M.nickel, x, 0.72, F + 0.02, mobo);
      box(0.08, 0.07, 0.1, M.plastic, x, 1.44, F + 0.05, mobo);
      box(0.08, 0.07, 0.1, M.plastic, x, 0.0, F + 0.05, mobo);
    });
    box(0.12, 0.5, 0.12, M.plastic, 1.1, 0.35, F + 0.06, mobo);

    // Steel-Armor PCIe Gen5 x16 Slots + M.2 Thermal Guards + Chipset + CR2032 Battery
    box(0.9, 0.07, 0.08, M.plastic, -0.62, -0.45, F + 0.04, mobo);
    box(0.92, 0.09, 0.055, M.chrome, -0.62, -0.45, F + 0.03, mobo);
    box(0.9, 0.07, 0.08, M.plastic, -0.62, -1.06, F + 0.04, mobo);
    box(0.92, 0.09, 0.055, M.chrome, -0.62, -1.06, F + 0.03, mobo);
    box(0.25, 0.06, 0.07, M.plastic, -0.85, -0.75, F + 0.035, mobo);
    box(0.92, 0.25, 0.045, M.darkAlu, -0.55, -0.8, F + 0.032, mobo);
    box(0.9, 0.022, 0.012, M.silver, -0.55, -0.7, F + 0.058, mobo);
    box(0.08, 0.08, 0.04, M.plastic, -1.04, 0.12, F + 0.02, mobo);
    box(0.62, 0.62, 0.065, M.darkAlu, 0.55, -0.95, F + 0.032, mobo);
    labelPlane(0.58, 0.58, chipTex, mobo, 0.55, -0.95, F + 0.066, {
      transparent: false,
      metalness: 0.85,
      roughness: 0.28,
    });
    box(0.6, 0.024, 0.024, rgbMat(0.2, 2.1, 2.8), 0.55, -0.63, F + 0.052, mobo);
    // Mirror-chrome CR2032 CMOS Battery
    cylZ(0.105, 0.024, M.chrome, 0.2, -1.3, F + 0.014, mobo, 32);
    [
      [-1.12, 1.4],
      [1.12, 1.4],
      [-1.12, -0.2],
      [1.12, -0.2],
      [-1.12, -1.4],
      [1.12, -1.4],
      [0.1, 1.4],
      [0.1, -1.4],
      [0.1, 0.2],
    ].forEach(([x, y]) => {
      cylZ(0.036, 0.016, M.gold, x, y, F + 0.008, mobo, 16);
    });

    // Braided 24-pin ATX & 8-pin EPS Cables with Acrylic Cable Combs
    const moboOffset = mobo.position.clone();
    function makeBundle(points, count, spacing, radius, mat, axis, parent, offset) {
      const grp = new THREE.Group();
      const ax = axis.clone().normalize();
      for (let i = 0; i < count; i++) {
        const k = (i - (count - 1) / 2) * spacing;
        const pts = points.map((p) =>
          p
            .clone()
            .addScaledVector(ax, k)
            .sub(offset || V3(0, 0, 0))
        );
        const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
        const geo = new THREE.TubeGeometry(curve, 64, radius, 8, false);
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.userData.indexCount = geo.index.count;
        grp.add(m);
      }
      grp.userData.reveal = 1;
      if (parent) parent.add(grp);
      return grp;
    }

    const cableATX = makeBundle(
      [
        V3(0.22, 3.45, -0.98),
        V3(0.4, 3.47, -0.86),
        V3(0.56, 3.45, -0.96),
        V3(0.64, 3.45, -1.13),
      ],
      12,
      0.026,
      0.0125,
      M.sleeve,
      V3(0, 1, 0),
      mobo,
      moboOffset
    );
    // 24-pin Cable Comb + ARGB Strimer Accent
    box(0.035, 0.34, 0.045, M.black, 0.42 - moboOffset.x, 3.46 - moboOffset.y, -0.86 - moboOffset.z, cableATX);
    box(0.018, 0.32, 0.048, rgbMat(0.42, 3.46, 2.8), 0.42 - moboOffset.x, 3.46 - moboOffset.y, -0.84 - moboOffset.z, cableATX);

    const cableEPS = makeBundle(
      [
        V3(-1.95, 4.5, -1.0),
        V3(-1.92, 4.66, -0.95),
        V3(-1.88, 4.74, -1.13),
      ],
      4,
      0.03,
      0.013,
      M.sleeve,
      V3(1, 0, 0),
      mobo,
      moboOffset
    );

    /* ───────────────────────── Processor (CPU) ───────────────────────── */
    const SOCKET_WORLD = V3(-1.2, 3.85, -1.075);
    const cpu = new THREE.Group();
    cpu.position.set(SOCKET_WORLD.x, SOCKET_WORLD.y, SOCKET_WORLD.z + 0.03);
    box(0.44, 0.44, 0.012, M.pcbGreen, 0, 0, 0.006, cpu);
    mesh(
      new THREE.BoxGeometry(0.36, 0.36, 0.03),
      [M.nickel, M.nickel, M.nickel, M.nickel, M.ihs, M.nickel],
      0,
      0,
      0.027,
      cpu
    );

    /* ───────────────────────── CPU Coolers (AIO 360 / 240 / Dual-Tower Air) ───────────────────────── */
    function makePump() {
      const p = new THREE.Group();
      cylZ(0.37, 0.06, M.darkAlu, 0, 0, 0.03, p, 48);
      const arm = new THREE.BoxGeometry(1.0, 0.08, 0.025);
      const a1 = mesh(arm, M.chrome, 0, 0, 0.02, p);
      a1.rotation.z = Math.PI / 4;
      const a2 = mesh(arm, M.chrome, 0, 0, 0.02, p);
      a2.rotation.z = -Math.PI / 4;
      cylZ(0.33, 0.22, M.chassis, 0, 0, 0.17, p, 64);
      const ring = mesh(
        new THREE.TorusGeometry(0.335, 0.022, 12, 72),
        rgbMat(-1.2, 3.85, 3.2),
        0,
        0,
        0.28,
        p
      );
      ring.userData.noShadow = true;
      const pumpHalo = mesh(
        new THREE.PlaneGeometry(0.92, 0.92),
        rgbHaloMat(-1.2, 3.85, 0.45),
        0,
        0,
        0.278,
        p
      );
      pumpHalo.userData.noShadow = true;
      const face = mesh(
        new THREE.CircleGeometry(0.305, 64),
        M.lcd,
        0,
        0,
        0.283,
        p
      );
      face.userData.noShadow = true;
      const cover = mesh(
        new THREE.CircleGeometry(0.31, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08,
          roughness: 0.02,
          clearcoat: 1,
          depthWrite: false,
        }),
        0,
        0,
        0.288,
        p
      );
      cover.userData.noShadow = true;
      // Knurled chrome rotary 90-degree fittings
      cylZ(0.052, 0.12, M.chrome, 0.3, 0.1, 0.16, p).rotation.set(
        0,
        Math.PI / 2,
        0
      );
      cylZ(0.052, 0.12, M.chrome, 0.3, -0.1, 0.16, p).rotation.set(
        0,
        Math.PI / 2,
        0
      );
      return p;
    }

    function makeRadiator(len) {
      const r = new THREE.Group();
      const coreLen = len - 0.36;
      mesh(
        new THREE.BoxGeometry(coreLen, 0.27, 1.22),
        [M.darkAlu, M.darkAlu, M.radFins, M.radFins, M.darkAlu, M.darkAlu],
        0,
        0,
        0,
        r
      );
      box(0.18, 0.31, 1.26, M.chassis, len / 2 - 0.09, 0, 0, r);
      box(0.18, 0.31, 1.26, M.chassis, -len / 2 + 0.09, 0, 0, r);
      [-0.25, 0.25].forEach((z) =>
        mesh(
          new THREE.CylinderGeometry(0.054, 0.054, 0.11, 24),
          M.chrome,
          len / 2 - 0.09,
          -0.2,
          z,
          r
        )
      );
      const t = textTex(512, 64, [
        {
          t: "AQUA HYDRO " + Math.round(len * 92) + " MM",
          font: "700 34px " + FONT_MONO,
          y: 44,
          color: "#e2e8f0",
        },
      ]);
      labelPlane(1.4, 0.175, t, r, 0, 0, 0.614);
      return r;
    }

    function makeAIO(size) {
      const g = new THREE.Group();
      const pump = makePump();
      pump.position.copy(SOCKET_WORLD).add(V3(0, 0, 0.035));
      g.add(pump);
      const len = size === 360 ? 3.9 : 2.7;
      const rad = makeRadiator(len);
      rad.position.set(size === 360 ? 0 : 0.6, 4.82, 0.05);
      g.add(rad);
      const fx = rad.position.x + len / 2 - 0.09;
      const pA = [
        V3(-0.92, 3.95, -0.86),
        V3(-0.72, 4.0, -0.5),
        V3(0.2, 4.05, -0.38),
        V3(1.35, 4.12, -0.24),
        V3(fx - 0.03, 4.3, -0.25),
        V3(fx, 4.62, -0.25),
      ];
      const pB = [
        V3(-0.92, 3.75, -0.86),
        V3(-0.7, 3.78, -0.42),
        V3(0.25, 3.82, -0.15),
        V3(1.4, 3.95, 0.2),
        V3(fx - 0.03, 4.25, 0.25),
        V3(fx, 4.62, 0.25),
      ];
      [pA, pB].forEach((pts) => {
        const c = new THREE.CatmullRomCurve3(pts, false, "centripetal");
        mesh(
          new THREE.TubeGeometry(c, 90, 0.058, 16, false),
          M.sleeve,
          0,
          0,
          0,
          g
        );
      });
      // Anodized Aluminum Tube Clips with ARGB Accent
      box(0.06, 0.3, 0.34, M.darkAlu, 0.22, 3.94, -0.26, g);
      box(0.025, 0.32, 0.36, rgbMat(0.22, 3.94, 2.6), 0.22, 3.94, -0.26, g);

      g.userData.pump = pump;
      g.userData.radiator = rad;
      return g;
    }

    function makeAirCooler() {
      const g = new THREE.Group();
      g.position.copy(SOCKET_WORLD).add(V3(0, 0, 0.035));
      box(0.42, 0.42, 0.06, M.copper, 0, 0, 0.03, g);
      box(0.3, 0.3, 0.06, M.darkAlu, 0, 0, 0.09, g);
      const pipes = [
        [-0.12, -0.42],
        [0.12, -0.25],
        [-0.12, -0.08],
        [0.12, 0.08],
        [-0.12, 0.25],
        [0.12, 0.42],
      ];
      pipes.forEach(([x, y]) => {
        const c = new THREE.CatmullRomCurve3([
          V3(x * 0.6, y * 0.25, 0.06),
          V3(x * 0.8, y * 0.6, 0.24),
          V3(x, y, 0.44),
          V3(x, y, 1.47),
        ]);
        mesh(
          new THREE.TubeGeometry(c, 30, 0.029, 14, false),
          M.copper,
          0,
          0,
          0,
          g
        );
      });
      const finGeo = new THREE.BoxGeometry(0.56, 1.24, 0.008);
      const n = 38;
      const fins = new THREE.InstancedMesh(finGeo, M.alu, n);
      fins.castShadow = true;
      fins.receiveShadow = true;
      const mtx = new THREE.Matrix4();
      for (let i = 0; i < n; i++) {
        mtx.makeTranslation(0, 0, 0.44 + i * 0.027);
        fins.setMatrixAt(i, mtx);
      }
      fins.instanceMatrix.needsUpdate = true;
      g.add(fins);
      box(0.6, 1.3, 0.07, M.chassis, 0, 0, 1.47, g);
      box(0.6, 0.025, 0.02, rgbMat(-1.2, 4.45, 3), 0, 0.64, 1.47, g);
      box(0.6, 0.025, 0.02, rgbMat(-1.2, 3.25, 3), 0, -0.64, 1.47, g);
      const t = textTex(256, 512, [
        {
          t: "AQUA",
          font: "800 70px " + FONT_DISPLAY,
          y: 270,
          color: "#e6edf4",
        },
      ]);
      labelPlane(0.5, 1.0, t, g, 0, 0, 1.506);
      const fan = makeFan(1.2, { px: -0.8, py: 3.85 });
      fan.rotation.y = Math.PI / 2;
      fan.position.set(0.41, 0, 0.92);
      g.add(fan);
      return g;
    }

    const coolers = {
      aio360: makeAIO(360),
      aio240: makeAIO(240),
      air: makeAirCooler(),
    };

    /* ───────────────────────── DDR5 ARGB Memory Modules ───────────────────────── */
    const ram = DIMM_X.map((lx, i) => {
      const g = new THREE.Group();
      const wx = mobo.position.x + lx;
      g.position.set(wx, 3.82, -1.0);
      box(0.012, 1.3, 0.3, M.pcbGreen, 0, 0, 0.15, g);
      box(0.014, 1.25, 0.03, M.gold, 0, 0, 0.0, g);
      [-0.021, 0.021].forEach((x) =>
        box(0.022, 1.33, 0.34, M.ramSpreader, x, 0, 0.18, g)
      );
      box(0.064, 1.33, 0.04, M.chassis, 0, 0, 0.36, g);
      box(
        0.058,
        1.27,
        0.065,
        rgbMat(wx, 3.82 + (i - 1.5) * 0.1, 3.0),
        0,
        0,
        0.405,
        g
      );
      const t = textTex(512, 128, [
        {
          t: "AQUA DDR5-6400 CL30",
          font: "700 42px " + FONT_MONO,
          y: 78,
          color: "#e2e8f0",
        },
      ]);
      const lp = labelPlane(1.0, 0.25, t, g, 0.0335, 0, 0.18);
      lp.rotation.set(0, Math.PI / 2, Math.PI / 2);
      return g;
    });

    /* ───────────────────────── NVMe Gen4 SSD ───────────────────────── */
    const ssd = new THREE.Group();
    ssd.position.set(mobo.position.x - 0.55, mobo.position.y + 0.12, -1.075);
    box(0.86, 0.22, 0.01, M.pcbGreen, 0, 0, 0.005, ssd);
    box(0.88, 0.25, 0.05, M.darkAlu, 0, 0, 0.035, ssd);
    for (let i = 0; i < 10; i++)
      box(0.86, 0.008, 0.012, M.alu, 0, -0.11 + i * 0.024, 0.062, ssd);
    const ssdTex = textTex(
      512,
      128,
      [
        {
          t: "AQUA NVMe GEN4",
          font: "700 44px " + FONT_MONO,
          y: 80,
          color: "#e6edf4",
        },
      ],
      "#181c24"
    );
    labelPlane(0.52, 0.13, ssdTex, ssd, -0.15, 0, 0.07, { transparent: false });
    ssd.userData.texture = ssdTex;

    /* ───────────────────────── Modular ATX 3.1 PSU ───────────────────────── */
    const psu = new THREE.Group();
    psu.position.set(-1.4, 0.56, -0.33);
    box(1.6, 0.86, 1.5, M.psu, 0, 0, 0, psu);
    const psuTex = textTex(
      512,
      224,
      [
        {
          t: "AQUA",
          font: "800 70px " + FONT_DISPLAY,
          y: 92,
          color: "#00f2fe",
        },
        {
          t: "1000W  ·  80 PLUS PLATINUM",
          font: "600 28px " + FONT_MONO,
          y: 146,
          color: "#f1f5f9",
        },
        {
          t: "FULLY MODULAR  ·  ATX 3.1",
          font: "500 22px " + FONT_MONO,
          y: 186,
          color: "#94a3b8",
        },
      ],
      "#0d1118"
    );
    const psuLabel = labelPlane(1.24, 0.54, psuTex, psu, 0, 0.0, 0.752, {
      transparent: false,
    });
    psu.userData.texture = psuTex;
    psu.userData.label = psuLabel;
    for (let i = 0; i < 6; i++)
      box(0.012, 0.6, 1.3, M.black, 0.4 + i * 0.06, 0, 0, psu).position.x =
        0.802;

    /* ───────────────────────── Chassis ARGB Fans ───────────────────────── */
    const fansFront = [1.85, 3.05, 4.25].map((y, i) => {
      const f = makeFan(1.2, { px: 2.1, py: y, dir: 1 });
      f.rotation.y = Math.PI / 2;
      f.position.set(2.08, y, 0.0);
      f.userData.index = i;
      return f;
    });
    const fanRear = makeFan(1.2, { px: -2.15, py: 3.95, dir: -1 });
    fanRear.rotation.y = Math.PI / 2;
    fanRear.position.set(-2.13, 3.95, 0.05);
    const fansTop = [-1.27, 0, 1.27].map((x) => {
      const f = makeFan(1.2, { px: x, py: 4.55, dir: 1 });
      f.rotation.x = Math.PI / 2;
      f.position.set(x, 4.55, 0.05);
      return f;
    });

    /* ───────────────────────── High-Detail GPU Factory ───────────────────────── */
    const GPU_SPECS = {
      rtx4060: { L: 2.45, H: 1.15, T: 0.42, fans: 2, label: "RTX 4060" },
      rx7800xt: { L: 2.85, H: 1.25, T: 0.55, fans: 3, label: "RX 7800 XT" },
      rtx4070s: { L: 2.95, H: 1.25, T: 0.52, fans: 3, label: "RTX 4070 SUPER" },
      rtx4080s: { L: 3.2, H: 1.36, T: 0.62, fans: 3, label: "RTX 4080 SUPER" },
      rtx4090: { L: 3.4, H: 1.45, T: 0.72, fans: 3, label: "RTX 4090" },
    };
    const SLOT_Y = mobo.position.y - 0.45;

    function gpuPose(spec, mount) {
      if (mount === "vertical") {
        return {
          pos: V3(-2.0 + spec.L / 2, 2.52, 0.55),
          quat: new THREE.Quaternion(),
        };
      }
      return {
        pos: V3(
          -2.2 + spec.L / 2,
          SLOT_Y - spec.T / 2 + 0.02,
          -1.02 + spec.H / 2
        ),
        quat: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(Math.PI / 2, 0, 0)
        ),
      };
    }

    function makeGPU(key, mount) {
      const spec = GPU_SPECS[key] || GPU_SPECS.rtx4090;
      const { L, H, T } = spec;
      const nF = spec.fans;
      const g = new THREE.Group();
      const pose = gpuPose(spec, mount);

      // High-Detail CNC Anodized GPU Backplate Texture (Exposed Core X-Clamp + Flow-Through Vent)
      const bpSurfaceTex = canvasTexture(1024, 512, (ctx, w, h) => {
        ctx.save();
        ctx.translate(w, h);
        ctx.scale(-1, -1);
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, "#141923");
        bg.addColorStop(0.5, "#0d1118");
        bg.addColorStop(1, "#171d28");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Brushed metal hairline strokes
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 3) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Diagonal CNC chamfer grooves
        ctx.strokeStyle = "rgba(0, 242, 254, 0.25)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.42, 24);
        ctx.lineTo(w * 0.54, h - 24);
        ctx.moveTo(w * 0.46, 24);
        ctx.lineTo(w * 0.58, h - 24);
        ctx.stroke();

        // Right-side Flow-Through Exhaust Fin Cutout Grille
        ctx.fillStyle = "#06080d";
        ctx.fillRect(w * 0.62, 64, w * 0.31, h - 128);
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        for (let fx = w * 0.63; fx < w * 0.92; fx += 9) {
          ctx.beginPath();
          ctx.moveTo(fx, 70);
          ctx.lineTo(fx, h - 70);
          ctx.stroke();
        }
        // Copper heatpipes visible through the flow-through cutout
        ctx.fillStyle = "#d47d42";
        [0.3, 0.45, 0.6, 0.7].forEach((py) => {
          ctx.fillRect(w * 0.62, h * py - 5, w * 0.31, 10);
        });
        // Diagonal structural ribs over the vent
        ctx.strokeStyle = "#161b24";
        ctx.lineWidth = 16;
        for (let rx = w * 0.64; rx < w * 0.9; rx += 82) {
          ctx.beginPath();
          ctx.moveTo(rx, 60);
          ctx.lineTo(rx + 48, h - 60);
          ctx.stroke();
        }

        // Exposed GPU Core Retention X-Bracket & SMD Capacitor Array (Left Side)
        const cx = w * 0.24,
          cy = h * 0.5;
        ctx.fillStyle = "#080b10";
        ctx.fillRect(cx - 72, cy - 72, 144, 144);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 5;
        ctx.strokeRect(cx - 68, cy - 68, 136, 136);
        // Gold MLCC capacitor array in center of retention bracket
        ctx.fillStyle = "#d4af37";
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            ctx.fillRect(cx + c * 14 - 5, cy + r * 14 - 3, 10, 6);
          }
        }

        // Silkscreen Branding & Technical Markings
        ctx.fillStyle = "#f8fafc";
        ctx.font = "800 54px " + FONT_DISPLAY;
        ctx.fillText("AQUA " + spec.label, 42, 78);
        ctx.fillStyle = "#00f2fe";
        ctx.font = "700 22px " + FONT_MONO;
        ctx.fillText("HYDRO OC EDITION // PCIe 5.0", 44, 114);
        ctx.fillStyle = "rgba(148,163,184,0.7)";
        ctx.font = "600 16px " + FONT_MONO;
        ctx.fillText("CAUTION: HIGH SURFACE TEMP · 600W 12VHPWR", 44, h - 34);
        ctx.restore();
      });

      const bpMat = new THREE.MeshPhysicalMaterial({
        map: bpSurfaceTex,
        bumpMap: brushedBumpTex,
        bumpScale: 0.003,
        metalness: 0.78,
        roughness: 0.32,
        clearcoat: 0.35,
      });

      const bp = mesh(
        new THREE.BoxGeometry(L, H, 0.03),
        [M.darkAlu, M.darkAlu, M.darkAlu, M.darkAlu, bpMat, bpMat],
        0,
        0,
        -T / 2 + 0.015,
        g
      );
      // Physical 3D Chrome Retention X-Clamp & Glowing ARGB Backplate Strip on Top of Backplate
      box(0.32, 0.32, 0.012, M.chrome, -L * 0.25, 0, -T / 2 - 0.004, g);
      box(0.24, 0.24, 0.016, M.gold, -L * 0.25, 0, -T / 2 - 0.006, g);
      box(
        L * 0.42,
        0.032,
        0.016,
        rgbMat(pose.pos.x, pose.pos.y, 3.4),
        L * 0.16,
        -H * 0.36,
        -T / 2 - 0.005,
        g
      );
      bp.userData.anchor = true;

      // Copper Vapor Chamber Baseplate + PCB
      box(L * 0.94, H * 0.92, 0.022, M.pcbEdge, 0, 0, -T / 2 + 0.05, g);
      box(L * 0.42, H * 0.52, 0.018, M.copper, -L * 0.12, 0, -T / 2 + 0.068, g);

      // High-density aluminum fin stack
      const finCount = Math.floor((L * 0.92) / 0.03);
      const finDepth = Math.max(0.12, T - 0.3);
      const fins = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.008, H * 0.84, finDepth),
        M.alu,
        finCount
      );
      fins.castShadow = true;
      fins.receiveShadow = true;
      const mtx = new THREE.Matrix4();
      const fz = -T / 2 + 0.07 + finDepth / 2;
      for (let i = 0; i < finCount; i++) {
        mtx.makeTranslation(-L * 0.46 + i * 0.03, 0, fz);
        fins.setMatrixAt(i, mtx);
      }
      fins.instanceMatrix.needsUpdate = true;
      g.add(fins);

      // 5 Nickel-Plated Copper Heatpipes
      for (let i = 0; i < 5; i++) {
        const hp = new THREE.CylinderGeometry(0.028, 0.028, L * 0.9, 14);
        hp.rotateZ(Math.PI / 2);
        mesh(
          hp,
          i % 2 === 0 ? M.copper : M.nickel,
          0,
          H * 0.36 - (i % 2) * 0.07,
          -T / 2 + 0.09 + i * (finDepth / 5),
          g
        );
      }

      const fanD = Math.min(H * 0.8, (L * 0.92) / nF);
      const gap = (L * 0.92 - fanD * nF) / Math.max(1, nF - 1);
      const fanXs = [];
      for (let i = 0; i < nF; i++)
        fanXs.push(-L * 0.46 + fanD / 2 + i * (fanD + gap) + 0.02);

      const shape = roundedRectShape(L, H, 0.08);
      fanXs.forEach((x) => {
        const h = new THREE.Path();
        h.absarc(x, 0, fanD * 0.5, 0, Math.PI * 2, false);
        shape.holes.push(h);
      });
      const sg = new THREE.ExtrudeGeometry(shape, {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
        curveSegments: 48,
      });
      mesh(sg, M.gpuShroud, 0, 0, T / 2 - 0.062, g);
      box(L, 0.05, T - 0.06, M.gpuShroud, 0, H / 2 - 0.025, 0.0, g);
      box(L, 0.05, T * 0.5, M.gpuShroud, 0, -H / 2 + 0.025, T * 0.22, g);
      box(0.05, H, T - 0.06, M.gpuShroud, L / 2 - 0.025, 0, 0, g);

      const chev = new THREE.Shape();
      chev.moveTo(-0.05, H * 0.42);
      chev.lineTo(0.07, H * 0.42);
      chev.lineTo(0.02, -H * 0.42);
      chev.lineTo(-0.1, -H * 0.42);
      chev.closePath();
      const chevGeo = new THREE.ExtrudeGeometry(chev, {
        depth: 0.014,
        bevelEnabled: false,
      });
      for (let i = 0; i < nF - 1; i++)
        mesh(
          chevGeo,
          M.silver,
          (fanXs[i] + fanXs[i + 1]) / 2,
          0,
          T / 2 + 0.0,
          g
        );
      box(L * 0.96, 0.025, 0.016, M.silver, 0, H / 2 - 0.07, T / 2 + 0.002, g);
      box(
        L * 0.96,
        0.025,
        0.016,
        M.silver,
        0,
        -H / 2 + 0.07,
        T / 2 + 0.002,
        g
      );

      fanXs.forEach((x, i) => {
        const f = makeFan(fanD * 1.02, {
          frame: false,
          blades: 11,
          px: pose.pos.x + x,
          py: pose.pos.y,
          intensity: 2.5,
          gpu: true,
          dir: i % 2 ? -1 : 1,
        });
        f.position.set(x, 0, T / 2 - 0.1);
        g.add(f);
      });

      const edgeTex = textTex(1024, 128, [
        {
          t: "AQUA  " + spec.label,
          font: "800 74px " + FONT_DISPLAY,
          y: 92,
          color: "#ffffff",
        },
      ]);
      const edgeMat = rgbMat(pose.pos.x, pose.pos.y, 3.4);
      edgeMat.emissiveMap = edgeTex;
      edgeMat.alphaMap = edgeTex;
      edgeMat.transparent = true;
      edgeMat.depthWrite = false;
      const edge = mesh(
        new THREE.PlaneGeometry(L * 0.46, L * 0.0575),
        edgeMat,
        -L * 0.18,
        H / 2 + 0.002,
        T * 0.08,
        g
      );
      edge.rotation.x = -Math.PI / 2;
      edge.userData.noShadow = true;
      box(
        L * 0.28,
        0.016,
        0.04,
        rgbMat(pose.pos.x + L * 0.25, pose.pos.y, 3.2),
        L * 0.24,
        H / 2 + 0.003,
        T * 0.08,
        g
      );
      box(0.025, H * 1.04, T, M.nickel, -L / 2 - 0.012, 0.02, 0, g);
      box(
        L * 0.28,
        0.08,
        0.014,
        M.gold,
        -L / 2 + L * 0.32,
        -H / 2 - 0.04,
        -T / 2 + 0.05,
        g
      );
      box(0.26, 0.08, 0.12, M.plastic, L * 0.15, H / 2 + 0.04, -T / 2 + 0.12, g);

      // 12VHPWR Braided Power Cable + Acrylic Comb
      const conn = V3(L * 0.15, H / 2 + 0.08, -T / 2 + 0.12);
      const inv = new THREE.Matrix4()
        .compose(pose.pos, pose.quat, V3(1, 1, 1))
        .invert();
      const world = conn
        .clone()
        .applyMatrix4(
          new THREE.Matrix4().compose(pose.pos, pose.quat, V3(1, 1, 1))
        );
      let pts;
      if (mount === "vertical") {
        pts = [
          world.clone(),
          world.clone().add(V3(0, 0.2, 0)),
          V3(world.x + 0.1, world.y + 0.35, -0.55),
          V3(0.64, world.y + 0.4, -1.13),
        ];
      } else {
        pts = [
          world.clone(),
          world.clone().add(V3(0, 0, 0.16)),
          V3(world.x + 0.12, world.y - 0.35, world.z + 0.3),
          V3(world.x + 0.28, 1.6, world.z + 0.26),
          V3(world.x + 0.3, 1.2, world.z + 0.2),
        ];
      }
      const local = pts.map((p) => p.clone().applyMatrix4(inv));
      const cableAxis =
        mount === "vertical"
          ? V3(1, 0, 0)
          : V3(1, 0, 0).applyQuaternion(pose.quat.clone().invert());
      const cable = makeBundle(
        local,
        6,
        0.032,
        0.013,
        M.sleeve,
        cableAxis,
        g,
        null
      );
      g.userData = { spec, pose, fanXs, cable, key, mount };
      return g;
    }

    /* ───────────────────────── Dynamic Texture Redraws ───────────────────────── */
    let lcdAcc = 0;
    function updateLCD(dt, t, colorHex, temp, power, boot) {
      lcdAcc += dt;
      if (lcdAcc < 1 / 15) return;
      lcdAcc = 0;
      lcdState.t = t;
      lcdState.temp = temp;
      lcdState.color = colorHex;
      lcdState.power = power;
      lcdState.boot = boot;
      redraw(lcdTex, (g, w, h) => drawLCD(g, w, h, lcdState));
    }

    function setChipset(name) {
      redraw(pcbTex, (g, w, h) => drawPCB(g, w, h, name));
      redraw(chipTex, (g, w, h) => drawChipset(g, w, h, name));
    }
    function setCPULabel(brand, model) {
      redraw(ihsTex, (g, w, h) => drawIHS(g, w, h, brand, model));
    }
    function setSSDLabel(text) {
      redraw(ssdTex, (g, w, h) => {
        g.fillStyle = "#181c24";
        g.fillRect(0, 0, w, h);
        g.font = "700 44px " + FONT_MONO;
        g.fillStyle = "#e6edf4";
        g.textAlign = "center";
        g.fillText(text, w / 2, 80);
        g.textAlign = "left";
      });
    }
    function setPSULabel(watts, rating) {
      redraw(psuTex, (g, w, h) => {
        g.fillStyle = "#0d1118";
        g.fillRect(0, 0, w, h);
        g.textAlign = "center";
        g.font = "800 70px " + FONT_DISPLAY;
        g.fillStyle = "#00f2fe";
        g.fillText("AQUA", w / 2, 92);
        g.font = "600 28px " + FONT_MONO;
        g.fillStyle = "#f1f5f9";
        g.fillText(watts + "W  ·  80 PLUS " + rating, w / 2, 146);
        g.font = "500 22px " + FONT_MONO;
        g.fillStyle = "#94a3b8";
        g.fillText("FULLY MODULAR  ·  ATX 3.1", w / 2, 186);
        g.textAlign = "left";
      });
    }

    function themeTargets(name) {
      const t = THEMES[name] || THEMES.black;
      const pbr = THEME_PBR[name] || THEME_PBR.black;
      return { colors: t, pbr };
    }

    const anchors = {
      cpu: SOCKET_WORLD.clone().add(V3(-0.22, 0.24, 0.25)),
      vrm: V3(-1.27, 4.37, -0.86),
      ram: V3(0.05, 3.58, -0.45),
      pump: SOCKET_WORLD.clone().add(V3(0.0, 0.0, 0.35)),
      gpu: V3(-0.45, 2.15, 0.32),
      radiator: V3(0.0, 4.82, 0.66),
      psu: V3(-1.4, 0.56, 0.76),
      ssd: V3(-1.5, 3.22, -0.95),
    };

    return {
      THREE_VERSION: THREE.REVISION,
      materials: M,
      themes: THEMES,
      themeTargets,
      rgbZones,
      fans,
      parts: {
        caseShell,
        glassSide,
        glassFront,
        topPanel,
        mobo,
        cpu,
        ssd,
        psu,
        ram,
        fansFront,
        fanRear,
        fansTop,
        coolers,
      },
      socketLever: lever,
      cables: { atx: cableATX, eps: cableEPS },
      anchors,
      GPU_SPECS,
      makeGPU,
      gpuPose,
      updateLCD,
      setChipset,
      setCPULabel,
      setSSDLabel,
      setPSULabel,
      canvasTexture,
    };
  }

  window.AquaPCModel = { create };
})();

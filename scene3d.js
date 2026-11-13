/* ==========================================================================
   AQUA PC SOLUTIONS — FULL-PAGE 3D SPATIAL WORLD & PHOTOREALISTIC 3D PC BAY
   Powered by Three.js + window.AquaPCModel (js/pc-model.js)
   ========================================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("pc-builder-canvas");
  const bgCanvas = document.getElementById("bg-ambient-canvas");
  if (typeof THREE === "undefined") return;

  // ==========================================================================
  // PART 1: FULL-VIEWPORT 3D SPATIAL CYBER-LAB WORLD (#bg-ambient-canvas)
  // Makes the entire website a true 3D depth-parallax & scroll-driven experience
  // ==========================================================================
  if (bgCanvas) {
    const bgScene = new THREE.Scene();
    bgScene.fog = new THREE.FogExp2(0x03060d, 0.038);

    const bgCam = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      80
    );
    bgCam.position.set(0, 1.2, 8);

    const bgRenderer = new THREE.WebGLRenderer({
      canvas: bgCanvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    bgRenderer.setSize(window.innerWidth, window.innerHeight);

    // 3D Architectural Cyber Grids (Floor + Ceiling)
    const floorGrid = new THREE.GridHelper(70, 56, 0x00f2fe, 0x0b2239);
    floorGrid.position.y = -4.2;
    floorGrid.material.transparent = true;
    floorGrid.material.opacity = 0.24;
    bgScene.add(floorGrid);

    const ceilingGrid = new THREE.GridHelper(70, 56, 0x10b981, 0x091d2c);
    ceilingGrid.position.y = 6.8;
    ceilingGrid.material.transparent = true;
    ceilingGrid.material.opacity = 0.14;
    bgScene.add(ceilingGrid);

    // Floating 3D Silicon Wafers, Wireframe Rings & Geometric Nodes in 3D Space
    const spatialNodes = [];
    const wireCyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const wireTealMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });

    const nodeGeos = [
      new THREE.IcosahedronGeometry(0.85, 0),
      new THREE.TorusGeometry(1.05, 0.025, 8, 36),
      new THREE.OctahedronGeometry(0.7, 0),
      new THREE.BoxGeometry(0.95, 0.95, 0.12),
    ];

    for (let i = 0; i < 18; i++) {
      const geo = nodeGeos[i % nodeGeos.length];
      const mat = i % 2 === 0 ? wireCyanMat : wireTealMat;
      const m = new THREE.Mesh(geo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      m.position.set(
        side * (4.2 + (i % 4) * 2.4),
        -2.2 + (i % 5) * 1.4,
        -2 - i * 2.1
      );
      m.rotation.set(i * 0.4, i * 0.7, i * 0.2);
      bgScene.add(m);
      spatialNodes.push({
        mesh: m,
        rx: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 3) * 0.08),
        ry: 0.24 + (i % 4) * 0.07,
        baseY: m.position.y,
        phase: i * 0.65,
      });
    }

    // 3D Starfield / Silicon Dust Particles in Depth
    const starCount = 260;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 36;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      starPos[i * 3 + 2] = 6 - Math.random() * 44;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.085,
      transparent: true,
      opacity: 0.55,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    bgScene.add(starPoints);

    let mouseNormX = 0;
    let mouseNormY = 0;
    let scrollDepth = 0;

    window.addEventListener(
      "pointermove",
      (e) => {
        mouseNormX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        mouseNormY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      },
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      () => {
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        scrollDepth = window.scrollY / maxScroll;
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      bgCam.aspect = window.innerWidth / window.innerHeight;
      bgCam.updateProjectionMatrix();
      bgRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    const bgClock = new THREE.Clock();
    function animateBgWorld() {
      requestAnimationFrame(animateBgWorld);
      const t = bgClock.getElapsedTime();

      // Scroll-driven 3D camera flight + mouse parallax
      const targetZ = 8 - scrollDepth * 16;
      const targetX = mouseNormX * 1.15;
      const targetY = 1.2 - mouseNormY * 0.65 - scrollDepth * 0.8;

      bgCam.position.x += (targetX - bgCam.position.x) * 0.05;
      bgCam.position.y += (targetY - bgCam.position.y) * 0.05;
      bgCam.position.z += (targetZ - bgCam.position.z) * 0.06;
      bgCam.lookAt(bgCam.position.x * 0.35, 0.2, bgCam.position.z - 12);

      floorGrid.position.z = ((t * 1.2) % 1.25) - 6;
      ceilingGrid.position.z = ((t * 1.2) % 1.25) - 6;

      for (const n of spatialNodes) {
        n.mesh.rotation.x += 0.004 * n.rx;
        n.mesh.rotation.y += 0.005 * n.ry;
        n.mesh.position.y = n.baseY + Math.sin(t * 1.1 + n.phase) * 0.22;
      }

      bgRenderer.render(bgScene, bgCam);
    }
    animateBgWorld();
  }

  // ==========================================================================
  // PART 2: PHOTOREALISTIC 3D ESD PC BUILDING BAY (#pc-builder-canvas)
  // ==========================================================================
  if (!canvas || !window.AquaPCModel) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040812, 0.022);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(6.4, 3.8, 7.6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // Neutral Photography Studio Softbox HDRI Environment (No unnatural green cast!)
  function buildStudioEnv() {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x050913);

    const addPanel = (w, h, color, x, y, z, lx, ly, lz) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(lx, ly, lz);
      envScene.add(m);
    };

    // Crisp overhead white softbox + cool daylight key + subtle cyan/warm rim reflectors
    addPanel(14, 5, 0xffffff, 0, 9.5, 2.5, 0, 2.5, 0);
    addPanel(11, 4, 0xe0f2fe, 8.5, 4.5, 6.5, 0, 2.5, 0);
    addPanel(11, 3.5, 0xcbd5e1, -8.5, 4.0, 5.5, 0, 2.5, 0);
    addPanel(9, 3, 0x38bdf8, 7, 3.2, -6, 0, 2.5, 0);
    addPanel(8, 2.5, 0xfef3c7, -6.5, 2.2, -6, 0, 2.5, 0);
    addPanel(16, 16, 0x0b1324, 0, -4, 0, 0, 2.5, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(envScene, 0.03).texture;
    pmrem.dispose();
    return envTex;
  }

  scene.environment = buildStudioEnv();

  // Studio Lighting with 2048x2048 Soft Shadow Map
  const hemi = new THREE.HemisphereLight(0xf1f5f9, 0x060b16, 1.05);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.65);
  keyLight.position.set(5.8, 10.2, 7.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 24;
  const d = 6.2;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const rimCyan = new THREE.PointLight(0x00f2fe, 5.2, 18);
  rimCyan.position.set(4.2, 4.0, 3.8);
  scene.add(rimCyan);

  const interiorLight = new THREE.PointLight(0x00f2fe, 4.8, 9.0);
  interiorLight.position.set(-0.35, 2.85, 0.35);
  scene.add(interiorLight);

  const fillCool = new THREE.PointLight(0x93c5fd, 3.4, 16);
  fillCool.position.set(-4.8, 3.2, 4.2);
  scene.add(fillCool);

  // ── Instantiate Photorealistic PC Model from js/pc-model.js ─────────────
  const pc = window.AquaPCModel.create(THREE, { anisotropy: 8 });
  const rigRoot = new THREE.Group();
  scene.add(rigRoot);

  const {
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
  } = pc.parts;

  rigRoot.add(caseShell);
  rigRoot.add(glassSide);
  rigRoot.add(glassFront);
  rigRoot.add(topPanel);
  rigRoot.add(mobo);
  rigRoot.add(cpu);
  rigRoot.add(ssd);
  rigRoot.add(psu);
  ram.forEach((stick) => rigRoot.add(stick));
  fansFront.forEach((f) => rigRoot.add(f));
  rigRoot.add(fanRear);
  fansTop.forEach((f) => rigRoot.add(f));
  Object.values(coolers).forEach((c) => rigRoot.add(c));

  // Tag 3D component groups for Direct 3D Raycast Hover & Click Inspection
  function tagHierarchy(rootObj, info) {
    rootObj.traverse((child) => {
      child.userData.partInfo = info;
    });
  }

  tagHierarchy(cpu, {
    cat: "cpu",
    preset: "cpu",
    title: "Processor & LGA Socket",
    sub: "Click to swap Intel Core i9/i7 or AMD Ryzen 9/7 3D V-Cache",
  });
  Object.values(coolers).forEach((c) =>
    tagHierarchy(c, {
      cat: "cooler",
      preset: "cooling",
      title: "Cryo Liquid AIO & Radiator Loop",
      sub: "Click to switch between 360mm LCD AIO, 240mm AIO, or Dual-Tower Air",
    })
  );
  ram.forEach((stick) =>
    tagHierarchy(stick, {
      cat: "ram",
      preset: "ram",
      title: "DDR5-6400 CL30 ARGB Memory",
      sub: "Click to toggle 64GB (4×16GB Quad DIMM) or 32GB (2×16GB Dual Channel)",
    })
  );
  tagHierarchy(ssd, {
    cat: "ssd",
    preset: "gpu",
    title: "PCIe Gen4/Gen5 NVMe M.2 SSD",
    sub: "High-speed NVMe solid state storage under CNC aluminum thermal guard",
  });
  tagHierarchy(psu, {
    cat: "psu",
    preset: "psu",
    title: "1000W 80+ Platinum ATX 3.1 PSU",
    sub: "Fully modular power supply with braided 12VHPWR & 24-pin cables",
  });
  tagHierarchy(mobo, {
    cat: "cpu",
    preset: "cpu",
    title: "Aqua Hydro ATX Motherboard",
    sub: "20+2 Phase VRM, PCIe 5.0 x16 steel slot & onboard POST code display",
  });
  tagHierarchy(glassSide, {
    cat: "glass",
    preset: "full",
    title: "Tempered Glass Side Showcase Panel",
    sub: "Click to slide open or close the 4mm beveled tempered glass panel",
  });

  // ── Full 3D ESD-Safe PC Building Bay & Diagnostic Workbench ─────────────
  const bayGroup = new THREE.Group();
  scene.add(bayGroup);

  const esdMatTex = pc.canvasTexture(2048, 1024, (g, w, h) => {
    const grad = g.createRadialGradient(
      w * 0.5,
      h * 0.5,
      80,
      w * 0.5,
      h * 0.5,
      w * 0.65
    );
    grad.addColorStop(0, "#0c1629");
    grad.addColorStop(0.6, "#080f1d");
    grad.addColorStop(1, "#04070f");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Precision millimeter ESD grid
    g.strokeStyle = "rgba(0, 242, 254, 0.08)";
    g.lineWidth = 1;
    const step = 32;
    for (let x = 0; x <= w; x += step) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }

    // Outer technical frame
    g.strokeStyle = "rgba(0, 242, 254, 0.42)";
    g.lineWidth = 3;
    g.strokeRect(36, 36, w - 72, h - 72);

    // Front ruler markings
    g.fillStyle = "rgba(226, 232, 240, 0.6)";
    g.font = '600 18px "JetBrains Mono", monospace';
    for (let x = 80; x <= w - 80; x += 16) {
      const major = (x - 80) % 80 === 0;
      const tickH = major ? 22 : 10;
      g.fillRect(x, h - 36 - tickH, 2, tickH);
      if (major) {
        const cm = ((x - 80) / 16) | 0;
        g.fillText(cm + "cm", x - 14, h - 66);
      }
    }

    // Center chassis footprint target reticle
    g.strokeStyle = "rgba(0, 242, 254, 0.35)";
    g.setLineDash([14, 8]);
    g.lineWidth = 2.5;
    g.strokeRect(w * 0.27, h * 0.2, w * 0.46, h * 0.56);
    g.setLineDash([]);

    // Left Tool Staging Zone & Right Oscilloscope Zone
    g.strokeStyle = "rgba(0, 242, 254, 0.3)";
    g.lineWidth = 2;
    g.strokeRect(72, h * 0.24, 370, h * 0.52);
    g.strokeRect(w - 442, h * 0.24, 370, h * 0.52);

    g.fillStyle = "rgba(0, 242, 254, 0.78)";
    g.font = '700 22px "JetBrains Mono", monospace';
    g.fillText("ESD-SAFE BAY 01 // 1MΩ GROUNDED", 74, 80);
    g.fillText("AQUA PC SOLUTIONS · EMBILIPITIYA LAB", w - 555, 80);

    g.fillStyle = "rgba(148, 163, 184, 0.6)";
    g.font = '600 18px "JetBrains Mono", monospace';
    g.fillText("[ CNC TOOLS & CRYO PASTE ]", 104, h * 0.29);
    g.fillText("[ 12VHPWR RAIL ANALYZER ]", w - 405, h * 0.29);
  });

  const benchMat = new THREE.MeshPhysicalMaterial({
    color: 0x070b14,
    metalness: 0.42,
    roughness: 0.26,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
  });
  const benchTable = new THREE.Mesh(
    new THREE.BoxGeometry(12.6, 0.24, 6.8),
    benchMat
  );
  benchTable.position.set(0, -0.23, 0.15);
  benchTable.receiveShadow = true;
  bayGroup.add(benchTable);

  const esdPadMat = new THREE.MeshPhysicalMaterial({
    map: esdMatTex,
    roughness: 0.38,
    metalness: 0.12,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
  });
  const esdPad = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.025, 4.9),
    esdPadMat
  );
  esdPad.position.set(0, -0.098, 0.18);
  esdPad.receiveShadow = true;
  bayGroup.add(esdPad);

  // Illuminated ARGB Pedestal Ring Under Chassis + Workbench Front Underglow
  const benchLedMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
  const benchFrontLed = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, 0.03, 0.038),
    benchLedMat
  );
  benchFrontLed.position.set(0, -0.14, 3.56);
  bayGroup.add(benchFrontLed);

  const chassisPedestalRing = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.63, 64),
    benchLedMat
  );
  chassisPedestalRing.rotation.x = -Math.PI / 2;
  chassisPedestalRing.position.set(0, -0.082, 0.0);
  bayGroup.add(chassisPedestalRing);

  // Brass ESD Grounding Snap Studs
  [
    [-4.85, 2.42],
    [4.85, 2.42],
  ].forEach(([gx, gz]) => {
    const stud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.03, 24),
      pc.materials.gold
    );
    stud.position.set(gx, -0.075, gz);
    bayGroup.add(stud);
  });

  // Left Staging Zone: Magnetic Screw Tray, Thermal Paste Syringe & CNC Driver
  const screwTrayGroup = new THREE.Group();
  screwTrayGroup.position.set(-3.55, -0.06, 0.85);
  bayGroup.add(screwTrayGroup);

  const trayBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.06, 1.35),
    pc.materials.darkAlu
  );
  trayBase.castShadow = true;
  trayBase.receiveShadow = true;
  screwTrayGroup.add(trayBase);

  const trayWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.065, 1.22),
    pc.materials.chassis
  );
  trayWell.position.y = 0.008;
  screwTrayGroup.add(trayWell);

  for (let i = 0; i < 6; i++) {
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.09, 14),
      i % 2 === 0 ? pc.materials.chrome : pc.materials.gold
    );
    screw.position.set(
      -0.22 + (i % 2) * 0.42,
      0.055,
      -0.42 + Math.floor(i / 2) * 0.38
    );
    screw.rotation.z = Math.PI / 2 + i * 0.3;
    screw.rotation.y = i * 0.5;
    screwTrayGroup.add(screw);
  }

  const syringeGroup = new THREE.Group();
  syringeGroup.position.set(-3.65, 0.01, -0.55);
  syringeGroup.rotation.y = 0.38;
  bayGroup.add(syringeGroup);

  const syringeBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.72, 24),
    pc.materials.silver
  );
  syringeBarrel.rotation.z = Math.PI / 2;
  syringeBarrel.castShadow = true;
  syringeGroup.add(syringeBarrel);

  const syringeBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.24, 24),
    benchLedMat
  );
  syringeBand.rotation.z = Math.PI / 2;
  syringeGroup.add(syringeBand);

  const syringePlunger = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.45, 16),
    pc.materials.darkAlu
  );
  syringePlunger.rotation.z = Math.PI / 2;
  syringePlunger.position.x = -0.45;
  syringeGroup.add(syringePlunger);

  const syringeTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.05, 0.18, 16),
    pc.materials.plastic
  );
  syringeTip.rotation.z = -Math.PI / 2;
  syringeTip.position.x = 0.44;
  syringeGroup.add(syringeTip);

  const driverGroup = new THREE.Group();
  driverGroup.position.set(-3.12, 0.01, -0.45);
  driverGroup.rotation.y = -0.22;
  bayGroup.add(driverGroup);

  const driverHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.82, 20),
    pc.materials.darkAlu
  );
  driverHandle.rotation.z = Math.PI / 2;
  driverHandle.castShadow = true;
  driverGroup.add(driverHandle);

  const driverCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.1, 20),
    pc.materials.gold
  );
  driverCap.rotation.z = Math.PI / 2;
  driverCap.position.x = -0.46;
  driverGroup.add(driverCap);

  const driverShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.65, 14),
    pc.materials.chrome
  );
  driverShaft.rotation.z = Math.PI / 2;
  driverShaft.position.x = 0.72;
  driverGroup.add(driverShaft);

  // Right Staging Zone: 3D Digital Power-Rail Oscilloscope & Probe Analyzer
  const scopeGroup = new THREE.Group();
  scopeGroup.position.set(3.55, 0.22, 0.65);
  scopeGroup.rotation.y = -0.42;
  bayGroup.add(scopeGroup);

  const scopeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.62, 0.55),
    pc.materials.darkAlu
  );
  scopeBody.castShadow = true;
  scopeBody.receiveShadow = true;
  scopeGroup.add(scopeBody);

  const scopeScreenTex = pc.canvasTexture(256, 144, (g, w, h) => {
    g.fillStyle = "#030a14";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0, 242, 254, 0.35)";
    g.lineWidth = 2;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = "#00f2fe";
    g.font = '700 14px "JetBrains Mono", monospace';
    g.fillText("12VHPWR RAIL // 12.04V", 12, 24);
    g.fillStyle = "#10b981";
    g.fillText("RIPPLE: 0.8mV [PASS]", 12, 44);
    g.strokeStyle = "#10b981";
    g.lineWidth = 2.5;
    g.beginPath();
    for (let x = 12; x < w - 12; x += 4) {
      const y = 96 + Math.sin(x * 0.08) * 16 + Math.cos(x * 0.2) * 5;
      if (x === 12) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  });

  const scopeScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.44),
    new THREE.MeshBasicMaterial({ map: scopeScreenTex })
  );
  scopeScreen.position.set(-0.1, 0.02, 0.278);
  scopeGroup.add(scopeScreen);

  // Knobs on right of oscilloscope
  [0.14, -0.02, -0.18].forEach((ky, idx) => {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.04, 18),
      idx === 0 ? pc.materials.gold : pc.materials.chrome
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.42, ky, 0.285);
    scopeGroup.add(knob);
  });

  // Overhead Studio Light Gantry Bridge
  const gantryArch = new THREE.Group();
  bayGroup.add(gantryArch);

  [-5.1, 5.1].forEach((px) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 6.8, 20),
      pc.materials.darkAlu
    );
    pillar.position.set(px, 3.3, -1.95);
    gantryArch.add(pillar);
  });

  const crossBeam = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 0.13, 0.2),
    pc.materials.darkAlu
  );
  crossBeam.position.set(0, 6.65, -1.95);
  gantryArch.add(crossBeam);

  const overheadLedBar = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.045, 0.26),
    new THREE.MeshBasicMaterial({ color: 0xe0f7ff })
  );
  overheadLedBar.position.set(0, 6.58, -1.75);
  gantryArch.add(overheadLedBar);

  // Dual 3D Rear Diagnostic Monitors (Right Telemetry OS + Left 3DMark FPS Monitor)
  const monitorState = {
    cpu: "INTEL CORE i9-14900K",
    gpu: "NVIDIA RTX 4090 24GB",
    cooler: "AQUA HYDRO 360MM LCD",
    stepText: "STAGE 8/8 · SYSTEM ONLINE",
    temp: 32,
    cp2077Fps: 138,
    cs2Fps: 540,
    watts: 788,
  };

  const bayMonitorTex = pc.canvasTexture(512, 320, (g, w, h) =>
    drawBayMonitor(g, w, h, monitorState, 0)
  );

  function drawBayMonitor(g, w, h, ms, t) {
    g.fillStyle = "#040915";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0, 242, 254, 0.5)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);

    g.fillStyle = "rgba(0, 242, 254, 0.16)";
    g.fillRect(14, 14, w - 28, 38);
    g.fillStyle = "#00f2fe";
    g.font = '700 18px "JetBrains Mono", monospace';
    g.fillText("AQUA LAB // BENCH TELEMETRY OS v5.2", 24, 39);

    g.fillStyle = "#cbd5e1";
    g.font = '600 15px "JetBrains Mono", monospace';
    g.fillText("CPU UNIT : " + ms.cpu, 24, 84);
    g.fillText("GPU CORE : " + ms.gpu, 24, 112);
    g.fillText("THERMALS : " + ms.cooler, 24, 140);

    g.fillStyle = "#10b981";
    g.font = '700 16px "JetBrains Mono", monospace';
    g.fillText("STATUS   : " + ms.stepText, 24, 174);

    // Live oscilloscope sine wave on the 3D monitor
    g.strokeStyle = "#00f2fe";
    g.lineWidth = 2.5;
    g.beginPath();
    for (let x = 24; x < w - 24; x += 6) {
      const y =
        246 +
        Math.sin(x * 0.04 + t * 4.2) * 20 +
        Math.cos(x * 0.09 - t * 2.5) * 9;
      if (x === 24) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();

    g.fillStyle = "#f8fafc";
    g.font = '800 28px "Syne", sans-serif';
    g.textAlign = "right";
    g.fillText(Math.round(ms.temp) + "°C CRYO", w - 24, 88);
    g.fillStyle = "#00f2fe";
    g.font = '700 18px "JetBrains Mono", monospace';
    g.fillText(ms.cp2077Fps + " FPS 4K RT", w - 24, 120);
    g.textAlign = "left";
  }

  const monitorFrame = new THREE.Group();
  monitorFrame.position.set(3.75, 2.55, -1.55);
  monitorFrame.rotation.y = -0.38;
  bayGroup.add(monitorFrame);

  const monBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 1.54, 0.06),
    pc.materials.chassis
  );
  monBack.castShadow = true;
  monitorFrame.add(monBack);

  const monScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.34, 1.44),
    new THREE.MeshBasicMaterial({ map: bayMonitorTex })
  );
  monScreen.position.z = 0.034;
  monitorFrame.add(monScreen);

  const monStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 2.65, 16),
    pc.materials.darkAlu
  );
  monStand.position.set(0, -1.3, -0.08);
  monitorFrame.add(monStand);

  // Left Rear 3D Benchmark & Stress-Test Display Screen
  const leftMonTex = pc.canvasTexture(384, 512, (g, w, h) =>
    drawLeftMonitor(g, w, h, monitorState)
  );

  function drawLeftMonitor(g, w, h, ms) {
    g.fillStyle = "#040814";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(16, 185, 129, 0.45)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);

    g.fillStyle = "rgba(16, 185, 129, 0.16)";
    g.fillRect(14, 14, w - 28, 42);
    g.fillStyle = "#10b981";
    g.font = '700 17px "JetBrains Mono", monospace';
    g.fillText("3DMARK // FURMARK QA PASS", 22, 40);

    g.fillStyle = "#94a3b8";
    g.font = '600 15px "JetBrains Mono", monospace';
    g.fillText("CYBERPUNK 2077 (4K RT)", 22, 96);
    g.fillStyle = "#00f2fe";
    g.font = '800 34px "Syne", sans-serif';
    g.fillText(ms.cp2077Fps + " FPS", 22, 136);
    g.fillStyle = "#0f172a";
    g.fillRect(22, 152, w - 44, 14);
    g.fillStyle = "#00f2fe";
    g.fillRect(22, 152, Math.min(w - 44, (ms.cp2077Fps / 145) * (w - 44)), 14);

    g.fillStyle = "#94a3b8";
    g.font = '600 15px "JetBrains Mono", monospace';
    g.fillText("CS2 / VALORANT (1440P)", 22, 216);
    g.fillStyle = "#10b981";
    g.font = '800 34px "Syne", sans-serif';
    g.fillText(ms.cs2Fps + " FPS", 22, 256);
    g.fillStyle = "#0f172a";
    g.fillRect(22, 272, w - 44, 14);
    g.fillStyle = "#10b981";
    g.fillRect(22, 272, Math.min(w - 44, (ms.cs2Fps / 560) * (w - 44)), 14);

    g.fillStyle = "#f8fafc";
    g.font = '700 16px "JetBrains Mono", monospace';
    g.fillText("EST. SYSTEM LOAD: " + ms.watts + "W", 22, 344);
    g.fillStyle = "#38bdf8";
    g.fillText("FRAME STABILITY : 99.4%", 22, 376);
    g.fillStyle = "#a7f3d0";
    g.fillText("WARRANTY        : 06 MONTHS", 22, 408);
    g.fillStyle = "rgba(148,163,184,0.7)";
    g.font = '500 14px "JetBrains Mono", monospace';
    g.fillText("CLICK ANY 3D PART TO SWAP", 22, 468);
  }

  const leftMonGroup = new THREE.Group();
  leftMonGroup.position.set(-3.75, 2.65, -1.45);
  leftMonGroup.rotation.y = 0.38;
  bayGroup.add(leftMonGroup);

  const leftMonBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 2.08, 0.06),
    pc.materials.chassis
  );
  leftMonBack.castShadow = true;
  leftMonGroup.add(leftMonBack);

  const leftMonScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.44, 1.96),
    new THREE.MeshBasicMaterial({ map: leftMonTex })
  );
  leftMonScreen.position.z = 0.034;
  leftMonGroup.add(leftMonScreen);

  const leftMonStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 2.7, 16),
    pc.materials.darkAlu
  );
  leftMonStand.position.set(0, -1.35, -0.08);
  leftMonGroup.add(leftMonStand);

  // Save rest positions of PC parts for Exploded View & Physical Fly-In Assembly
  const restPos = new Map();
  function recordRest(obj) {
    restPos.set(obj, obj.position.clone());
  }
  [
    caseShell,
    glassSide,
    glassFront,
    topPanel,
    mobo,
    cpu,
    ssd,
    psu,
    fanRear,
    ...ram,
    ...fansFront,
    ...fansTop,
    ...Object.values(coolers),
  ].forEach(recordRest);

  // ── 3D Airflow Streamlines Group (Toggleable) ───────────────────────────
  const airflowGroup = new THREE.Group();
  airflowGroup.visible = false;
  rigRoot.add(airflowGroup);

  const airflowParticles = [];
  const streamPaths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.5, 1.85, 0.2),
      new THREE.Vector3(0.6, 2.1, 0.1),
      new THREE.Vector3(-1.1, 2.7, -0.1),
      new THREE.Vector3(-2.4, 3.95, 0.05),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.5, 3.05, 0.1),
      new THREE.Vector3(0.4, 3.25, 0.0),
      new THREE.Vector3(-1.0, 3.85, -0.2),
      new THREE.Vector3(-1.2, 5.1, 0.05),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.5, 4.25, -0.1),
      new THREE.Vector3(0.8, 4.35, 0.05),
      new THREE.Vector3(0.0, 5.1, 0.05),
    ]),
  ];

  streamPaths.forEach((curve) => {
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.018, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.3,
    });
    airflowGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

    const arrowGeo = new THREE.SphereGeometry(0.052, 12, 12);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(
        arrowGeo,
        new THREE.MeshBasicMaterial({ color: 0x00f2fe })
      );
      airflowGroup.add(m);
      airflowParticles.push({ mesh: m, curve, offset: i / 6 });
    }
  });

  // ── Builder State, Fly-In Physics & GPU Management ──────────────────────
  const state = {
    cpu: "i9-14900k",
    cooler: "aio360",
    gpu: "rtx4090",
    gpuMount: "horizontal",
    ram: "64gb-4x16",
    ssd: "2tb-gen4",
    psu: "1000w",
    theme: "black",
    rgbColor: "#00f2fe",
    rgbRainbow: false,
    exploded: false,
    glassOpen: false,
    airflow: false,
    bayVisible: true,
    pinsVisible: true,
    powerOn: true,
    buildStep: 8,
    fanRpmMult: 1.25,
  };

  const flyIn = {
    mobo: 1,
    cpu: 1,
    ssd: 1,
    ram: 1,
    cooler: 1,
    gpu: 1,
    psu: 1,
  };

  let activeGpuMesh = null;

  function rebuildGPU(animateFlyIn = false) {
    if (activeGpuMesh) {
      for (let i = pc.fans.length - 1; i >= 0; i--) {
        if (pc.fans[i].userData && pc.fans[i].userData.gpu) {
          pc.fans.splice(i, 1);
        }
      }
      rigRoot.remove(activeGpuMesh);
    }
    activeGpuMesh = pc.makeGPU(state.gpu, state.gpuMount);
    const pose = activeGpuMesh.userData.pose;
    activeGpuMesh.position.copy(pose.pos);
    activeGpuMesh.quaternion.copy(pose.quat);
    recordRest(activeGpuMesh);

    const gpuNames = {
      rtx4090: "NVIDIA RTX 4090 24GB GDDR6X",
      rtx4080s: "NVIDIA RTX 4080 SUPER 16GB",
      rtx4070s: "NVIDIA RTX 4070 SUPER 12GB",
      rx7800xt: "AMD Radeon RX 7800 XT 16GB",
      rtx4060: "NVIDIA RTX 4060 8GB",
    };
    tagHierarchy(activeGpuMesh, {
      cat: "gpu",
      preset: "gpu",
      title: gpuNames[state.gpu] || "PCIe 5.0 Graphics Accelerator",
      sub: "Click to swap GPU model or toggle Horizontal / Vertical Showcase mount",
    });

    rigRoot.add(activeGpuMesh);
    if (animateFlyIn) flyIn.gpu = 0;
  }

  rebuildGPU(false);

  function syncCoolerVisibility() {
    Object.entries(coolers).forEach(([key, grp]) => {
      grp.visible = key === state.cooler && state.buildStep >= 6;
    });
    fansTop.forEach((f, idx) => {
      if (state.cooler === "aio240" && idx === 0) {
        f.visible = false;
      } else {
        f.visible = state.buildStep >= 1;
      }
    });
  }

  function syncRamVisibility() {
    const is4Sticks = state.ram === "64gb-4x16";
    ram.forEach((stick, idx) => {
      if (state.buildStep < 5) {
        stick.visible = false;
      } else {
        stick.visible = is4Sticks ? true : idx === 1 || idx === 3;
      }
    });
  }

  function applyStepVisibility(prevStep) {
    const s = state.buildStep;
    caseShell.visible = s >= 1;
    topPanel.visible = s >= 1;
    fansFront.forEach((f) => (f.visible = s >= 1));
    fanRear.visible = s >= 1;

    mobo.visible = s >= 2;
    cpu.visible = s >= 3;
    ssd.visible = s >= 4;
    syncRamVisibility();
    syncCoolerVisibility();
    if (activeGpuMesh) activeGpuMesh.visible = s >= 7;
    psu.visible = s >= 8;
    glassSide.visible = s >= 8;
    glassFront.visible = s >= 8;

    if (prevStep !== undefined && s > prevStep) {
      if (s === 2) flyIn.mobo = 0;
      if (s === 3) flyIn.cpu = 0;
      if (s === 4) flyIn.ssd = 0;
      if (s === 5) flyIn.ram = 0;
      if (s === 6) flyIn.cooler = 0;
      if (s === 7) flyIn.gpu = 0;
      if (s === 8) flyIn.psu = 0;
    }

    monitorState.stepText = `STAGE ${s}/8 · ${s === 8 ? "SYSTEM ONLINE" : "ASSEMBLING"
      }`;
  }

  applyStepVisibility(8);

  // ── Camera Orbit, Zoom & Smooth Focus Controller ────────────────────────
  const CAMERA_PRESETS = {
    full: { theta: 0.56, phi: 1.28, radius: 9.5, target: [0.0, 2.42, 0.0] },
    bay: { theta: 0.42, phi: 1.2, radius: 11.4, target: [0.0, 2.25, 0.1] },
    cpu: { theta: 0.22, phi: 1.32, radius: 4.1, target: [-0.95, 3.85, -0.4] },
    gpu: { theta: 0.35, phi: 1.42, radius: 4.6, target: [-0.45, 2.25, 0.0] },
    ram: { theta: -0.25, phi: 1.32, radius: 3.9, target: [-0.25, 3.85, -0.5] },
    cooling: { theta: 0.52, phi: 1.16, radius: 5.4, target: [0.0, 4.25, 0.0] },
    psu: { theta: 0.4, phi: 1.5, radius: 4.9, target: [-0.6, 0.9, 0.2] },
  };

  const camCtrl = {
    theta: CAMERA_PRESETS.full.theta,
    phi: CAMERA_PRESETS.full.phi,
    radius: CAMERA_PRESETS.full.radius,
    target: new THREE.Vector3(...CAMERA_PRESETS.full.target),
    curTheta: CAMERA_PRESETS.full.theta,
    curPhi: CAMERA_PRESETS.full.phi,
    curRadius: CAMERA_PRESETS.full.radius,
    curTarget: new THREE.Vector3(...CAMERA_PRESETS.full.target),
    dragging: false,
    downX: 0,
    downY: 0,
    lastX: 0,
    lastY: 0,
    movedDist: 0,
    autoOrbit: true,
  };

  // ── Direct 3D Raycast Component Hover & Click Selection ─────────────────
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const hoverTooltipEl = document.getElementById("viewport-hover-tooltip");
  const hoverTitleEl = document.getElementById("hover-tooltip-title");
  const hoverSubEl = document.getElementById("hover-tooltip-sub");

  // 3D Glowing Selection Box Highlight
  const hoverBoxHelper = new THREE.BoxHelper(mobo, 0x00f2fe);
  hoverBoxHelper.material.transparent = true;
  hoverBoxHelper.material.opacity = 0.65;
  hoverBoxHelper.visible = false;
  scene.add(hoverBoxHelper);

  let hoveredPartInfo = null;

  function getInteractiveMeshes() {
    const list = [];
    if (activeGpuMesh && activeGpuMesh.visible) list.push(activeGpuMesh);
    ram.forEach((r) => {
      if (r.visible) list.push(r);
    });
    Object.values(coolers).forEach((c) => {
      if (c.visible) list.push(c);
    });
    if (cpu.visible) list.push(cpu);
    if (ssd.visible) list.push(ssd);
    if (psu.visible) list.push(psu);
    if (mobo.visible) list.push(mobo);
    return list;
  }

  function findPartGroup(obj) {
    let cur = obj;
    while (cur && cur !== rigRoot && cur.parent !== rigRoot) {
      cur = cur.parent;
    }
    return cur;
  }

  canvas.addEventListener("pointerdown", (e) => {
    camCtrl.dragging = true;
    camCtrl.autoOrbit = false;
    camCtrl.downX = e.clientX;
    camCtrl.downY = e.clientY;
    camCtrl.lastX = e.clientX;
    camCtrl.lastY = e.clientY;
    camCtrl.movedDist = 0;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (camCtrl.dragging) {
      const dx = e.clientX - camCtrl.lastX;
      const dy = e.clientY - camCtrl.lastY;
      camCtrl.movedDist += Math.hypot(dx, dy);
      camCtrl.lastX = e.clientX;
      camCtrl.lastY = e.clientY;

      camCtrl.theta -= dx * 0.0065;
      camCtrl.phi = Math.max(0.42, Math.min(1.62, camCtrl.phi - dy * 0.0055));
      if (hoverTooltipEl) hoverTooltipEl.classList.remove("visible");
      return;
    }

    // Raycast 3D PC Components on Hover
    pointerNDC.x = (localX / Math.max(1, rect.width)) * 2 - 1;
    pointerNDC.y = -(localY / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);

    const hits = raycaster.intersectObjects(getInteractiveMeshes(), true);
    const hit = hits.find(
      (h) => h.object && h.object.userData && h.object.userData.partInfo
    );

    if (hit) {
      const info = hit.object.userData.partInfo;
      hoveredPartInfo = info;
      canvas.style.cursor = "pointer";

      const grp = findPartGroup(hit.object);
      if (grp) {
        hoverBoxHelper.setFromObject(grp);
        hoverBoxHelper.visible = true;
      }

      if (hoverTooltipEl && hoverTitleEl && hoverSubEl) {
        hoverTitleEl.textContent = info.title;
        hoverSubEl.textContent = info.sub;
        hoverTooltipEl.style.transform = `translate3d(${Math.min(
          rect.width - 250,
          Math.max(12, localX + 16)
        )}px, ${Math.min(
          rect.height - 80,
          Math.max(12, localY - 18)
        )}px, 0)`;
        hoverTooltipEl.classList.add("visible");
      }
    } else {
      hoveredPartInfo = null;
      hoverBoxHelper.visible = false;
      canvas.style.cursor = "grab";
      if (hoverTooltipEl) hoverTooltipEl.classList.remove("visible");
    }
  });

  const endDrag = (e) => {
    if (camCtrl.dragging && camCtrl.movedDist < 6 && hoveredPartInfo) {
      // User clicked directly on a 3D PC part!
      focusPreset(hoveredPartInfo.preset || "full");
      window.dispatchEvent(
        new CustomEvent("aqua:part-clicked-3d", {
          detail: hoveredPartInfo,
        })
      );
    }
    camCtrl.dragging = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    hoverBoxHelper.visible = false;
    if (hoverTooltipEl) hoverTooltipEl.classList.remove("visible");
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      camCtrl.autoOrbit = false;
      camCtrl.radius = Math.max(
        3.2,
        Math.min(13.5, camCtrl.radius + e.deltaY * 0.004)
      );
    },
    { passive: false }
  );

  function focusPreset(name) {
    const p = CAMERA_PRESETS[name] || CAMERA_PRESETS.full;
    camCtrl.autoOrbit = name === "full" || name === "bay";
    camCtrl.theta = p.theta;
    camCtrl.phi = p.phi;
    camCtrl.radius = p.radius;
    camCtrl.target.set(p.target[0], p.target[1], p.target[2]);
  }

  // ── Public API Exposed to UI (window.AquaBuilder3D) ─────────────────────
  window.AquaBuilder3D = {
    state,
    focusPreset,

    zoom(delta) {
      camCtrl.autoOrbit = false;
      camCtrl.radius = Math.max(3.2, Math.min(13.5, camCtrl.radius + delta));
    },

    updateTelemetryBench(cpFps, csFps, watts) {
      monitorState.cp2077Fps = cpFps;
      monitorState.cs2Fps = csFps;
      monitorState.watts = watts;
      const g = leftMonTex.userData.ctx;
      const c = leftMonTex.userData.canvas;
      drawLeftMonitor(g, c.width, c.height, monitorState);
      leftMonTex.needsUpdate = true;
    },

    setPart(category, value, skipCameraFocus) {
      state[category] = value;

      if (category === "cpu") {
        const modelMap = {
          "i9-14900k": ["INTEL® CORE™", "i9-14900K", "Z790"],
          "i7-14700k": ["INTEL® CORE™", "i7-14700K", "Z790"],
          "ryzen-7950x3d": ["AMD RYZEN™ 9", "7950X3D", "X670E"],
          "ryzen-7800x3d": ["AMD RYZEN™ 7", "7800X3D", "B650E"],
        };
        const [brand, mod, chip] = modelMap[value] || modelMap["i9-14900k"];
        pc.setCPULabel(brand, mod);
        pc.setChipset(chip);
        monitorState.cpu = `${brand} ${mod}`;
        flyIn.cpu = 0;
        if (!skipCameraFocus) focusPreset("cpu");
      } else if (category === "cooler") {
        syncCoolerVisibility();
        monitorState.cooler =
          value === "air"
            ? "DUAL-TOWER 6-PIPE AIR"
            : value === "aio240"
              ? "AQUA HYDRO 240MM AIO"
              : "AQUA HYDRO 360MM LCD";
        flyIn.cooler = 0;
        if (!skipCameraFocus) focusPreset("cooling");
      } else if (category === "gpu" || category === "gpuMount") {
        rebuildGPU(true);
        applyStepVisibility();
        const gpuNames = {
          rtx4090: "NVIDIA RTX 4090 24GB",
          rtx4080s: "RTX 4080 SUPER 16GB",
          rtx4070s: "RTX 4070 SUPER 12GB",
          rx7800xt: "RADEON RX 7800 XT 16GB",
          rtx4060: "NVIDIA RTX 4060 8GB",
        };
        monitorState.gpu = gpuNames[state.gpu] || state.gpu;
        if (!skipCameraFocus) focusPreset("gpu");
      } else if (category === "ram") {
        syncRamVisibility();
        flyIn.ram = 0;
        if (!skipCameraFocus) focusPreset("ram");
      } else if (category === "ssd") {
        const labels = {
          "1tb-gen4": "AQUA 1TB GEN4",
          "2tb-gen4": "AQUA 2TB PRO",
          "4tb-gen5": "AQUA 4TB GEN5",
        };
        pc.setSSDLabel(labels[value] || "AQUA NVMe GEN4");
        flyIn.ssd = 0;
        if (!skipCameraFocus) focusPreset("gpu");
      } else if (category === "psu") {
        const map = {
          "850w": ["850", "GOLD"],
          "1000w": ["1000", "PLATINUM"],
          "1200w": ["1200", "TITANIUM"],
        };
        const [w, r] = map[value] || map["1000w"];
        pc.setPSULabel(w, r);
        flyIn.psu = 0;
        if (!skipCameraFocus) focusPreset("psu");
      } else if (category === "theme") {
        const t = pc.themeTargets(value);
        Object.entries(t.colors).forEach(([matKey, hex]) => {
          if (pc.materials[matKey]) pc.materials[matKey].color.setHex(hex);
        });
      }
    },

    setRGB(hexOrRainbow) {
      if (hexOrRainbow === "rainbow") {
        state.rgbRainbow = true;
      } else {
        state.rgbRainbow = false;
        state.rgbColor = hexOrRainbow;
        const c = new THREE.Color(hexOrRainbow);
        pc.rgbZones.forEach((z) => {
          if (z.isHalo) z.mat.color.copy(c);
          else z.mat.emissive.copy(c);
        });
        rimCyan.color.copy(c);
        interiorLight.color.copy(c);
        benchLedMat.color.copy(c);
        hoverBoxHelper.material.color.copy(c);
      }
    },

    toggleExploded() {
      state.exploded = !state.exploded;
      if (state.exploded) focusPreset("full");
      return state.exploded;
    },

    toggleGlass() {
      state.glassOpen = !state.glassOpen;
      return state.glassOpen;
    },

    toggleAirflow() {
      state.airflow = !state.airflow;
      airflowGroup.visible = state.airflow;
      return state.airflow;
    },

    toggleBayEnvironment() {
      state.bayVisible = !state.bayVisible;
      bayGroup.visible = state.bayVisible;
      return state.bayVisible;
    },

    togglePower() {
      state.powerOn = !state.powerOn;
      return state.powerOn;
    },

    setBuildStep(stepNum) {
      const prev = state.buildStep;
      state.buildStep = Math.max(1, Math.min(8, parseInt(stepNum, 10) || 8));
      applyStepVisibility(prev);

      const stepFocusMap = {
        1: "bay",
        2: "full",
        3: "cpu",
        4: "gpu",
        5: "ram",
        6: "cooling",
        7: "gpu",
        8: "full",
      };
      focusPreset(stepFocusMap[state.buildStep] || "full");
      return state.buildStep;
    },
  };

  // ── 3D Floating Callout Pins Projection ─────────────────────────────────
  const pinElements = document.querySelectorAll("[data-pin-anchor]");
  const projVec = new THREE.Vector3();

  function updateCalloutPins() {
    if (!pinElements.length) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const el of pinElements) {
      const key = el.getAttribute("data-pin-anchor");
      const worldPt = pc.anchors[key];
      if (!worldPt || state.buildStep < 8) {
        el.style.opacity = "0";
        continue;
      }
      projVec.copy(worldPt).project(camera);
      if (projVec.z > 1) {
        el.style.opacity = "0";
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-projVec.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
        1
      )}px, 0)`;
      el.style.opacity = "1";
    }
  }

  // ── Resize Handler ──────────────────────────────────────────────────────
  function resizeBuilderCanvas() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(320, parent.clientWidth);
    const h = Math.max(420, parent.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resizeBuilderCanvas();
  window.addEventListener("resize", resizeBuilderCanvas);

  // ── Main 60FPS Render & Physics Animation Loop ──────────────────────────
  const clock = new THREE.Clock();
  const tmpColor = new THREE.Color();
  const tmpVec = new THREE.Vector3();
  let monAcc = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const elapsed = clock.getElapsedTime();

    if (camCtrl.autoOrbit && !camCtrl.dragging) {
      camCtrl.theta += dt * 0.12;
    }

    camCtrl.curTheta += (camCtrl.theta - camCtrl.curTheta) * 0.08;
    camCtrl.curPhi += (camCtrl.phi - camCtrl.curPhi) * 0.08;
    camCtrl.curRadius += (camCtrl.radius - camCtrl.curRadius) * 0.08;
    camCtrl.curTarget.lerp(camCtrl.target, 0.08);

    camera.position.x =
      camCtrl.curTarget.x +
      camCtrl.curRadius * Math.sin(camCtrl.curPhi) * Math.sin(camCtrl.curTheta);
    camera.position.y =
      camCtrl.curTarget.y + camCtrl.curRadius * Math.cos(camCtrl.curPhi);
    camera.position.z =
      camCtrl.curTarget.z +
      camCtrl.curRadius * Math.sin(camCtrl.curPhi) * Math.cos(camCtrl.curTheta);
    camera.lookAt(camCtrl.curTarget);

    // Advance Physical Fly-In Progress (0 -> 1)
    Object.keys(flyIn).forEach((k) => {
      if (flyIn[k] < 1) {
        flyIn[k] = Math.min(1, flyIn[k] + dt * 2.4);
      }
    });

    // Rotate socket retention lever as CPU seats
    if (pc.socketLever) {
      const openAngle = state.buildStep < 3 ? -1.1 : (1 - flyIn.cpu) * -1.1;
      pc.socketLever.rotation.x = openAngle;
    }

    // Rotate all case, cooler, and GPU fans
    const powerFactor = state.powerOn && state.buildStep >= 8 ? 1.0 : 0.08;
    const spinSpeed = 14.5 * state.fanRpmMult * powerFactor;
    for (const fan of pc.fans) {
      if (fan.userData && fan.userData.rotor) {
        fan.userData.rotor.rotation.z +=
          dt * spinSpeed * (fan.userData.dir || 1);
      }
    }

    // ARGB Rainbow Wave or solid glow + Optical Bloom Halos
    for (const z of pc.rgbZones) {
      if (state.rgbRainbow) {
        const hue = (elapsed * 0.18 + z.px * 0.35 + z.py * 0.25) % 1;
        tmpColor.setHSL(hue, 0.95, 0.55);
        if (z.isHalo) z.mat.color.copy(tmpColor);
        else z.mat.emissive.copy(tmpColor);
      }
      if (z.isHalo) {
        z.mat.opacity = state.powerOn ? z.base : 0.03;
      } else {
        z.mat.emissiveIntensity = state.powerOn ? z.base : 0.12;
      }
    }

    // Update AIO Pump LCD & Rear 3D Bay Telemetry Screen
    const simTemp =
      31 +
      Math.sin(elapsed * 0.9) * 2.4 +
      (state.gpu === "rtx4090" ? 3 : 0);
    monitorState.temp = simTemp;
    pc.updateLCD(
      dt,
      elapsed,
      state.rgbRainbow ? "#00f2fe" : state.rgbColor,
      simTemp,
      state.powerOn ? 1 : 0.05,
      1
    );

    monAcc += dt;
    if (monAcc > 0.08) {
      monAcc = 0;
      const g = bayMonitorTex.userData.ctx;
      const c = bayMonitorTex.userData.canvas;
      drawBayMonitor(g, c.width, c.height, monitorState, elapsed);
      bayMonitorTex.needsUpdate = true;
    }

    // Smoothly animate Exploded View, Open Glass, and Fly-In Part Seating
    const exp = state.exploded ? 1 : 0;
    const glassOut = state.glassOpen || state.exploded ? 1 : 0;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    if (restPos.has(mobo)) {
      const r = restPos.get(mobo);
      const f = 1 - easeOut(flyIn.mobo);
      tmpVec.set(r.x, r.y, r.z + f * 0.95);
      mobo.position.lerp(tmpVec, 0.16);
    }
    if (restPos.has(cpu)) {
      const r = restPos.get(cpu);
      const f = 1 - easeOut(flyIn.cpu);
      tmpVec.set(r.x, r.y + f * 0.35, r.z + f * 0.85 + exp * 0.32);
      cpu.position.lerp(tmpVec, 0.16);
    }
    if (restPos.has(ssd)) {
      const r = restPos.get(ssd);
      const f = 1 - easeOut(flyIn.ssd);
      tmpVec.set(r.x + f * 0.6, r.y, r.z + f * 0.45 + exp * 0.35);
      ssd.position.lerp(tmpVec, 0.16);
    }
    if (restPos.has(glassSide)) {
      const r = restPos.get(glassSide);
      tmpVec.set(r.x, r.y, r.z + glassOut * 1.45);
      glassSide.position.lerp(tmpVec, 0.09);
    }
    if (restPos.has(glassFront)) {
      const r = restPos.get(glassFront);
      tmpVec.set(r.x + exp * 1.25, r.y, r.z);
      glassFront.position.lerp(tmpVec, 0.09);
    }
    if (restPos.has(topPanel)) {
      const r = restPos.get(topPanel);
      tmpVec.set(r.x, r.y + exp * 0.95, r.z);
      topPanel.position.lerp(tmpVec, 0.09);
    }
    if (activeGpuMesh && restPos.has(activeGpuMesh)) {
      const r = restPos.get(activeGpuMesh);
      const f = 1 - easeOut(flyIn.gpu);
      tmpVec.set(
        r.x + f * 0.55,
        r.y - exp * 0.25,
        r.z + f * 1.1 + exp * 0.85
      );
      activeGpuMesh.position.lerp(tmpVec, 0.14);
    }
    ram.forEach((stick, i) => {
      if (restPos.has(stick)) {
        const r = restPos.get(stick);
        const f = 1 - easeOut(flyIn.ram);
        tmpVec.set(
          r.x,
          r.y + f * (0.25 + i * 0.08),
          r.z + f * 0.75 + exp * (0.45 + i * 0.08)
        );
        stick.position.lerp(tmpVec, 0.14);
      }
    });

    if (state.airflow) {
      for (const p of airflowParticles) {
        const t = (elapsed * 0.42 + p.offset) % 1;
        p.curve.getPointAt(t, p.mesh.position);
        p.mesh.material.color.setHSL(0.52 - t * 0.42, 0.95, 0.55);
      }
    }

    updateCalloutPins();
    renderer.render(scene, camera);
  }

  animate();
})();

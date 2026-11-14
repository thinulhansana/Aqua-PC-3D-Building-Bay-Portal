/* ==========================================================================
   AQUA PC SOLUTIONS — PHOTOREALISTIC 3D PC BUILDING BAY (ES MODULE)
   Three.js r160 · EffectComposer + Unreal Bloom + Film grade
   Mirror-floor showroom · ESD lab bay · Studio void
   Uses window.AquaPCModel (js/pc-model.js) for the procedural hardware.
   ========================================================================== */

import * as THREE from "three";
import { EffectComposer } from "../vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "../vendor/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "../vendor/addons/postprocessing/OutputPass.js";
import { Reflector } from "../vendor/addons/objects/Reflector.js";
import { GPUS, CPUS, LOOKUP } from "./catalog.js";

const QUALITY = {
  ultra: { dpr: 2, bloom: true, reflect: true, reflectScale: 0.6, shadow: 4096 },
  high: { dpr: 1.5, bloom: true, reflect: true, reflectScale: 0.4, shadow: 2048 },
  performance: { dpr: 1, bloom: false, reflect: false, reflectScale: 0.3, shadow: 1024 },
};

const CAMERA_PRESETS = {
  full: { theta: 0.62, phi: 1.3, radius: 10.4, target: [0, 2.45, 0] },
  front: { theta: 0.02, phi: 1.45, radius: 9.8, target: [0, 2.5, 0] },
  top: { theta: 0.35, phi: 0.62, radius: 9.6, target: [0, 2.3, 0] },
  rear: { theta: -2.4, phi: 1.28, radius: 10, target: [0, 2.45, 0] },
  bay: { theta: 0.42, phi: 1.2, radius: 13.5, target: [0, 2.2, 0.1] },
  cpu: { theta: 0.22, phi: 1.32, radius: 4.1, target: [-0.95, 3.85, -0.4] },
  mobo: { theta: 0.12, phi: 1.38, radius: 6.2, target: [-0.95, 3.1, -0.9] },
  gpu: { theta: 0.35, phi: 1.42, radius: 4.8, target: [-0.45, 2.25, 0] },
  ram: { theta: -0.25, phi: 1.32, radius: 3.9, target: [-0.25, 3.85, -0.5] },
  cooling: { theta: 0.52, phi: 1.16, radius: 5.6, target: [0, 4.25, 0] },
  psu: { theta: 0.4, phi: 1.5, radius: 5.0, target: [-0.6, 0.9, 0.2] },
  ssd: { theta: 0.18, phi: 1.36, radius: 3.8, target: [-1.45, 3.2, -0.9] },
};

const THEME_COLORS = {
  black: { chassis: 0x0b0e14, chassisInner: 0x0d1017, chassisMesh: 0x0b0e14, plastic: 0x0e1116, fanFrame: 0x0e1116, fanBlade: 0x181c22, psu: 0x0c0f15, fanBlur: 0x23272d, pbr: [0.62, 0.34] },
  white: { chassis: 0xe6ebf0, chassisInner: 0xdce2e8, chassisMesh: 0xe6ebf0, plastic: 0xe8edf2, fanFrame: 0xf1f5f9, fanBlade: 0xf8fafc, psu: 0xe2e8f0, fanBlur: 0xd8dcdf, pbr: [0.18, 0.32] },
  gunmetal: { chassis: 0x41464f, chassisInner: 0x2c3038, chassisMesh: 0x41464f, plastic: 0x2a2e35, fanFrame: 0x1c1f25, fanBlade: 0x24282e, psu: 0x2a2e35, fanBlur: 0x30343a, pbr: [0.85, 0.3] },
  midnight: { chassis: 0x101d3a, chassisInner: 0x0c1428, chassisMesh: 0x101d3a, plastic: 0x0f1a30, fanFrame: 0x0e1424, fanBlade: 0x141c2e, psu: 0x0e1628, fanBlur: 0x1a2236, pbr: [0.7, 0.3] },
  sakura: { chassis: 0xf2c4d2, chassisInner: 0xf6d5df, chassisMesh: 0xf2c4d2, plastic: 0xf8dbe4, fanFrame: 0xfbe7ee, fanBlade: 0xfdf2f6, psu: 0xf4ccd8, fanBlur: 0xf0d0da, pbr: [0.2, 0.34] },
};
const GLASS_LOOK = {
  clear: { color: 0xdcf4ff, opacity: 0.17 },
  smoked: { color: 0x10151f, opacity: 0.52 },
  bronze: { color: 0x6b4a22, opacity: 0.4 },
};
const GPU_FINISH = {
  stealth: { color: 0x181c24, metal: 0.82, rough: 0.26 },
  silver: { color: 0xb8c0cc, metal: 0.95, rough: 0.22 },
  white: { color: 0xeef2f6, metal: 0.2, rough: 0.3 },
};
const RAM_COLOR = {
  black: { color: 0x202630, metal: 0.92, rough: 0.24 },
  white: { color: 0xe5e9ef, metal: 0.3, rough: 0.28 },
  silver: { color: 0xaeb6c2, metal: 1.0, rough: 0.2 },
  gold: { color: 0xc9a45c, metal: 1.0, rough: 0.22 },
};
const CABLE_COLOR = { black: 0x222730, white: 0xf1f5f9, aqua: 0x00c6d4, crimson: 0xd01c3c, violet: 0x8b5cf6 };
const FAN_SPEED = { silent: 0.3, balanced: 0.6, turbo: 1.0 };

/* Film grade: vignette + grain + subtle chromatic aberration */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.32 },
    uGrain: { value: 0.035 },
    uCA: { value: 0.0016 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain; uniform float uCA;
    varying vec2 vUv;
    float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * uCA * (0.5 + r2 * 4.0);
      vec4 c = texture2D(tDiffuse, vUv);
      c.r = texture2D(tDiffuse, vUv + off).r;
      c.b = texture2D(tDiffuse, vUv - off).b;
      float vig = smoothstep(0.85, 0.18, r2 * (1.0 + uVignette * 2.2));
      c.rgb *= mix(1.0 - uVignette, 1.0, vig);
      float n = rand(vUv * vec2(1920.0, 1080.0) + fract(uTime * 7.13)) - 0.5;
      c.rgb += n * uGrain * (0.4 + 0.6 * (1.0 - dot(c.rgb, vec3(0.299, 0.587, 0.114))));
      gl_FragColor = c;
    }
  `,
};

export function createBuilderScene(opts) {
  const { canvas, onHover, onPick, onQualityDrop } = opts;
  let qualityName = opts.quality || "high";
  let Q = QUALITY[qualityName];

  /* ───────────── Renderer ───────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x04060b, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060b);
  scene.fog = new THREE.FogExp2(0x04060b, 0.028);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  camera.position.set(14, 7, 14);

  /* ───────────── Studio HDR environment (reflections) ───────────── */
  function buildStudioEnv() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x03050a);
    const panel = (w, h, color, intensity, x, y, z) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 2.5, 0);
      env.add(m);
    };
    panel(16, 4.5, 0xffffff, 2.4, 0, 11, 1.5); // overhead softbox
    panel(3, 9, 0xeaf6ff, 1.8, 9, 4.5, 6); // right strip box
    panel(3, 9, 0xdbe7f5, 1.2, -9, 4.5, 5); // left strip box
    panel(10, 3, 0x38bdf8, 0.9, 7, 3, -7); // cool rim
    panel(8, 2.5, 0xffe7c2, 0.7, -7, 2.4, -6.5); // warm kicker
    panel(22, 22, 0x0a0f1a, 1, 0, -5, 0); // floor bounce
    const pmrem = new THREE.PMREMGenerator(renderer);
    const tex = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
    return tex;
  }
  scene.environment = buildStudioEnv();

  /* ───────────── Lighting rig ───────────── */
  const hemi = new THREE.HemisphereLight(0xe2ecf8, 0x05070c, 0.7);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
  keyLight.position.set(5.5, 11, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(Q.shadow, Q.shadow);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  const sd = 6.5;
  Object.assign(keyLight.shadow.camera, { left: -sd, right: sd, top: sd, bottom: -sd });
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const topSpot = new THREE.SpotLight(0xffffff, 3.2, 0, Math.PI / 7, 0.55, 0);
  topSpot.position.set(0.2, 12, 1.2);
  topSpot.target.position.set(0, 1.6, 0);
  topSpot.castShadow = true;
  topSpot.shadow.mapSize.set(Q.shadow / 2, Q.shadow / 2);
  topSpot.shadow.bias = -0.0005;
  topSpot.shadow.normalBias = 0.02;
  scene.add(topSpot, topSpot.target);

  const rimLight = new THREE.PointLight(0x00f2fe, 5.5, 18);
  rimLight.position.set(4.4, 4.2, -3.2);
  scene.add(rimLight);

  const interiorLight = new THREE.PointLight(0x00f2fe, 4.6, 8.5);
  interiorLight.position.set(-0.35, 2.85, 0.2);
  scene.add(interiorLight);

  const fillLight = new THREE.PointLight(0x9cc8ff, 3.2, 18);
  fillLight.position.set(-5.2, 3.4, 4.6);
  scene.add(fillLight);

  /* ───────────── Procedural PC model ───────────── */
  const pc = window.AquaPCModel.create(THREE, {
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
  });
  const M = pc.materials;

  // Register extended GPU geometry specs from the catalog
  GPUS.forEach((g) => {
    if (g.dims && !pc.GPU_SPECS[g.id]) pc.GPU_SPECS[g.id] = Object.assign({}, g.dims);
  });

  const rigRoot = new THREE.Group();
  scene.add(rigRoot);

  const P = pc.parts;
  const { caseShell, glassSide, glassFront, topPanel, mobo, cpu, ssd, psu, ram, fansFront, fanRear, fansTop, coolers } = P;
  [caseShell, glassSide, glassFront, topPanel, mobo, cpu, ssd, psu, fanRear].forEach((o) => rigRoot.add(o));
  ram.forEach((o) => rigRoot.add(o));
  fansFront.forEach((o) => rigRoot.add(o));
  fansTop.forEach((o) => rigRoot.add(o));
  Object.values(coolers).forEach((o) => rigRoot.add(o));

  // Dedicated (non-shared) GPU shroud material so the GPU finish is independent of the case
  const gpuShroudMat = M.gpuShroud.clone();

  // Interactive tagging for raycast hover / click
  function tag(root, info) {
    root.traverse((c) => (c.userData.partInfo = info));
  }
  tag(cpu, { cat: "cpu", preset: "cpu" });
  tag(mobo, { cat: "mobo", preset: "mobo" });
  Object.values(coolers).forEach((c) => tag(c, { cat: "cooler", preset: "cooling" }));
  ram.forEach((r) => tag(r, { cat: "ram", preset: "ram" }));
  tag(ssd, { cat: "ssd", preset: "ssd" });
  tag(psu, { cat: "psu", preset: "psu" });
  tag(glassSide, { cat: "glass", preset: "full" });
  [caseShell, topPanel, glassFront, fanRear, ...fansFront, ...fansTop].forEach((o) => tag(o, { cat: "case", preset: "full" }));

  /* ───────────── Accent (RGB-following) materials for environments ───────────── */
  const accentMats = [];
  function accentMat(intensity = 2.2) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x00f2fe).multiplyScalar(intensity) });
    m.userData.intensity = intensity;
    accentMats.push(m);
    return m;
  }

  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.userData.canvas = c;
    t.userData.ctx = g;
    return t;
  }

  /* Soft contact shadow (always present) */
  const contactTex = canvasTex(256, 256, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(0,0,0,0.85)");
    grad.addColorStop(0.45, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, false);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 3.6),
    new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 0.9 })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, -0.085, 0);
  contactShadow.renderOrder = 2;
  rigRoot.add(contactShadow);

  /* ═════════════ ENVIRONMENT 1: MIRROR-FLOOR SHOWROOM ═════════════ */
  const showroom = new THREE.Group();
  scene.add(showroom);

  // Seamless cyclorama dome (gradient + horizon glow)
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x020308) },
      uMid: { value: new THREE.Color(0x0a1220) },
      uGlow: { value: new THREE.Color(0x00f2fe) },
      uGlowAmt: { value: 0.06 },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uGlow; uniform float uGlowAmt; varying vec3 vP;
      void main(){
        float h = vP.y;
        vec3 c = mix(uMid, uTop, smoothstep(-0.02, 0.55, h));
        c += uGlow * uGlowAmt * exp(-abs(h - 0.02) * 18.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), domeMat);
  dome.position.y = -0.1;
  showroom.add(dome);

  let reflector = null;
  const floorOverlayMat = new THREE.MeshStandardMaterial({
    color: 0x070a10,
    roughness: 0.42,
    metalness: 0.35,
    transparent: true,
    opacity: 0.8,
    map: canvasTex(1024, 1024, (g, w, h) => {
      // polished resin floor with subtle concentric sheen + tile seams
      g.fillStyle = "#808389";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = 118 + Math.random() * 30;
        g.fillStyle = `rgba(${v},${v},${v + 4},0.12)`;
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      g.strokeStyle = "rgba(20,24,30,0.55)";
      g.lineWidth = 2;
      for (let x = 0; x <= w; x += 128) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, x);
        g.lineTo(w, x);
        g.stroke();
      }
    }),
  });
  floorOverlayMat.map.wrapS = floorOverlayMat.map.wrapT = THREE.RepeatWrapping;
  floorOverlayMat.map.repeat.set(4, 4);
  const floorOverlay = new THREE.Mesh(new THREE.CircleGeometry(30, 96), floorOverlayMat);
  floorOverlay.rotation.x = -Math.PI / 2;
  floorOverlay.position.y = -0.098;
  floorOverlay.receiveShadow = true;
  showroom.add(floorOverlay);

  function buildReflector() {
    if (reflector) {
      showroom.remove(reflector);
      reflector.getRenderTarget().dispose();
      reflector.material.dispose();
      reflector = null;
    }
    if (!Q.reflect) {
      floorOverlayMat.opacity = 1;
      return;
    }
    const w = Math.max(256, Math.round(canvas.clientWidth * renderer.getPixelRatio() * Q.reflectScale));
    const h = Math.max(256, Math.round(canvas.clientHeight * renderer.getPixelRatio() * Q.reflectScale));
    reflector = new Reflector(new THREE.CircleGeometry(30, 96), {
      clipBias: 0.003,
      textureWidth: w,
      textureHeight: h,
      color: 0x9aa0aa,
      multisample: 2,
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.y = -0.102;
    showroom.add(reflector);
    floorOverlayMat.opacity = 0.8;
  }

  // Glowing pedestal ring + light pool
  const pedestalRing = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.12, 128), accentMat(2.4));
  pedestalRing.rotation.x = -Math.PI / 2;
  pedestalRing.position.y = -0.09;
  showroom.add(pedestalRing);
  const pedestalRing2 = new THREE.Mesh(new THREE.RingGeometry(3.32, 3.34, 128), accentMat(1.1));
  pedestalRing2.rotation.x = -Math.PI / 2;
  pedestalRing2.position.y = -0.09;
  showroom.add(pedestalRing2);

  const poolTex = canvasTex(256, 256, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.32)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const lightPool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 })
  );
  lightPool.rotation.x = -Math.PI / 2;
  lightPool.position.y = -0.092;
  showroom.add(lightPool);

  // Overhead softbox panels (bloom + visible in mirror floor)
  const softboxMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(2.6), side: THREE.DoubleSide, fog: false });
  [-1.6, 0, 1.6].forEach((x) => {
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.4), softboxMat);
    sb.rotation.x = Math.PI / 2;
    sb.position.set(x, 11.5, 0.6);
    showroom.add(sb);
  });

  // Volumetric light cone from overhead
  const coneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xdff3ff) }, uOpacity: { value: 0.07 } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float rim = pow(abs(dot(vN, vV)), 1.6); float a = uOpacity * smoothstep(0.0, 0.9, vY) * rim; gl_FragColor = vec4(uColor * a, a); }`,
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 4.2, 11.5, 48, 1, true), coneMat);
  cone.position.set(0, 5.7, 0.4);
  showroom.add(cone);

  // RGB light pylons in the back
  [-6.5, 6.5].forEach((x) => {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 7.5, 12), accentMat(2.8));
    pylon.position.set(x, 3.65, -5.5);
    showroom.add(pylon);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 32), M.darkAlu);
    base.position.set(x, -0.04, -5.5);
    base.castShadow = true;
    showroom.add(base);
  });

  // Floating dust motes catching the light
  const dustCount = 420;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const r = Math.sqrt(Math.random()) * 3.6;
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = Math.random() * 9;
    dustPos[i * 3 + 2] = Math.sin(a) * r + 0.4;
    dustSeed[i] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustTex = canvasTex(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ size: 0.035, map: dustTex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xcfe9ff })
  );
  showroom.add(dust);

  /* ═════════════ ENVIRONMENT 2: ESD LAB BAY ═════════════ */
  const lab = new THREE.Group();
  scene.add(lab);

  const esdTex = pc.canvasTexture(2048, 1024, (g, w, h) => {
    const grad = g.createRadialGradient(w * 0.5, h * 0.5, 80, w * 0.5, h * 0.5, w * 0.65);
    grad.addColorStop(0, "#0c1629");
    grad.addColorStop(0.6, "#080f1d");
    grad.addColorStop(1, "#04070f");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0, 242, 254, 0.08)";
    g.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = "rgba(0, 242, 254, 0.42)";
    g.lineWidth = 3;
    g.strokeRect(36, 36, w - 72, h - 72);
    g.fillStyle = "rgba(226, 232, 240, 0.6)";
    g.font = '600 18px "JetBrains Mono", monospace';
    for (let x = 80; x <= w - 80; x += 16) {
      const major = (x - 80) % 80 === 0;
      g.fillRect(x, h - 36 - (major ? 22 : 10), 2, major ? 22 : 10);
      if (major) g.fillText(((x - 80) / 16 | 0) + "cm", x - 14, h - 66);
    }
    g.strokeStyle = "rgba(0, 242, 254, 0.35)";
    g.setLineDash([14, 8]);
    g.lineWidth = 2.5;
    g.strokeRect(w * 0.27, h * 0.2, w * 0.46, h * 0.56);
    g.setLineDash([]);
    g.fillStyle = "rgba(0, 242, 254, 0.78)";
    g.font = '700 22px "JetBrains Mono", monospace';
    g.fillText("ESD-SAFE BAY 01 // 1MΩ GROUNDED", 74, 80);
    g.fillText("AQUA PC SOLUTIONS · EMBILIPITIYA LAB", w - 555, 80);
  });

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(12.6, 0.24, 6.8),
    new THREE.MeshPhysicalMaterial({ color: 0x070b14, metalness: 0.42, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.2 })
  );
  bench.position.set(0, -0.23, 0.15);
  bench.receiveShadow = true;
  lab.add(bench);
  const esdPad = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.025, 4.9),
    new THREE.MeshPhysicalMaterial({ map: esdTex, roughness: 0.38, metalness: 0.12, clearcoat: 0.28, clearcoatRoughness: 0.3 })
  );
  esdPad.position.set(0, -0.098, 0.18);
  esdPad.receiveShadow = true;
  lab.add(esdPad);
  const benchLed = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.03, 0.038), accentMat(2.2));
  benchLed.position.set(0, -0.14, 3.56);
  lab.add(benchLed);
  const labRing = new THREE.Mesh(new THREE.RingGeometry(2.95, 3.02, 96), accentMat(2.0));
  labRing.rotation.x = -Math.PI / 2;
  labRing.position.set(0, -0.083, 0);
  lab.add(labRing);
  const labFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x05080e, roughness: 0.8, metalness: 0.1 })
  );
  labFloor.rotation.x = -Math.PI / 2;
  labFloor.position.y = -3.2;
  labFloor.receiveShadow = true;
  lab.add(labFloor);
  // bench legs
  [[-5.9, -2.9], [5.9, -2.9], [-5.9, 3.2], [5.9, 3.2]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.9, 0.16), M.darkAlu);
    leg.position.set(x, -1.8, z);
    leg.castShadow = true;
    lab.add(leg);
  });

  function addMesh(geo, mat, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Tools: screw tray, paste syringe, precision screwdriver
  const tray = new THREE.Group();
  tray.position.set(-3.9, -0.06, 0.9);
  lab.add(tray);
  addMesh(new THREE.BoxGeometry(0.95, 0.06, 1.35), M.darkAlu, 0, 0, 0, tray);
  addMesh(new THREE.BoxGeometry(0.82, 0.065, 1.22), M.chassis, 0, 0.008, 0, tray);
  for (let i = 0; i < 6; i++) {
    addMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 14), i % 2 ? M.gold : M.chrome, -0.22 + (i % 2) * 0.42, 0.055, -0.42 + Math.floor(i / 2) * 0.38, tray, 0, i * 0.5, Math.PI / 2 + i * 0.3);
  }
  const syringe = new THREE.Group();
  syringe.position.set(-4.0, 0.01, -0.55);
  syringe.rotation.y = 0.38;
  lab.add(syringe);
  addMesh(new THREE.CylinderGeometry(0.065, 0.065, 0.72, 24), M.silver, 0, 0, 0, syringe, 0, 0, Math.PI / 2);
  addMesh(new THREE.CylinderGeometry(0.068, 0.068, 0.24, 24), accentMat(1.6), 0, 0, 0, syringe, 0, 0, Math.PI / 2);
  addMesh(new THREE.CylinderGeometry(0.042, 0.042, 0.45, 16), M.darkAlu, -0.45, 0, 0, syringe, 0, 0, Math.PI / 2);
  const driver = new THREE.Group();
  driver.position.set(-3.4, 0.01, -0.35);
  driver.rotation.y = -0.22;
  lab.add(driver);
  addMesh(new THREE.CylinderGeometry(0.058, 0.058, 0.82, 20), M.darkAlu, 0, 0, 0, driver, 0, 0, Math.PI / 2);
  addMesh(new THREE.CylinderGeometry(0.058, 0.058, 0.1, 20), M.gold, -0.46, 0, 0, driver, 0, 0, Math.PI / 2);
  addMesh(new THREE.CylinderGeometry(0.016, 0.016, 0.65, 14), M.chrome, 0.72, 0, 0, driver, 0, 0, Math.PI / 2);

  // Gantry + overhead LED bar
  [-5.1, 5.1].forEach((x) => addMesh(new THREE.CylinderGeometry(0.075, 0.075, 6.8, 20), M.darkAlu, x, 3.3, -1.95, lab));
  addMesh(new THREE.BoxGeometry(10.4, 0.13, 0.2), M.darkAlu, 0, 6.65, -1.95, lab);
  const ledBar = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.045, 0.26), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe0f7ff).multiplyScalar(2.2) }));
  ledBar.position.set(0, 6.58, -1.75);
  lab.add(ledBar);

  // Telemetry monitors
  const monitorState = { cpu: "", gpu: "", cooler: "", temp: 34, gpuTemp: 52, cp: 0, aaa: 0, esp: 0, watts: 0, step: 8, psu: 1000 };
  function drawTelemetry(g, w, h, t) {
    const ms = monitorState;
    g.fillStyle = "#040915";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,242,254,0.5)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "rgba(0,242,254,0.14)";
    g.fillRect(14, 14, w - 28, 38);
    g.fillStyle = "#00f2fe";
    g.font = '700 18px "JetBrains Mono", monospace';
    g.fillText("AQUA LAB // BENCH TELEMETRY OS v6", 24, 39);
    g.fillStyle = "#cbd5e1";
    g.font = '600 15px "JetBrains Mono", monospace';
    g.fillText("CPU : " + ms.cpu, 24, 84);
    g.fillText("GPU : " + ms.gpu, 24, 110);
    g.fillText("COOL: " + ms.cooler, 24, 136);
    g.fillStyle = "#10b981";
    g.font = '700 16px "JetBrains Mono", monospace';
    g.fillText(ms.step >= 8 ? "STATUS: SYSTEM ONLINE · STRESS TEST PASS" : "STATUS: ASSEMBLING " + ms.step + "/8", 24, 168);
    g.strokeStyle = "#00f2fe";
    g.lineWidth = 2.5;
    g.beginPath();
    for (let x = 24; x < w - 24; x += 6) {
      const y = 248 + Math.sin(x * 0.04 + t * 4.2) * 20 + Math.cos(x * 0.09 - t * 2.5) * 9;
      x === 24 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    g.textAlign = "right";
    g.fillStyle = "#f8fafc";
    g.font = '800 28px "Syne", sans-serif';
    g.fillText(Math.round(ms.temp) + "°C CPU", w - 24, 88);
    g.fillStyle = "#00f2fe";
    g.font = '700 17px "JetBrains Mono", monospace';
    g.fillText(Math.round(ms.gpuTemp) + "°C GPU", w - 24, 116);
    g.fillText(ms.watts + "W / " + ms.psu + "W", w - 24, 140);
    g.textAlign = "left";
  }
  function drawBench(g, w, h) {
    const ms = monitorState;
    g.fillStyle = "#040814";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(16,185,129,0.45)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "rgba(16,185,129,0.16)";
    g.fillRect(14, 14, w - 28, 42);
    g.fillStyle = "#10b981";
    g.font = '700 17px "JetBrains Mono", monospace';
    g.fillText("3DMARK // QA BENCHMARK", 22, 40);
    const rows = [
      ["CYBERPUNK 2077 · 4K RT", ms.cp, 180, "#00f2fe"],
      ["AAA ULTRA · 1440P", ms.aaa, 250, "#38bdf8"],
      ["CS2 / VALORANT · 1080P", ms.esp, 740, "#10b981"],
    ];
    rows.forEach(([label, v, max, col], i) => {
      const y = 96 + i * 120;
      g.fillStyle = "#94a3b8";
      g.font = '600 15px "JetBrains Mono", monospace';
      g.fillText(label, 22, y);
      g.fillStyle = col;
      g.font = '800 34px "Syne", sans-serif';
      g.fillText(v + " FPS", 22, y + 40);
      g.fillStyle = "#0f172a";
      g.fillRect(22, y + 56, w - 44, 12);
      g.fillStyle = col;
      g.fillRect(22, y + 56, Math.min(w - 44, (v / max) * (w - 44)), 12);
    });
    g.fillStyle = "rgba(148,163,184,0.75)";
    g.font = '500 14px "JetBrains Mono", monospace';
    g.fillText("CLICK ANY 3D PART TO SWAP", 22, h - 28);
  }
  const teleTex = pc.canvasTexture(512, 320, (g, w, h) => drawTelemetry(g, w, h, 0));
  const benchTex = pc.canvasTexture(384, 512, (g, w, h) => drawBench(g, w, h));
  function makeMonitor(w, h, tex, x, y, z, ry) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    addMesh(new THREE.BoxGeometry(w + 0.11, h + 0.1, 0.06), M.chassis, 0, 0, 0, grp);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.25, 1.25, 1.25) }));
    scr.position.z = 0.034;
    grp.add(scr);
    addMesh(new THREE.CylinderGeometry(0.055, 0.075, y, 16), M.darkAlu, 0, -y / 2, -0.08, grp);
    lab.add(grp);
    return grp;
  }
  makeMonitor(2.34, 1.44, teleTex, 4.1, 2.55, -1.55, -0.38);
  makeMonitor(1.44, 1.96, benchTex, -4.1, 2.65, -1.45, 0.38);

  /* ═════════════ ENVIRONMENT 3: STUDIO VOID ═════════════ */
  const voidEnv = new THREE.Group();
  scene.add(voidEnv);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.55 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.1;
  shadowCatcher.receiveShadow = true;
  voidEnv.add(shadowCatcher);
  const voidGrid = new THREE.GridHelper(40, 80, 0x00f2fe, 0x0b2239);
  voidGrid.position.y = -0.099;
  voidGrid.material.transparent = true;
  voidGrid.material.opacity = 0.16;
  voidGrid.material.depthWrite = false;
  voidEnv.add(voidGrid);

  let envName = "showroom";
  function setEnvironment(name) {
    envName = name;
    showroom.visible = name === "showroom";
    lab.visible = name === "lab";
    voidEnv.visible = name === "void";
    if (name === "lab") {
      scene.background.setHex(0x050a14);
      scene.fog.color.setHex(0x050a14);
      scene.fog.density = 0.03;
      rigRoot.position.y = 0;
      contactShadow.material.opacity = 0.75;
    } else if (name === "void") {
      scene.background.setHex(0x020306);
      scene.fog.color.setHex(0x020306);
      scene.fog.density = 0.045;
      contactShadow.material.opacity = 0.95;
    } else {
      scene.background.setHex(0x04060b);
      scene.fog.color.setHex(0x04060b);
      scene.fog.density = 0.022;
      contactShadow.material.opacity = 0.9;
    }
  }

  /* ───────────── Rest positions, exploded view & fly-in assembly ───────────── */
  const restPos = new Map();
  const record = (o) => restPos.set(o, o.position.clone());
  [caseShell, glassSide, glassFront, topPanel, mobo, cpu, ssd, psu, fanRear, ...ram, ...fansFront, ...fansTop, ...Object.values(coolers)].forEach(record);

  // Airflow streamlines
  const airflowGroup = new THREE.Group();
  airflowGroup.visible = false;
  rigRoot.add(airflowGroup);
  const airParticles = [];
  const streamDefs = [
    [[2.4, 1.85, 0.2], [0.6, 2.1, 0.1], [-1.1, 2.7, -0.1], [-2.4, 3.95, 0.05]],
    [[2.4, 3.05, 0.1], [0.4, 3.25, 0], [-1.0, 3.85, -0.2], [-1.2, 5.3, 0.05]],
    [[2.4, 4.25, -0.1], [0.8, 4.35, 0.05], [0, 5.3, 0.05]],
    [[2.4, 2.4, 0.5], [0.2, 2.0, 0.6], [-1.5, 2.6, 0.5], [-2.5, 3.6, 0.3]],
  ];
  const airTubeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x00f2fe).multiplyScalar(1.4), transparent: true, opacity: 0.22, depthWrite: false });
  const airDotGeo = new THREE.SphereGeometry(0.045, 10, 10);
  streamDefs.forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    airflowGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.014, 6, false), airTubeMat));
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(airDotGeo, new THREE.MeshBasicMaterial({ color: 0x00f2fe }));
      airflowGroup.add(m);
      airParticles.push({ mesh: m, curve, offset: i / 8 });
    }
  });

  /* ───────────── Build state ───────────── */
  const state = {
    cpu: "r7-9800x3d", mobo: "x870e-hydro", cooler: "aio360", gpu: "rtx5080", gpuMount: "horizontal", gpuFinish: "stealth",
    ram: "64gb-4x16", ramColor: "black", ssd: "2tb-gen5", psu: "1000w", theme: "black", glass: "clear", cables: "black",
    rgb: "#00f2fe", rgbMode: "static", brightness: 1, fan: "balanced",
    exploded: false, glassOpen: false, airflow: false, powerOn: true, buildStep: 8, autoRotate: true, pins: true,
  };
  const flyIn = { mobo: 1, cpu: 1, ssd: 1, ram: 1, cooler: 1, gpu: 1, psu: 1 };
  let power = 0; // smoothed 0..1 (fans spin-up / RGB fade)
  let rgbPower = 0;

  let gpuMesh = null;
  function disposeGpu(g) {
    const sharedMats = new Set(Object.values(M));
    sharedMats.add(gpuShroudMat);
    const zoneMats = new Set();
    g.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m || sharedMats.has(m)) return;
        zoneMats.add(m);
        ["map", "emissiveMap", "alphaMap"].forEach((k) => m[k] && m[k] !== M.chip?.map && m[k].dispose && k !== "bumpMap" && m[k].userData?.canvas && m[k].dispose());
        m.dispose();
      });
    });
    for (let i = pc.rgbZones.length - 1; i >= 0; i--) {
      if (zoneMats.has(pc.rgbZones[i].mat)) pc.rgbZones.splice(i, 1);
    }
    for (let i = pc.fans.length - 1; i >= 0; i--) {
      if (pc.fans[i].userData && pc.fans[i].userData.gpu) pc.fans.splice(i, 1);
    }
  }
  function rebuildGPU(animate) {
    if (gpuMesh) {
      rigRoot.remove(gpuMesh);
      disposeGpu(gpuMesh);
    }
    gpuMesh = pc.makeGPU(state.gpu, state.gpuMount);
    const pose = gpuMesh.userData.pose;
    gpuMesh.position.copy(pose.pos);
    gpuMesh.quaternion.copy(pose.quat);
    gpuMesh.traverse((o) => {
      if (o.isMesh && o.material === M.gpuShroud) o.material = gpuShroudMat;
    });
    record(gpuMesh);
    tag(gpuMesh, { cat: "gpu", preset: "gpu" });
    rigRoot.add(gpuMesh);
    applyRGBStatic();
    if (animate) flyIn.gpu = 0;
    gpuMesh.visible = state.buildStep >= 7;
  }

  function syncCoolers() {
    Object.entries(coolers).forEach(([k, g]) => (g.visible = k === state.cooler && state.buildStep >= 6));
    fansTop.forEach((f, i) => (f.visible = state.buildStep >= 1 && !(state.cooler === "aio240" && i === 0)));
  }
  function syncRam() {
    const sticks = (LOOKUP.ram[state.ram] || { sticks: 4 }).sticks;
    ram.forEach((s, i) => (s.visible = state.buildStep >= 5 && (sticks === 4 || i === 1 || i === 3)));
  }
  function applyStepVisibility(prev) {
    const s = state.buildStep;
    caseShell.visible = topPanel.visible = fanRear.visible = s >= 1;
    fansFront.forEach((f) => (f.visible = s >= 1));
    mobo.visible = s >= 2;
    cpu.visible = s >= 3;
    ssd.visible = s >= 4;
    syncRam();
    syncCoolers();
    if (gpuMesh) gpuMesh.visible = s >= 7;
    psu.visible = glassSide.visible = glassFront.visible = s >= 8;
    if (prev !== undefined && s > prev) {
      const map = { 2: "mobo", 3: "cpu", 4: "ssd", 5: "ram", 6: "cooler", 7: "gpu", 8: "psu" };
      for (let k = prev + 1; k <= s; k++) if (map[k]) flyIn[map[k]] = 0;
    }
    monitorState.step = s;
  }

  /* ───────────── Material appliers ───────────── */
  function applyTheme() {
    const t = THEME_COLORS[state.theme] || THEME_COLORS.black;
    ["chassis", "chassisInner", "chassisMesh", "plastic", "fanFrame", "fanBlade", "psu", "fanBlur"].forEach((k) => {
      if (M[k]) M[k].color.setHex(t[k]);
    });
    M.chassis.metalness = t.pbr[0];
    M.chassis.roughness = t.pbr[1];
  }
  function applyGlass() {
    const g = GLASS_LOOK[state.glass] || GLASS_LOOK.clear;
    M.glass.color.setHex(g.color);
    M.glass.opacity = g.opacity;
  }
  function applyGpuFinish() {
    const f = GPU_FINISH[state.gpuFinish] || GPU_FINISH.stealth;
    gpuShroudMat.color.setHex(f.color);
    gpuShroudMat.metalness = f.metal;
    gpuShroudMat.roughness = f.rough;
  }
  function applyRamColor() {
    const r = RAM_COLOR[state.ramColor] || RAM_COLOR.black;
    M.ramSpreader.color.setHex(r.color);
    M.ramSpreader.metalness = r.metal;
    M.ramSpreader.roughness = r.rough;
  }
  function applyCables() {
    M.sleeve.color.setHex(CABLE_COLOR[state.cables] || CABLE_COLOR.black);
  }
  const rgbColor = new THREE.Color(state.rgb);
  function applyRGBStatic() {
    rgbColor.set(state.rgb);
    pc.rgbZones.forEach((z) => (z.isHalo ? z.mat.color.copy(rgbColor) : z.mat.emissive.copy(rgbColor)));
  }
  function applyCpu() {
    const c = LOOKUP.cpu[state.cpu] || CPUS[0];
    pc.setCPULabel(c.ihs[0], c.ihs[1]);
    monitorState.cpu = c.name.replace(/^(AMD|Intel) /, "").toUpperCase();
  }
  function applyMobo() {
    const m = LOOKUP.mobo[state.mobo];
    if (m) pc.setChipset(m.chipset);
  }
  function applySsd() {
    const s = LOOKUP.ssd[state.ssd];
    if (s) pc.setSSDLabel(s.label);
  }
  function applyPsu() {
    const p = LOOKUP.psu[state.psu];
    if (p) {
      pc.setPSULabel(String(p.watts), p.rating);
      monitorState.psu = p.watts;
    }
  }

  /* ───────────── Camera controller (orbit + pan + zoom + inertia) ───────────── */
  const cam = {
    theta: -1.1, phi: 1.0, radius: 19,
    tTheta: CAMERA_PRESETS.full.theta, tPhi: CAMERA_PRESETS.full.phi, tRadius: CAMERA_PRESETS.full.radius,
    target: new THREE.Vector3(0, 3.2, 0), tTarget: new THREE.Vector3(...CAMERA_PRESETS.full.target),
    vTheta: 0, vPhi: 0, damp: 0.035, lastInteract: performance.now() - 20000,
  };
  function focusPreset(name) {
    const p = CAMERA_PRESETS[name] || CAMERA_PRESETS.full;
    // keep continuous theta (avoid spinning the long way round)
    const twoPi = Math.PI * 2;
    let t = p.theta;
    while (t - cam.tTheta > Math.PI) t -= twoPi;
    while (t - cam.tTheta < -Math.PI) t += twoPi;
    cam.tTheta = t;
    cam.tPhi = p.phi;
    cam.tRadius = p.radius * (canvas.clientWidth < 700 ? 1.25 : 1);
    cam.tTarget.set(...p.target);
    cam.damp = 0.07;
    cam.vTheta = cam.vPhi = 0;
    if (name !== "full" && name !== "bay") cam.lastInteract = performance.now();
  }

  const pointers = new Map();
  let dragMode = null;
  let downX = 0, downY = 0, moved = 0, pinchDist = 0;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hoverBox = new THREE.BoxHelper(mobo, 0x00f2fe);
  hoverBox.material.transparent = true;
  hoverBox.material.opacity = 0.75;
  hoverBox.material.depthTest = false;
  hoverBox.renderOrder = 50;
  hoverBox.visible = false;
  scene.add(hoverBox);
  let hovered = null;

  function interactiveRoots() {
    const list = [];
    if (gpuMesh && gpuMesh.visible) list.push(gpuMesh);
    ram.forEach((r) => r.visible && list.push(r));
    Object.values(coolers).forEach((c) => c.visible && list.push(c));
    [cpu, ssd, psu, mobo].forEach((o) => o.visible && list.push(o));
    if (glassSide.visible && !state.glassOpen) list.push(glassSide);
    [caseShell, topPanel, ...fansFront, ...fansTop, fanRear].forEach((o) => o.visible && list.push(o));
    return list;
  }
  function rootOf(obj) {
    let c = obj;
    while (c && c.parent && c.parent !== rigRoot) c = c.parent;
    return c;
  }
  function doHover(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(interactiveRoots(), true);
    // let users see "through" the glass: prefer the first non-glass hit if glass is first
    let hit = hits.find((h) => h.object.userData.partInfo && h.object.visible);
    if (hit && hit.object.userData.partInfo.cat === "glass") {
      const inner = hits.find((h) => h.object.userData.partInfo && h.object.userData.partInfo.cat !== "glass" && h.object.userData.partInfo.cat !== "case");
      if (inner) hit = inner;
    }
    if (hit) {
      const info = hit.object.userData.partInfo;
      const root = rootOf(hit.object);
      hovered = { info, root };
      hoverBox.setFromObject(root);
      hoverBox.visible = info.cat !== "case" && info.cat !== "glass";
      canvas.style.cursor = "pointer";
      onHover && onHover(info, clientX - rect.left, clientY - rect.top);
    } else {
      hovered = null;
      hoverBox.visible = false;
      canvas.style.cursor = dragMode ? "grabbing" : "grab";
      onHover && onHover(null);
    }
  }

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downX = e.clientX;
    downY = e.clientY;
    moved = 0;
    cam.lastInteract = performance.now();
    cam.damp = 0.12;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      dragMode = "pinch";
    } else {
      dragMode = e.button === 2 || e.shiftKey ? "pan" : "orbit";
    }
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === "mouse") doHover(e.clientX, e.clientY);
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    moved += Math.hypot(dx, dy);
    cam.lastInteract = performance.now();
    if (dragMode === "pinch" && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      cam.tRadius = THREE.MathUtils.clamp(cam.tRadius * (pinchDist / Math.max(1, d)), 2.6, 17);
      pinchDist = d;
    } else if (dragMode === "orbit") {
      cam.vTheta = -dx * 0.0062;
      cam.vPhi = -dy * 0.0052;
      cam.tTheta += cam.vTheta;
      cam.tPhi = THREE.MathUtils.clamp(cam.tPhi + cam.vPhi, 0.35, 1.62);
    } else if (dragMode === "pan") {
      const s = cam.radius * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      cam.tTarget.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
      cam.tTarget.y = THREE.MathUtils.clamp(cam.tTarget.y, 0.2, 5.5);
    }
    if (moved > 4) {
      hoverBox.visible = false;
      onHover && onHover(null);
    }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      if (moved < 6 && dragMode === "orbit") {
        doHover(e.clientX, e.clientY);
        if (hovered) {
          const info = hovered.info;
          if (info.cat === "glass") {
            api.toggleGlass();
            onPick && onPick({ cat: "glass" });
          } else {
            focusPreset(info.preset);
            onPick && onPick(info);
          }
        }
      }
      dragMode = null;
      canvas.style.cursor = "grab";
    } else {
      dragMode = "orbit";
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", () => {
    if (!pointers.size) {
      hoverBox.visible = false;
      onHover && onHover(null);
    }
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      cam.lastInteract = performance.now();
      cam.damp = 0.12;
      cam.tRadius = THREE.MathUtils.clamp(cam.tRadius * (1 + e.deltaY * 0.0011), 2.6, 17);
    },
    { passive: false }
  );

  /* ───────────── Post-processing ───────────── */
  let composer = null, bloomPass = null, filmPass = null;
  function buildComposer() {
    if (composer) {
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
      composer = null;
    }
    if (!Q.bloom) return;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(canvas.clientWidth, canvas.clientHeight);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 0.62, 0.55, 0.9);
    composer.addPass(bloomPass);
    filmPass = new ShaderPass(FilmShader);
    composer.addPass(filmPass);
    composer.addPass(new OutputPass());
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 44 : 36;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
    if (reflector) {
      const rw = Math.max(256, Math.round(w * renderer.getPixelRatio() * Q.reflectScale));
      const rh = Math.max(256, Math.round(h * renderer.getPixelRatio() * Q.reflectScale));
      reflector.getRenderTarget().setSize(rw, rh);
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function setQuality(name) {
    if (!QUALITY[name]) return;
    qualityName = name;
    Q = QUALITY[name];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
    keyLight.shadow.mapSize.set(Q.shadow, Q.shadow);
    topSpot.shadow.mapSize.set(Q.shadow / 2, Q.shadow / 2);
    [keyLight, topSpot].forEach((l) => {
      if (l.shadow.map) {
        l.shadow.map.dispose();
        l.shadow.map = null;
      }
    });
    resize();
    buildComposer();
    buildReflector();
    // fake halos are only needed when real bloom is off
    haloScale = Q.bloom ? 0.55 : 1;
  }
  let haloScale = 1;

  /* ───────────── Pins (HTML callouts projected from 3D anchors) ───────────── */
  const pinEls = opts.pinElements || [];
  const projV = new THREE.Vector3();
  function updatePins() {
    if (!pinEls.length) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const show = state.pins && state.buildStep >= 8 && !state.exploded;
    for (const el of pinEls) {
      const a = pc.anchors[el.dataset.pinAnchor];
      if (!a || !show) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        continue;
      }
      projV.copy(a).applyMatrix4(rigRoot.matrixWorld).project(camera);
      if (projV.z > 1 || Math.abs(projV.x) > 1.05 || Math.abs(projV.y) > 1.05) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        continue;
      }
      el.style.transform = `translate3d(${((projV.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-projV.y * 0.5 + 0.5) * h).toFixed(1)}px, 0)`;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }
  }

  /* ───────────── Main loop ───────────── */
  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const accentC = new THREE.Color();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let monAcc = 0;
  let fpsAcc = 0, fpsFrames = 0, fpsChecked = false, startTime = performance.now();
  let running = true;

  function lerpTo(obj, x, y, z, k) {
    tmpV.set(x, y, z);
    obj.position.lerp(tmpV, k);
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // Adaptive quality: after the intro, drop a level if the device struggles
    if (!fpsChecked) {
      fpsAcc += dt;
      fpsFrames++;
      if (performance.now() - startTime > 6000) {
        fpsChecked = true;
        const fps = fpsFrames / Math.max(0.001, fpsAcc);
        if (fps < 28 && qualityName !== "performance") {
          const next = qualityName === "ultra" ? "high" : "performance";
          setQuality(next);
          onQualityDrop && onQualityDrop(next, Math.round(fps));
        }
      } else if (performance.now() - startTime < 2500) {
        fpsAcc = 0;
        fpsFrames = 0;
      }
    }

    // Camera
    const idle = performance.now() - cam.lastInteract > 9000;
    if (state.autoRotate && idle && !pointers.size) cam.tTheta += dt * 0.09;
    if (!pointers.size) {
      // inertia after release
      cam.tTheta += cam.vTheta * 0.9;
      cam.tPhi = THREE.MathUtils.clamp(cam.tPhi + cam.vPhi * 0.9, 0.35, 1.62);
      cam.vTheta *= 0.9;
      cam.vPhi *= 0.9;
    }
    const k = 1 - Math.pow(1 - cam.damp, dt * 60);
    cam.theta += (cam.tTheta - cam.theta) * k;
    cam.phi += (cam.tPhi - cam.phi) * k;
    cam.radius += (cam.tRadius - cam.radius) * k;
    cam.target.lerp(cam.tTarget, k);
    cam.damp = Math.min(0.12, cam.damp + dt * 0.02);
    camera.position.set(
      cam.target.x + cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta),
      Math.max(0.15, cam.target.y + cam.radius * Math.cos(cam.phi)),
      cam.target.z + cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta)
    );
    camera.lookAt(cam.target);

    // Power: fans spin up, RGB fades in slightly later
    const pTarget = state.powerOn && state.buildStep >= 8 ? 1 : 0;
    power += (pTarget - power) * Math.min(1, dt * (pTarget ? 0.9 : 1.6));
    rgbPower += ((pTarget ? 1 : 0) - rgbPower) * Math.min(1, dt * (pTarget ? 1.8 : 3));

    Object.keys(flyIn).forEach((key) => {
      if (flyIn[key] < 1) flyIn[key] = Math.min(1, flyIn[key] + dt * 1.9);
    });

    if (pc.socketLever) pc.socketLever.rotation.x = state.buildStep < 3 ? -1.1 : (1 - flyIn.cpu) * -1.1;

    // Fans
    const fanVal = FAN_SPEED[state.fan] || 0.6;
    const spin = (5 + 34 * fanVal) * power;
    for (const f of pc.fans) {
      if (f.userData && f.userData.rotor) f.userData.rotor.rotation.z += dt * spin * (f.userData.dir || 1);
    }
    M.fanBlur.opacity = THREE.MathUtils.clamp((spin - 12) / 40, 0, 0.42);

    // RGB effects
    const mode = state.rgbMode;
    const bright = state.brightness;
    let breath = 1;
    if (mode === "breathing") breath = 0.18 + 0.82 * Math.pow(Math.sin(t * 1.6) * 0.5 + 0.5, 1.6);
    const onFactor = mode === "off" ? 0 : rgbPower * bright * breath;
    if (mode === "spectrum") tmpC.setHSL((t * 0.08) % 1, 0.95, 0.55);
    for (const z of pc.rgbZones) {
      if (mode === "wave") {
        tmpC.setHSL((t * 0.16 + z.px * 0.4 + z.py * 0.25) % 1, 0.95, 0.55);
        z.isHalo ? z.mat.color.copy(tmpC) : z.mat.emissive.copy(tmpC);
      } else if (mode === "spectrum") {
        z.isHalo ? z.mat.color.copy(tmpC) : z.mat.emissive.copy(tmpC);
      }
      if (z.isHalo) z.mat.opacity = z.base * haloScale * Math.max(0.02, onFactor);
      else z.mat.emissiveIntensity = z.base * Math.max(0.04, onFactor);
    }
    if (mode === "wave") accentC.setHSL((t * 0.16) % 1, 0.95, 0.55);
    else if (mode === "spectrum") accentC.copy(tmpC);
    else accentC.copy(rgbColor);
    const accentLevel = Math.max(0.08, onFactor);
    for (const m of accentMats) m.color.copy(accentC).multiplyScalar(m.userData.intensity * accentLevel);
    interiorLight.color.copy(accentC);
    interiorLight.intensity = 4.6 * onFactor;
    rimLight.color.copy(accentC);
    rimLight.intensity = 2.5 + 3 * onFactor;
    hoverBox.material.color.copy(accentC);
    domeMat.uniforms.uGlow.value.copy(accentC);
    airTubeMat.color.copy(accentC).multiplyScalar(1.4);

    // Thermals (simulated)
    const cpuSpec = LOOKUP.cpu[state.cpu] || CPUS[0];
    const cool = LOOKUP.cooler[state.cooler] || { capacity: 300 };
    const gpuSpec = LOOKUP.gpu[state.gpu] || GPUS[0];
    const load = 0.7 + Math.sin(t * 0.7) * 0.15;
    const cpuTemp = (32 + (cpuSpec.tdp / cool.capacity) * 40 * load * (1.25 - fanVal * 0.35)) * (0.55 + 0.45 * power);
    const gpuTemp = (36 + (gpuSpec.tbp / 575) * 34 * load * (1.2 - fanVal * 0.3)) * (0.55 + 0.45 * power);
    monitorState.temp = cpuTemp;
    monitorState.gpuTemp = gpuTemp;
    pc.updateLCD(dt, t, mode === "static" || mode === "breathing" ? state.rgb : "#" + accentC.getHexString(), cpuTemp, power > 0.5 ? 1 : 0.05, 1);

    if (lab.visible) {
      monAcc += dt;
      if (monAcc > 0.09) {
        monAcc = 0;
        const g = teleTex.userData.ctx;
        drawTelemetry(g, teleTex.userData.canvas.width, teleTex.userData.canvas.height, t);
        teleTex.needsUpdate = true;
      }
    }

    // Exploded / fly-in / glass animation
    const exp = state.exploded ? 1 : 0;
    const glassOut = state.glassOpen || state.exploded ? 1 : 0;
    const kk = 1 - Math.pow(1 - 0.14, dt * 60);
    const kg = 1 - Math.pow(1 - 0.08, dt * 60);
    let r;
    r = restPos.get(mobo);
    lerpTo(mobo, r.x, r.y, r.z + (1 - ease(flyIn.mobo)) * 1.1 - exp * 0.45, kk);
    r = restPos.get(cpu);
    lerpTo(cpu, r.x, r.y + (1 - ease(flyIn.cpu)) * 0.4, r.z + (1 - ease(flyIn.cpu)) * 0.9 + exp * 0.35 - exp * 0.45, kk);
    r = restPos.get(ssd);
    lerpTo(ssd, r.x + (1 - ease(flyIn.ssd)) * 0.6, r.y, r.z + (1 - ease(flyIn.ssd)) * 0.5 + exp * 0.3 - exp * 0.45, kk);
    ram.forEach((s, i) => {
      const rr = restPos.get(s);
      const f = 1 - ease(flyIn.ram);
      lerpTo(s, rr.x + exp * (i - 1.5) * 0.12, rr.y + f * (0.3 + i * 0.08) + exp * 0.25, rr.z + f * 0.8 + exp * 0.3 - exp * 0.45, kk);
    });
    Object.values(coolers).forEach((c) => {
      const rr = restPos.get(c);
      const f = 1 - ease(flyIn.cooler);
      lerpTo(c, rr.x, rr.y + f * 0.7 + exp * 0.9, rr.z + f * 0.9 + exp * 0.7, kk);
    });
    r = restPos.get(psu);
    lerpTo(psu, r.x - (1 - ease(flyIn.psu)) * 1.4 - exp * 0.9, r.y - exp * 0.25, r.z + exp * 0.9, kk);
    r = restPos.get(glassSide);
    lerpTo(glassSide, r.x, r.y, r.z + glassOut * 1.6, kg);
    r = restPos.get(glassFront);
    lerpTo(glassFront, r.x + exp * 1.4, r.y, r.z, kg);
    r = restPos.get(topPanel);
    lerpTo(topPanel, r.x, r.y + exp * 1.6, r.z, kg);
    fansTop.forEach((f) => {
      const rr = restPos.get(f);
      lerpTo(f, rr.x, rr.y + exp * 1.2, rr.z, kg);
    });
    fansFront.forEach((f) => {
      const rr = restPos.get(f);
      lerpTo(f, rr.x + exp * 0.9, rr.y, rr.z, kg);
    });
    r = restPos.get(fanRear);
    lerpTo(fanRear, r.x - exp * 0.8, r.y, r.z, kg);
    if (gpuMesh && restPos.has(gpuMesh)) {
      const rr = restPos.get(gpuMesh);
      const f = 1 - ease(flyIn.gpu);
      lerpTo(gpuMesh, rr.x + f * 0.6, rr.y - exp * 0.3, rr.z + f * 1.2 + exp * 1.1, kk);
    }

    if (state.airflow) {
      for (const p of airParticles) {
        const u = (t * 0.22 * (0.5 + fanVal) + p.offset) % 1;
        p.curve.getPointAt(u, p.mesh.position);
        p.mesh.material.color.setHSL(0.55 - u * 0.5, 0.95, 0.55);
      }
    }

    // Dust drift
    if (showroom.visible) {
      const arr = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3 + 1] += dt * 0.05;
        arr[i * 3] += Math.sin(t * 0.3 + dustSeed[i]) * dt * 0.02;
        if (arr[i * 3 + 1] > 9) arr[i * 3 + 1] = 0;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    if (hoverBox.visible && hovered) hoverBox.setFromObject(hovered.root);
    updatePins();

    if (composer) {
      filmPass.uniforms.uTime.value = t;
      composer.render(dt);
    } else {
      renderer.render(scene, camera);
    }
  }

  /* ───────────── Public API ───────────── */
  const api = {
    state,
    pc,
    focusPreset,
    setQuality,
    getQuality: () => qualityName,
    setEnvironment(name) {
      setEnvironment(name);
      return envName;
    },
    getEnvironment: () => envName,
    zoom(f) {
      cam.tRadius = THREE.MathUtils.clamp(cam.tRadius * f, 2.6, 17);
      cam.lastInteract = performance.now();
    },
    setPart(cat, val, { focus = true, animate = true } = {}) {
      if (state[cat] === val && cat !== "gpu") return;
      state[cat] = val;
      switch (cat) {
        case "cpu":
          applyCpu();
          if (animate) flyIn.cpu = 0;
          if (focus) focusPreset("cpu");
          break;
        case "mobo":
          applyMobo();
          if (focus) focusPreset("mobo");
          break;
        case "cooler":
          syncCoolers();
          monitorState.cooler = (LOOKUP.cooler[val] || {}).name?.replace("Aqua ", "").toUpperCase() || "";
          if (animate) flyIn.cooler = 0;
          if (focus) focusPreset("cooling");
          break;
        case "gpu":
        case "gpuMount":
          rebuildGPU(animate);
          monitorState.gpu = (LOOKUP.gpu[state.gpu] || {}).name?.replace(/^(NVIDIA GeForce|NVIDIA|AMD Radeon|Intel) /, "").toUpperCase() || "";
          if (focus) focusPreset("gpu");
          break;
        case "gpuFinish":
          applyGpuFinish();
          if (focus) focusPreset("gpu");
          break;
        case "ram":
          syncRam();
          if (animate) flyIn.ram = 0;
          if (focus) focusPreset("ram");
          break;
        case "ramColor":
          applyRamColor();
          if (focus) focusPreset("ram");
          break;
        case "ssd":
          applySsd();
          if (animate) flyIn.ssd = 0;
          if (focus) focusPreset("ssd");
          break;
        case "psu":
          applyPsu();
          if (animate) flyIn.psu = 0;
          if (focus) focusPreset("psu");
          break;
        case "theme":
          applyTheme();
          if (focus) focusPreset("full");
          break;
        case "glass":
          applyGlass();
          if (focus) focusPreset("front");
          break;
        case "cables":
          applyCables();
          if (focus) focusPreset("mobo");
          break;
        case "rgb":
          applyRGBStatic();
          if (state.rgbMode === "off" || state.rgbMode === "wave" || state.rgbMode === "spectrum") state.rgbMode = "static";
          break;
        case "rgbMode":
          if (val === "static" || val === "breathing") applyRGBStatic();
          break;
        default:
          break;
      }
    },
    applyBuild(b, { animate = false } = {}) {
      Object.keys(b).forEach((k) => {
        if (k in state && state[k] !== b[k]) {
          state[k] = b[k];
        }
      });
      applyCpu();
      applyMobo();
      applySsd();
      applyPsu();
      applyTheme();
      applyGlass();
      applyRamColor();
      applyCables();
      rebuildGPU(animate);
      applyGpuFinish();
      applyRGBStatic();
      monitorState.gpu = (LOOKUP.gpu[state.gpu] || {}).name?.replace(/^(NVIDIA GeForce|NVIDIA|AMD Radeon|Intel) /, "").toUpperCase() || "";
      monitorState.cooler = (LOOKUP.cooler[state.cooler] || {}).name?.replace("Aqua ", "").toUpperCase() || "";
      applyStepVisibility();
      if (animate) Object.keys(flyIn).forEach((k) => (flyIn[k] = Math.random() * -0.4));
    },
    updateBench({ cp, aaa, esp, watts }) {
      Object.assign(monitorState, { cp, aaa, esp, watts });
      const g = benchTex.userData.ctx;
      drawBench(g, benchTex.userData.canvas.width, benchTex.userData.canvas.height);
      benchTex.needsUpdate = true;
    },
    setBuildStep(s, { focus = true } = {}) {
      const prev = state.buildStep;
      state.buildStep = THREE.MathUtils.clamp(s | 0, 1, 8);
      applyStepVisibility(prev);
      if (focus) focusPreset({ 1: "bay", 2: "mobo", 3: "cpu", 4: "ssd", 5: "ram", 6: "cooling", 7: "gpu", 8: "full" }[state.buildStep]);
      return state.buildStep;
    },
    toggleExploded(force) {
      state.exploded = force !== undefined ? force : !state.exploded;
      focusPreset(state.exploded ? "bay" : "full");
      return state.exploded;
    },
    toggleGlass(force) {
      state.glassOpen = force !== undefined ? force : !state.glassOpen;
      return state.glassOpen;
    },
    toggleAirflow(force) {
      state.airflow = force !== undefined ? force : !state.airflow;
      airflowGroup.visible = state.airflow;
      return state.airflow;
    },
    togglePower(force) {
      state.powerOn = force !== undefined ? force : !state.powerOn;
      return state.powerOn;
    },
    toggleAutoRotate(force) {
      state.autoRotate = force !== undefined ? force : !state.autoRotate;
      if (state.autoRotate) cam.lastInteract = performance.now() - 20000;
      return state.autoRotate;
    },
    togglePins(force) {
      state.pins = force !== undefined ? force : !state.pins;
      return state.pins;
    },
    getTemps: () => ({ cpu: monitorState.temp, gpu: monitorState.gpuTemp }),
    snapshot() {
      if (composer) composer.render(0);
      else renderer.render(scene, camera);
      return canvas.toDataURL("image/png");
    },
    start() {
      setQuality(qualityName);
      setEnvironment(envName);
      applyStepVisibility();
      frame();
    },
    dispose() {
      running = false;
      ro.disconnect();
      renderer.dispose();
    },
  };
  return api;
}


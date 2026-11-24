/**
 * EIGENLAB — Interactive 3D Derivative & Secant-to-Tangent Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. ANALYTICAL FUNCTION PRESETS
// ============================================================================

export const FUNCTION_PRESETS = {
  cubic: {
    key: 'cubic',
    label: 'Cubic Wave',
    mechatronicsLabel: 'S-Curve Cam Trajectory',
    latex: 'f(x) = 0.25x^3 - 1.5x',
    derivLatex: "f'(x) = 0.75x^2 - 1.5",
    domain: [-3.4, 3.4],
    defaultX: -0.8,
    fn: (x) => 0.25 * x * x * x - 1.5 * x,
    df: (x) => 0.75 * x * x - 1.5,
    ddf: (x) => 1.5 * x,
  },
  sine: {
    key: 'sine',
    label: 'Sine Oscillator',
    mechatronicsLabel: 'Harmonic Actuator Stroke',
    latex: 'f(x) = 2\\sin(x)',
    derivLatex: "f'(x) = 2\\cos(x)",
    domain: [-3.6, 3.6],
    defaultX: 0.5,
    fn: (x) => 2 * Math.sin(x),
    df: (x) => 2 * Math.cos(x),
    ddf: (x) => -2 * Math.sin(x),
  },
  servo: {
    key: 'servo',
    label: 'Damped Servo Response',
    mechatronicsLabel: 'Underdamped PID Step Response',
    latex: 'f(x) = 2.5e^{-0.25x}\\sin(2x)',
    derivLatex: "f'(x) = e^{-0.25x}(5\\cos(2x) - 0.625\\sin(2x))",
    domain: [0, 6.2],
    defaultX: 1.1,
    fn: (x) => 2.5 * Math.exp(-0.25 * x) * Math.sin(2 * x),
    df: (x) => Math.exp(-0.25 * x) * (5 * Math.cos(2 * x) - 0.625 * Math.sin(2 * x)),
    ddf: (x) => Math.exp(-0.25 * x) * (-2.5 * Math.cos(2 * x) - 9.84375 * Math.sin(2 * x)),
  },
  gaussian: {
    key: 'gaussian',
    label: 'Gaussian Bell',
    mechatronicsLabel: 'Smooth Velocity Bell Profile',
    latex: 'f(x) = 3e^{-0.4x^2}',
    derivLatex: "f'(x) = -2.4xe^{-0.4x^2}",
    domain: [-3.5, 3.5],
    defaultX: -1.0,
    fn: (x) => 3 * Math.exp(-0.4 * x * x),
    df: (x) => -2.4 * x * Math.exp(-0.4 * x * x),
    ddf: (x) => (1.92 * x * x - 2.4) * Math.exp(-0.4 * x * x),
  },
  polytrig: {
    key: 'polytrig',
    label: 'Polynomial + Trig Mix',
    mechatronicsLabel: 'Vibration-Coupled Lead Screw',
    latex: 'f(x) = 0.2x^2 + \\cos(1.5x)',
    derivLatex: "f'(x) = 0.4x - 1.5\\sin(1.5x)",
    domain: [-3.4, 3.4],
    defaultX: 0.8,
    fn: (x) => 0.2 * x * x + Math.cos(1.5 * x),
    df: (x) => 0.4 * x - 1.5 * Math.sin(1.5 * x),
    ddf: (x) => 0.4 - 2.25 * Math.cos(1.5 * x),
  },
};

// ============================================================================
// 2. CONSTANTS & SHARED MATH / GEOMETRY UTILITIES
// ============================================================================

const WORLD_SCALE = 0.72; // Isotropic X & Y scale preserves true geometric slopes (slope 1 = 45 deg)
const DERIV_Z = -0.65;
const TANGENT_THRESHOLD = 0.025;
const ACTUATOR_X = -3.55;
const PLINTH_WIDTH = 8.9;
const PLINTH_DEPTH = 3.5;
const PLINTH_HEIGHT = 0.26;
const PLINTH_OFFSET_X = -0.3;

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanDeep: 0x0891b2,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  violet: 0xa78bfa,
  violetDeep: 0x7c3aed,
  emerald: 0x34d399,
  coral: 0xfb7185,
  slateGlass: 0x0d1526,
  aluminum: 0x94a3b8,
  anodized: 0x1e293b,
};

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Sample f'(x) across the active domain and locate roots via sign-change + bisection.
 */
function findCriticalPoints(preset, samples = 360) {
  const [minX, maxX] = preset.domain;
  const step = (maxX - minX) / samples;
  const rawRoots = [];

  let prevX = minX;
  let prevV = preset.df(prevX);

  for (let i = 1; i <= samples; i++) {
    const curX = i === samples ? maxX : minX + i * step;
    const curV = preset.df(curX);

    if (Math.abs(prevV) < 1e-6) {
      rawRoots.push(prevX);
    } else if (prevV * curV < 0) {
      let lo = prevX;
      let hi = curX;
      let fLo = prevV;
      for (let iter = 0; iter < 32; iter++) {
        const mid = 0.5 * (lo + hi);
        const fMid = preset.df(mid);
        if (Math.abs(fMid) < 1e-9) {
          lo = hi = mid;
          break;
        }
        if (fLo * fMid <= 0) {
          hi = mid;
        } else {
          lo = mid;
          fLo = fMid;
        }
      }
      rawRoots.push(0.5 * (lo + hi));
    }

    prevX = curX;
    prevV = curV;
  }

  // Deduplicate roots within tolerance and exclude exact domain boundary noise
  const deduped = [];
  for (const r of rawRoots) {
    if (r <= minX + 1e-3 || r >= maxX - 1e-3) continue;
    if (deduped.some((existing) => Math.abs(existing - r) < 1e-2)) continue;
    deduped.push(r);
  }

  return deduped.map((x) => {
    const y = preset.fn(x);
    const ddf = preset.ddf(x);
    let type = 'inflection';
    if (ddf > 1e-4) type = 'min';
    else if (ddf < -1e-4) type = 'max';
    return { x, y, ddf, type };
  });
}

/**
 * Safely align a unit-height (1.0), unit-radius (1.0) cylinder mesh between pA and pB.
 * Guards against zero-length or non-finite vectors.
 */
function alignCylinderBetween(mesh, pA, pB, radius) {
  _tmpDelta.subVectors(pB, pA);
  const len = _tmpDelta.length();
  if (!Number.isFinite(len) || len < 1e-4 || radius <= 0) {
    mesh.visible = false;
    return false;
  }
  _tmpDir.copy(_tmpDelta).divideScalar(len);
  _tmpMid.addVectors(pA, pB).multiplyScalar(0.5);
  _tmpQuat.setFromUnitVectors(UP_VEC, _tmpDir);

  mesh.visible = true;
  mesh.position.copy(_tmpMid);
  mesh.quaternion.copy(_tmpQuat);
  mesh.scale.set(radius, len, radius);
  return true;
}

/**
 * Safely orient an object whose local +Y points along a unit direction vector.
 */
function orientAlongY(obj, dir) {
  const len = dir.length();
  if (!Number.isFinite(len) || len < 1e-5) return false;
  _tmpDir.copy(dir).divideScalar(len);
  obj.quaternion.setFromUnitVectors(UP_VEC, _tmpDir);
  return true;
}

/**
 * Filter near-duplicate consecutive vertices and create a safe TubeGeometry.
 */
function createSafeTubeGeometry(points, tubularSegments, radius, radialSegments) {
  const cleaned = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
    if (cleaned.length === 0 || cleaned[cleaned.length - 1].distanceToSquared(p) > 1e-8) {
      cleaned.push(p);
    }
  }
  if (cleaned.length < 2) {
    return new THREE.BufferGeometry();
  }
  const curve = new THREE.CatmullRomCurve3(cleaned, false, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

/**
 * Build a translucent vertical curtain ribbon from y = 0 to y = point.y with smooth vertex colors.
 */
function createCurtainGeometry(points, topHex, bottomHex) {
  const n = points.length;
  if (n < 2) return new THREE.BufferGeometry();

  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const topColor = new THREE.Color(topHex);
  const bottomColor = new THREE.Color(bottomHex);

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const baseIdx = i * 6;

    // Bottom vertex at y = 0
    positions[baseIdx] = p.x;
    positions[baseIdx + 1] = 0;
    positions[baseIdx + 2] = p.z;
    colors[baseIdx] = bottomColor.r;
    colors[baseIdx + 1] = bottomColor.g;
    colors[baseIdx + 2] = bottomColor.b;

    // Top vertex at y = p.y
    positions[baseIdx + 3] = p.x;
    positions[baseIdx + 4] = p.y;
    positions[baseIdx + 5] = p.z;

    // Modulate intensity slightly by height so near-zero crossings stay silky
    const hFactor = clamp(Math.abs(p.y) / 1.4, 0.28, 1.0);
    colors[baseIdx + 3] = topColor.r * hFactor;
    colors[baseIdx + 4] = topColor.g * hFactor;
    colors[baseIdx + 5] = topColor.b * hFactor;
  }

  let ptr = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices[ptr++] = a;
    indices[ptr++] = b;
    indices[ptr++] = c;
    indices[ptr++] = b;
    indices[ptr++] = d;
    indices[ptr++] = c;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Create a rounded-rectangle 2D THREE.Shape centered at (0, 0).
 */
function createRoundedRectShape(width, depth, radius) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const r = Math.min(radius, hw * 0.9, hd * 0.9);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

/**
 * Create a bevelled frosted-glass plinth geometry whose top surface sits at y = 0.
 */
function createPlinthSlabGeometry(width, depth, height, cornerRadius, bevel) {
  const innerW = Math.max(width - bevel * 2, 0.2);
  const innerD = Math.max(depth - bevel * 2, 0.2);
  const coreH = Math.max(height - bevel * 2, 0.04);
  const shape = createRoundedRectShape(innerW, innerD, Math.max(cornerRadius - bevel, 0.05));
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: coreH,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  });
  // Rotate so extrusion lies along Y and top face sits cleanly at y = 0
  geom.rotateX(Math.PI / 2);
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    geom.translate(0, -geom.boundingBox.max.y, 0);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * Create a closed glowing perimeter tube around the top chamfer of the plinth.
 */
function createPlinthRimGeometry(width, depth, cornerRadius, tubeRadius = 0.015) {
  const shape = createRoundedRectShape(width, depth, cornerRadius);
  const pts2D = shape.getSpacedPoints(120);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.008, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 140, tubeRadius, 8, true);
}

/**
 * Procedural radial glow texture for studio floor ambient light pool.
 */
function createRadialGlowTexture(innerRgba, midRgba, outerRgba) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    grad.addColorStop(0, innerRgba);
    grad.addColorStop(0.42, midRgba);
    grad.addColorStop(1, outerRgba);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Dispose all geometries and materials inside a temporary group without touching shared materials.
 */
function disposeGroupChildren(group, sharedMaterials = new Set(), sharedGeometries = new Set()) {
  const disposedGeos = new Set();
  const disposedMats = new Set();
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse((node) => {
      if (node.geometry && !sharedGeometries.has(node.geometry) && !disposedGeos.has(node.geometry)) {
        disposedGeos.add(node.geometry);
        node.geometry.dispose();
      }
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of mats) {
          if (m && !sharedMaterials.has(m) && !disposedMats.has(m)) {
            disposedMats.add(m);
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      }
    });
  }
}

// ============================================================================
// 3. DERIVATIVE 3D STUDIO CLASS
// ============================================================================

export class Derivative3DStudio {
  constructor(options = {}) {
    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

    this.fnKey = FUNCTION_PRESETS[options.fnKey] ? options.fnKey : 'cubic';
    const initPreset = FUNCTION_PRESETS[this.fnKey];
    this.x = Number.isFinite(options.x)
      ? clamp(options.x, initPreset.domain[0], initPreset.domain[1])
      : initPreset.defaultX;
    this.dx = Number.isFinite(options.dx) ? options.dx : 1.25;

    this.showDerivative = options.showDerivative ?? true;
    this.showMechatronics = options.showMechatronics ?? true;
    this.cameraPreset = '3d';

    // Derived math state
    this._criticalPoints = findCriticalPoints(initPreset);
    this._minWorldY = -2.0;
    this._maxWorldY = 2.0;
    this._currentPlinthY = -2.25;
    this._targetPlinthY = -2.25;

    // Three.js core handles
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;
    this.envRT = null;

    // Groups & interactive meshes
    this._stageGroup = null;
    this._plinthGroup = null;
    this._axesGroup = null;
    this._fnGroup = null;
    this._derivGroup = null;
    this._criticalGroup = null;
    this._interactiveGroup = null;
    this._actuatorGroup = null;

    this._criticalAnimItems = [];
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Animation & lifecycle handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = new THREE.Clock();
    this._initialized = false;
    this._disposed = false;

    // Camera transition state
    this._camTransition = null;

    // Limit animation state
    this._limitAnim = null;

    // Bound handlers
    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  // --------------------------------------------------------------------------
  // Coordinate Mapping (domain-centered so e.g. 'servo' [0, 6.2] sits centered)
  // --------------------------------------------------------------------------

  _getPreset() {
    return FUNCTION_PRESETS[this.fnKey] || FUNCTION_PRESETS.cubic;
  }

  _getDomainMid() {
    const [minX, maxX] = this._getPreset().domain;
    return 0.5 * (minX + maxX);
  }

  _mathToWorldX(mx) {
    return (mx - this._getDomainMid()) * WORLD_SCALE;
  }

  _mathToWorldY(my) {
    return my * WORLD_SCALE;
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  init(container) {
    if (!container) return this;
    if (this._initialized) {
      this.dispose();
    }
    this._disposed = false;
    this.container = container;

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.02);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. Renderer (mandatory Spline-quality physical standards)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(COLORS.studioBg, 0);

    const dom = this.renderer.domElement;
    dom.style.display = 'block';
    dom.style.width = '100%';
    dom.style.height = '100%';
    dom.style.outline = 'none';
    container.appendChild(dom);

    // 3. Studio Reflections via PMREMGenerator + RoomEnvironment (no external HDR)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 4. Post-Processing: EffectComposer + RenderPass + tasteful UnrealBloomPass
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.composer.setSize(width, height);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.72);
    this.composer.addPass(this.bloomPass);

    // 5. Smoothly Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.65;
    this.controls.minPolarAngle = 0.1;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 24.0;
    this.controls.rotateSpeed = 0.78;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.65;
    this.controls.addEventListener('start', this._onControlsStart);

    // 6. Lighting & Shared Resources
    this._setupLighting();
    this._createSharedResources();

    // 7. Build Scene Hierarchy
    this._stageGroup = new THREE.Group();
    this.scene.add(this._stageGroup);

    this._plinthGroup = new THREE.Group();
    this._axesGroup = new THREE.Group();
    this._fnGroup = new THREE.Group();
    this._derivGroup = new THREE.Group();
    this._criticalGroup = new THREE.Group();
    this._interactiveGroup = new THREE.Group();
    this._actuatorGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._axesGroup,
      this._fnGroup,
      this._derivGroup,
      this._criticalGroup,
      this._interactiveGroup,
      this._actuatorGroup
    );

    this._buildPlinth();
    this._buildInteractiveRig();
    this._buildMechatronicsActuator();

    // Build active preset curves, axes, and critical beacons
    this._rebuildPresetScene(true);
    this._updateInteractiveElements();

    // Apply initial camera preset immediately
    this._applyCameraPresetImmediate(this.cameraPreset);

    // Observe container resizes
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._initialized = true;
    this._clock.start();
    this._rafId = requestAnimationFrame(this._onAnimate);
    this._emitChange();

    return this;
  }

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.55);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.3);
    keyLight.position.set(6.5, 9.5, 7.5);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight(COLORS.cyan, 2.2, 24, 1.5);
    cyanRim.position.set(-5.5, 3.2, -3.5);
    this.scene.add(cyanRim);

    const amberFill = new THREE.PointLight(COLORS.amber, 1.35, 22, 1.6);
    amberFill.position.set(5.8, -1.2, 4.2);
    this.scene.add(amberFill);

    const violetBack = new THREE.PointLight(COLORS.violet, 1.25, 20, 1.6);
    violetBack.position.set(0.0, 4.2, -6.0);
    this.scene.add(violetBack);
  }

  _createSharedResources() {
    // Unit primitives (scaled dynamically by alignCylinderBetween)
    this._unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false);
    this._unitCone = new THREE.ConeGeometry(1, 1, 20);
    this._beaconOcta = new THREE.OctahedronGeometry(0.085, 0);
    this._beaconRing = new THREE.TorusGeometry(0.145, 0.011, 10, 36);
    this._sharedGeometries.add(
      this._unitCylinder,
      this._unitCone,
      this._beaconOcta,
      this._beaconRing
    );

    // Shared materials
    this._matFunctionTube = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.92,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.45,
    });

    this._matFunctionCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._matDerivTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.violet,
      emissive: 0x8b5cf6,
      emissiveIntensity: 1.0,
      roughness: 0.16,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.35,
    });

    this._matDerivCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._matSpecularAxis = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      emissive: 0x1e3a5f,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.9,
      envMapIntensity: 1.4,
    });

    this._matAxisTick = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      roughness: 0.25,
      metalness: 0.75,
    });

    this._matBeaconMin = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7b7,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.55,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
    });

    this._matBeaconMax = new THREE.MeshPhysicalMaterial({
      color: 0xfda4af,
      emissive: COLORS.coral,
      emissiveIntensity: 1.55,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
    });

    this._matBeaconInflection = new THREE.MeshPhysicalMaterial({
      color: 0xfde68a,
      emissive: COLORS.amber,
      emissiveIntensity: 1.4,
      roughness: 0.14,
      metalness: 0.15,
      clearcoat: 1.0,
    });

    this._matDropPin = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });

    this._sharedMaterials.add(
      this._matFunctionTube,
      this._matFunctionCurtain,
      this._matDerivTube,
      this._matDerivCurtain,
      this._matSpecularAxis,
      this._matAxisTick,
      this._matBeaconMin,
      this._matBeaconMax,
      this._matBeaconInflection,
      this._matDropPin
    );
  }

  // --------------------------------------------------------------------------
  // Floating Frosted-Glass Studio Plinth
  // --------------------------------------------------------------------------

  _buildPlinth() {
    this._plinthGroup.position.set(PLINTH_OFFSET_X, this._currentPlinthY, 0);

    // 1. Bevelled dark frosted-glass slab (top at local y = 0)
    const slabGeom = createPlinthSlabGeometry(
      PLINTH_WIDTH,
      PLINTH_DEPTH,
      PLINTH_HEIGHT,
      0.34,
      0.05
    );
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.slateGlass,
      roughness: 0.16,
      metalness: 0.18,
      transmission: 0.32,
      thickness: 0.55,
      ior: 1.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      envMapIntensity: 1.35,
      transparent: true,
      opacity: 0.9,
    });
    const slabMesh = new THREE.Mesh(slabGeom, slabMat);
    this._plinthGroup.add(slabMesh);

    // 2. Inset anodized dark metallic sub-chassis
    const chassisGeom = createPlinthSlabGeometry(
      PLINTH_WIDTH - 0.36,
      PLINTH_DEPTH - 0.36,
      0.09,
      0.24,
      0.02
    );
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.32,
      metalness: 0.85,
      clearcoat: 0.4,
      envMapIntensity: 1.1,
    });
    const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
    chassisMesh.position.y = -PLINTH_HEIGHT + 0.01;
    this._plinthGroup.add(chassisMesh);

    // 3. Crisp glowing perimeter rim tube
    const rimGeom = createPlinthRimGeometry(PLINTH_WIDTH - 0.08, PLINTH_DEPTH - 0.08, 0.32, 0.014);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.25,
      roughness: 0.2,
      metalness: 0.3,
    });
    const rimMesh = new THREE.Mesh(rimGeom, this._plinthRimMat);
    this._plinthGroup.add(rimMesh);

    // 4. Subtle etched surface grid & Z-plane guide tracks on top of the plinth
    const floorPts = [];
    const halfW = PLINTH_WIDTH * 0.5 - 0.4;
    const halfD = PLINTH_DEPTH * 0.5 - 0.35;
    const ySurf = 0.005;

    for (let gx = -Math.floor(halfW); gx <= Math.floor(halfW); gx += 0.72) {
      floorPts.push(gx, ySurf, -halfD, gx, ySurf, halfD);
    }
    for (let gz = -1.2; gz <= 1.21; gz += 0.6) {
      floorPts.push(-halfW, ySurf, gz, halfW, ySurf, gz);
    }
    const floorGridGeom = new THREE.BufferGeometry();
    floorGridGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPts, 3));
    const floorGridMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    this._plinthGroup.add(new THREE.LineSegments(floorGridGeom, floorGridMat));

    // Luminous lane indicators on plinth for z = 0 (f(x)) and z = -0.65 (f'(x))
    const laneCyanGeom = new THREE.BoxGeometry(PLINTH_WIDTH - 1.9, 0.006, 0.018);
    const laneCyanMat = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.45,
    });
    const laneCyan = new THREE.Mesh(laneCyanGeom, laneCyanMat);
    laneCyan.position.set(0.35, 0.008, 0);
    this._plinthGroup.add(laneCyan);

    const laneVioletGeom = new THREE.BoxGeometry(PLINTH_WIDTH - 1.9, 0.006, 0.016);
    const laneVioletMat = new THREE.MeshBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.38,
    });
    this._plinthDerivLane = new THREE.Mesh(laneVioletGeom, laneVioletMat);
    this._plinthDerivLane.position.set(0.35, 0.008, DERIV_Z);
    this._plinthDerivLane.visible = this.showDerivative;
    this._plinthGroup.add(this._plinthDerivLane);

    // 5. Soft studio under-glow pool beneath floating plinth
    const glowTex = createRadialGlowTexture(
      'rgba(34, 211, 238, 0.24)',
      'rgba(99, 102, 241, 0.08)',
      'rgba(11, 13, 18, 0.0)'
    );
    this._ownedTextures.push(glowTex);
    const glowPlaneGeom = new THREE.PlaneGeometry(PLINTH_WIDTH * 1.25, PLINTH_DEPTH * 1.45);
    const glowPlaneMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowPlane = new THREE.Mesh(glowPlaneGeom, glowPlaneMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = -PLINTH_HEIGHT - 0.14;
    this._plinthGroup.add(glowPlane);
  }

  // --------------------------------------------------------------------------
  // Luminous Cartesian Grid & Specular Axes (rebuilt per preset)
  // --------------------------------------------------------------------------

  _rebuildAxesAndGrid() {
    disposeGroupChildren(this._axesGroup, this._sharedMaterials, this._sharedGeometries);

    const preset = this._getPreset();
    const [minX, maxX] = preset.domain;

    const wxMin = this._mathToWorldX(minX) - 0.35;
    const wxMax = this._mathToWorldX(maxX) + 0.45;
    const wyMin = Math.min(-2.0, this._minWorldY - 0.25);
    const wyMax = Math.max(2.3, this._maxWorldY + 0.45);

    const zGrid = -0.025;

    // 1. Major & Minor Cartesian grid lines in XY plane
    const majorPts = [];
    const minorPts = [];

    const xIntStart = Math.ceil(minX * 2) / 2;
    const xIntEnd = Math.floor(maxX * 2) / 2;
    for (let mx = xIntStart; mx <= xIntEnd + 1e-6; mx += 0.5) {
      const wx = this._mathToWorldX(mx);
      const isMajor = Math.abs(mx - Math.round(mx)) < 1e-3;
      const target = isMajor ? majorPts : minorPts;
      target.push(wx, wyMin, zGrid, wx, wyMax, zGrid);
    }

    const yMathMin = Math.ceil((wyMin / WORLD_SCALE) * 2) / 2;
    const yMathMax = Math.floor((wyMax / WORLD_SCALE) * 2) / 2;
    for (let my = yMathMin; my <= yMathMax + 1e-6; my += 0.5) {
      const wy = this._mathToWorldY(my);
      const isMajor = Math.abs(my - Math.round(my)) < 1e-3;
      const target = isMajor ? majorPts : minorPts;
      target.push(wxMin, wy, zGrid, wxMax, wy, zGrid);
    }

    if (majorPts.length > 0) {
      const majorGeom = new THREE.BufferGeometry();
      majorGeom.setAttribute('position', new THREE.Float32BufferAttribute(majorPts, 3));
      const majorMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      this._axesGroup.add(new THREE.LineSegments(majorGeom, majorMat));
    }

    if (minorPts.length > 0) {
      const minorGeom = new THREE.BufferGeometry();
      minorGeom.setAttribute('position', new THREE.Float32BufferAttribute(minorPts, 3));
      const minorMat = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      });
      this._axesGroup.add(new THREE.LineSegments(minorGeom, minorMat));
    }

    // 2. Specular X-Axis (y = 0, z = 0)
    const xAxisMesh = new THREE.Mesh(this._unitCylinder, this._matSpecularAxis);
    alignCylinderBetween(
      xAxisMesh,
      new THREE.Vector3(wxMin, 0, 0),
      new THREE.Vector3(wxMax, 0, 0),
      0.015
    );
    this._axesGroup.add(xAxisMesh);

    const xTip = new THREE.Mesh(this._unitCone, this._matSpecularAxis);
    xTip.position.set(wxMax + 0.06, 0, 0);
    xTip.rotation.z = -Math.PI / 2;
    xTip.scale.set(0.045, 0.14, 0.045);
    this._axesGroup.add(xTip);

    // 3. Specular Y-Axis at true mathematical x = 0 (centered for symmetric domains, left-aligned for 'servo')
    const wyAxisX = this._mathToWorldX(0);
    const yAxisMesh = new THREE.Mesh(this._unitCylinder, this._matSpecularAxis);
    alignCylinderBetween(
      yAxisMesh,
      new THREE.Vector3(wyAxisX, wyMin, 0),
      new THREE.Vector3(wyAxisX, wyMax, 0),
      0.015
    );
    this._axesGroup.add(yAxisMesh);

    const yTip = new THREE.Mesh(this._unitCone, this._matSpecularAxis);
    yTip.position.set(wyAxisX, wyMax + 0.06, 0);
    yTip.scale.set(0.045, 0.14, 0.045);
    this._axesGroup.add(yTip);

    // 4. Fine tick markers along X, Y, and Z depth axis
    const tickGeomX = new THREE.BoxGeometry(0.016, 0.09, 0.016);
    const tickGeomY = new THREE.BoxGeometry(0.09, 0.016, 0.016);

    for (let mx = Math.ceil(minX); mx <= Math.floor(maxX); mx++) {
      if (mx === 0) continue;
      const tick = new THREE.Mesh(tickGeomX, this._matAxisTick);
      tick.position.set(this._mathToWorldX(mx), 0, 0);
      this._axesGroup.add(tick);
    }

    for (let my = Math.ceil(wyMin / WORLD_SCALE); my <= Math.floor(wyMax / WORLD_SCALE); my++) {
      if (my === 0) continue;
      const tick = new THREE.Mesh(tickGeomY, this._matAxisTick);
      tick.position.set(wyAxisX, this._mathToWorldY(my), 0);
      this._axesGroup.add(tick);
    }

    // Z depth rail connecting f(x) plane (z = 0) and f'(x) plane (z = -0.65)
    const zAxisMesh = new THREE.Mesh(this._unitCylinder, this._matAxisTick);
    alignCylinderBetween(
      zAxisMesh,
      new THREE.Vector3(wyAxisX, 0, 0.25),
      new THREE.Vector3(wyAxisX, 0, DERIV_Z - 0.25),
      0.01
    );
    this._axesGroup.add(zAxisMesh);

    // Z depth tick collars
    const zTickGeom = new THREE.TorusGeometry(0.032, 0.007, 8, 20);
    const zTickMain = new THREE.Mesh(zTickGeom, this._matFunctionTube);
    zTickMain.position.set(wyAxisX, 0, 0);
    this._axesGroup.add(zTickMain);

    const zTickDeriv = new THREE.Mesh(zTickGeom, this._matDerivTube);
    zTickDeriv.position.set(wyAxisX, 0, DERIV_Z);
    this._axesGroup.add(zTickDeriv);
  }

  // --------------------------------------------------------------------------
  // Sculpted Curves f(x), f'(x) & Critical Point Beacons
  // --------------------------------------------------------------------------

  _rebuildPresetScene(snapPlinth = false) {
    const preset = this._getPreset();
    const [minX, maxX] = preset.domain;
    const samples = 160;

    const fnPoints = [];
    const derivPoints = [];
    const baselinePoints = [];

    let minWY = Infinity;
    let maxWY = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const mx = minX + ((maxX - minX) * i) / samples;
      const wx = this._mathToWorldX(mx);

      const fy = preset.fn(mx);
      const wy = this._mathToWorldY(fy);
      minWY = Math.min(minWY, wy);
      maxWY = Math.max(maxWY, wy);

      fnPoints.push(new THREE.Vector3(wx, wy, 0));
      baselinePoints.push(new THREE.Vector3(wx, 0, 0.004));

      const dfy = clamp(preset.df(mx), -8.5, 8.5);
      derivPoints.push(new THREE.Vector3(wx, this._mathToWorldY(dfy), DERIV_Z));
    }

    this._minWorldY = minWY;
    this._maxWorldY = maxWY;
    this._targetPlinthY = Math.min(-2.15, minWY - 0.5);
    if (snapPlinth) {
      this._currentPlinthY = this._targetPlinthY;
      this._plinthGroup.position.y = this._currentPlinthY;
    }

    // 1. Active Function f(x) sculpted 3D tube + translucent gradient curtain
    disposeGroupChildren(this._fnGroup, this._sharedMaterials, this._sharedGeometries);

    const fnTubeGeom = createSafeTubeGeometry(fnPoints, 160, 0.052, 16);
    const fnTubeMesh = new THREE.Mesh(fnTubeGeom, this._matFunctionTube);
    this._fnGroup.add(fnTubeMesh);

    const fnCurtainGeom = createCurtainGeometry(fnPoints, COLORS.cyan, 0x051324);
    const fnCurtainMesh = new THREE.Mesh(fnCurtainGeom, this._matFunctionCurtain);
    this._fnGroup.add(fnCurtainMesh);

    const baseGeom = new THREE.BufferGeometry().setFromPoints(baselinePoints);
    const baseMat = new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    this._fnGroup.add(new THREE.Line(baseGeom, baseMat));

    // 2. Secondary Derivative Curve f'(x) at z = -0.65
    disposeGroupChildren(this._derivGroup, this._sharedMaterials, this._sharedGeometries);

    const derivTubeGeom = createSafeTubeGeometry(derivPoints, 160, 0.04, 16);
    const derivTubeMesh = new THREE.Mesh(derivTubeGeom, this._matDerivTube);
    this._derivGroup.add(derivTubeMesh);

    const derivCurtainGeom = createCurtainGeometry(derivPoints, COLORS.violet, 0x110a24);
    const derivCurtainMesh = new THREE.Mesh(derivCurtainGeom, this._matDerivCurtain);
    this._derivGroup.add(derivCurtainMesh);

    // Subtle baseline for f'(x) at z = -0.65
    const derivBasePts = [
      new THREE.Vector3(this._mathToWorldX(minX), 0, DERIV_Z),
      new THREE.Vector3(this._mathToWorldX(maxX), 0, DERIV_Z),
    ];
    const derivBaseGeom = new THREE.BufferGeometry().setFromPoints(derivBasePts);
    const derivBaseMat = new THREE.LineBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this._derivGroup.add(new THREE.Line(derivBaseGeom, derivBaseMat));

    // Synced violet probe on f'(x) + translucent Z-bridge back to f(x)
    const dProbeGeom = new THREE.SphereGeometry(0.072, 20, 20);
    const dProbeMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      emissive: COLORS.violet,
      emissiveIntensity: 1.5,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._derivProbe = new THREE.Mesh(dProbeGeom, dProbeMat);
    this._derivGroup.add(this._derivProbe);

    this._derivBridgeMat = new THREE.MeshBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this._derivBridge = new THREE.Mesh(this._unitCylinder, this._derivBridgeMat);
    this._derivGroup.add(this._derivBridge);

    this._derivGroup.visible = this.showDerivative;
    if (this._plinthDerivLane) {
      this._plinthDerivLane.visible = this.showDerivative;
    }

    // 3. Rebuild Cartesian grid & specular axes to match domain & vertical bounds
    this._rebuildAxesAndGrid();

    // 4. Critical Point Beacons (f'(x) = 0)
    this._criticalPoints = findCriticalPoints(preset);
    this._rebuildCriticalBeacons();

    // 5. Update Mechatronics linear rail span to cover the new preset range cleanly
    this._updateActuatorRailSpan(snapPlinth ? this._targetPlinthY : this._currentPlinthY);
  }

  _rebuildCriticalBeacons() {
    disposeGroupChildren(this._criticalGroup, this._sharedMaterials, this._sharedGeometries);
    this._criticalAnimItems = [];

    for (let i = 0; i < this._criticalPoints.length; i++) {
      const cp = this._criticalPoints[i];
      const wx = this._mathToWorldX(cp.x);
      const wy = this._mathToWorldY(cp.y);

      const mat =
        cp.type === 'min'
          ? this._matBeaconMin
          : cp.type === 'max'
            ? this._matBeaconMax
            : this._matBeaconInflection;

      const beaconRoot = new THREE.Group();
      beaconRoot.position.set(wx, wy, 0.05);

      const crystal = new THREE.Mesh(this._beaconOcta, mat);
      beaconRoot.add(crystal);

      const halo = new THREE.Mesh(this._beaconRing, mat);
      halo.rotation.x = Math.PI / 2;
      beaconRoot.add(halo);

      this._criticalGroup.add(beaconRoot);

      // Subtle vertical drop pin from (wx, wy, 0) to (wx, 0, 0)
      if (Math.abs(wy) > 0.08) {
        const pin = new THREE.Mesh(this._unitCylinder, this._matDropPin);
        alignCylinderBetween(
          pin,
          new THREE.Vector3(wx, 0, 0),
          new THREE.Vector3(wx, wy, 0),
          0.008
        );
        this._criticalGroup.add(pin);
      }

      this._criticalAnimItems.push({
        crystal,
        halo,
        phase: i * 1.15,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Interactive Secant -> Tangent Limit Mechanic Rig
  // --------------------------------------------------------------------------

  _buildInteractiveRig() {
    // 1. Cyan Probe Sphere at (x0, f(x0)) + pulsing halo ring + subtle drop pin
    const probeGeo0 = new THREE.SphereGeometry(0.115, 28, 28);
    this._matProbe0 = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.65,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    this._probe0 = new THREE.Mesh(probeGeo0, this._matProbe0);

    const haloGeo0 = new THREE.TorusGeometry(0.195, 0.014, 12, 48);
    this._matHalo0 = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.85,
    });
    this._probe0Halo = new THREE.Mesh(haloGeo0, this._matHalo0);
    this._probe0.add(this._probe0Halo);
    this._interactiveGroup.add(this._probe0);

    this._probe0DropPin = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    this._interactiveGroup.add(this._probe0DropPin);

    // 2. Amber Probe Sphere at (x0 + dx, f(x0 + dx)) + halo ring
    const probeGeo1 = new THREE.SphereGeometry(0.102, 28, 28);
    this._matProbe1 = new THREE.MeshPhysicalMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.6,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    this._probe1 = new THREE.Mesh(probeGeo1, this._matProbe1);

    const haloGeo1 = new THREE.TorusGeometry(0.165, 0.012, 12, 40);
    const matHalo1 = new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.8,
    });
    this._probe1Halo = new THREE.Mesh(haloGeo1, matHalo1);
    this._probe1.add(this._probe1Halo);
    this._interactiveGroup.add(this._probe1);

    // 3. Glowing 3D Secant / Tangent Line
    this._matSecantLine = new THREE.MeshPhysicalMaterial({
      color: 0xfde68a,
      emissive: COLORS.amber,
      emissiveIntensity: 1.35,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.96,
    });
    this._secantLine = new THREE.Mesh(this._unitCylinder, this._matSecantLine);
    this._interactiveGroup.add(this._secantLine);

    // 4. Glowing 3D Tangent Vector Shaft + Crisp Cone Arrowhead (activates as |dx| -> 0.025)
    this._matTangentVec = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7b7,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.7,
      roughness: 0.1,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._tangentShaft = new THREE.Mesh(this._unitCylinder, this._matTangentVec);
    this._tangentCone = new THREE.Mesh(this._unitCone, this._matTangentVec);
    this._tangentShaft.visible = false;
    this._tangentCone.visible = false;
    this._interactiveGroup.add(this._tangentShaft, this._tangentCone);

    // 5. Right-Triangle Rise/Run Drop (Run bar dx, Rise bar dy, translucent filled triangle)
    this._matRunBar = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.15,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    this._runBar = new THREE.Mesh(this._unitCylinder, this._matRunBar);
    this._interactiveGroup.add(this._runBar);

    this._matRiseBar = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    this._riseBar = new THREE.Mesh(this._unitCylinder, this._matRiseBar);
    this._interactiveGroup.add(this._riseBar);

    // Corner node at (x0 + dx, f(x0))
    const cornerGeo = new THREE.SphereGeometry(0.042, 16, 16);
    this._cornerNode = new THREE.Mesh(cornerGeo, this._matRunBar);
    this._interactiveGroup.add(this._cornerNode);

    // Filled translucent triangle face
    const triPositions = new Float32Array(9);
    this._triGeom = new THREE.BufferGeometry();
    this._triGeom.setAttribute('position', new THREE.BufferAttribute(triPositions, 3));
    this._matTriFill = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._triMesh = new THREE.Mesh(this._triGeom, this._matTriFill);
    this._interactiveGroup.add(this._triMesh);
  }

  // --------------------------------------------------------------------------
  // Miniature 3D Mechatronics Linear Actuator / Servo Carriage
  // --------------------------------------------------------------------------

  _buildMechatronicsActuator() {
    this._actuatorGroup.position.set(ACTUATOR_X, 0, 0);
    this._actuatorGroup.visible = this.showMechatronics;

    const matStainless = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.16,
      metalness: 0.94,
      clearcoat: 0.85,
      envMapIntensity: 1.65,
    });

    const matAnodized = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.82,
      clearcoat: 0.55,
      envMapIntensity: 1.3,
    });

    const matBrushedAlum = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      roughness: 0.28,
      metalness: 0.88,
      clearcoat: 0.4,
      envMapIntensity: 1.4,
    });

    const matCyanGlass = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.95,
      roughness: 0.12,
      metalness: 0.15,
      transmission: 0.35,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.92,
    });

    // Twin cylindrical stainless guide rails + central lead screw
    this._railFront = new THREE.Mesh(this._unitCylinder, matStainless);
    this._railBack = new THREE.Mesh(this._unitCylinder, matStainless);
    this._leadScrew = new THREE.Mesh(this._unitCylinder, matBrushedAlum);
    this._actuatorGroup.add(this._railFront, this._railBack, this._leadScrew);

    // Anodized top & bottom CNC end caps
    const capGeo = new THREE.BoxGeometry(0.46, 0.22, 0.62);
    this._topCap = new THREE.Mesh(capGeo, matAnodized);
    this._bottomCap = new THREE.Mesh(capGeo, matAnodized);

    // Subtle anodized decorative collars + stepper motor canister on bottom cap
    const motorGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.28, 24);
    const motorMesh = new THREE.Mesh(motorGeo, matAnodized);
    motorMesh.position.set(0, -0.22, 0);
    this._bottomCap.add(motorMesh);

    const motorRingGeo = new THREE.TorusGeometry(0.165, 0.012, 10, 32);
    const motorRingMat = new THREE.MeshStandardMaterial({
      color: COLORS.cyan,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.2,
    });
    const motorRing = new THREE.Mesh(motorRingGeo, motorRingMat);
    motorRing.rotation.x = Math.PI / 2;
    motorRing.position.set(0, -0.14, 0);
    this._bottomCap.add(motorRing);

    const topCapAccent = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.64), matBrushedAlum);
    topCapAccent.position.y = 0.06;
    this._topCap.add(topCapAccent);

    this._actuatorGroup.add(this._topCap, this._bottomCap);

    // Sliding CNC-style frosted-cyan carriage block
    this._carriage = new THREE.Group();

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.56), matAnodized);
    this._carriage.add(bodyMesh);

    // Frosted cyan glowing acrylic core insert wrapping carriage sides
    const glassInsert = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.32), matCyanGlass);
    this._carriage.add(glassInsert);

    // Four stainless bearing collars hugging the twin rails
    const collarGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.52, 16);
    for (const zOff of [-0.17, 0.17]) {
      const collar = new THREE.Mesh(collarGeo, matBrushedAlum);
      collar.position.set(0, 0, zOff);
      this._carriage.add(collar);
    }

    // Laser emitter nozzle on the right face of the carriage
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.1, 16), matBrushedAlum);
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.set(0.22, 0, 0);
    this._carriage.add(nozzle);

    // Zero-velocity hold LED halo around the carriage front
    const zeroVelGeo = new THREE.TorusGeometry(0.075, 0.012, 10, 28);
    this._matZeroVelRing = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.0,
    });
    this._zeroVelRing = new THREE.Mesh(zeroVelGeo, this._matZeroVelRing);
    this._zeroVelRing.position.set(0, 0, 0.295);
    this._carriage.add(this._zeroVelRing);

    this._actuatorGroup.add(this._carriage);

    // Glowing laser projection beam linking carriage to Cyan probe sphere (in world stage coords)
    this._matLaserBeam = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._laserBeam = new THREE.Mesh(this._unitCylinder, this._matLaserBeam);
    this._actuatorGroup.add(this._laserBeam);

    // Dynamic 3D velocity thrust arrow (emerald for +v, coral for -v)
    this._matVelocityArrow = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7b7,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.55,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._velShaft = new THREE.Mesh(this._unitCylinder, this._matVelocityArrow);
    this._velCone = new THREE.Mesh(this._unitCone, this._matVelocityArrow);
    this._actuatorGroup.add(this._velShaft, this._velCone);
  }

  _updateActuatorRailSpan(plinthTopY) {
    if (!this._actuatorGroup) return;
    const bottomY = plinthTopY + 0.32;
    const topY = Math.max(2.65, this._maxWorldY + 0.55);
    this._railMinY = bottomY + 0.34;
    this._railMaxY = topY - 0.34;

    this._bottomCap.position.set(0, bottomY, 0);
    this._topCap.position.set(0, topY, 0);

    alignCylinderBetween(
      this._railFront,
      new THREE.Vector3(0, bottomY, 0.17),
      new THREE.Vector3(0, topY, 0.17),
      0.036
    );
    alignCylinderBetween(
      this._railBack,
      new THREE.Vector3(0, bottomY, -0.17),
      new THREE.Vector3(0, topY, -0.17),
      0.036
    );
    alignCylinderBetween(
      this._leadScrew,
      new THREE.Vector3(0, bottomY, 0),
      new THREE.Vector3(0, topY, 0),
      0.02
    );
  }

  // --------------------------------------------------------------------------
  // Update Interactive Geometry (Probes, Secant/Tangent, Triangle, Actuator)
  // --------------------------------------------------------------------------

  _updateInteractiveElements() {
    if (!this._initialized && !this._probe0) return;

    const metrics = this.getMetrics();
    const wx0 = this._mathToWorldX(metrics.x);
    const wy0 = this._mathToWorldY(metrics.fx);
    const wx1 = this._mathToWorldX(metrics.x + metrics.dx);
    const wy1 = this._mathToWorldY(metrics.fxDx);

    const p0 = new THREE.Vector3(wx0, wy0, 0);
    const p1 = new THREE.Vector3(wx1, wy1, 0);
    const corner = new THREE.Vector3(wx1, wy0, 0);

    const absDx = Math.abs(metrics.dx);
    const isTangent = metrics.isTangent;

    // 1. Cyan Probe at P0
    this._probe0.position.copy(p0);
    if (isTangent) {
      this._matProbe0.color.setHex(0x6ee7b7);
      this._matProbe0.emissive.setHex(COLORS.emerald);
      this._matProbe0.emissiveIntensity = 1.85;
      this._matHalo0.color.setHex(COLORS.emerald);
    } else {
      this._matProbe0.color.setHex(0x67e8f9);
      this._matProbe0.emissive.setHex(COLORS.cyan);
      this._matProbe0.emissiveIntensity = 1.65;
      this._matHalo0.color.setHex(COLORS.cyan);
    }

    // Subtle vertical drop pin from P0 to y = 0
    if (Math.abs(wy0) > 0.12) {
      alignCylinderBetween(
        this._probe0DropPin,
        new THREE.Vector3(wx0, 0, 0),
        p0,
        0.009
      );
    } else {
      this._probe0DropPin.visible = false;
    }

    // 2. Amber Probe at P1 (glides smoothly into Cyan probe as |dx| -> 0.001)
    this._probe1.position.copy(p1);
    if (absDx <= 0.012) {
      this._probe1.visible = false;
    } else {
      this._probe1.visible = true;
      const shrinkT = clamp((absDx - 0.012) / 0.12, 0.22, 1.0);
      this._probe1.scale.setScalar(shrinkT);
    }

    // 3. Secant -> Tangent Line & Tangent Vector Arrowhead
    const activeSlope = isTangent ? metrics.exactSlope : metrics.secantSlope;
    const dir = new THREE.Vector3(1, activeSlope, 0).normalize();

    if (isTangent) {
      // Glowing Emerald-Cyan tangent guideline through P0
      const ext = 1.65;
      const a = p0.clone().addScaledVector(dir, -ext);
      const b = p0.clone().addScaledVector(dir, ext);
      this._matSecantLine.color.setHex(0x6ee7b7);
      this._matSecantLine.emissive.setHex(COLORS.emerald);
      this._matSecantLine.emissiveIntensity = 1.45;
      alignCylinderBetween(this._secantLine, a, b, 0.022);

      // Crisp 3D Tangent Vector Arrow originating at P0 along +dir
      const vecLen = 1.32;
      const tipStart = p0.clone().addScaledVector(dir, 0.12);
      const shaftEnd = p0.clone().addScaledVector(dir, vecLen - 0.22);
      const conePos = p0.clone().addScaledVector(dir, vecLen - 0.11);

      alignCylinderBetween(this._tangentShaft, tipStart, shaftEnd, 0.036);
      this._tangentCone.visible = true;
      this._tangentCone.position.copy(conePos);
      this._tangentCone.scale.set(0.088, 0.24, 0.088);
      orientAlongY(this._tangentCone, dir);
    } else {
      // Blend secant color warmly toward emerald as |dx| nears the tangent limit
      const proximity = 1 - clamp((absDx - TANGENT_THRESHOLD) / 0.35, 0, 1);
      const lineColor = new THREE.Color(0xfde68a).lerp(new THREE.Color(0x6ee7b7), proximity);
      const lineEmissive = new THREE.Color(COLORS.amber).lerp(
        new THREE.Color(COLORS.emerald),
        proximity
      );
      this._matSecantLine.color.copy(lineColor);
      this._matSecantLine.emissive.copy(lineEmissive);
      this._matSecantLine.emissiveIntensity = 1.35 + proximity * 0.25;

      const span = p0.distanceTo(p1);
      const pad = 0.85;
      const sign = metrics.dx >= 0 ? 1 : -1;
      const lineDir = dir.clone().multiplyScalar(sign);
      const a = p0.clone().addScaledVector(lineDir, -pad);
      const b = p0.clone().addScaledVector(lineDir, span + pad);

      alignCylinderBetween(this._secantLine, a, b, 0.026);
      this._tangentShaft.visible = false;
      this._tangentCone.visible = false;
    }

    // 4. Right-Triangle Rise/Run Drop (dx, dy, translucent filled triangle)
    const triOpacityFactor = isTangent
      ? 0
      : clamp((absDx - TANGENT_THRESHOLD) / 0.14, 0, 1);

    if (triOpacityFactor > 0.01 && Math.abs(wx1 - wx0) > 1e-3) {
      this._matRunBar.opacity = 0.9 * triOpacityFactor;
      this._matRiseBar.opacity = 0.9 * triOpacityFactor;
      this._matTriFill.opacity = 0.22 * triOpacityFactor;

      alignCylinderBetween(this._runBar, p0, corner, 0.018);
      alignCylinderBetween(this._riseBar, corner, p1, 0.018);

      this._cornerNode.visible = true;
      this._cornerNode.position.copy(corner);
      this._cornerNode.scale.setScalar(triOpacityFactor);

      // Update translucent triangle vertices slightly forward in Z to avoid z-fighting
      const zTri = 0.018;
      const posAttr = this._triGeom.getAttribute('position');
      posAttr.setXYZ(0, p0.x, p0.y, zTri);
      posAttr.setXYZ(1, corner.x, corner.y, zTri);
      posAttr.setXYZ(2, p1.x, p1.y, zTri);
      posAttr.needsUpdate = true;
      this._triGeom.computeBoundingSphere();

      // Tint triangle subtle emerald for positive rise, amber-coral for negative rise
      this._matTriFill.color.setHex(metrics.dy * metrics.dx >= 0 ? 0x22d3ee : 0xf59e0b);
      this._triMesh.visible = Math.abs(wy1 - wy0) > 1e-3;
    } else {
      this._runBar.visible = false;
      this._riseBar.visible = false;
      this._cornerNode.visible = false;
      this._triMesh.visible = false;
    }

    // 5. Synced Violet Probe on Derivative Curve f'(x) at z = -0.65
    if (this._derivProbe && this._derivBridge) {
      const clampedDfY = this._mathToWorldY(clamp(metrics.exactSlope, -8.5, 8.5));
      const pDeriv = new THREE.Vector3(wx0, clampedDfY, DERIV_Z);
      this._derivProbe.position.copy(pDeriv);
      alignCylinderBetween(this._derivBridge, p0, pDeriv, 0.01);
    }

    // 6. Miniature 3D Mechatronics Linear Actuator Carriage, Laser & Velocity Arrow
    if (this._carriage) {
      const clampedY = clamp(wy0, this._railMinY ?? -3.2, this._railMaxY ?? 3.2);
      this._carriage.position.set(0, clampedY, 0);

      // Laser projection beam from carriage nozzle to Cyan probe (in actuator local space)
      const beamStart = new THREE.Vector3(0.24, clampedY, 0);
      const beamEnd = new THREE.Vector3(wx0 - ACTUATOR_X, wy0, 0);
      alignCylinderBetween(this._laserBeam, beamStart, beamEnd, 0.011);

      // Velocity thrust arrow proportional to exact f'(x0)
      const v = metrics.exactSlope;
      const absV = Math.abs(v);
      if (absV < 0.03) {
        this._velShaft.visible = false;
        this._velCone.visible = false;
        this._matZeroVelRing.opacity = 0.9;
      } else {
        this._matZeroVelRing.opacity = 0.0;
        const vSign = v >= 0 ? 1 : -1;
        const isPos = vSign > 0;

        this._matVelocityArrow.color.setHex(isPos ? 0x6ee7b7 : 0xfda4af);
        this._matVelocityArrow.emissive.setHex(isPos ? COLORS.emerald : COLORS.coral);

        const arrowLen = 0.24 + Math.min(absV, 4.5) * 0.26;
        const xOff = -0.34;
        const startY = clampedY + vSign * 0.14;
        const shaftEndY = startY + vSign * Math.max(arrowLen - 0.18, 0.08);
        const coneY = shaftEndY + vSign * 0.1;

        alignCylinderBetween(
          this._velShaft,
          new THREE.Vector3(xOff, startY, 0),
          new THREE.Vector3(xOff, shaftEndY, 0),
          0.032
        );

        this._velCone.visible = true;
        this._velCone.position.set(xOff, coneY, 0);
        this._velCone.scale.set(0.085, 0.22, 0.085);
        orientAlongY(this._velCone, new THREE.Vector3(0, vSign, 0));
      }
    }
  }

  // --------------------------------------------------------------------------
  // Camera Presets
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    const yCenter = this._targetPlinthY < -3.0 ? -0.25 : 0.15;
    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(-0.3, yCenter, 12.2),
          target: new THREE.Vector3(-0.3, yCenter, 0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(6.9, yCenter + 5.2, 7.8),
          target: new THREE.Vector3(-0.35, yCenter - 0.35, -0.2),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(3.1, yCenter + 2.1, 10.6),
          target: new THREE.Vector3(-0.3, yCenter - 0.2, -0.15),
        };
    }
  }

  _applyCameraPresetImmediate(preset) {
    if (!this.camera || !this.controls) return;
    const pose = this._getCameraPose(preset);
    this.camera.position.copy(pose.pos);
    this.controls.target.copy(pose.target);
    this.controls.update();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  setFunction(fnKey) {
    if (!FUNCTION_PRESETS[fnKey]) return this.getMetrics();
    this._cancelLimitAnimation();

    this.fnKey = fnKey;
    const preset = FUNCTION_PRESETS[fnKey];
    this.x = preset.defaultX;
    this._criticalPoints = findCriticalPoints(preset);

    if (this._initialized) {
      this._rebuildPresetScene(false);
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setX(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return this.getMetrics();
    const [minX, maxX] = this._getPreset().domain;
    this.x = clamp(num, minX, maxX);

    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setDeltaX(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return this.getMetrics();
    // Manual scrub cleanly cancels any running limit animation
    this._cancelLimitAnimation();
    this.dx = clamp(num, -3.5, 3.5);

    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setCameraPreset(preset) {
    const valid = preset === 'front' || preset === 'iso' ? preset : '3d';
    this.cameraPreset = valid;
    if (!this._initialized || !this.camera || !this.controls) return;

    const to = this._getCameraPose(valid);
    this._camTransition = {
      startTime: performance.now(),
      duration: 760,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
    };
  }

  toggleDerivativeCurve(bool) {
    this.showDerivative = Boolean(bool);
    if (this._derivGroup) {
      this._derivGroup.visible = this.showDerivative;
    }
    if (this._plinthDerivLane) {
      this._plinthDerivLane.visible = this.showDerivative;
    }
  }

  toggleMechatronicsLens(bool) {
    this.showMechatronics = Boolean(bool);
    if (this._actuatorGroup) {
      this._actuatorGroup.visible = this.showMechatronics;
    }
  }

  animateLimit(onFrame) {
    this._cancelLimitAnimation();

    const startDx = Math.abs(this.dx) <= 0.08 ? 1.6 : this.dx;
    const sign = startDx >= 0 ? 1 : -1;
    const startMag = Math.abs(startDx);
    const endMag = 0.001;

    this._limitAnim = {
      startTime: performance.now(),
      duration: 2200,
      sign,
      startMag,
      endMag,
      onFrame: typeof onFrame === 'function' ? onFrame : null,
    };

    // Set starting frame cleanly if starting from tiny dx
    if (Math.abs(this.dx) <= 0.08) {
      this.dx = startDx;
      if (this._initialized) {
        this._updateInteractiveElements();
      }
      const m = this.getMetrics();
      this._emitChange(m);
      if (this._limitAnim.onFrame) this._limitAnim.onFrame(m);
    }

    return () => this._cancelLimitAnimation();
  }

  _cancelLimitAnimation() {
    this._limitAnim = null;
  }

  getMetrics() {
    const preset = this._getPreset();
    const x = this.x;
    const dx = this.dx;
    const fx = preset.fn(x);
    const fxDx = preset.fn(x + dx);
    const dy = fxDx - fx;
    const exactSlope = preset.df(x);
    const secantSlope = Math.abs(dx) > 1e-7 ? dy / dx : exactSlope;
    const secondDeriv = preset.ddf(x);
    const isTangent = Math.abs(dx) <= TANGENT_THRESHOLD;

    return {
      fnKey: this.fnKey,
      preset,
      x,
      dx,
      fx,
      fxDx,
      dy,
      secantSlope,
      exactSlope,
      secondDeriv,
      isTangent,
      criticalPoints: this._criticalPoints.map((cp) => ({ ...cp })),
    };
  }

  _emitChange(metrics = this.getMetrics()) {
    if (this.onChange) {
      this.onChange(metrics);
    }
  }

  resize() {
    if (!this._initialized || !this.container || !this.renderer || !this.camera) return;
    const width = Math.max(this.container.clientWidth || 1, 1);
    const height = Math.max(this.container.clientHeight || 1, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setPixelRatio(dpr);
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  // --------------------------------------------------------------------------
  // Animation Loop (60fps)
  // --------------------------------------------------------------------------

  _animate() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._onAnimate);

    const now = performance.now();
    const elapsed = this._clock.getElapsedTime();

    // 1. Smooth limit animation (dx -> 0.001)
    if (this._limitAnim) {
      const { startTime, duration, sign, startMag, endMag, onFrame } = this._limitAnim;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      // Smooth ease combined with logarithmic-feel precision tail for dramatic limit convergence
      const eased = easeInOutCubic(rawT);
      const logInterp = Math.exp(
        Math.log(startMag) * (1 - eased) + Math.log(endMag) * eased
      );
      const nextMag = rawT >= 1 ? endMag : logInterp;
      this.dx = sign * nextMag;

      this._updateInteractiveElements();
      const metrics = this.getMetrics();
      this._emitChange(metrics);
      if (onFrame) onFrame(metrics);

      if (rawT >= 1) {
        this._limitAnim = null;
      }
    }

    // 2. Smooth cubic ease-out camera preset transition
    if (this._camTransition && this.camera && this.controls) {
      const { startTime, duration, fromPos, fromTarget, toPos, toTarget } = this._camTransition;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      const t = easeOutCubic(rawT);
      this.camera.position.lerpVectors(fromPos, toPos, t);
      this.controls.target.lerpVectors(fromTarget, toTarget, t);
      if (rawT >= 1) {
        this._camTransition = null;
      }
    }

    // 3. Smooth plinth elevation transition when switching presets (e.g. cubic <-> sine)
    if (Math.abs(this._currentPlinthY - this._targetPlinthY) > 0.002) {
      this._currentPlinthY += (this._targetPlinthY - this._currentPlinthY) * 0.1;
      if (this._plinthGroup) {
        this._plinthGroup.position.y = this._currentPlinthY;
      }
      this._updateActuatorRailSpan(this._currentPlinthY);
      this._updateInteractiveElements();
    }

    // 4. Living Spline micro-animations (probe halos, critical beacons, plinth rim breath)
    if (this._probe0Halo) {
      this._probe0Halo.rotation.z = elapsed * 0.9;
      this._probe0Halo.rotation.y = Math.sin(elapsed * 1.4) * 0.45;
      const s0 = 1 + Math.sin(elapsed * 3.2) * 0.07;
      this._probe0Halo.scale.setScalar(s0);
    }

    if (this._probe1Halo && this._probe1 && this._probe1.visible) {
      this._probe1Halo.rotation.z = -elapsed * 1.1;
      this._probe1Halo.rotation.x = Math.cos(elapsed * 1.6) * 0.4;
    }

    for (let i = 0; i < this._criticalAnimItems.length; i++) {
      const item = this._criticalAnimItems[i];
      item.crystal.rotation.y = elapsed * 1.2 + item.phase;
      item.crystal.rotation.x = Math.sin(elapsed * 1.5 + item.phase) * 0.25;
      const pulse = 1 + Math.sin(elapsed * 3.0 + item.phase) * 0.16;
      item.halo.scale.setScalar(pulse);
    }

    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.18 + Math.sin(elapsed * 1.8) * 0.12;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // --------------------------------------------------------------------------
  // Full GPU & DOM Resource Cleanup (Zero WebGL Leaks)
  // --------------------------------------------------------------------------

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._initialized = false;
    this._camTransition = null;
    this._limitAnim = null;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this.controls) {
      this.controls.removeEventListener('start', this._onControlsStart);
      this.controls.dispose();
      this.controls = null;
    }

    // Traverse scene and dispose every unique geometry, material, and map
    if (this.scene) {
      const disposedGeos = new Set();
      const disposedMats = new Set();
      this.scene.traverse((obj) => {
        if (obj.geometry && !disposedGeos.has(obj.geometry)) {
          disposedGeos.add(obj.geometry);
          obj.geometry.dispose();
        }
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && !disposedMats.has(m)) {
              disposedMats.add(m);
              if (m.map) m.map.dispose();
              m.dispose();
            }
          }
        }
      });
    }

    for (const geo of this._sharedGeometries) {
      geo.dispose();
    }
    this._sharedGeometries.clear();

    for (const mat of this._sharedMaterials) {
      mat.dispose();
    }
    this._sharedMaterials.clear();

    for (const tex of this._ownedTextures) {
      tex.dispose();
    }
    this._ownedTextures.length = 0;

    if (this.envRT) {
      this.envRT.dispose();
      this.envRT = null;
    }

    if (this.bloomPass && typeof this.bloomPass.dispose === 'function') {
      this.bloomPass.dispose();
      this.bloomPass = null;
    }

    if (this.composer && typeof this.composer.dispose === 'function') {
      this.composer.dispose();
      this.composer = null;
    }

    if (this.renderer) {
      const dom = this.renderer.domElement;
      this.renderer.dispose();
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.container = null;
    this._criticalAnimItems = [];
  }
}

// ============================================================================
// 4. AMBIENT HERO SCENE (Discipline Hub Showcase Card)
// ============================================================================

export function createAmbientHeroScene(container) {
  if (!container) {
    return { dispose() {} };
  }

  let disposed = false;
  let rafId = null;

  const width = Math.max(container.clientWidth || 480, 1);
  const height = Math.max(container.clientHeight || 300, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
  camera.position.set(0.6, 1.45, 6.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const dom = renderer.domElement;
  dom.style.display = 'block';
  dom.style.width = '100%';
  dom.style.height = '100%';
  dom.style.pointerEvents = 'none';
  container.appendChild(dom);

  // Studio environment reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Studio lighting
  const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0b1120, 0.65);
  const key = new THREE.DirectionalLight(0xe0f2fe, 1.4);
  key.position.set(4, 6, 5);
  const cyanLight = new THREE.PointLight(COLORS.cyan, 2.8, 16, 1.6);
  cyanLight.position.set(-3.2, 1.8, 2.4);
  const amberLight = new THREE.PointLight(COLORS.amber, 2.2, 16, 1.6);
  amberLight.position.set(3.4, -1.2, 2.2);
  const violetLight = new THREE.PointLight(COLORS.violet, 1.8, 16, 1.6);
  violetLight.position.set(0, 2.2, -3.5);
  scene.add(hemi, key, cyanLight, amberLight, violetLight);

  const sculpture = new THREE.Group();
  scene.add(sculpture);

  // 1. Floating Glossy Metallic-Glass 3D Wave Ribbon Surface
  const segX = 96;
  const segZ = 18;
  const ribbonWidth = 5.8;
  const ribbonDepth = 1.35;
  const ribbonGeom = new THREE.PlaneGeometry(ribbonWidth, ribbonDepth, segX, segZ);
  ribbonGeom.rotateX(-Math.PI / 2);

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    emissive: 0x0e7490,
    emissiveIntensity: 0.35,
    roughness: 0.12,
    metalness: 0.42,
    transmission: 0.25,
    thickness: 0.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.65,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });
  const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
  sculpture.add(ribbonMesh);

  // Subtle glowing wireframe lattice overlay hugging the wave ribbon
  const wireMat = new THREE.MeshBasicMaterial({
    color: COLORS.cyan,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });
  const wireMesh = new THREE.Mesh(ribbonGeom, wireMat);
  wireMesh.position.y = 0.008;
  sculpture.add(wireMesh);

  // 2. Sculpted Floating Glass Halo Ring framing the wave
  const outerRingGeom = new THREE.TorusGeometry(2.55, 0.016, 12, 96);
  const outerRingMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.violet,
    emissive: COLORS.violet,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.5,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.55,
  });
  const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
  outerRing.rotation.x = Math.PI * 0.44;
  outerRing.rotation.y = -0.18;
  sculpture.add(outerRing);

  // 3. Orbiting Luminous Cyan & Amber Probes + Dynamic Tangent Bridge
  const probeCyanGeo = new THREE.SphereGeometry(0.145, 28, 28);
  const probeCyanMat = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: COLORS.cyan,
    emissiveIntensity: 1.7,
    roughness: 0.08,
    metalness: 0.15,
    clearcoat: 1.0,
  });
  const probeCyan = new THREE.Mesh(probeCyanGeo, probeCyanMat);

  const probeCyanHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.014, 10, 40),
    new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.8 })
  );
  probeCyan.add(probeCyanHalo);
  sculpture.add(probeCyan);

  const probeAmberGeo = new THREE.SphereGeometry(0.115, 24, 24);
  const probeAmberMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.amberLight,
    emissive: COLORS.amber,
    emissiveIntensity: 1.65,
    roughness: 0.08,
    metalness: 0.15,
    clearcoat: 1.0,
  });
  const probeAmber = new THREE.Mesh(probeAmberGeo, probeAmberMat);
  sculpture.add(probeAmber);

  const bridgeGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x6ee7b7,
    emissive: COLORS.emerald,
    emissiveIntensity: 1.35,
    roughness: 0.15,
    metalness: 0.2,
  });
  const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
  sculpture.add(bridgeMesh);

  // Subtle pointer parallax
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointer.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  const onPointerLeave = () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  };
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave, { passive: true });

  // Wave height helper
  const evalWave = (x, z, t) =>
    0.58 * Math.sin(x * 1.15 - t * 1.05) * Math.exp(-0.08 * x * x) +
    0.22 * Math.cos(x * 2.1 + z * 1.4 + t * 0.85);

  const posAttr = ribbonGeom.getAttribute('position');
  const basePos = new Float32Array(posAttr.array);

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const extA = new THREE.Vector3();
  const extB = new THREE.Vector3();
  const heroDir = new THREE.Vector3();
  const clock = new THREE.Clock();

  const resize = () => {
    if (disposed) return;
    const w = Math.max(container.clientWidth || 1, 1);
    const h = Math.max(container.clientHeight || 1, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
  };

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  }

  const animate = () => {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    // Update sculpted wave surface smoothly
    for (let i = 0; i < posAttr.count; i++) {
      const ix = i * 3;
      const vx = basePos[ix];
      const vz = basePos[ix + 2];
      const vy = evalWave(vx, vz, t);
      posAttr.array[ix + 1] = vy;
    }
    posAttr.needsUpdate = true;
    ribbonGeom.computeVertexNormals();

    // Animate luminous cyan & amber probes gliding along wave crest
    const xCyan = Math.sin(t * 0.65) * 1.85;
    const zCyan = Math.cos(t * 0.45) * 0.25;
    const yCyan = evalWave(xCyan, zCyan, t) + 0.16;
    pA.set(xCyan, yCyan, zCyan);
    probeCyan.position.copy(pA);
    probeCyanHalo.rotation.z = t * 1.2;
    probeCyanHalo.rotation.x = Math.sin(t * 1.4) * 0.6;

    const dxBreath = 0.28 + (Math.sin(t * 1.1) * 0.5 + 0.5) * 0.85;
    const xAmber = xCyan + dxBreath;
    const zAmber = zCyan - 0.14;
    const yAmber = evalWave(xAmber, zAmber, t) + 0.15;
    pB.set(xAmber, yAmber, zAmber);
    probeAmber.position.copy(pB);

    // Secant/tangent beam bridging both probes
    heroDir.subVectors(pB, pA);
    const dist = heroDir.length();
    if (dist > 1e-4) {
      heroDir.divideScalar(dist);
      extA.copy(pA).addScaledVector(heroDir, -0.45);
      extB.copy(pB).addScaledVector(heroDir, 0.45);
      alignCylinderBetween(bridgeMesh, extA, extB, 0.02);
    }

    // Gentle orbital breathing & pointer parallax
    pointer.x += (pointer.targetX - pointer.x) * 0.06;
    pointer.y += (pointer.targetY - pointer.y) * 0.06;

    sculpture.rotation.y = Math.sin(t * 0.28) * 0.22 + pointer.x * 0.24;
    sculpture.rotation.x = 0.14 + Math.cos(t * 0.22) * 0.06 + pointer.y * 0.14;
    outerRing.rotation.z = t * 0.18;

    renderer.render(scene, camera);
  };

  rafId = requestAnimationFrame(animate);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);

      const disposedGeos = new Set();
      const disposedMats = new Set();
      scene.traverse((obj) => {
        if (obj.geometry && !disposedGeos.has(obj.geometry)) {
          disposedGeos.add(obj.geometry);
          obj.geometry.dispose();
        }
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && !disposedMats.has(m)) {
              disposedMats.add(m);
              if (m.map) m.map.dispose();
              m.dispose();
            }
          }
        }
      });

      envRT.dispose();
      renderer.dispose();
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    },
  };
}

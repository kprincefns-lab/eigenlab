/**
 * EIGENLAB — Interactive 3D Integral & Riemann Accumulation Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. HIGH-PRECISION GAUSS-LEGENDRE QUADRATURE & ANALYTICAL INTEGRAL PRESETS
// ============================================================================

// 10-point Gauss-Legendre nodes & weights on [-1, 1] (exact up to degree 19)
const GL10_NODES = [
  -0.9739065285171717,
  -0.8650633666889845,
  -0.6794095682990244,
  -0.4333953941292472,
  -0.1488743389816312,
  0.1488743389816312,
  0.4333953941292472,
  0.6794095682990244,
  0.8650633666889845,
  0.9739065285171717,
];

const GL10_WEIGHTS = [
  0.06667134430868814,
  0.1494513491505806,
  0.21908636251598204,
  0.26926671930999635,
  0.29552422471475287,
  0.29552422471475287,
  0.26926671930999635,
  0.21908636251598204,
  0.1494513491505806,
  0.06667134430868814,
];

/**
 * Composite 10-point Gauss-Legendre numerical integration of fn from 0 to x.
 * Achieves near machine precision (< 1e-14 error) for smooth integrands like the Gaussian pulse.
 */
function gaussLegendreFromZero(fn, x) {
  if (!Number.isFinite(x) || x === 0) return 0;
  const panels = Math.max(4, Math.ceil(Math.abs(x) / 0.5));
  const h = x / panels;
  const halfH = 0.5 * h;
  let total = 0;

  for (let p = 0; p < panels; p++) {
    const mid = (p + 0.5) * h;
    let panelSum = 0;
    for (let k = 0; k < 10; k++) {
      panelSum += GL10_WEIGHTS[k] * fn(mid + halfH * GL10_NODES[k]);
    }
    total += panelSum * halfH;
  }
  return total;
}

const gaussianFn = (x) => 2.6 * Math.exp(-0.45 * x * x);

export const INTEGRAL_PRESETS = {
  parabola: {
    key: 'parabola',
    label: 'Quadratic Ramp',
    mechatronicsLabel: 'Parabolic Velocity Profile',
    latex: 'f(x) = 0.45x^2 + 0.5',
    integralLatex: 'F(x) = 0.15x^3 + 0.5x',
    domain: [-2.8, 2.8],
    defaultA: -1.5,
    defaultB: 2.0,
    fn: (x) => 0.45 * x * x + 0.5,
    antideriv: (x) => 0.15 * x * x * x + 0.5 * x,
  },
  sine: {
    key: 'sine',
    label: 'Sine Wave',
    mechatronicsLabel: 'Harmonic AC / Oscillation',
    latex: 'f(x) = 2\\sin(x)',
    integralLatex: 'F(x) = -2\\cos(x)',
    domain: [0, 6.283],
    defaultA: 0,
    defaultB: 3.14159,
    fn: (x) => 2 * Math.sin(x),
    antideriv: (x) => -2 * Math.cos(x),
  },
  decay: {
    key: 'decay',
    label: 'Exponential Impulse',
    mechatronicsLabel: 'Capacitor Charging Current',
    latex: 'f(x) = 2.6e^{-0.45x}',
    integralLatex: 'F(x) = -\\frac{2.6}{0.45}e^{-0.45x}',
    domain: [0, 5.5],
    defaultA: 0,
    defaultB: 3.2,
    fn: (x) => 2.6 * Math.exp(-0.45 * x),
    antideriv: (x) => -(2.6 / 0.45) * Math.exp(-0.45 * x),
  },
  cubic: {
    key: 'cubic',
    label: 'Signed Area Wave',
    mechatronicsLabel: 'Bidirectional Velocity Net Flow',
    latex: 'f(x) = 0.35x^3 - 1.4x',
    integralLatex: 'F(x) = 0.0875x^4 - 0.7x^2',
    domain: [-2.8, 2.8],
    defaultA: -2.0,
    defaultB: 2.0,
    fn: (x) => 0.35 * x * x * x - 1.4 * x,
    antideriv: (x) => 0.0875 * x * x * x * x - 0.7 * x * x,
  },
  gaussian: {
    key: 'gaussian',
    label: 'Gaussian Pulse',
    mechatronicsLabel: 'Sensor Impulse / Probability Mass',
    latex: 'f(x) = 2.6e^{-0.45x^2}',
    integralLatex: 'F(x) = \\int_0^x 2.6e^{-0.45t^2}\\,dt',
    domain: [-3.2, 3.2],
    defaultA: -2.0,
    defaultB: 1.5,
    fn: gaussianFn,
    antideriv: (x) => gaussLegendreFromZero(gaussianFn, x),
  },
};

// ============================================================================
// 2. CONSTANTS & SHARED MATH / GEOMETRY UTILITIES
// ============================================================================

const WORLD_SCALE = 0.72;
const ACCUM_Z = -0.65;
const BAR_DEPTH = 0.42;
const MAX_BARS = 80;
const MIN_BARS = 4;
const GAUGE_X = 3.55;
const PLINTH_WIDTH = 8.9;
const PLINTH_DEPTH = 3.5;
const PLINTH_HEIGHT = 0.26;
const PLINTH_OFFSET_X = 0.3;

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  cyanDeep: 0x0891b2,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  violet: 0xa78bfa,
  violetDeep: 0x7c3aed,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  emeraldDeep: 0x059669,
  coral: 0xfb7185,
  coralLight: 0xfda4af,
  coralDeep: 0xe11d48,
  slateGlass: 0x0d1526,
  aluminum: 0x94a3b8,
  anodized: 0x1e293b,
};

const VALID_RULES = new Set(['left', 'midpoint', 'right']);

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
const _tmpMat4 = new THREE.Matrix4();
const _tmpPos = new THREE.Vector3();
const _tmpScale = new THREE.Vector3();
const _identityQuat = new THREE.Quaternion();

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

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function normalizeZero(v) {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

/**
 * Safely align a unit-height (1.0), unit-radius (1.0) cylinder mesh between pA and pB.
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
 * Build a signed exact-area 3D glass ribbon across [xStart, xEnd] with Emerald (>= 0)
 * and Coral (< 0) vertex colors, extruded front/back + curve top cap for Spline crystal depth.
 */
function createSignedAreaCurtainGeometry(samples, zHalfDepth) {
  const n = samples.length;
  if (n < 2) return new THREE.BufferGeometry();

  // We emit front wall (z = +zHalfDepth), back wall (z = -zHalfDepth), and top contour strip
  const vertCount = n * 4;
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const indices = new Uint32Array((n - 1) * 18);

  const posTop = new THREE.Color(COLORS.emerald);
  const posBase = new THREE.Color(0x064e3b);
  const negTop = new THREE.Color(COLORS.coral);
  const negBase = new THREE.Color(0x881337);

  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const isPos = s.wy >= 0;
    const topC = isPos ? posTop : negTop;
    const baseC = isPos ? posBase : negBase;
    const intensity = clamp(Math.abs(s.wy) / 1.15, 0.35, 1.0);

    const v0 = i * 4; // front bottom (y = 0, +z)
    const v1 = v0 + 1; // front top (y = wy, +z)
    const v2 = v0 + 2; // back bottom (y = 0, -z)
    const v3 = v0 + 3; // back top (y = wy, -z)

    // Front bottom
    positions[v0 * 3] = s.wx;
    positions[v0 * 3 + 1] = 0;
    positions[v0 * 3 + 2] = zHalfDepth;
    colors[v0 * 3] = baseC.r;
    colors[v0 * 3 + 1] = baseC.g;
    colors[v0 * 3 + 2] = baseC.b;

    // Front top
    positions[v1 * 3] = s.wx;
    positions[v1 * 3 + 1] = s.wy;
    positions[v1 * 3 + 2] = zHalfDepth;
    colors[v1 * 3] = topC.r * intensity;
    colors[v1 * 3 + 1] = topC.g * intensity;
    colors[v1 * 3 + 2] = topC.b * intensity;

    // Back bottom
    positions[v2 * 3] = s.wx;
    positions[v2 * 3 + 1] = 0;
    positions[v2 * 3 + 2] = -zHalfDepth;
    colors[v2 * 3] = baseC.r;
    colors[v2 * 3 + 1] = baseC.g;
    colors[v2 * 3 + 2] = baseC.b;

    // Back top
    positions[v3 * 3] = s.wx;
    positions[v3 * 3 + 1] = s.wy;
    positions[v3 * 3 + 2] = -zHalfDepth;
    colors[v3 * 3] = topC.r * intensity;
    colors[v3 * 3 + 1] = topC.g * intensity;
    colors[v3 * 3 + 2] = topC.b * intensity;
  }

  let ptr = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;

    // Front wall: (a0, a1, b0), (a1, b1, b0)
    indices[ptr++] = a;
    indices[ptr++] = a + 1;
    indices[ptr++] = b;
    indices[ptr++] = a + 1;
    indices[ptr++] = b + 1;
    indices[ptr++] = b;

    // Back wall: (a2, b2, a3), (a3, b2, b3)
    indices[ptr++] = a + 2;
    indices[ptr++] = b + 2;
    indices[ptr++] = a + 3;
    indices[ptr++] = a + 3;
    indices[ptr++] = b + 2;
    indices[ptr++] = b + 3;

    // Top contour cap: (a1, a3, b1), (a3, b3, b1)
    indices[ptr++] = a + 1;
    indices[ptr++] = a + 3;
    indices[ptr++] = b + 1;
    indices[ptr++] = a + 3;
    indices[ptr++] = b + 3;
    indices[ptr++] = b + 1;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Append the 12 wireframe edges of an axis-aligned 3D box into a Float32Array segment buffer.
 * Returns the next float write index.
 */
function pushBoxEdges(arr, offset, cx, cy, cz, sx, sy, sz) {
  const x0 = cx - sx * 0.5;
  const x1 = cx + sx * 0.5;
  const y0 = cy - sy * 0.5;
  const y1 = cy + sy * 0.5;
  const z0 = cz - sz * 0.5;
  const z1 = cz + sz * 0.5;

  let o = offset;
  // Bottom rectangle (4 edges)
  arr[o++] = x0; arr[o++] = y0; arr[o++] = z0; arr[o++] = x1; arr[o++] = y0; arr[o++] = z0;
  arr[o++] = x1; arr[o++] = y0; arr[o++] = z0; arr[o++] = x1; arr[o++] = y0; arr[o++] = z1;
  arr[o++] = x1; arr[o++] = y0; arr[o++] = z1; arr[o++] = x0; arr[o++] = y0; arr[o++] = z1;
  arr[o++] = x0; arr[o++] = y0; arr[o++] = z1; arr[o++] = x0; arr[o++] = y0; arr[o++] = z0;
  // Top rectangle (4 edges)
  arr[o++] = x0; arr[o++] = y1; arr[o++] = z0; arr[o++] = x1; arr[o++] = y1; arr[o++] = z0;
  arr[o++] = x1; arr[o++] = y1; arr[o++] = z0; arr[o++] = x1; arr[o++] = y1; arr[o++] = z1;
  arr[o++] = x1; arr[o++] = y1; arr[o++] = z1; arr[o++] = x0; arr[o++] = y1; arr[o++] = z1;
  arr[o++] = x0; arr[o++] = y1; arr[o++] = z1; arr[o++] = x0; arr[o++] = y1; arr[o++] = z0;
  // Vertical pillars (4 edges)
  arr[o++] = x0; arr[o++] = y0; arr[o++] = z0; arr[o++] = x0; arr[o++] = y1; arr[o++] = z0;
  arr[o++] = x1; arr[o++] = y0; arr[o++] = z0; arr[o++] = x1; arr[o++] = y1; arr[o++] = z0;
  arr[o++] = x1; arr[o++] = y0; arr[o++] = z1; arr[o++] = x1; arr[o++] = y1; arr[o++] = z1;
  arr[o++] = x0; arr[o++] = y0; arr[o++] = z1; arr[o++] = x0; arr[o++] = y1; arr[o++] = z1;
  return o;
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
 * Dispose all geometries and materials inside a temporary group without touching shared assets.
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
// 3. INTEGRAL 3D STUDIO CLASS
// ============================================================================

export class Integral3DStudio {
  constructor(options = {}) {
    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

    this.fnKey = INTEGRAL_PRESETS[options.fnKey] ? options.fnKey : 'parabola';
    const initPreset = INTEGRAL_PRESETS[this.fnKey];
    const [minX, maxX] = initPreset.domain;

    this.a = Number.isFinite(options.a) ? clamp(options.a, minX, maxX) : initPreset.defaultA;
    this.b = Number.isFinite(options.b) ? clamp(options.b, minX, maxX) : initPreset.defaultB;
    this.n = Number.isFinite(options.n)
      ? clamp(Math.round(options.n), MIN_BARS, MAX_BARS)
      : 12;
    this.rule = VALID_RULES.has(options.rule) ? options.rule : 'left';

    this.showAccumulation = options.showAccumulation ?? true;
    this.showMechatronics = options.showMechatronics ?? true;
    this.cameraPreset = '3d';

    // Continuous effective N used for butter-smooth exact-curtain blending during animateRefine()
    this._effectiveN = this.n;

    // Derived vertical framing state
    this._minWorldY = -2.0;
    this._maxWorldY = 2.4;
    this._accumScaleY = WORLD_SCALE;
    this._gaugeMaxIntegral = 6.0;
    this._currentPlinthY = -2.2;
    this._targetPlinthY = -2.2;

    // Three.js core handles
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;
    this.envRT = null;

    // Scene hierarchy groups
    this._stageGroup = null;
    this._plinthGroup = null;
    this._axesGroup = null;
    this._fnGroup = null;
    this._riemannGroup = null;
    this._curtainGroup = null;
    this._accumGroup = null;
    this._boundsGroup = null;
    this._gaugeGroup = null;

    // Shared resource registries for leak-free cleanup
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Animation & lifecycle handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = new THREE.Clock();
    this._initialized = false;
    this._disposed = false;

    // Smooth transition handles
    this._camTransition = null;
    this._refineAnim = null;

    // Track last bounds used for exact area curtain & accumulation curve to avoid redundant rebuilds
    this._lastCurtainKey = '';
    this._lastAccumKey = '';

    // Bound handlers
    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  // --------------------------------------------------------------------------
  // Coordinate Mapping (domain-centered so [0, 2pi] & [-2.8, 2.8] frame identically)
  // --------------------------------------------------------------------------

  _getPreset() {
    return INTEGRAL_PRESETS[this.fnKey] || INTEGRAL_PRESETS.parabola;
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

  _accumToWorldY(val) {
    return val * this._accumScaleY;
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

    // 2. Renderer (Spline-quality physical rendering standards)
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

    // 3. Studio Reflections via PMREMGenerator + RoomEnvironment (disposed immediately after RT)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 4. Post-Processing: EffectComposer + RenderPass + UnrealBloomPass
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

    // 6. Lighting & Shared GPU Resources
    this._setupLighting();
    this._createSharedResources();

    // 7. Build Scene Hierarchy
    this._stageGroup = new THREE.Group();
    this.scene.add(this._stageGroup);

    this._plinthGroup = new THREE.Group();
    this._axesGroup = new THREE.Group();
    this._fnGroup = new THREE.Group();
    this._riemannGroup = new THREE.Group();
    this._curtainGroup = new THREE.Group();
    this._accumGroup = new THREE.Group();
    this._boundsGroup = new THREE.Group();
    this._gaugeGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._axesGroup,
      this._fnGroup,
      this._riemannGroup,
      this._curtainGroup,
      this._accumGroup,
      this._boundsGroup,
      this._gaugeGroup
    );

    this._buildPlinth();
    this._buildRiemannRig();
    this._buildBoundaryBeacons();
    this._buildMechatronicsGauge();

    // Build active preset curves, grid, accumulation curve, and initial Riemann bars
    this._rebuildPresetScene(true);
    this._updateInteractiveElements();

    // Snap initial camera preset
    this._applyCameraPresetImmediate(this.cameraPreset);

    // Observe container resize
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
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.56);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.32);
    keyLight.position.set(-5.8, 9.5, 7.6);
    this.scene.add(keyLight);

    const emeraldRim = new THREE.PointLight(COLORS.emerald, 2.0, 24, 1.5);
    emeraldRim.position.set(5.8, 3.2, -2.5);
    this.scene.add(emeraldRim);

    const cyanFill = new THREE.PointLight(COLORS.cyan, 1.8, 22, 1.6);
    cyanFill.position.set(-5.6, -0.8, 4.4);
    this.scene.add(cyanFill);

    const violetBack = new THREE.PointLight(COLORS.violet, 1.3, 20, 1.6);
    violetBack.position.set(0.0, 4.2, -6.0);
    this.scene.add(violetBack);
  }

  _createSharedResources() {
    this._unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 18, 1, false);
    this._unitCone = new THREE.ConeGeometry(1, 1, 20);
    this._unitBox = new THREE.BoxGeometry(1, 1, 1);
    this._unitSphere = new THREE.SphereGeometry(1, 16, 16);
    this._sharedGeometries.add(
      this._unitCylinder,
      this._unitCone,
      this._unitBox,
      this._unitSphere
    );

    // Sculpted Cyan Function Tube material
    this._matFunctionTube = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.94,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.45,
    });

    // Whisper-subtle ambient silhouette beneath f(x) outside/behind [a, b]
    this._matAmbientCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Floating Violet Accumulation Curve F(x) material
    this._matAccumTube = new THREE.MeshPhysicalMaterial({
      color: COLORS.violet,
      emissive: 0x8b5cf6,
      emissiveIntensity: 1.02,
      roughness: 0.16,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.35,
    });

    this._matAccumCurtain = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Specular metallic Cartesian axes
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

    // Exact Area Continuous Curtain material (blends smoothly as N -> 80)
    this._matExactCurtain = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.35,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._matExactGlowCore = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._sharedMaterials.add(
      this._matFunctionTube,
      this._matAmbientCurtain,
      this._matAccumTube,
      this._matAccumCurtain,
      this._matSpecularAxis,
      this._matAxisTick,
      this._matExactCurtain,
      this._matExactGlowCore
    );
  }

  // --------------------------------------------------------------------------
  // Floating Frosted-Glass Studio Plinth
  // --------------------------------------------------------------------------

  _buildPlinth() {
    this._plinthGroup.position.set(PLINTH_OFFSET_X, this._currentPlinthY, 0);

    // 1. Bevelled dark frosted-glass slab (top sits at local y = 0)
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
    this._plinthGroup.add(new THREE.Mesh(slabGeom, slabMat));

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
    this._plinthGroup.add(new THREE.Mesh(rimGeom, this._plinthRimMat));

    // 4. Subtle etched surface grid & Z-plane guide tracks on plinth deck
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

    // Luminous lane indicators on plinth for z = 0 (f(x)) and z = -0.65 (F(x))
    const laneCyanGeom = new THREE.BoxGeometry(PLINTH_WIDTH - 1.9, 0.006, 0.018);
    const laneCyanMat = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.45,
    });
    const laneCyan = new THREE.Mesh(laneCyanGeom, laneCyanMat);
    laneCyan.position.set(-0.35, 0.008, 0);
    this._plinthGroup.add(laneCyan);

    const laneVioletGeom = new THREE.BoxGeometry(PLINTH_WIDTH - 1.9, 0.006, 0.016);
    const laneVioletMat = new THREE.MeshBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.38,
    });
    this._plinthAccumLane = new THREE.Mesh(laneVioletGeom, laneVioletMat);
    this._plinthAccumLane.position.set(-0.35, 0.008, ACCUM_Z);
    this._plinthAccumLane.visible = this.showAccumulation;
    this._plinthGroup.add(this._plinthAccumLane);

    // 5. Soft studio under-glow pool beneath floating plinth
    const glowTex = createRadialGlowTexture(
      'rgba(52, 211, 153, 0.22)',
      'rgba(34, 211, 238, 0.09)',
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
    const wyMin = Math.min(-1.85, this._minWorldY - 0.25);
    const wyMax = Math.max(2.35, this._maxWorldY + 0.45);

    const zGrid = -0.25;

    // 1. Major & Minor Cartesian grid lines behind the Riemann bars
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

    // 3. Specular Y-Axis at true mathematical x = 0
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

    // Z depth rail linking f(x) plane (z = 0) to F(x) accumulation plane (z = -0.65)
    const zAxisMesh = new THREE.Mesh(this._unitCylinder, this._matAxisTick);
    alignCylinderBetween(
      zAxisMesh,
      new THREE.Vector3(wyAxisX, 0, 0.28),
      new THREE.Vector3(wyAxisX, 0, ACCUM_Z - 0.25),
      0.01
    );
    this._axesGroup.add(zAxisMesh);

    const zTickGeom = new THREE.TorusGeometry(0.032, 0.007, 8, 20);
    const zTickMain = new THREE.Mesh(zTickGeom, this._matFunctionTube);
    zTickMain.position.set(wyAxisX, 0, 0);
    this._axesGroup.add(zTickMain);

    const zTickAccum = new THREE.Mesh(zTickGeom, this._matAccumTube);
    zTickAccum.position.set(wyAxisX, 0, ACCUM_Z);
    this._axesGroup.add(zTickAccum);
  }

  // --------------------------------------------------------------------------
  // Pre-Allocated Zero-Churn 3D Frosted-Glass Riemann Partition Rig
  // --------------------------------------------------------------------------

  _buildRiemannRig() {
    // 1. Positive Emerald frosted-glass bars (f(x_i) >= 0)
    this._matPosBar = new THREE.MeshPhysicalMaterial({
      color: COLORS.emerald,
      emissive: COLORS.emeraldDeep,
      emissiveIntensity: 0.36,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.92,
      envMapIntensity: 1.45,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });

    this._posBarsInst = new THREE.InstancedMesh(this._unitBox, this._matPosBar, MAX_BARS);
    this._posBarsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._posBarsInst.frustumCulled = false;
    this._posBarsInst.renderOrder = 2;
    this._posBarsInst.count = 0;

    // 2. Negative Coral frosted-glass bars (f(x_i) < 0)
    this._matNegBar = new THREE.MeshPhysicalMaterial({
      color: COLORS.coral,
      emissive: COLORS.coralDeep,
      emissiveIntensity: 0.38,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.92,
      envMapIntensity: 1.45,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
    });

    this._negBarsInst = new THREE.InstancedMesh(this._unitBox, this._matNegBar, MAX_BARS);
    this._negBarsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._negBarsInst.frustumCulled = false;
    this._negBarsInst.renderOrder = 2;
    this._negBarsInst.count = 0;

    // 3. Luminous top/bottom glass cap rims catching bloom at y = f(x_i)
    this._matPosCap = new THREE.MeshPhysicalMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.15,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.86,
    });
    this._posCapsInst = new THREE.InstancedMesh(this._unitBox, this._matPosCap, MAX_BARS);
    this._posCapsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._posCapsInst.frustumCulled = false;
    this._posCapsInst.renderOrder = 3;
    this._posCapsInst.count = 0;

    this._matNegCap = new THREE.MeshPhysicalMaterial({
      color: COLORS.coralLight,
      emissive: COLORS.coral,
      emissiveIntensity: 1.15,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.86,
    });
    this._negCapsInst = new THREE.InstancedMesh(this._unitBox, this._matNegCap, MAX_BARS);
    this._negCapsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._negCapsInst.frustumCulled = false;
    this._negCapsInst.renderOrder = 3;
    this._negCapsInst.count = 0;

    // 4. Crisp glowing emissive edge-frames around every glass block (24 vertices per bar)
    const maxEdgeFloats = MAX_BARS * 24 * 3;
    this._posEdgePositions = new Float32Array(maxEdgeFloats);
    this._posEdgeGeom = new THREE.BufferGeometry();
    const posEdgeAttr = new THREE.BufferAttribute(this._posEdgePositions, 3);
    posEdgeAttr.setUsage(THREE.DynamicDrawUsage);
    this._posEdgeGeom.setAttribute('position', posEdgeAttr);
    this._posEdgeGeom.setDrawRange(0, 0);

    this._matPosEdges = new THREE.LineBasicMaterial({
      color: COLORS.emeraldLight,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._posEdgesLines = new THREE.LineSegments(this._posEdgeGeom, this._matPosEdges);
    this._posEdgesLines.frustumCulled = false;
    this._posEdgesLines.renderOrder = 4;

    this._negEdgePositions = new Float32Array(maxEdgeFloats);
    this._negEdgeGeom = new THREE.BufferGeometry();
    const negEdgeAttr = new THREE.BufferAttribute(this._negEdgePositions, 3);
    negEdgeAttr.setUsage(THREE.DynamicDrawUsage);
    this._negEdgeGeom.setAttribute('position', negEdgeAttr);
    this._negEdgeGeom.setDrawRange(0, 0);

    this._matNegEdges = new THREE.LineBasicMaterial({
      color: COLORS.coralLight,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._negEdgesLines = new THREE.LineSegments(this._negEdgeGeom, this._matNegEdges);
    this._negEdgesLines.frustumCulled = false;
    this._negEdgesLines.renderOrder = 4;

    // 5. Micro sample-point contact beads showing Left / Midpoint / Right sample contact
    this._matSampleBead = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    this._sampleBeadsInst = new THREE.InstancedMesh(
      this._unitSphere,
      this._matSampleBead,
      MAX_BARS
    );
    this._sampleBeadsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._sampleBeadsInst.frustumCulled = false;
    this._sampleBeadsInst.renderOrder = 5;
    this._sampleBeadsInst.count = 0;

    this._riemannGroup.add(
      this._posBarsInst,
      this._negBarsInst,
      this._posCapsInst,
      this._negCapsInst,
      this._posEdgesLines,
      this._negEdgesLines,
      this._sampleBeadsInst
    );
  }

  // --------------------------------------------------------------------------
  // Glowing Boundary Beacons at x = a (Cyan) & Movable x = b (Amber)
  // --------------------------------------------------------------------------

  _buildBoundaryBeacons() {
    // 1. Lower Bound x = a (Glowing Cyan Beacon + Vertical Pillar + Base Ring)
    const probeGeoA = new THREE.SphereGeometry(0.102, 24, 24);
    this._matBeaconA = new THREE.MeshPhysicalMaterial({
      color: COLORS.cyanLight,
      emissive: COLORS.cyan,
      emissiveIntensity: 1.65,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._beaconA = new THREE.Mesh(probeGeoA, this._matBeaconA);

    const haloGeoA = new THREE.TorusGeometry(0.17, 0.013, 12, 40);
    this._matHaloA = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.85,
    });
    this._haloA = new THREE.Mesh(haloGeoA, this._matHaloA);
    this._beaconA.add(this._haloA);
    this._boundsGroup.add(this._beaconA);

    this._pillarA = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshStandardMaterial({
        color: COLORS.cyanLight,
        emissive: COLORS.cyan,
        emissiveIntensity: 1.35,
        roughness: 0.18,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88,
      })
    );
    this._boundsGroup.add(this._pillarA);

    const baseRingGeo = new THREE.TorusGeometry(0.085, 0.013, 10, 32);
    this._baseRingA = new THREE.Mesh(baseRingGeo, this._matBeaconA);
    this._baseRingA.rotation.x = Math.PI / 2;
    this._boundsGroup.add(this._baseRingA);

    // Subtle glowing curtain edge plane at x = a
    this._edgePlaneGeo = new THREE.PlaneGeometry(BAR_DEPTH + 0.04, 1);
    this._matEdgePlaneA = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._edgePlaneA = new THREE.Mesh(this._edgePlaneGeo, this._matEdgePlaneA);
    this._edgePlaneA.rotation.y = Math.PI / 2;
    this._boundsGroup.add(this._edgePlaneA);

    // 2. Movable Upper Bound x = b (Glowing Amber Beacon + Vertical Curtain Edge + Base Ring)
    const probeGeoB = new THREE.SphereGeometry(0.118, 28, 28);
    this._matBeaconB = new THREE.MeshPhysicalMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.7,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._beaconB = new THREE.Mesh(probeGeoB, this._matBeaconB);

    const haloGeoB = new THREE.TorusGeometry(0.205, 0.015, 12, 48);
    this._matHaloB = new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.9,
    });
    this._haloB = new THREE.Mesh(haloGeoB, this._matHaloB);
    this._beaconB.add(this._haloB);
    this._boundsGroup.add(this._beaconB);

    this._matPillarB = new THREE.MeshStandardMaterial({
      color: COLORS.amberLight,
      emissive: COLORS.amber,
      emissiveIntensity: 1.5,
      roughness: 0.16,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    this._pillarB = new THREE.Mesh(this._unitCylinder, this._matPillarB);
    this._boundsGroup.add(this._pillarB);

    this._baseRingB = new THREE.Mesh(baseRingGeo, this._matBeaconB);
    this._baseRingB.rotation.x = Math.PI / 2;
    this._boundsGroup.add(this._baseRingB);

    // Translucent Amber vertical sweep curtain edge at x = b
    this._matEdgePlaneB = new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._edgePlaneB = new THREE.Mesh(this._edgePlaneGeo, this._matEdgePlaneB);
    this._edgePlaneB.rotation.y = Math.PI / 2;
    this._boundsGroup.add(this._edgePlaneB);
  }

  // --------------------------------------------------------------------------
  // Miniature 3D Mechatronics Accumulator / Displacement Column Gauge (Right Edge)
  // --------------------------------------------------------------------------

  _buildMechatronicsGauge() {
    this._gaugeGroup.position.set(GAUGE_X, 0, 0);
    this._gaugeGroup.visible = this.showMechatronics;

    const matAnodized = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.84,
      clearcoat: 0.55,
      envMapIntensity: 1.35,
    });

    const matBrushedAlum = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      roughness: 0.24,
      metalness: 0.9,
      clearcoat: 0.55,
      envMapIntensity: 1.55,
    });

    const matStainless = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.16,
      metalness: 0.94,
      clearcoat: 0.85,
      envMapIntensity: 1.65,
    });

    const matGlassBarrel = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      roughness: 0.08,
      metalness: 0.06,
      transmission: 0.55,
      thickness: 0.35,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });

    // 1. Brushed anodized aluminum top & bottom CNC cylinder end-caps
    this._gaugeTopCap = new THREE.Group();
    const capBodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.2, 32);
    const capFlangeGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.055, 32);

    this._gaugeTopCap.add(new THREE.Mesh(capBodyGeo, matAnodized));
    const topFlange = new THREE.Mesh(capFlangeGeo, matBrushedAlum);
    topFlange.position.y = -0.06;
    this._gaugeTopCap.add(topFlange);

    // Top pressure breather valve dome
    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.14, 24), matBrushedAlum);
    domeMesh.position.y = 0.15;
    this._gaugeTopCap.add(domeMesh);

    this._gaugeBottomCap = new THREE.Group();
    this._gaugeBottomCap.add(new THREE.Mesh(capBodyGeo, matAnodized));
    const botFlange = new THREE.Mesh(capFlangeGeo, matBrushedAlum);
    botFlange.position.y = 0.06;
    this._gaugeBottomCap.add(botFlange);

    // Base manifold canister + glowing status collar
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.24, 24), matAnodized);
    manifold.position.y = -0.2;
    this._gaugeBottomCap.add(manifold);

    this._matGaugeStatusRing = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.2,
    });
    const statusRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.265, 0.014, 10, 32),
      this._matGaugeStatusRing
    );
    statusRing.rotation.x = Math.PI / 2;
    statusRing.position.y = -0.14;
    this._gaugeBottomCap.add(statusRing);

    this._gaugeGroup.add(this._gaugeTopCap, this._gaugeBottomCap);

    // 2. Outer borosilicate glass cylinder barrel (open-ended, scaled dynamically in Y)
    const barrelGeo = new THREE.CylinderGeometry(0.31, 0.31, 1, 36, 1, true);
    this._gaugeBarrel = new THREE.Mesh(barrelGeo, matGlassBarrel);
    this._gaugeBarrel.renderOrder = 6;
    this._gaugeGroup.add(this._gaugeBarrel);

    // 3. Three external stainless tie-rods at 120° around the cylinder
    this._gaugeTieRods = [];
    for (let i = 0; i < 3; i++) {
      const rod = new THREE.Mesh(this._unitCylinder, matStainless);
      this._gaugeTieRods.push(rod);
      this._gaugeGroup.add(rod);
    }

    // 4. Central precision zero-datum collar ring at y = 0
    const datumCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.328, 0.015, 10, 40),
      matBrushedAlum
    );
    datumCollar.rotation.x = Math.PI / 2;
    this._gaugeGroup.add(datumCollar);

    this._matZeroDatumLed = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.55,
    });
    const datumLed = new THREE.Mesh(
      new THREE.TorusGeometry(0.312, 0.008, 8, 40),
      this._matZeroDatumLed
    );
    datumLed.rotation.x = Math.PI / 2;
    this._gaugeGroup.add(datumLed);

    // Graduated glass sight-rings along barrel (+50%, -50%)
    this._gradRingPos = new THREE.Mesh(
      new THREE.TorusGeometry(0.316, 0.006, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.4 })
    );
    this._gradRingPos.rotation.x = Math.PI / 2;
    this._gradRingNeg = new THREE.Mesh(
      new THREE.TorusGeometry(0.316, 0.006, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.4 })
    );
    this._gradRingNeg.rotation.x = Math.PI / 2;
    this._gaugeGroup.add(this._gradRingPos, this._gradRingNeg);

    // 5. Internal Glowing Emerald/Coral Signed Fluid Column (tracks net signed integral)
    this._matFluidColumn = new THREE.MeshPhysicalMaterial({
      color: COLORS.emerald,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.05,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.84,
    });
    const fluidGeo = new THREE.CylinderGeometry(0.245, 0.245, 1, 32);
    this._fluidColumn = new THREE.Mesh(fluidGeo, this._matFluidColumn);
    this._fluidColumn.renderOrder = 3;
    this._gaugeGroup.add(this._fluidColumn);

    // Inner bright plasma core inside fluid column for premium Spline bloom
    this._matFluidCore = new THREE.MeshBasicMaterial({
      color: COLORS.emeraldLight,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._fluidCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1, 20),
      this._matFluidCore
    );
    this._fluidCore.renderOrder = 4;
    this._gaugeGroup.add(this._fluidCore);

    // 6. Machined Piston Meniscus Head sitting cleanly at the live fluid level
    this._pistonHead = new THREE.Group();
    const pistonDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.268, 0.268, 0.065, 32),
      matBrushedAlum
    );
    this._pistonHead.add(pistonDisc);

    this._matPistonRim = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.65,
      roughness: 0.12,
      metalness: 0.2,
    });
    const pistonRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.272, 0.015, 10, 36),
      this._matPistonRim
    );
    pistonRim.rotation.x = Math.PI / 2;
    this._pistonHead.add(pistonRim);
    this._gaugeGroup.add(this._pistonHead);

    // 7. Thin glowing Exact-Integral Reference Target Ring around barrel
    this._matExactTargetRing = new THREE.MeshBasicMaterial({
      color: COLORS.cyanLight,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._exactTargetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.01, 10, 40),
      this._matExactTargetRing
    );
    this._exactTargetRing.rotation.x = Math.PI / 2;
    this._gaugeGroup.add(this._exactTargetRing);

    // 8. Optical Receiver Nozzle on left edge of gauge + Live Glowing Laser Beam from (b, f(b))
    this._receiverPort = new THREE.Group();
    const portBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.062, 0.11, 18),
      matBrushedAlum
    );
    portBody.rotation.z = Math.PI / 2;
    portBody.position.set(-0.37, 0, 0);
    this._receiverPort.add(portBody);

    this._matPortLens = new THREE.MeshBasicMaterial({
      color: COLORS.amberLight,
    });
    const portLens = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 14), this._matPortLens);
    portLens.position.set(-0.425, 0, 0);
    this._receiverPort.add(portLens);
    this._gaugeGroup.add(this._receiverPort);

    this._matLaserBeam = new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._laserBeam = new THREE.Mesh(this._unitCylinder, this._matLaserBeam);
    this._gaugeGroup.add(this._laserBeam);
  }

  _updateGaugeSpan(plinthTopY) {
    if (!this._gaugeGroup) return;
    const bottomY = plinthTopY + 0.34;
    const topY = Math.max(2.65, this._maxWorldY + 0.55);

    this._gaugeBottomY = bottomY + 0.14;
    this._gaugeTopY = topY - 0.14;
    // Symmetric usable travel around y = 0 so + and - net integrals are cleanly comparable
    this._gaugeHalfTravel = Math.max(
      0.8,
      Math.min(Math.abs(this._gaugeTopY) - 0.12, Math.abs(this._gaugeBottomY) - 0.12)
    );

    this._gaugeBottomCap.position.set(0, bottomY, 0);
    this._gaugeTopCap.position.set(0, topY, 0);

    const barrelLen = Math.max(topY - bottomY - 0.16, 0.5);
    const barrelMidY = 0.5 * (topY + bottomY);
    this._gaugeBarrel.position.set(0, barrelMidY, 0);
    this._gaugeBarrel.scale.set(1, barrelLen, 1);

    const rodRadius = 0.355;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI * 2) / 3 + Math.PI / 6;
      const rx = Math.cos(ang) * rodRadius;
      const rz = Math.sin(ang) * rodRadius;
      alignCylinderBetween(
        this._gaugeTieRods[i],
        new THREE.Vector3(rx, bottomY, rz),
        new THREE.Vector3(rx, topY, rz),
        0.018
      );
    }

    this._gradRingPos.position.set(0, this._gaugeHalfTravel * 0.55, 0);
    this._gradRingNeg.position.set(0, -this._gaugeHalfTravel * 0.55, 0);
  }

  // --------------------------------------------------------------------------
  // Sculpted Curves f(x) & Floating Violet Accumulation Curve F(x)
  // --------------------------------------------------------------------------

  _rebuildPresetScene(snapPlinth = false) {
    const preset = this._getPreset();
    const [minX, maxX] = preset.domain;
    const samples = 180;

    const fnPoints = [];
    const baselinePoints = [];

    let minWY = Infinity;
    let maxWY = -Infinity;
    let minF = Infinity;
    let maxF = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const mx = minX + ((maxX - minX) * i) / samples;
      const wx = this._mathToWorldX(mx);

      const fy = preset.fn(mx);
      const wy = this._mathToWorldY(fy);
      minWY = Math.min(minWY, wy);
      maxWY = Math.max(maxWY, wy);

      fnPoints.push(new THREE.Vector3(wx, wy, 0));
      baselinePoints.push(new THREE.Vector3(wx, 0, 0.004));

      const Fraw = preset.antideriv(mx);
      minF = Math.min(minF, Fraw);
      maxF = Math.max(maxF, Fraw);
    }

    this._minWorldY = minWY;
    this._maxWorldY = maxWY;
    // Maximum possible integral span across the preset domain for gauge calibration
    this._gaugeMaxIntegral = Math.max(1.8, (maxF - minF) * 0.88);
    this._targetPlinthY = Math.min(-2.15, minWY - 0.5);

    if (snapPlinth) {
      this._currentPlinthY = this._targetPlinthY;
      this._plinthGroup.position.y = this._currentPlinthY;
    }

    // 1. Sculpted Glowing Cyan 3D Tube for f(x)
    disposeGroupChildren(this._fnGroup, this._sharedMaterials, this._sharedGeometries);

    const fnTubeGeom = createSafeTubeGeometry(fnPoints, 180, 0.052, 16);
    this._fnGroup.add(new THREE.Mesh(fnTubeGeom, this._matFunctionTube));

    const ambientCurtainGeom = createCurtainGeometry(fnPoints, COLORS.cyan, 0x051324);
    this._fnGroup.add(new THREE.Mesh(ambientCurtainGeom, this._matAmbientCurtain));

    const baseGeom = new THREE.BufferGeometry().setFromPoints(baselinePoints);
    const baseMat = new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    this._fnGroup.add(new THREE.Line(baseGeom, baseMat));

    // 2. Rebuild Axes & Grid for active domain and vertical span
    this._rebuildAxesAndGrid();

    // 3. Force-rebuild Floating Violet Accumulation Curve F(x) = int_a^x f(t) dt
    this._lastAccumKey = '';
    this._lastCurtainKey = '';
    this._rebuildAccumulationCurve();

    // 4. Update right-edge Mechatronics Gauge span
    this._updateGaugeSpan(snapPlinth ? this._targetPlinthY : this._currentPlinthY);
  }

  _rebuildAccumulationCurve() {
    const preset = this._getPreset();
    const accumKey = `${this.fnKey}:${this.a.toFixed(5)}`;
    if (accumKey === this._lastAccumKey && this._accumProbe) return;
    this._lastAccumKey = accumKey;

    const [minX, maxX] = preset.domain;
    const samples = 160;
    const Fa = preset.antideriv(this.a);

    // First pass: find max |F_a(x)| across domain to compute clean vertical scale inside stage
    let maxAbsF = 0;
    const rawValues = new Float64Array(samples + 1);
    for (let i = 0; i <= samples; i++) {
      const mx = minX + ((maxX - minX) * i) / samples;
      const val = preset.antideriv(mx) - Fa;
      rawValues[i] = val;
      const absV = Math.abs(val);
      if (absV > maxAbsF) maxAbsF = absV;
    }

    const stageMaxH = Math.max(1.85, Math.min(2.35, Math.max(Math.abs(this._minWorldY), Math.abs(this._maxWorldY)) * 0.92));
    this._accumScaleY = maxAbsF > 1e-4 ? Math.min(WORLD_SCALE, stageMaxH / maxAbsF) : WORLD_SCALE;

    const accumPoints = [];
    for (let i = 0; i <= samples; i++) {
      const mx = minX + ((maxX - minX) * i) / samples;
      const wx = this._mathToWorldX(mx);
      const wy = this._accumToWorldY(rawValues[i]);
      accumPoints.push(new THREE.Vector3(wx, wy, ACCUM_Z));
    }

    disposeGroupChildren(this._accumGroup, this._sharedMaterials, this._sharedGeometries);

    const accumTubeGeom = createSafeTubeGeometry(accumPoints, 160, 0.04, 16);
    this._accumGroup.add(new THREE.Mesh(accumTubeGeom, this._matAccumTube));

    const accumCurtainGeom = createCurtainGeometry(accumPoints, COLORS.violet, 0x110a24);
    this._accumGroup.add(new THREE.Mesh(accumCurtainGeom, this._matAccumCurtain));

    // Baseline for F(x) at z = -0.65
    const accumBasePts = [
      new THREE.Vector3(this._mathToWorldX(minX), 0, ACCUM_Z),
      new THREE.Vector3(this._mathToWorldX(maxX), 0, ACCUM_Z),
    ];
    const accumBaseGeom = new THREE.BufferGeometry().setFromPoints(accumBasePts);
    const accumBaseMat = new THREE.LineBasicMaterial({
      color: COLORS.violet,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this._accumGroup.add(new THREE.Line(accumBaseGeom, accumBaseMat));

    // Subtle Violet zero-anchor ring at (a, 0, -0.65) proving F(a) = 0
    const anchorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.011, 10, 28),
      this._matAccumTube
    );
    anchorRing.position.set(this._mathToWorldX(this.a), 0, ACCUM_Z);
    this._accumGroup.add(anchorRing);

    // Synced Violet Probe tracking (b, F(b)) + halo + Z-bridge to (b, f(b)) + drop pin
    const aProbeGeom = new THREE.SphereGeometry(0.082, 22, 22);
    const aProbeMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      emissive: COLORS.violet,
      emissiveIntensity: 1.55,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this._accumProbe = new THREE.Mesh(aProbeGeom, aProbeMat);

    this._accumProbeHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.011, 10, 32),
      new THREE.MeshBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0.82 })
    );
    this._accumProbe.add(this._accumProbeHalo);
    this._accumGroup.add(this._accumProbe);

    this._accumBridge = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.violet,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      })
    );
    this._accumGroup.add(this._accumBridge);

    this._accumDropPin = new THREE.Mesh(
      this._unitCylinder,
      new THREE.MeshBasicMaterial({
        color: COLORS.violet,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    this._accumGroup.add(this._accumDropPin);

    this._accumGroup.visible = this.showAccumulation;
    if (this._plinthAccumLane) {
      this._plinthAccumLane.visible = this.showAccumulation;
    }
  }

  _rebuildExactAreaCurtain() {
    const curtainKey = `${this.fnKey}:${this.a.toFixed(5)}:${this.b.toFixed(5)}`;
    if (curtainKey === this._lastCurtainKey) return;
    this._lastCurtainKey = curtainKey;

    disposeGroupChildren(this._curtainGroup, this._sharedMaterials, this._sharedGeometries);

    const span = Math.abs(this.b - this.a);
    if (span < 1e-5) return;

    const preset = this._getPreset();
    const xStart = Math.min(this.a, this.b);
    const xEnd = Math.max(this.a, this.b);
    const steps = 128;

    // Sample with exact zero-crossing insertions so Emerald/Coral transitions are razor-sharp
    const samples = [];
    let prevX = xStart;
    let prevY = preset.fn(prevX);
    samples.push({ wx: this._mathToWorldX(prevX), wy: this._mathToWorldY(prevY) });

    for (let i = 1; i <= steps; i++) {
      const curX = i === steps ? xEnd : xStart + ((xEnd - xStart) * i) / steps;
      const curY = preset.fn(curX);

      // Insert interpolated root vertex on sign change for crisp positive/negative color split
      if (prevY * curY < 0) {
        const tZero = Math.abs(prevY) / (Math.abs(prevY) + Math.abs(curY));
        const zeroX = prevX + (curX - prevX) * tZero;
        samples.push({ wx: this._mathToWorldX(zeroX), wy: 0 });
      }

      samples.push({ wx: this._mathToWorldX(curX), wy: this._mathToWorldY(curY) });
      prevX = curX;
      prevY = curY;
    }

    // 1. 3D Frosted-Glass Continuous Volume Ribbon (z in [-0.18, +0.18])
    const ribbonGeom = createSignedAreaCurtainGeometry(samples, BAR_DEPTH * 0.44);
    const ribbonMesh = new THREE.Mesh(ribbonGeom, this._matExactCurtain);
    ribbonMesh.renderOrder = 3;
    this._curtainGroup.add(ribbonMesh);

    // 2. Glowing Center Luminous Curtain Sheet at z = 0
    const coreGeom = createSignedAreaCurtainGeometry(samples, 0.008);
    const coreMesh = new THREE.Mesh(coreGeom, this._matExactGlowCore);
    coreMesh.renderOrder = 4;
    this._curtainGroup.add(coreMesh);
  }

  // --------------------------------------------------------------------------
  // Update Interactive Geometry (Riemann Bars, Exact Curtain, Beacons, F(x), Gauge)
  // --------------------------------------------------------------------------

  _updateInteractiveElements() {
    if (!this._initialized && !this._posBarsInst) return;

    const preset = this._getPreset();
    const metrics = this.getMetrics();

    // Ensure accumulation curve matches current lower bound a
    this._rebuildAccumulationCurve();
    // Ensure exact area curtain matches [a, b]
    this._rebuildExactAreaCurtain();

    const a = this.a;
    const b = this.b;
    const n = this.n;
    const rule = this.rule;
    const dx = (b - a) / n;
    const span = Math.abs(b - a);

    // Smooth melt factor: blends continuous Exact Area Curtain cleanly as N -> 80 (visible at N >= 60)
    const effN = this._effectiveN;
    const meltT = smoothstep((effN - 52) / 28); // 0 at N<=52, ~0.20 at N=60, 1.0 at N=80

    // Modulate glass opacity & edge glow so bars dissolve seamlessly into the continuous area
    this._matPosBar.opacity = 0.45 - meltT * 0.28;
    this._matNegBar.opacity = 0.47 - meltT * 0.28;
    this._matPosCap.opacity = 0.88 - meltT * 0.48;
    this._matNegCap.opacity = 0.88 - meltT * 0.48;
    this._matPosEdges.opacity = 0.62 - meltT * 0.52;
    this._matNegEdges.opacity = 0.62 - meltT * 0.52;

    this._matExactCurtain.opacity = meltT * 0.54;
    this._matExactGlowCore.opacity = meltT * 0.34;
    this._curtainGroup.visible = meltT > 0.005 && span > 1e-5;

    // 1. Update Instanced 3D Frosted-Glass Riemann Bars + Luminous Edges + Sample Beads
    let posCount = 0;
    let negCount = 0;
    let beadCount = 0;
    let posEdgeOff = 0;
    let negEdgeOff = 0;

    const showBeads = n <= 36 && span > 1e-4;
    const beadRadius = clamp(0.036 - (n - 4) * 0.0005, 0.018, 0.036);

    if (span > 1e-5) {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = a + (i + 1) * dx;
        const sampleX =
          rule === 'left' ? x0 : rule === 'right' ? x1 : 0.5 * (x0 + x1);
        const fy = preset.fn(sampleX);
        const wy = this._mathToWorldY(fy);

        const wx0 = this._mathToWorldX(x0);
        const wx1 = this._mathToWorldX(x1);
        const rawW = Math.abs(wx1 - wx0);
        const cx = 0.5 * (wx0 + wx1);

        // Inter-bar architectural crystal seam tightens smoothly to 0 as N -> 80
        const maxGap = Math.min(0.026, rawW * 0.12);
        const gap = maxGap * (1 - meltT);
        const barW = Math.max(rawW - gap, 0.004);
        const absH = Math.abs(wy);

        if (absH >= 0.004) {
          const cy = wy * 0.5;
          const capThickness = Math.min(0.018, absH * 0.35);
          const capY = wy >= 0 ? wy - capThickness * 0.5 : wy + capThickness * 0.5;

          _tmpPos.set(cx, cy, 0);
          _tmpScale.set(barW, absH, BAR_DEPTH);
          _tmpMat4.compose(_tmpPos, _identityQuat, _tmpScale);

          if (fy >= 0) {
            this._posBarsInst.setMatrixAt(posCount, _tmpMat4);

            _tmpPos.set(cx, capY, 0);
            _tmpScale.set(barW * 1.005, capThickness, BAR_DEPTH * 1.015);
            _tmpMat4.compose(_tmpPos, _identityQuat, _tmpScale);
            this._posCapsInst.setMatrixAt(posCount, _tmpMat4);

            posEdgeOff = pushBoxEdges(
              this._posEdgePositions,
              posEdgeOff,
              cx,
              cy,
              0,
              barW,
              absH,
              BAR_DEPTH
            );
            posCount++;
          } else {
            this._negBarsInst.setMatrixAt(negCount, _tmpMat4);

            _tmpPos.set(cx, capY, 0);
            _tmpScale.set(barW * 1.005, capThickness, BAR_DEPTH * 1.015);
            _tmpMat4.compose(_tmpPos, _identityQuat, _tmpScale);
            this._negCapsInst.setMatrixAt(negCount, _tmpMat4);

            negEdgeOff = pushBoxEdges(
              this._negEdgePositions,
              negEdgeOff,
              cx,
              cy,
              0,
              barW,
              absH,
              BAR_DEPTH
            );
            negCount++;
          }
        }

        if (showBeads) {
          const sampleWx = this._mathToWorldX(sampleX);
          _tmpPos.set(sampleWx, wy, BAR_DEPTH * 0.5 + 0.016);
          _tmpScale.setScalar(beadRadius);
          _tmpMat4.compose(_tmpPos, _identityQuat, _tmpScale);
          this._sampleBeadsInst.setMatrixAt(beadCount, _tmpMat4);
          beadCount++;
        }
      }
    }

    this._posBarsInst.count = posCount;
    this._posCapsInst.count = posCount;
    this._negBarsInst.count = negCount;
    this._negCapsInst.count = negCount;
    this._sampleBeadsInst.count = beadCount;

    this._posBarsInst.instanceMatrix.needsUpdate = true;
    this._posCapsInst.instanceMatrix.needsUpdate = true;
    this._negBarsInst.instanceMatrix.needsUpdate = true;
    this._negCapsInst.instanceMatrix.needsUpdate = true;
    this._sampleBeadsInst.instanceMatrix.needsUpdate = true;

    this._posEdgeGeom.setDrawRange(0, posCount * 24);
    this._posEdgeGeom.attributes.position.needsUpdate = true;
    this._negEdgeGeom.setDrawRange(0, negCount * 24);
    this._negEdgeGeom.attributes.position.needsUpdate = true;

    // 2. Boundary Beacons at x = a (Cyan) & x = b (Amber)
    const wxA = this._mathToWorldX(a);
    const wyA = this._mathToWorldY(preset.fn(a));
    const wxB = this._mathToWorldX(b);
    const wyB = this._mathToWorldY(metrics.fb);

    this._beaconA.position.set(wxA, wyA, 0);
    this._baseRingA.position.set(wxA, 0, 0);
    if (Math.abs(wyA) > 0.05) {
      alignCylinderBetween(
        this._pillarA,
        new THREE.Vector3(wxA, 0, 0),
        new THREE.Vector3(wxA, wyA, 0),
        0.014
      );
      this._edgePlaneA.visible = true;
      this._edgePlaneA.position.set(wxA, wyA * 0.5, 0);
      this._edgePlaneA.scale.set(1, Math.abs(wyA), 1);
    } else {
      this._pillarA.visible = false;
      this._edgePlaneA.visible = false;
    }

    this._beaconB.position.set(wxB, wyB, 0);
    this._baseRingB.position.set(wxB, 0, 0);
    if (metrics.isExactLocked) {
      this._matBeaconB.color.setHex(COLORS.emeraldLight);
      this._matBeaconB.emissive.setHex(COLORS.emerald);
      this._matBeaconB.emissiveIntensity = 1.85;
      this._matHaloB.color.setHex(COLORS.emerald);
      this._matPillarB.color.setHex(COLORS.emeraldLight);
      this._matPillarB.emissive.setHex(COLORS.emerald);
      this._matEdgePlaneB.color.setHex(COLORS.emerald);
      this._matLaserBeam.color.setHex(COLORS.emerald);
      this._matPortLens.color.setHex(COLORS.emeraldLight);
    } else {
      this._matBeaconB.color.setHex(COLORS.amberLight);
      this._matBeaconB.emissive.setHex(COLORS.amber);
      this._matBeaconB.emissiveIntensity = 1.7;
      this._matHaloB.color.setHex(COLORS.amber);
      this._matPillarB.color.setHex(COLORS.amberLight);
      this._matPillarB.emissive.setHex(COLORS.amber);
      this._matEdgePlaneB.color.setHex(COLORS.amber);
      this._matLaserBeam.color.setHex(COLORS.amber);
      this._matPortLens.color.setHex(COLORS.amberLight);
    }

    if (Math.abs(wyB) > 0.05) {
      alignCylinderBetween(
        this._pillarB,
        new THREE.Vector3(wxB, 0, 0),
        new THREE.Vector3(wxB, wyB, 0),
        0.017
      );
      this._edgePlaneB.visible = true;
      this._edgePlaneB.position.set(wxB, wyB * 0.5, 0);
      this._edgePlaneB.scale.set(1, Math.abs(wyB), 1);
    } else {
      this._pillarB.visible = false;
      this._edgePlaneB.visible = false;
    }

    // 3. Synced Violet Probe on Floating Accumulation Curve F(x) at z = -0.65
    if (this._accumProbe && this._accumBridge && this._accumDropPin) {
      const accumWY = this._accumToWorldY(metrics.exactIntegral);
      const pCurve = new THREE.Vector3(wxB, wyB, 0);
      const pAccum = new THREE.Vector3(wxB, accumWY, ACCUM_Z);

      this._accumProbe.position.copy(pAccum);
      alignCylinderBetween(this._accumBridge, pCurve, pAccum, 0.011);

      if (Math.abs(accumWY) > 0.06) {
        alignCylinderBetween(
          this._accumDropPin,
          new THREE.Vector3(wxB, 0, ACCUM_Z),
          pAccum,
          0.009
        );
      } else {
        this._accumDropPin.visible = false;
      }
    }

    // 4. Miniature 3D Mechatronics Accumulator / Displacement Column Gauge (Right Edge)
    if (this._fluidColumn && this._pistonHead) {
      const halfTravel = this._gaugeHalfTravel || 1.7;
      const maxInt = Math.max(this._gaugeMaxIntegral, 1.5);

      const exactNorm = clamp(metrics.exactIntegral / maxInt, -1, 1);
      const exactLevelY = exactNorm * halfTravel;

      // Fluid column tracks live signed net integral (smoothly converging from Riemann sum -> exact)
      const displayVal = metrics.isExactLocked ? metrics.exactIntegral : metrics.riemannSum;
      const fluidNorm = clamp(displayVal / maxInt, -1, 1);
      const fluidLevelY = fluidNorm * halfTravel;

      const absLevel = Math.abs(fluidLevelY);
      const isPositive = displayVal >= 0;
      const isZeroNet = Math.abs(displayVal) < 0.025;

      if (absLevel < 0.015) {
        this._fluidColumn.visible = false;
        this._fluidCore.visible = false;
      } else {
        this._fluidColumn.visible = true;
        this._fluidCore.visible = true;
        this._fluidColumn.position.set(0, fluidLevelY * 0.5, 0);
        this._fluidColumn.scale.set(1, absLevel, 1);
        this._fluidCore.position.set(0, fluidLevelY * 0.5, 0);
        this._fluidCore.scale.set(1, absLevel, 1);
      }

      if (isZeroNet) {
        this._matFluidColumn.color.setHex(COLORS.cyan);
        this._matFluidColumn.emissive.setHex(COLORS.cyan);
        this._matFluidCore.color.setHex(COLORS.cyanLight);
        this._matPistonRim.color.setHex(COLORS.cyanLight);
        this._matPistonRim.emissive.setHex(COLORS.cyan);
        this._matGaugeStatusRing.color.setHex(COLORS.cyanLight);
        this._matGaugeStatusRing.emissive.setHex(COLORS.cyan);
        this._matZeroDatumLed.opacity = 0.95;
      } else if (isPositive) {
        this._matFluidColumn.color.setHex(COLORS.emerald);
        this._matFluidColumn.emissive.setHex(COLORS.emeraldDeep);
        this._matFluidCore.color.setHex(COLORS.emeraldLight);
        this._matPistonRim.color.setHex(COLORS.emeraldLight);
        this._matPistonRim.emissive.setHex(COLORS.emerald);
        this._matGaugeStatusRing.color.setHex(COLORS.emeraldLight);
        this._matGaugeStatusRing.emissive.setHex(COLORS.emerald);
        this._matZeroDatumLed.opacity = 0.45;
      } else {
        this._matFluidColumn.color.setHex(COLORS.coral);
        this._matFluidColumn.emissive.setHex(COLORS.coralDeep);
        this._matFluidCore.color.setHex(COLORS.coralLight);
        this._matPistonRim.color.setHex(COLORS.coralLight);
        this._matPistonRim.emissive.setHex(COLORS.coral);
        this._matGaugeStatusRing.color.setHex(COLORS.coralLight);
        this._matGaugeStatusRing.emissive.setHex(COLORS.coral);
        this._matZeroDatumLed.opacity = 0.45;
      }

      this._pistonHead.position.set(0, fluidLevelY, 0);
      this._exactTargetRing.position.set(0, exactLevelY, 0);
      this._matExactTargetRing.opacity = metrics.isExactLocked ? 0.92 : 0.62;

      // Optical receiver port tracks clamped y of (b, f(b)), connected by live glowing laser beam
      const portY = clamp(wyB, -halfTravel, halfTravel);
      this._receiverPort.position.set(0, portY, 0);

      const beamStart = new THREE.Vector3(wxB - GAUGE_X, wyB, 0);
      const beamEnd = new THREE.Vector3(-0.425, portY, 0);
      alignCylinderBetween(this._laserBeam, beamStart, beamEnd, 0.011);
    }
  }

  // --------------------------------------------------------------------------
  // Camera Presets
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    const yCenter = this._targetPlinthY < -3.0 ? -0.2 : 0.2;
    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(0.3, yCenter, 12.2),
          target: new THREE.Vector3(0.3, yCenter, 0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(-6.4, yCenter + 5.1, 8.0),
          target: new THREE.Vector3(0.35, yCenter - 0.3, -0.2),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(-2.7, yCenter + 2.1, 10.6),
          target: new THREE.Vector3(0.3, yCenter - 0.15, -0.15),
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
    if (!INTEGRAL_PRESETS[fnKey]) return this.getMetrics();
    this._cancelRefineAnimation();

    this.fnKey = fnKey;
    const preset = INTEGRAL_PRESETS[fnKey];
    this.a = preset.defaultA;
    this.b = preset.defaultB;
    this._effectiveN = this.n;

    if (this._initialized) {
      this._rebuildPresetScene(false);
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setBounds(a, b) {
    const numA = Number(a);
    const numB = Number(b);
    if (!Number.isFinite(numA) && !Number.isFinite(numB)) return this.getMetrics();

    const [minX, maxX] = this._getPreset().domain;
    if (Number.isFinite(numA)) this.a = clamp(numA, minX, maxX);
    if (Number.isFinite(numB)) this.b = clamp(numB, minX, maxX);

    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setB(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return this.getMetrics();
    const [minX, maxX] = this._getPreset().domain;
    this.b = clamp(num, minX, maxX);

    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setSubdivisions(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return this.getMetrics();
    this._cancelRefineAnimation();

    this.n = clamp(Math.round(num), MIN_BARS, MAX_BARS);
    this._effectiveN = this.n;

    if (this._initialized) {
      this._updateInteractiveElements();
    }

    const metrics = this.getMetrics();
    this._emitChange(metrics);
    return metrics;
  }

  setRule(rule) {
    if (!VALID_RULES.has(rule)) return this.getMetrics();
    this.rule = rule;

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

  toggleAccumulationCurve(bool) {
    this.showAccumulation = Boolean(bool);
    if (this._accumGroup) {
      this._accumGroup.visible = this.showAccumulation;
    }
    if (this._plinthAccumLane) {
      this._plinthAccumLane.visible = this.showAccumulation;
    }
  }

  toggleMechatronicsLens(bool) {
    this.showMechatronics = Boolean(bool);
    if (this._gaugeGroup) {
      this._gaugeGroup.visible = this.showMechatronics;
    }
  }

  animateRefine(onFrame) {
    this._cancelRefineAnimation();

    const startN = MIN_BARS;
    const endN = MAX_BARS;

    this._refineAnim = {
      startTime: performance.now(),
      duration: 2200,
      startN,
      endN,
      onFrame: typeof onFrame === 'function' ? onFrame : null,
    };

    // Start crisply from N = 4 so the dramatic coarse-to-continuous refinement is unmistakable
    this.n = startN;
    this._effectiveN = startN;
    if (this._initialized) {
      this._updateInteractiveElements();
    }
    const initMetrics = this.getMetrics();
    this._emitChange(initMetrics);
    if (this._refineAnim.onFrame) {
      this._refineAnim.onFrame(initMetrics);
    }

    return () => this._cancelRefineAnimation();
  }

  _cancelRefineAnimation() {
    this._refineAnim = null;
    this._effectiveN = this.n;
  }

  getMetrics() {
    const preset = this._getPreset();
    const a = this.a;
    const b = this.b;
    const n = this.n;
    const rule = this.rule;

    const dx = (b - a) / n;
    let riemannSum = 0;
    let positiveArea = 0;
    let negativeArea = 0;

    if (Math.abs(b - a) > 1e-12) {
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = a + (i + 1) * dx;
        const sampleX =
          rule === 'left' ? x0 : rule === 'right' ? x1 : 0.5 * (x0 + x1);
        const contrib = preset.fn(sampleX) * dx;
        riemannSum += contrib;
        if (contrib >= 0) {
          positiveArea += contrib;
        } else {
          negativeArea += contrib;
        }
      }
    }

    const exactIntegral = normalizeZero(preset.antideriv(b) - preset.antideriv(a));
    const normRiemann = normalizeZero(riemannSum);
    const error = normalizeZero(normRiemann - exactIntegral);
    const fb = normalizeZero(preset.fn(b));
    const isExactLocked = n >= 64 || Math.abs(error) < 0.015;

    return {
      fnKey: this.fnKey,
      preset,
      a,
      b,
      n,
      rule,
      riemannSum: normRiemann,
      exactIntegral,
      error,
      positiveArea: normalizeZero(positiveArea),
      negativeArea: normalizeZero(negativeArea),
      fb,
      isExactLocked,
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

    // 1. Smooth Riemann refinement animation (N: 4 -> 80 over ~2.2s)
    if (this._refineAnim) {
      const { startTime, duration, startN, endN, onFrame } = this._refineAnim;
      const rawT = clamp((now - startTime) / duration, 0, 1);
      // Slight power-eased curve so coarse bars (4..16) breathe clearly before accelerating to 80
      const eased = easeInOutCubic(Math.pow(rawT, 1.15));
      const floatN = rawT >= 1 ? endN : startN + (endN - startN) * eased;

      this._effectiveN = floatN;
      this.n = clamp(Math.round(floatN), MIN_BARS, MAX_BARS);

      this._updateInteractiveElements();
      const metrics = this.getMetrics();
      this._emitChange(metrics);
      if (onFrame) onFrame(metrics);

      if (rawT >= 1) {
        this._refineAnim = null;
        this._effectiveN = endN;
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

    // 3. Smooth plinth elevation transition when switching presets
    if (Math.abs(this._currentPlinthY - this._targetPlinthY) > 0.002) {
      this._currentPlinthY += (this._targetPlinthY - this._currentPlinthY) * 0.1;
      if (this._plinthGroup) {
        this._plinthGroup.position.y = this._currentPlinthY;
      }
      this._updateGaugeSpan(this._currentPlinthY);
      this._updateInteractiveElements();
    }

    // 4. Living Spline micro-animations (boundary halos, accumulation probe, plinth rim breath)
    if (this._haloA) {
      this._haloA.rotation.z = elapsed * 0.85;
      this._haloA.rotation.y = Math.sin(elapsed * 1.3) * 0.4;
      this._haloA.scale.setScalar(1 + Math.sin(elapsed * 2.8) * 0.06);
    }

    if (this._haloB) {
      this._haloB.rotation.z = -elapsed * 1.05;
      this._haloB.rotation.x = Math.cos(elapsed * 1.5) * 0.45;
      this._haloB.scale.setScalar(1 + Math.sin(elapsed * 3.2 + 0.8) * 0.08);
    }

    if (this._accumProbeHalo) {
      this._accumProbeHalo.rotation.z = elapsed * 1.15;
      this._accumProbeHalo.rotation.y = Math.cos(elapsed * 1.4) * 0.42;
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
    this._refineAnim = null;

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
  }
}

/**
 * EIGENLAB — Interactive 3D Linear Algebra, Matrix Transform & Eigenspace Studio
 * Spline-quality Three.js WebGL visualization module (ES Modules).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ============================================================================
// 1. NUMERICAL HELPERS & EXACT 3x3 LINEAR ALGEBRA ENGINE
// ============================================================================

const EPS_ZERO = 1e-12;
const EPS_SINGULAR = 1e-4;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function cleanZero(v, tol = EPS_ZERO) {
  return Math.abs(v) < tol ? 0 : v;
}

function easeOutCubic(t) {
  const inv = 1 - clamp(t, 0, 1);
  return 1 - inv * inv * inv;
}

function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function fmtNum(v) {
  const n = cleanZero(v, 1e-6);
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) < 1e-4) {
    return String(rounded === 0 ? 0 : rounded);
  }
  return n.toFixed(2);
}

function mat3Vec3(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

function det3x3(M) {
  const [a, b, c] = M[0];
  const [d, e, f] = M[1];
  const [g, h, i] = M[2];
  return cleanZero(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g), 1e-12);
}

function canonicalizeUnitVec3(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-12) return null;
  let x = v[0] / len;
  let y = v[1] / len;
  let z = v[2] / len;
  // Deterministic sign convention so eigenvectors never flip abruptly while scrubbing
  if (Math.abs(x) > 1e-6) {
    if (x < 0) {
      x = -x;
      y = -y;
      z = -z;
    }
  } else if (Math.abs(y) > 1e-6) {
    if (y < 0) {
      x = -x;
      y = -y;
      z = -z;
    }
  } else if (z < 0) {
    x = -x;
    y = -y;
    z = -z;
  }
  return [cleanZero(x, 1e-12), cleanZero(y, 1e-12), cleanZero(z, 1e-12)];
}

function computeRank3x3(M, tol = EPS_SINGULAR) {
  const A = [
    [M[0][0], M[0][1], M[0][2]],
    [M[1][0], M[1][1], M[1][2]],
    [M[2][0], M[2][1], M[2][2]],
  ];
  let rank = 0;
  for (let col = 0; col < 3 && rank < 3; col++) {
    let pivotRow = rank;
    let maxVal = Math.abs(A[rank][col]);
    for (let r = rank + 1; r < 3; r++) {
      const val = Math.abs(A[r][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = r;
      }
    }
    if (maxVal <= tol) continue;
    if (pivotRow !== rank) {
      const tmp = A[rank];
      A[rank] = A[pivotRow];
      A[pivotRow] = tmp;
    }
    const piv = A[rank][col];
    for (let r = rank + 1; r < 3; r++) {
      const factor = A[r][col] / piv;
      for (let c = col; c < 3; c++) {
        A[r][c] -= factor * A[rank][c];
      }
    }
    rank++;
  }
  return rank;
}

/**
 * Find an orthonormal basis for the nullspace of a 3x3 matrix B = M - lambda*I.
 */
function nullspace3x3(B, tol = 1e-7) {
  const A = [
    [B[0][0], B[0][1], B[0][2]],
    [B[1][0], B[1][1], B[1][2]],
    [B[2][0], B[2][1], B[2][2]],
  ];

  // Reduced Row Echelon Form with partial pivoting
  const pivotCols = [];
  let row = 0;
  for (let col = 0; col < 3 && row < 3; col++) {
    let bestRow = row;
    let bestVal = Math.abs(A[row][col]);
    for (let r = row + 1; r < 3; r++) {
      const v = Math.abs(A[r][col]);
      if (v > bestVal) {
        bestVal = v;
        bestRow = r;
      }
    }
    if (bestVal <= tol) continue;
    if (bestRow !== row) {
      const tmp = A[row];
      A[row] = A[bestRow];
      A[bestRow] = tmp;
    }
    const piv = A[row][col];
    for (let c = col; c < 3; c++) {
      A[row][c] /= piv;
    }
    for (let r = 0; r < 3; r++) {
      if (r === row) continue;
      const factor = A[r][col];
      if (Math.abs(factor) > 1e-15) {
        for (let c = col; c < 3; c++) {
          A[r][c] -= factor * A[row][c];
        }
      }
    }
    pivotCols.push(col);
    row++;
  }

  const freeCols = [];
  for (let c = 0; c < 3; c++) {
    if (!pivotCols.includes(c)) freeCols.push(c);
  }

  // Construct basis vectors from free columns
  const basis = [];
  for (const fc of freeCols) {
    const vec = [0, 0, 0];
    vec[fc] = 1;
    for (let i = 0; i < pivotCols.length; i++) {
      vec[pivotCols[i]] = -A[i][fc];
    }
    // Gram-Schmidt orthogonalize against previously collected vectors in this eigenspace
    for (const prev of basis) {
      const dot = vec[0] * prev[0] + vec[1] * prev[1] + vec[2] * prev[2];
      vec[0] -= dot * prev[0];
      vec[1] -= dot * prev[1];
      vec[2] -= dot * prev[2];
    }
    const unit = canonicalizeUnitVec3(vec);
    if (unit) basis.push(unit);
  }

  // Fallback for near-singular 1D nullspace via cross products of rows
  if (basis.length === 0) {
    const r0 = B[0];
    const r1 = B[1];
    const r2 = B[2];
    const pairs = [
      [r0, r1],
      [r0, r2],
      [r1, r2],
    ];
    let best = null;
    let bestNorm = 0;
    for (const [u, v] of pairs) {
      const cx = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const norm = Math.hypot(cx[0], cx[1], cx[2]);
      if (norm > bestNorm) {
        bestNorm = norm;
        best = cx;
      }
    }
    if (best && bestNorm > 1e-12) {
      const unit = canonicalizeUnitVec3(best);
      if (unit) basis.push(unit);
    }
  }

  return basis;
}

/**
 * Solve the 2x2 XY block eigenvalues & eigenvectors analytically to machine precision.
 */
function solve2x2Block(a, b, d, e) {
  const tr = a + e;
  const disc = (a - e) * (a - e) + 4 * b * d;

  if (disc > 1e-12) {
    const s = Math.sqrt(disc);
    const l1 = cleanZero(0.5 * (tr + s), 1e-12);
    const l2 = cleanZero(0.5 * (tr - s), 1e-12);

    const findVec2 = (lam) => {
      const c1 = [-b, a - lam];
      const c2 = [e - lam, -d];
      const n1 = Math.hypot(c1[0], c1[1]);
      const n2 = Math.hypot(c2[0], c2[1]);
      const chosen = n1 >= n2 ? c1 : c2;
      return canonicalizeUnitVec3([chosen[0], chosen[1], 0]) || [1, 0, 0];
    };

    return {
      eigs: [
        { re: l1, im: 0 },
        { re: l2, im: 0 },
      ],
      vecs: [
        { vec: findVec2(l1), lambda: l1 },
        { vec: findVec2(l2), lambda: l2 },
      ],
    };
  }

  if (disc >= -1e-12) {
    const lam = cleanZero(0.5 * tr, 1e-12);
    const eigs = [
      { re: lam, im: 0 },
      { re: lam, im: 0 },
    ];
    // Check if B - lam*I == 0 (geometric multiplicity 2)
    if (
      Math.abs(a - lam) < 1e-9 &&
      Math.abs(b) < 1e-9 &&
      Math.abs(d) < 1e-9 &&
      Math.abs(e - lam) < 1e-9
    ) {
      return {
        eigs,
        vecs: [
          { vec: [1, 0, 0], lambda: lam },
          { vec: [0, 1, 0], lambda: lam },
        ],
      };
    }
    // Defective 2x2 Jordan block (geometric multiplicity 1)
    const c1 = [-b, a - lam];
    const c2 = [e - lam, -d];
    const n1 = Math.hypot(c1[0], c1[1]);
    const n2 = Math.hypot(c2[0], c2[1]);
    const chosen = n1 >= n2 ? c1 : c2;
    const unit = canonicalizeUnitVec3([chosen[0], chosen[1], 0]) || [1, 0, 0];
    return {
      eigs,
      vecs: [{ vec: unit, lambda: lam }],
    };
  }

  // Complex conjugate pair
  const re = cleanZero(0.5 * tr, 1e-12);
  const im = cleanZero(0.5 * Math.sqrt(-disc), 1e-12);
  return {
    eigs: [
      { re, im },
      { re, im: -im },
    ],
    vecs: [],
  };
}

/**
 * General 3x3 characteristic cubic solver fallback (Cardano + trigonometric + Newton polish).
 */
function solveGeneral3x3Eigen(M) {
  const p = M[0][0] + M[1][1] + M[2][2];
  const q =
    M[0][0] * M[1][1] -
    M[0][1] * M[1][0] +
    M[0][0] * M[2][2] -
    M[0][2] * M[2][0] +
    M[1][1] * M[2][2] -
    M[1][2] * M[2][1];
  const r = det3x3(M);

  const P = q - (p * p) / 3;
  const Q = (-2 * p * p * p) / 27 + (p * q) / 3 - r;
  const D = (Q * Q) / 4 + (P * P * P) / 27;

  const polishRoot = (x0) => {
    let x = x0;
    for (let iter = 0; iter < 8; iter++) {
      const f = ((x - p) * x + q) * x - r;
      const df = (3 * x - 2 * p) * x + q;
      if (Math.abs(df) < 1e-14) break;
      const step = f / df;
      x -= step;
      if (Math.abs(step) < 1e-14) break;
    }
    return cleanZero(x, 1e-12);
  };

  let rawEigs = [];

  if (D > 1e-12) {
    const sqrtD = Math.sqrt(D);
    const u = Math.cbrt(-Q / 2 + sqrtD);
    const v = Math.cbrt(-Q / 2 - sqrtD);
    const realRoot = polishRoot(u + v + p / 3);
    // Deflate cubic by (lam - realRoot): lam^2 + b1*lam + c1 = 0
    const b1 = realRoot - p;
    const c1 = q + realRoot * b1;
    const quadDisc = b1 * b1 - 4 * c1;
    const re = cleanZero(-0.5 * b1, 1e-12);
    const im = cleanZero(0.5 * Math.sqrt(Math.max(0, -quadDisc)), 1e-12);
    rawEigs = [
      { re: realRoot, im: 0 },
      { re, im },
      { re, im: -im },
    ];
  } else {
    const rad = Math.sqrt(Math.max(0, -P / 3));
    let roots;
    if (rad < 1e-12) {
      const triple = cleanZero(p / 3, 1e-12);
      roots = [triple, triple, triple];
    } else {
      const cosArg = clamp(-Q / (2 * rad * rad * rad), -1, 1);
      const phi = Math.acos(cosArg);
      roots = [
        polishRoot(2 * rad * Math.cos(phi / 3) + p / 3),
        polishRoot(2 * rad * Math.cos((phi + 2 * Math.PI) / 3) + p / 3),
        polishRoot(2 * rad * Math.cos((phi + 4 * Math.PI) / 3) + p / 3),
      ];
      roots.sort((x, y) => y - x);
    }
    rawEigs = roots.map((re) => ({ re, im: 0 }));
  }

  // Group distinct real eigenvalues and compute nullspace basis for each
  const distinctReal = [];
  for (const e of rawEigs) {
    if (Math.abs(e.im) > 1e-7) continue;
    if (!distinctReal.some((val) => Math.abs(val - e.re) < 1e-5)) {
      distinctReal.push(e.re);
    }
  }

  const realEigenvectors = [];
  for (const lam of distinctReal) {
    const B = [
      [M[0][0] - lam, M[0][1], M[0][2]],
      [M[1][0], M[1][1] - lam, M[1][2]],
      [M[2][0], M[2][1], M[2][2] - lam],
    ];
    const basis = nullspace3x3(B, 1e-6);
    for (const vec of basis) {
      const Av = mat3Vec3(M, vec);
      const res = Math.hypot(Av[0] - lam * vec[0], Av[1] - lam * vec[1], Av[2] - lam * vec[2]);
      if (res < 1e-5) {
        realEigenvectors.push({ vec, lambda: lam });
      }
    }
  }

  return { rawEigs, realEigenvectors };
}

function formatEigenLabel(re, im) {
  if (Math.abs(im) < 1e-5) {
    return fmtNum(re);
  }
  const sign = im >= 0 ? '+' : '-';
  return `${fmtNum(re)} ${sign} ${fmtNum(Math.abs(im))}i`;
}

function buildMatrixLatex(M) {
  const rows = M.map((row) => row.map((v) => fmtNum(v)).join(' & '));
  return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
}

function buildEigenLatex(eigenvalues) {
  const complexEigs = eigenvalues.filter((e) => Math.abs(e.im) >= 1e-5);
  const realEigs = eigenvalues.filter((e) => Math.abs(e.im) < 1e-5);

  if (complexEigs.length >= 2) {
    const pos = complexEigs.find((e) => e.im > 0) || complexEigs[0];
    const magSq = pos.re * pos.re + pos.im * pos.im;
    const realPart = realEigs.map((e) => fmtNum(e.re)).join(',\\; ');

    if (Math.abs(magSq - 1) < 1e-3) {
      const deg = Math.round((Math.atan2(pos.im, pos.re) * 180) / Math.PI);
      return realPart
        ? `\\lambda = ${realPart},\\; e^{\\pm i ${deg}^\\circ}`
        : `\\lambda = e^{\\pm i ${deg}^\\circ}`;
    }

    const cStr = `${fmtNum(pos.re)} \\pm ${fmtNum(Math.abs(pos.im))}i`;
    return realPart ? `\\lambda = ${realPart},\\; ${cStr}` : `\\lambda = ${cStr}`;
  }

  return `\\lambda = ${eigenvalues.map((e) => fmtNum(e.re)).join(',\\; ')}`;
}

// ============================================================================
// 2. PRESETS & MATRIX ANALYZER EXPORTS
// ============================================================================

export const LINALG_PRESETS = {
  'eigen-stretch': {
    id: 'eigen-stretch',
    label: 'Symmetric Stretch',
    mechatronicsLabel: 'Principal Inertia Tensor',
    defaultParam: 0.8,
    paramLabel: 'Coupling Off-Diag k',
    paramMin: -1.2,
    paramMax: 1.4,
    paramStep: 0.05,
    paramUnit: '',
    matrixAt(k) {
      const v = Number(k);
      return [
        [1.8, cleanZero(v), 0],
        [cleanZero(v), 1.2, 0],
        [0, 0, 1.3],
      ];
    },
  },
  'horizontal-shear': {
    id: 'horizontal-shear',
    label: '3D Shear',
    mechatronicsLabel: 'Pure Shear Deformation',
    defaultParam: 1.2,
    paramLabel: 'Shear Factor k',
    paramMin: -2.0,
    paramMax: 2.0,
    paramStep: 0.05,
    paramUnit: '',
    matrixAt(k) {
      const v = Number(k);
      return [
        [1, cleanZero(v), 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
    },
  },
  'rotation-3d': {
    id: 'rotation-3d',
    label: 'SO(3) Rotation',
    mechatronicsLabel: 'Robot Yaw Frame SO(3)',
    defaultParam: 45,
    paramLabel: 'Rotation Angle θ',
    paramMin: -180,
    paramMax: 180,
    paramStep: 5,
    paramUnit: '°',
    matrixAt(deg) {
      const rad = (Number(deg) * Math.PI) / 180;
      const c = cleanZero(Math.cos(rad), 1e-12);
      const s = cleanZero(Math.sin(rad), 1e-12);
      return [
        [c, cleanZero(-s, 1e-12), 0],
        [s, c, 0],
        [0, 0, 1],
      ];
    },
  },
  'rank-collapse': {
    id: 'rank-collapse',
    label: 'Rank-2 Projection',
    mechatronicsLabel: 'Kinematic Singularity',
    defaultParam: 0.0,
    paramLabel: 'Z-Scale λ₃',
    paramMin: 0.0,
    paramMax: 1.5,
    paramStep: 0.05,
    paramUnit: '',
    matrixAt(k) {
      const v = Number(k);
      return [
        [1.5, 0.5, 0],
        [0.5, 1.1, 0],
        [0, 0, cleanZero(v)],
      ];
    },
  },
  'reflection-flip': {
    id: 'reflection-flip',
    label: 'Mirror Flip (det < 0)',
    mechatronicsLabel: 'Parity / Handedness Flip',
    defaultParam: -1.0,
    paramLabel: 'X-Parity Scale k',
    paramMin: -1.6,
    paramMax: 1.6,
    paramStep: 0.05,
    paramUnit: '',
    matrixAt(k) {
      const v = Number(k);
      return [
        [cleanZero(v), 0.35, 0],
        [0, 1.25, 0],
        [0, 0, 1.0],
      ];
    },
  },
};

/**
 * Exact 3x3 matrix analysis: determinant, trace, rank, orientation, eigenvalues,
 * linearly independent unit real eigenvectors, and KaTeX strings.
 */
export function analyzeMatrix3x3(M) {
  const det = det3x3(M);
  const trace = cleanZero(M[0][0] + M[1][1] + M[2][2], 1e-12);
  const rank = computeRank3x3(M, EPS_SINGULAR);
  const isSingular = Math.abs(det) < EPS_SINGULAR;

  let orientation = 'Preserved';
  if (det < -EPS_SINGULAR) {
    orientation = 'Flipped';
  } else if (Math.abs(det) <= EPS_SINGULAR) {
    orientation = 'Collapsed';
  }

  const isBlockXY =
    Math.abs(M[0][2]) < 1e-10 &&
    Math.abs(M[1][2]) < 1e-10 &&
    Math.abs(M[2][0]) < 1e-10 &&
    Math.abs(M[2][1]) < 1e-10;

  let rawEigs;
  let realEigenvectors;

  if (isBlockXY) {
    const xy = solve2x2Block(M[0][0], M[0][1], M[1][0], M[1][1]);
    const lamZ = cleanZero(M[2][2], 1e-12);
    const hasComplexXY = xy.eigs.some((e) => Math.abs(e.im) >= 1e-5);

    if (hasComplexXY) {
      // Put real Z eigenvalue first for clean rotation readouts: lambda = 1, e^{+-i theta}
      rawEigs = [{ re: lamZ, im: 0 }, ...xy.eigs];
    } else {
      rawEigs = [...xy.eigs, { re: lamZ, im: 0 }];
    }

    realEigenvectors = [...xy.vecs, { vec: [0, 0, 1], lambda: lamZ }];
  } else {
    const general = solveGeneral3x3Eigen(M);
    rawEigs = general.rawEigs;
    realEigenvectors = general.realEigenvectors;
  }

  const eigenvalues = rawEigs.map((e) => {
    const re = cleanZero(e.re, 1e-12);
    const im = cleanZero(e.im, 1e-12);
    return {
      re,
      im,
      label: formatEigenLabel(re, im),
    };
  });

  return {
    det,
    trace,
    rank,
    isSingular,
    orientation,
    eigenvalues,
    realEigenvectors,
    matrixLatex: buildMatrixLatex(M),
    eigenLatex: buildEigenLatex(eigenvalues),
  };
}

// ============================================================================
// 3. STUDIO PALETTE, GEOMETRY BUILDERS & SHARED UTILITIES
// ============================================================================

const COLORS = {
  studioBg: 0x0b0d12,
  cyan: 0x22d3ee,
  cyanLight: 0x67e8f9,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  violet: 0xa78bfa,
  violetLight: 0xc4b5fd,
  emerald: 0x34d399,
  emeraldLight: 0x6ee7b7,
  coral: 0xfb7185,
  coralLight: 0xfda4af,
  probeSilver: 0xe2e8f0,
  probeIce: 0x94a3b8,
  slateGlass: 0x0d1526,
  anodized: 0x1e293b,
  aluminum: 0x94a3b8,
};

const PLINTH_Y = -2.35;
const PLINTH_WIDTH = 7.4;
const PLINTH_DEPTH = 7.4;
const PLINTH_HEIGHT = 0.22;

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpDelta = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
const _tmpV0 = new THREE.Vector3();
const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();

// Unit cube vertices in [0, 1]^3
const UNIT_CUBE_CORNERS = [
  [0, 0, 0], // 0: origin
  [1, 0, 0], // 1: i
  [1, 1, 0], // 2: i + j
  [0, 1, 0], // 3: j
  [0, 0, 1], // 4: k
  [1, 0, 1], // 5: i + k
  [1, 1, 1], // 6: i + j + k
  [0, 1, 1], // 7: j + k
];

const UNIT_CUBE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// 6 faces (12 triangles, non-indexed for crisp flat-shaded glossy clearcoat reflections)
const UNIT_CUBE_FACE_QUADS = [
  [0, 3, 2, 1], // z = 0
  [4, 5, 6, 7], // z = 1
  [0, 1, 5, 4], // y = 0
  [3, 7, 6, 2], // y = 1
  [0, 4, 7, 3], // x = 0
  [1, 2, 6, 5], // x = 1
];

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

function createPlinthRimGeometry(width, depth, cornerRadius, tubeRadius = 0.014) {
  const shape = createRoundedRectShape(width, depth, cornerRadius);
  const pts2D = shape.getSpacedPoints(120);
  const pts3D = [];
  for (let i = 0; i < pts2D.length - 1; i++) {
    pts3D.push(new THREE.Vector3(pts2D[i].x, 0.008, pts2D[i].y));
  }
  const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.5);
  return new THREE.TubeGeometry(curve, 140, tubeRadius, 8, true);
}

function createRadialGlowTexture(innerRgba, midRgba, outerRgba) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    grad.addColorStop(0, innerRgba);
    grad.addColorStop(0.45, midRgba);
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
 * Pick a canonical unit non-eigenvector probe direction well-separated from all real eigenvectors
 * so the contrast between eigenvectors (locked on laser) and non-eigenvectors (swinging off-axis)
 * is unmistakable. Returns null if M is a scalar multiple of the identity (every vector is an eigenvec).
 */
function pickNonEigenvectorProbe(M) {
  const candidates = [
    [1, 1, 0.5],
    [1, -0.75, 0.45],
    [0.55, 1, -0.45],
    [0.85, 0.5, -0.6],
  ];

  let bestProbe = null;
  let bestSinSq = 0;

  for (const raw of candidates) {
    const len = Math.hypot(raw[0], raw[1], raw[2]);
    const p = [raw[0] / len, raw[1] / len, raw[2] / len];
    const Ap = mat3Vec3(M, p);
    const normApSq = Ap[0] * Ap[0] + Ap[1] * Ap[1] + Ap[2] * Ap[2];
    if (normApSq < 1e-6) continue;

    // Cross product magnitude squared / ||Ap||^2 = sin^2(angle(p, Ap))
    const cx = p[1] * Ap[2] - p[2] * Ap[1];
    const cy = p[2] * Ap[0] - p[0] * Ap[2];
    const cz = p[0] * Ap[1] - p[1] * Ap[0];
    const sinSq = (cx * cx + cy * cy + cz * cz) / normApSq;

    if (sinSq > bestSinSq) {
      bestSinSq = sinSq;
      bestProbe = p;
    }
  }

  // If angle < ~1.5 degrees for all candidates, M is effectively scalar * I
  if (!bestProbe || bestSinSq < 7e-4) {
    return null;
  }
  return bestProbe;
}

// ============================================================================
// 4. LINALG 3D STUDIO CLASS
// ============================================================================

export class LinAlg3DStudio {
  constructor(options = {}) {
    this._applyOptions(options, true);

    // Three.js core handles
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;
    this.envRT = null;

    // Scene groups
    this._stageGroup = null;
    this._plinthGroup = null;
    this._referenceGroup = null;
    this._gridGroup = null;
    this._parallelepipedGroup = null;
    this._basisGroup = null;
    this._eigenGroup = null;
    this._mechatronicsGroup = null;

    // Resource registries for leak-free disposal
    this._sharedGeometries = new Set();
    this._sharedMaterials = new Set();
    this._ownedTextures = [];

    // Dynamic mesh/buffer handles (mutated in-place for zero per-frame allocations)
    this._plinthRimMat = null;
    this._originHalo = null;
    this._gridBasePoints = null;
    this._gridPosAttr = null;
    this._paraFacePosAttr = null;
    this._paraEdgePosAttr = null;
    this._paraFaceMat = null;
    this._paraEdgeMat = null;
    this._paraCornerMat = null;
    this._paraCornerDots = [];
    this._basisArrows = [];
    this._eigenSlots = [];
    this._probeRig = null;

    // Mechatronics lens handles
    this._ellipsoidBasePos = null;
    this._ellipsoidGeom = null;
    this._ellipsoidWireBasePos = null;
    this._ellipsoidWirePosAttr = null;
    this._ellipsoidRings = [];
    this._gimbalPivot = null;
    this._gimbalInnerRing = null;

    // Lifecycle & animation handles
    this._rafId = null;
    this._resizeObserver = null;
    this._clock = new THREE.Clock();
    this._initialized = false;
    this._disposed = false;
    this._camTransition = null;
    this._morphAnim = null;

    // Bound handlers
    this._onAnimate = this._animate.bind(this);
    this._onControlsStart = () => {
      this._camTransition = null;
    };
  }

  _applyOptions(options = {}, setDefaults = false) {
    if (typeof options.onTelemetry === 'function') {
      this.onTelemetry = options.onTelemetry;
    } else if (typeof options.onChange === 'function') {
      this.onTelemetry = options.onChange;
    } else if (setDefaults) {
      this.onTelemetry = null;
    }

    if (options.presetId && LINALG_PRESETS[options.presetId]) {
      this.presetId = options.presetId;
    } else if (setDefaults) {
      this.presetId = 'eigen-stretch';
    }

    const preset = this._getPreset();
    if (Number.isFinite(Number(options.param)) && options.param !== undefined) {
      this.param = clamp(Number(options.param), preset.paramMin, preset.paramMax);
    } else if (setDefaults || (options.presetId && options.param === undefined)) {
      this.param = preset.defaultParam;
    }

    if (Number.isFinite(Number(options.morph)) && options.morph !== undefined) {
      this.morph = clamp(Number(options.morph), 0, 1);
    } else if (setDefaults) {
      this.morph = 1.0;
    }

    if (options.showEigen !== undefined) {
      this.showEigen = Boolean(options.showEigen);
    } else if (setDefaults) {
      this.showEigen = true;
    }

    if (options.mechatronicsLens !== undefined) {
      this.mechatronicsLens = Boolean(options.mechatronicsLens);
    } else if (setDefaults) {
      this.mechatronicsLens = false;
    }

    if (options.cameraPreset) {
      this.cameraPreset =
        options.cameraPreset === 'front' || options.cameraPreset === 'iso'
          ? options.cameraPreset
          : '3d';
    } else if (setDefaults) {
      this.cameraPreset = '3d';
    }
  }

  _getPreset() {
    return LINALG_PRESETS[this.presetId] || LINALG_PRESETS['eigen-stretch'];
  }

  _getTargetMatrix() {
    return this._getPreset().matrixAt(this.param);
  }

  /**
   * Compute live interpolated transformation matrix A(t) for morph t in [0, 1].
   * For SO(3) rotation, smoothly interpolates the yaw angle t*theta so motion stays strictly rigid.
   */
  _getMorphedMatrix(t = this.morph) {
    const u = clamp(t, 0, 1);
    const preset = this._getPreset();
    if (preset.id === 'rotation-3d') {
      return preset.matrixAt(this.param * u);
    }
    const A = preset.matrixAt(this.param);
    const inv = 1 - u;
    return [
      [inv + u * A[0][0], u * A[0][1], u * A[0][2]],
      [u * A[1][0], inv + u * A[1][1], u * A[1][2]],
      [u * A[2][0], u * A[2][1], inv + u * A[2][2]],
    ];
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  init(container, options = {}) {
    if (!container) return this;
    if (this._initialized) {
      this.dispose();
    }
    this._applyOptions(options, false);
    this._disposed = false;
    this.container = container;

    const width = Math.max(container.clientWidth || 800, 1);
    const height = Math.max(container.clientHeight || 520, 1);

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.studioBg, 0.018);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 2. Renderer (Spline-quality physical rendering standards)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
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

    // 3. Studio Reflections via PMREMGenerator + RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 4. Post-Processing: EffectComposer + RenderPass + Subtle UnrealBloomPass
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.72);
    this.composer.addPass(this.bloomPass);

    // 5. Smoothly Damped OrbitControls
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.82;
    this.controls.minPolarAngle = 0.08;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 20.0;
    this.controls.rotateSpeed = 0.78;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.65;
    this.controls.addEventListener('start', this._onControlsStart);

    // 6. Lighting & Shared GPU Resources
    this._setupLighting();
    this._createSharedResources();

    // 7. Scene Hierarchy
    this._stageGroup = new THREE.Group();
    this.scene.add(this._stageGroup);

    this._plinthGroup = new THREE.Group();
    this._referenceGroup = new THREE.Group();
    this._gridGroup = new THREE.Group();
    this._parallelepipedGroup = new THREE.Group();
    this._basisGroup = new THREE.Group();
    this._eigenGroup = new THREE.Group();
    this._mechatronicsGroup = new THREE.Group();

    this._stageGroup.add(
      this._plinthGroup,
      this._referenceGroup,
      this._gridGroup,
      this._parallelepipedGroup,
      this._basisGroup,
      this._eigenGroup,
      this._mechatronicsGroup
    );

    // 8. Build Studio Stage & Interactive Objects
    this._buildPlinth();
    this._buildReferenceSpace();
    this._buildTransformedGrid();
    this._buildParallelepiped();
    this._buildBasisVectors();
    this._buildEigenspaceAndProbe();
    this._buildMechatronicsLens();

    // Sync initial visibility & geometry transforms
    this._eigenGroup.visible = this.showEigen;
    this._mechatronicsGroup.visible = this.mechatronicsLens;
    this._updateSceneGeometry();

    // Snap initial camera preset
    this._applyCameraPresetImmediate(this.cameraPreset);

    // Observe container resize (crash-proof on rapid mobile resize)
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(container);
    }

    this._initialized = true;
    this._clock.start();
    this._rafId = requestAnimationFrame(this._onAnimate);
    this._emitTelemetry();

    return this;
  }

  // --------------------------------------------------------------------------
  // Studio Lighting & Shared GPU Geometries / Materials
  // --------------------------------------------------------------------------

  _setupLighting() {
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x0b1120, 0.58);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.38);
    keyLight.position.set(5.5, 9.2, 8.2);
    this.scene.add(keyLight);

    const cyanRim = new THREE.PointLight(COLORS.cyan, 2.0, 22, 1.5);
    cyanRim.position.set(5.6, 2.6, 3.8);
    this.scene.add(cyanRim);

    const amberWarm = new THREE.PointLight(COLORS.amber, 1.3, 20, 1.6);
    amberWarm.position.set(-4.8, 3.8, 3.2);
    this.scene.add(amberWarm);

    const violetBack = new THREE.PointLight(COLORS.violet, 1.8, 22, 1.5);
    violetBack.position.set(-2.5, 2.4, -5.8);
    this.scene.add(violetBack);
  }

  _createSharedResources() {
    this._unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 20, 1, false);
    this._unitCone = new THREE.ConeGeometry(1, 1, 24);
    this._unitSphere = new THREE.SphereGeometry(1, 20, 20);
    this._unitTorus = new THREE.TorusGeometry(1, 0.14, 12, 32);

    this._sharedGeometries.add(
      this._unitCylinder,
      this._unitCone,
      this._unitSphere,
      this._unitTorus
    );

    // Sculpted glowing basis vector materials
    this._matBasisI = this._makeVectorMaterial(COLORS.cyanLight, COLORS.cyan, 1.12);
    this._matBasisJ = this._makeVectorMaterial(COLORS.amberLight, COLORS.amber, 1.08);
    this._matBasisK = this._makeVectorMaterial(COLORS.violetLight, COLORS.violet, 1.15);

    // Eigenvector laser & arrow materials (Emerald)
    this._matEigenBeam = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.55,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    this._matEigenHalo = new THREE.MeshBasicMaterial({
      color: COLORS.emerald,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._matEigenArrow = this._makeVectorMaterial(COLORS.emeraldLight, COLORS.emerald, 1.25);

    // Non-eigenvector silver/pearl contrast probe material
    this._matProbeArrow = new THREE.MeshPhysicalMaterial({
      color: COLORS.probeSilver,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.65,
      roughness: 0.16,
      metalness: 0.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.5,
    });

    this._matAnodized = new THREE.MeshPhysicalMaterial({
      color: COLORS.anodized,
      roughness: 0.28,
      metalness: 0.85,
      clearcoat: 0.7,
      envMapIntensity: 1.3,
    });

    this._matChrome = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      roughness: 0.14,
      metalness: 0.92,
      clearcoat: 1.0,
      envMapIntensity: 1.6,
    });

    this._sharedMaterials.add(
      this._matBasisI,
      this._matBasisJ,
      this._matBasisK,
      this._matEigenBeam,
      this._matEigenHalo,
      this._matEigenArrow,
      this._matProbeArrow,
      this._matAnodized,
      this._matChrome
    );
  }

  _makeVectorMaterial(baseHex, emissiveHex, emissiveIntensity = 1.1) {
    return new THREE.MeshPhysicalMaterial({
      color: baseHex,
      emissive: emissiveHex,
      emissiveIntensity,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.45,
    });
  }

  // --------------------------------------------------------------------------
  // 4A. Floating Frosted-Glass Studio Plinth
  // --------------------------------------------------------------------------

  _buildPlinth() {
    this._plinthGroup.position.set(0, PLINTH_Y, 0);

    // Bevelled frosted dark-slate glass slab (top surface sits at local y = 0)
    const slabGeom = createPlinthSlabGeometry(PLINTH_WIDTH, PLINTH_DEPTH, PLINTH_HEIGHT, 0.42, 0.045);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.slateGlass,
      roughness: 0.17,
      metalness: 0.18,
      transmission: 0.34,
      thickness: 0.5,
      ior: 1.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      envMapIntensity: 1.35,
      transparent: true,
      opacity: 0.88,
    });
    const slabMesh = new THREE.Mesh(slabGeom, slabMat);
    this._plinthGroup.add(slabMesh);

    // Subtle dark brushed metallic base chassis beneath the glass slab
    const baseGeom = createPlinthSlabGeometry(
      PLINTH_WIDTH - 0.28,
      PLINTH_DEPTH - 0.28,
      0.06,
      0.34,
      0.015
    );
    const baseMesh = new THREE.Mesh(baseGeom, this._matAnodized);
    baseMesh.position.y = -PLINTH_HEIGHT + 0.02;
    this._plinthGroup.add(baseMesh);

    // Glowing perimeter chamfer rim tube
    const rimGeom = createPlinthRimGeometry(PLINTH_WIDTH - 0.06, PLINTH_DEPTH - 0.06, 0.39, 0.013);
    this._plinthRimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.1,
      roughness: 0.18,
      metalness: 0.2,
    });
    const rimMesh = new THREE.Mesh(rimGeom, this._plinthRimMat);
    this._plinthGroup.add(rimMesh);

    // Radial studio ambient glow pool on plinth surface
    const glowTex = createRadialGlowTexture(
      'rgba(34, 211, 238, 0.22)',
      'rgba(167, 139, 250, 0.09)',
      'rgba(11, 13, 18, 0.0)'
    );
    this._ownedTextures.push(glowTex);
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 5.6),
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.004;
    this._plinthGroup.add(glowPlane);

    // Etched hairline studio grid on top of the plinth
    const floorPts = [];
    for (let i = -3; i <= 3; i++) {
      floorPts.push(i, 0.005, -3, i, 0.005, 3);
      floorPts.push(-3, 0.005, i, 3, 0.005, i);
    }
    const floorGeom = new THREE.BufferGeometry();
    floorGeom.setAttribute('position', new THREE.Float32BufferAttribute(floorPts, 3));
    const floorGrid = new THREE.LineSegments(
      floorGeom,
      new THREE.LineBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    this._plinthGroup.add(floorGrid);
  }

  // --------------------------------------------------------------------------
  // 4B. Reference Cartesian Axes, Ghost Grid & Reference Unit Cube [0,1]^3
  // --------------------------------------------------------------------------

  _buildReferenceSpace() {
    // 1. Reference subtle XY Cartesian grid (helps in 2D 'front' view & 3D orientation)
    const refGridPts = [];
    for (let i = -2; i <= 2; i++) {
      refGridPts.push(i, -2, 0, i, 2, 0);
      refGridPts.push(-2, i, 0, 2, i, 0);
    }
    const refGridGeom = new THREE.BufferGeometry();
    refGridGeom.setAttribute('position', new THREE.Float32BufferAttribute(refGridPts, 3));
    const refGridLines = new THREE.LineSegments(
      refGridGeom,
      new THREE.LineBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    );
    this._referenceGroup.add(refGridLines);

    // 2. Reference subtle Cartesian axis lines (-2.4 to +2.4)
    const axisSpecs = [
      { dir: new THREE.Vector3(1, 0, 0), color: 0x38bdf8 },
      { dir: new THREE.Vector3(0, 1, 0), color: 0xfbbf24 },
      { dir: new THREE.Vector3(0, 0, 1), color: 0xc4b5fd },
    ];
    for (const spec of axisSpecs) {
      const pts = [spec.dir.clone().multiplyScalar(-2.45), spec.dir.clone().multiplyScalar(2.45)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      );
      this._referenceGroup.add(line);

      // Subtle metallic tick beads at -2, -1, 1, 2
      for (const tick of [-2, -1, 1, 2]) {
        const bead = new THREE.Mesh(this._unitSphere, this._matAnodized);
        bead.scale.setScalar(0.024);
        bead.position.copy(spec.dir).multiplyScalar(tick);
        this._referenceGroup.add(bead);
      }
    }

    // 3. Reference Unit Cube [0, 1]^3 wireframe (volume = 1 benchmark)
    const cubeEdgePts = [];
    for (const [a, b] of UNIT_CUBE_EDGES) {
      cubeEdgePts.push(...UNIT_CUBE_CORNERS[a], ...UNIT_CUBE_CORNERS[b]);
    }
    const refCubeGeom = new THREE.BufferGeometry();
    refCubeGeom.setAttribute('position', new THREE.Float32BufferAttribute(cubeEdgePts, 3));
    const refCubeWire = new THREE.LineSegments(
      refCubeGeom,
      new THREE.LineBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    this._referenceGroup.add(refCubeWire);

    // Subtle pearl vertices on the reference unit cube
    const refDotMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
    });
    for (let i = 1; i < UNIT_CUBE_CORNERS.length; i++) {
      const c = UNIT_CUBE_CORNERS[i];
      const dot = new THREE.Mesh(this._unitSphere, refDotMat);
      dot.scale.setScalar(0.022);
      dot.position.set(c[0], c[1], c[2]);
      this._referenceGroup.add(dot);
    }

    // 4. Sculpted Origin Jewel & Breathing Halo
    const originCore = new THREE.Mesh(this._unitSphere, this._matChrome);
    originCore.scale.setScalar(0.062);
    this._referenceGroup.add(originCore);

    const haloMat = new THREE.MeshBasicMaterial({
      color: COLORS.cyanLight,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._originHalo = new THREE.Mesh(this._unitTorus, haloMat);
    this._originHalo.scale.setScalar(0.11);
    this._referenceGroup.add(this._originHalo);
  }

  // --------------------------------------------------------------------------
  // 4C. Transformed 3D Warped Coordinate Space Grid
  // --------------------------------------------------------------------------

  _buildTransformedGrid() {
    // Build a clean 3D lattice in [-2, 2] x [-2, 2] x [-1, 1]
    // Main XY plane (z = 0) is brighter; outer z = +-1 planes provide crisp 3D depth
    const basePts = [];
    const colors = [];

    const cX = new THREE.Color(COLORS.cyan);
    const cY = new THREE.Color(COLORS.amber);
    const cZ = new THREE.Color(COLORS.violet);

    const pushSegment = (p0, p1, col, intensity) => {
      basePts.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
      colors.push(
        col.r * intensity,
        col.g * intensity,
        col.b * intensity,
        col.r * intensity,
        col.g * intensity,
        col.b * intensity
      );
    };

    const rangeXY = [-2, -1, 0, 1, 2];
    const rangeZ = [-1, 0, 1];

    // X-parallel & Y-parallel lines across z in {-1, 0, 1}
    for (const z of rangeZ) {
      const planeBoost = z === 0 ? 0.56 : 0.22;
      for (const y of rangeXY) {
        const boost = y === 0 && z === 0 ? 0.85 : planeBoost;
        pushSegment([-2, y, z], [2, y, z], cX, boost);
      }
      for (const x of rangeXY) {
        const boost = x === 0 && z === 0 ? 0.85 : planeBoost;
        pushSegment([x, -2, z], [x, 2, z], cY, boost);
      }
    }

    // Z-parallel vertical columns on inner lattice points x, y in {-1, 0, 1}
    for (const x of [-1, 0, 1]) {
      for (const y of [-1, 0, 1]) {
        const boost = x === 0 && y === 0 ? 0.78 : 0.26;
        pushSegment([x, y, -1], [x, y, 1], cZ, boost);
      }
    }

    this._gridBasePoints = new Float32Array(basePts);
    const dynamicPos = new Float32Array(basePts.length);
    const geom = new THREE.BufferGeometry();
    this._gridPosAttr = new THREE.BufferAttribute(dynamicPos, 3);
    geom.setAttribute('position', this._gridPosAttr);
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(geom, mat);
    lines.frustumCulled = false;
    this._gridGroup.add(lines);
  }

  // --------------------------------------------------------------------------
  // 4D. Transformed Unit Parallelepiped (Volume = |det A(t)|)
  // --------------------------------------------------------------------------

  _buildParallelepiped() {
    // 1. Glossy translucent physical volume (6 quads = 12 triangles = 36 vertices)
    const faceGeom = new THREE.BufferGeometry();
    this._paraFacePosAttr = new THREE.BufferAttribute(new Float32Array(36 * 3), 3);
    faceGeom.setAttribute('position', this._paraFacePosAttr);

    this._paraFaceMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.emerald,
      emissive: COLORS.emerald,
      emissiveIntensity: 0.28,
      roughness: 0.14,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.5,
    });

    const faceMesh = new THREE.Mesh(faceGeom, this._paraFaceMat);
    faceMesh.frustumCulled = false;
    this._parallelepipedGroup.add(faceMesh);

    // 2. Crisp glowing wireframe edges (12 edges = 24 vertices)
    const edgeGeom = new THREE.BufferGeometry();
    this._paraEdgePosAttr = new THREE.BufferAttribute(new Float32Array(24 * 3), 3);
    edgeGeom.setAttribute('position', this._paraEdgePosAttr);

    this._paraEdgeMat = new THREE.LineBasicMaterial({
      color: COLORS.emeraldLight,
      transparent: true,
      opacity: 0.95,
    });

    const edgeLines = new THREE.LineSegments(edgeGeom, this._paraEdgeMat);
    edgeLines.frustumCulled = false;
    this._parallelepipedGroup.add(edgeLines);

    // 3. Glowing corner nodes at the 7 non-origin vertices of A(t)[0,1]^3
    this._paraCornerMat = new THREE.MeshStandardMaterial({
      color: COLORS.emeraldLight,
      emissive: COLORS.emerald,
      emissiveIntensity: 1.25,
      roughness: 0.15,
      metalness: 0.2,
    });

    this._paraCornerDots = [];
    for (let i = 0; i < 8; i++) {
      const dot = new THREE.Mesh(this._unitSphere, this._paraCornerMat);
      dot.scale.setScalar(i === 6 ? 0.044 : 0.03);
      dot.visible = i !== 0; // origin already has chrome jewel
      this._parallelepipedGroup.add(dot);
      this._paraCornerDots.push(dot);
    }
  }

  // --------------------------------------------------------------------------
  // 4E. Sculpted Glowing Basis Vectors (i' Cyan, j' Amber, k' Violet)
  // --------------------------------------------------------------------------

  _createSculptedArrow(material, shaftRadius = 0.032, headRadius = 0.088, headLength = 0.24) {
    const group = new THREE.Group();

    const shaft = new THREE.Mesh(this._unitCylinder, material);
    const head = new THREE.Mesh(this._unitCone, material);
    const tipOrb = new THREE.Mesh(this._unitSphere, material);
    const collar = new THREE.Mesh(this._unitTorus, material);

    group.add(shaft, head, tipOrb, collar);

    return {
      group,
      shaft,
      head,
      tipOrb,
      collar,
      shaftRadius,
      headRadius,
      headLength,
    };
  }

  _updateSculptedArrow(rig, endVec, startVec = null) {
    const sx = startVec ? startVec[0] : 0;
    const sy = startVec ? startVec[1] : 0;
    const sz = startVec ? startVec[2] : 0;

    _tmpV0.set(sx, sy, sz);
    _tmpV1.set(endVec[0], endVec[1], endVec[2]);
    _tmpDelta.subVectors(_tmpV1, _tmpV0);
    const len = _tmpDelta.length();

    if (!Number.isFinite(len) || len < 0.025) {
      // Collapsed vector (e.g., k' -> 0 in rank-2 singularity): show pulsing dot at start
      rig.shaft.visible = false;
      rig.head.visible = false;
      rig.collar.visible = false;
      rig.tipOrb.visible = true;
      rig.tipOrb.position.copy(_tmpV0);
      rig.tipOrb.scale.setScalar(rig.shaftRadius * 2.1);
      return;
    }

    _tmpDir.copy(_tmpDelta).divideScalar(len);
    _tmpQuat.setFromUnitVectors(UP_VEC, _tmpDir);

    const headLen = Math.min(rig.headLength, len * 0.42);
    const headRad = rig.headRadius * Math.min(1, len / 0.45);
    const shaftLen = Math.max(len - headLen, 0.001);

    // Shaft from start to base of cone
    _tmpV2.copy(_tmpV0).addScaledVector(_tmpDir, shaftLen);
    alignCylinderBetween(rig.shaft, _tmpV0, _tmpV2, rig.shaftRadius);

    // Arrowhead cone
    rig.head.visible = true;
    rig.head.position.copy(_tmpV0).addScaledVector(_tmpDir, shaftLen + headLen * 0.5);
    rig.head.quaternion.copy(_tmpQuat);
    rig.head.scale.set(headRad, headLen, headRad);

    // Subtle floating tip pearl
    rig.tipOrb.visible = true;
    rig.tipOrb.position.copy(_tmpV1).addScaledVector(_tmpDir, 0.045);
    rig.tipOrb.scale.setScalar(rig.shaftRadius * 1.05);

    // Precision collar ring at base of arrowhead
    rig.collar.visible = len > 0.35;
    rig.collar.position.copy(_tmpV2);
    rig.collar.quaternion.copy(_tmpQuat);
    rig.collar.rotateX(Math.PI / 2);
    rig.collar.scale.setScalar(rig.shaftRadius * 1.75);
  }

  _buildBasisVectors() {
    const mats = [this._matBasisI, this._matBasisJ, this._matBasisK];
    this._basisArrows = mats.map((mat) => {
      const rig = this._createSculptedArrow(mat, 0.032, 0.09, 0.25);
      this._basisGroup.add(rig.group);
      return rig;
    });
  }

  // --------------------------------------------------------------------------
  // 4F. Toggleable Eigenvector Spans + Non-Eigenvector Contrast Probe
  // --------------------------------------------------------------------------

  _buildEigenspaceAndProbe() {
    this._eigenSlots = [];
    for (let i = 0; i < 3; i++) {
      const slotGroup = new THREE.Group();

      // Infinite-style luminous Emerald laser beam + soft additive aura
      const beam = new THREE.Mesh(this._unitCylinder, this._matEigenBeam);
      const aura = new THREE.Mesh(this._unitCylinder, this._matEigenHalo);

      // Reference unit marker ring at +1.0 * v so you visually measure stretch lambda
      const unitRing = new THREE.Mesh(this._unitTorus, this._matEigenBeam);

      // Sculpted eigenvector arrow A(t) * v staying dead-locked on its laser
      const arrow = this._createSculptedArrow(this._matEigenArrow, 0.024, 0.074, 0.21);

      slotGroup.add(beam, aura, unitRing, arrow.group);
      this._eigenGroup.add(slotGroup);

      this._eigenSlots.push({
        group: slotGroup,
        beam,
        aura,
        unitRing,
        arrow,
      });
    }

    // Non-eigenvector contrast probe: dashed original ray + silver arrow + translucent deflection fan
    const probeGroup = new THREE.Group();

    const dashedGeom = new THREE.BufferGeometry();
    const dashedPosAttr = new THREE.BufferAttribute(new Float32Array(6), 3);
    dashedGeom.setAttribute('position', dashedPosAttr);
    const dashedMat = new THREE.LineDashedMaterial({
      color: COLORS.probeSilver,
      dashSize: 0.14,
      gapSize: 0.09,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const dashedLine = new THREE.Line(dashedGeom, dashedMat);
    dashedLine.frustumCulled = false;

    // Translucent swept angular deflection fan between original ray p and transformed A(t)*p
    const fanSegments = 16;
    const fanGeom = new THREE.BufferGeometry();
    const fanPosAttr = new THREE.BufferAttribute(new Float32Array(fanSegments * 3 * 3), 3);
    fanGeom.setAttribute('position', fanPosAttr);
    const fanMat = new THREE.MeshBasicMaterial({
      color: COLORS.probeSilver,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fanMesh = new THREE.Mesh(fanGeom, fanMat);
    fanMesh.frustumCulled = false;

    const arrow = this._createSculptedArrow(this._matProbeArrow, 0.022, 0.068, 0.19);
    // Start-point pearl marker at +1.0 * p on the dashed reference line
    const refMarker = new THREE.Mesh(
      this._unitSphere,
      new THREE.MeshBasicMaterial({
        color: COLORS.probeSilver,
        transparent: true,
        opacity: 0.65,
      })
    );
    refMarker.scale.setScalar(0.032);

    probeGroup.add(dashedLine, fanMesh, refMarker, arrow.group);
    this._eigenGroup.add(probeGroup);

    this._probeRig = {
      group: probeGroup,
      dashedLine,
      dashedPosAttr,
      fanMesh,
      fanPosAttr,
      fanSegments,
      refMarker,
      arrow,
    };
  }

  // --------------------------------------------------------------------------
  // 4G. Mechatronics Lens: Transformed Principal Ellipsoid + Robotic Pose Gimbal
  // --------------------------------------------------------------------------

  _buildMechatronicsLens() {
    // 1. Translucent iridescent glass ellipsoid (unit sphere S^2 mapped by A(t))
    const sphereGeom = new THREE.SphereGeometry(1, 32, 22);
    const basePos = sphereGeom.attributes.position.array;
    this._ellipsoidBasePos = new Float32Array(basePos.length);
    this._ellipsoidBasePos.set(basePos);
    this._ellipsoidGeom = sphereGeom;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.42,
      thickness: 0.35,
      ior: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.6,
    });
    const ellipsoidMesh = new THREE.Mesh(sphereGeom, glassMat);
    ellipsoidMesh.frustumCulled = false;
    this._mechatronicsGroup.add(ellipsoidMesh);

    // 2. Subtle latitude/longitude geodesic wireframe on S^2 mapped by A(t)
    const wireBase = [];
    const latSteps = 36;
    for (const latDeg of [-45, 0, 45]) {
      const phi = (latDeg * Math.PI) / 180;
      const r = Math.cos(phi);
      const y = Math.sin(phi);
      for (let i = 0; i < latSteps; i++) {
        const a0 = (i / latSteps) * Math.PI * 2;
        const a1 = ((i + 1) / latSteps) * Math.PI * 2;
        wireBase.push(
          Math.cos(a0) * r,
          y,
          Math.sin(a0) * r,
          Math.cos(a1) * r,
          y,
          Math.sin(a1) * r
        );
      }
    }
    for (let m = 0; m < 6; m++) {
      const theta = (m / 6) * Math.PI;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);
      for (let i = 0; i < latSteps; i++) {
        const a0 = (i / latSteps) * Math.PI * 2;
        const a1 = ((i + 1) / latSteps) * Math.PI * 2;
        wireBase.push(
          Math.cos(a0) * ct,
          Math.sin(a0),
          Math.cos(a0) * st,
          Math.cos(a1) * ct,
          Math.sin(a1),
          Math.cos(a1) * st
        );
      }
    }
    this._ellipsoidWireBasePos = new Float32Array(wireBase);
    const wireGeom = new THREE.BufferGeometry();
    this._ellipsoidWirePosAttr = new THREE.BufferAttribute(new Float32Array(wireBase.length), 3);
    wireGeom.setAttribute('position', this._ellipsoidWirePosAttr);
    const wireLines = new THREE.LineSegments(
      wireGeom,
      new THREE.LineBasicMaterial({
        color: COLORS.cyanLight,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    wireLines.frustumCulled = false;
    this._mechatronicsGroup.add(wireLines);

    // 3. Three luminous orthogonal principal meridian rings mapped by A(t)
    const ringConfigs = [
      { plane: 'xy', color: COLORS.cyanLight },
      { plane: 'yz', color: COLORS.amberLight },
      { plane: 'xz', color: COLORS.violetLight },
    ];
    this._ellipsoidRings = ringConfigs.map((cfg) => {
      const segs = 72;
      const base = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        if (cfg.plane === 'xy') {
          base[i * 3] = c;
          base[i * 3 + 1] = s;
          base[i * 3 + 2] = 0;
        } else if (cfg.plane === 'yz') {
          base[i * 3] = 0;
          base[i * 3 + 1] = c;
          base[i * 3 + 2] = s;
        } else {
          base[i * 3] = c;
          base[i * 3 + 1] = 0;
          base[i * 3 + 2] = s;
        }
      }
      const geom = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(new Float32Array(base.length), 3);
      geom.setAttribute('position', posAttr);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.85,
        })
      );
      line.frustumCulled = false;
      this._mechatronicsGroup.add(line);
      return { base, posAttr };
    });

    // 4. Precision Robotic Pose Gimbal Collar at the Origin
    this._gimbalPivot = new THREE.Group();

    const outerRingGeom = new THREE.TorusGeometry(0.32, 0.018, 14, 48);
    const outerRing = new THREE.Mesh(outerRingGeom, this._matAnodized);
    this._gimbalPivot.add(outerRing);

    const glowTrackGeom = new THREE.TorusGeometry(0.32, 0.007, 10, 48);
    const glowTrack = new THREE.Mesh(
      glowTrackGeom,
      new THREE.MeshStandardMaterial({
        color: COLORS.cyanLight,
        emissive: COLORS.cyan,
        emissiveIntensity: 1.25,
        roughness: 0.2,
      })
    );
    this._gimbalPivot.add(glowTrack);

    const innerRingGeom = new THREE.TorusGeometry(0.24, 0.014, 14, 44);
    this._gimbalInnerRing = new THREE.Mesh(innerRingGeom, this._matChrome);
    this._gimbalInnerRing.rotation.x = Math.PI / 2;
    this._gimbalPivot.add(this._gimbalInnerRing);

    // 4 machined encoder pips around the outer gimbal collar
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const pip = new THREE.Mesh(this._unitSphere, this._matBasisI);
      pip.scale.setScalar(0.022);
      pip.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0);
      this._gimbalPivot.add(pip);
    }

    this._mechatronicsGroup.add(this._gimbalPivot);
  }

  // --------------------------------------------------------------------------
  // 5. LIVE IN-PLACE GEOMETRY SYNCHRONIZATION (ZERO ALLOCATIONS)
  // --------------------------------------------------------------------------

  _updateSceneGeometry() {
    if (!this._gridPosAttr) return;

    const targetM = this._getTargetMatrix();
    const morphedM = this._getMorphedMatrix(this.morph);
    const analysis = analyzeMatrix3x3(targetM);
    const liveDet = det3x3(morphedM);

    // 1. Update Transformed 3D Warped Coordinate Grid
    const gBase = this._gridBasePoints;
    const gOut = this._gridPosAttr.array;
    const m00 = morphedM[0][0],
      m01 = morphedM[0][1],
      m02 = morphedM[0][2];
    const m10 = morphedM[1][0],
      m11 = morphedM[1][1],
      m12 = morphedM[1][2];
    const m20 = morphedM[2][0],
      m21 = morphedM[2][1],
      m22 = morphedM[2][2];

    for (let i = 0; i < gBase.length; i += 3) {
      const x = gBase[i];
      const y = gBase[i + 1];
      const z = gBase[i + 2];
      gOut[i] = m00 * x + m01 * y + m02 * z;
      gOut[i + 1] = m10 * x + m11 * y + m12 * z;
      gOut[i + 2] = m20 * x + m21 * y + m22 * z;
    }
    this._gridPosAttr.needsUpdate = true;

    // 2. Update Transformed Unit Parallelepiped Corners, Faces, Edges & Determinant Color
    const corners = UNIT_CUBE_CORNERS.map((c) => mat3Vec3(morphedM, c));

    // Faces (6 quads -> 12 triangles -> 36 vertices)
    const fArr = this._paraFacePosAttr.array;
    let fPtr = 0;
    for (const [i0, i1, i2, i3] of UNIT_CUBE_FACE_QUADS) {
      const p0 = corners[i0],
        p1 = corners[i1],
        p2 = corners[i2],
        p3 = corners[i3];
      // Triangle 1: p0, p1, p2
      fArr[fPtr++] = p0[0];
      fArr[fPtr++] = p0[1];
      fArr[fPtr++] = p0[2];
      fArr[fPtr++] = p1[0];
      fArr[fPtr++] = p1[1];
      fArr[fPtr++] = p1[2];
      fArr[fPtr++] = p2[0];
      fArr[fPtr++] = p2[1];
      fArr[fPtr++] = p2[2];
      // Triangle 2: p0, p2, p3
      fArr[fPtr++] = p0[0];
      fArr[fPtr++] = p0[1];
      fArr[fPtr++] = p0[2];
      fArr[fPtr++] = p2[0];
      fArr[fPtr++] = p2[1];
      fArr[fPtr++] = p2[2];
      fArr[fPtr++] = p3[0];
      fArr[fPtr++] = p3[1];
      fArr[fPtr++] = p3[2];
    }
    this._paraFacePosAttr.needsUpdate = true;
    this._parallelepipedGroup.children[0].geometry.computeVertexNormals();

    // Edges (12 edges -> 24 vertices)
    const eArr = this._paraEdgePosAttr.array;
    let ePtr = 0;
    for (const [a, b] of UNIT_CUBE_EDGES) {
      const pa = corners[a];
      const pb = corners[b];
      eArr[ePtr++] = pa[0];
      eArr[ePtr++] = pa[1];
      eArr[ePtr++] = pa[2];
      eArr[ePtr++] = pb[0];
      eArr[ePtr++] = pb[1];
      eArr[ePtr++] = pb[2];
    }
    this._paraEdgePosAttr.needsUpdate = true;

    // Corner dots
    for (let i = 1; i < 8; i++) {
      const c = corners[i];
      this._paraCornerDots[i].position.set(c[0], c[1], c[2]);
    }

    // Color-code parallelepiped by live determinant det(A(t)):
    // Emerald (det > 0.02), Coral (det < -0.02), Amber/Flat (|det| <= 0.02)
    let primaryHex = COLORS.emerald;
    let lightHex = COLORS.emeraldLight;
    let faceOpacity = 0.3;
    if (Math.abs(liveDet) < 0.02) {
      primaryHex = COLORS.amber;
      lightHex = COLORS.amberLight;
      faceOpacity = 0.42;
    } else if (liveDet < 0) {
      primaryHex = COLORS.coral;
      lightHex = COLORS.coralLight;
      faceOpacity = 0.34;
    }

    this._paraFaceMat.color.setHex(primaryHex);
    this._paraFaceMat.emissive.setHex(primaryHex);
    this._paraFaceMat.opacity = faceOpacity;
    this._paraEdgeMat.color.setHex(lightHex);
    this._paraCornerMat.color.setHex(lightHex);
    this._paraCornerMat.emissive.setHex(primaryHex);

    // 3. Update 3 Sculpted Basis Vectors: columns of morphedM
    this._updateSculptedArrow(this._basisArrows[0], [m00, m10, m20]);
    this._updateSculptedArrow(this._basisArrows[1], [m01, m11, m21]);
    this._updateSculptedArrow(this._basisArrows[2], [m02, m12, m22]);

    // 4. Update Eigenvector Spans + Non-Eigenvector Contrast Probe
    const eigVecs = analysis.realEigenvectors;
    for (let i = 0; i < 3; i++) {
      const slot = this._eigenSlots[i];
      if (i < eigVecs.length) {
        slot.group.visible = true;
        const v = eigVecs[i].vec;

        // Infinite-style Emerald laser span through origin [-3.0, +3.0]
        _tmpV0.set(-v[0] * 3.05, -v[1] * 3.05, -v[2] * 3.05);
        _tmpV1.set(v[0] * 3.05, v[1] * 3.05, v[2] * 3.05);
        alignCylinderBetween(slot.beam, _tmpV0, _tmpV1, 0.011);
        alignCylinderBetween(slot.aura, _tmpV0, _tmpV1, 0.036);

        // Unit marker ring at +1.0 * v
        _tmpDir.set(v[0], v[1], v[2]).normalize();
        _tmpQuat.setFromUnitVectors(UP_VEC, _tmpDir);
        slot.unitRing.position.copy(_tmpDir);
        slot.unitRing.quaternion.copy(_tmpQuat);
        slot.unitRing.rotateX(Math.PI / 2);
        slot.unitRing.scale.setScalar(0.068);

        // Morphed eigenvector arrow A(t) * v (slides strictly along laser!)
        const mappedV = mat3Vec3(morphedM, v);
        this._updateSculptedArrow(slot.arrow, mappedV);
      } else {
        slot.group.visible = false;
      }
    }

    // Non-eigenvector contrast probe
    const probeDir = pickNonEigenvectorProbe(targetM);
    if (probeDir) {
      this._probeRig.group.visible = true;
      const mappedP = mat3Vec3(morphedM, probeDir);

      // Dashed reference line along original direction p (0 -> 2.35 * p)
      const dArr = this._probeRig.dashedPosAttr.array;
      dArr[0] = 0;
      dArr[1] = 0;
      dArr[2] = 0;
      dArr[3] = probeDir[0] * 2.35;
      dArr[4] = probeDir[1] * 2.35;
      dArr[5] = probeDir[2] * 2.35;
      this._probeRig.dashedPosAttr.needsUpdate = true;
      this._probeRig.dashedLine.computeLineDistances();

      // Unit reference pearl marker at +1.0 * p
      this._probeRig.refMarker.position.set(probeDir[0], probeDir[1], probeDir[2]);

      // Sculpted silver arrow pointing to A(t)*p
      this._updateSculptedArrow(this._probeRig.arrow, mappedP);

      // Swept deflection fan between p (scaled to ||A(t)p||) and A(t)*p
      const normMapped = Math.hypot(mappedP[0], mappedP[1], mappedP[2]);
      const fanArr = this._probeRig.fanPosAttr.array;
      const segs = this._probeRig.fanSegments;

      if (normMapped > 0.05) {
        const u0x = probeDir[0],
          u0y = probeDir[1],
          u0z = probeDir[2];
        const u1x = mappedP[0] / normMapped,
          u1y = mappedP[1] / normMapped,
          u1z = mappedP[2] / normMapped;
        const dot = clamp(u0x * u1x + u0y * u1y + u0z * u1z, -1, 1);
        const angle = Math.acos(dot);

        if (angle > 0.015) {
          this._probeRig.fanMesh.visible = true;
          const rFan = Math.min(normMapped, 1.85);
          let ptr = 0;
          for (let s = 0; s < segs; s++) {
            const f0 = s / segs;
            const f1 = (s + 1) / segs;

            // Slerp along unit directions u0 -> u1
            const sinA = Math.sin(angle);
            const w0a = Math.sin((1 - f0) * angle) / sinA;
            const w1a = Math.sin(f0 * angle) / sinA;
            const w0b = Math.sin((1 - f1) * angle) / sinA;
            const w1b = Math.sin(f1 * angle) / sinA;

            // Origin
            fanArr[ptr++] = 0;
            fanArr[ptr++] = 0;
            fanArr[ptr++] = 0;
            // Arc point a
            fanArr[ptr++] = (w0a * u0x + w1a * u1x) * rFan;
            fanArr[ptr++] = (w0a * u0y + w1a * u1y) * rFan;
            fanArr[ptr++] = (w0a * u0z + w1a * u1z) * rFan;
            // Arc point b
            fanArr[ptr++] = (w0b * u0x + w1b * u1x) * rFan;
            fanArr[ptr++] = (w0b * u0y + w1b * u1y) * rFan;
            fanArr[ptr++] = (w0b * u0z + w1b * u1z) * rFan;
          }
          this._probeRig.fanPosAttr.needsUpdate = true;
        } else {
          this._probeRig.fanMesh.visible = false;
        }
      } else {
        this._probeRig.fanMesh.visible = false;
      }
    } else {
      this._probeRig.group.visible = false;
    }

    // 5. Update Mechatronics Lens (Principal Ellipsoid A(t)*S^2 & Pose Gimbal)
    if (this._ellipsoidBasePos && this._ellipsoidGeom) {
      const sBase = this._ellipsoidBasePos;
      const sPosAttr = this._ellipsoidGeom.attributes.position;
      const sOut = sPosAttr.array;
      for (let i = 0; i < sBase.length; i += 3) {
        const x = sBase[i];
        const y = sBase[i + 1];
        const z = sBase[i + 2];
        sOut[i] = m00 * x + m01 * y + m02 * z;
        sOut[i + 1] = m10 * x + m11 * y + m12 * z;
        sOut[i + 2] = m20 * x + m21 * y + m22 * z;
      }
      sPosAttr.needsUpdate = true;
      this._ellipsoidGeom.computeVertexNormals();

      // Update ellipsoid geodesic wireframe
      const wBase = this._ellipsoidWireBasePos;
      const wOut = this._ellipsoidWirePosAttr.array;
      for (let i = 0; i < wBase.length; i += 3) {
        const x = wBase[i];
        const y = wBase[i + 1];
        const z = wBase[i + 2];
        wOut[i] = m00 * x + m01 * y + m02 * z;
        wOut[i + 1] = m10 * x + m11 * y + m12 * z;
        wOut[i + 2] = m20 * x + m21 * y + m22 * z;
      }
      this._ellipsoidWirePosAttr.needsUpdate = true;

      // Update 3 luminous meridian rings
      for (const ring of this._ellipsoidRings) {
        const rBase = ring.base;
        const rOut = ring.posAttr.array;
        for (let i = 0; i < rBase.length; i += 3) {
          const x = rBase[i];
          const y = rBase[i + 1];
          const z = rBase[i + 2];
          rOut[i] = m00 * x + m01 * y + m02 * z;
          rOut[i + 1] = m10 * x + m11 * y + m12 * z;
          rOut[i + 2] = m20 * x + m21 * y + m22 * z;
        }
        ring.posAttr.needsUpdate = true;
      }

      // Align robotic pose gimbal yaw with transformed i' projection in XY
      if (this._gimbalPivot) {
        const yawAngle = Math.atan2(m10, m00);
        this._gimbalPivot.rotation.z = Number.isFinite(yawAngle) ? yawAngle : 0;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. CAMERA PRESETS (3D Studio / Front 2D XY / Isometric)
  // --------------------------------------------------------------------------

  _getCameraPose(preset) {
    const aspect = this.camera ? this.camera.aspect : 1.5;
    const distScale = aspect < 0.85 ? 1.28 : aspect < 1.15 ? 1.1 : 1.0;

    switch (preset) {
      case 'front':
        return {
          pos: new THREE.Vector3(0.15, 0.15, 8.6 * distScale),
          target: new THREE.Vector3(0.15, 0.15, 0),
        };
      case 'iso':
        return {
          pos: new THREE.Vector3(4.9 * distScale, 4.4 * distScale, 4.9 * distScale),
          target: new THREE.Vector3(0.25, 0.15, 0.2),
        };
      case '3d':
      default:
        return {
          pos: new THREE.Vector3(3.85 * distScale, 2.75 * distScale, 6.25 * distScale),
          target: new THREE.Vector3(0.2, 0.12, 0.1),
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
  // 7. PUBLIC API
  // --------------------------------------------------------------------------

  setPreset(presetId) {
    if (!LINALG_PRESETS[presetId]) return this.getTelemetry();
    this._cancelMorphAnimation();

    this.presetId = presetId;
    this.param = LINALG_PRESETS[presetId].defaultParam;

    if (this._initialized) {
      this._updateSceneGeometry();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setMorph(t) {
    const num = Number(t);
    if (!Number.isFinite(num)) return this.getTelemetry();
    this._cancelMorphAnimation();

    this.morph = clamp(num, 0, 1);
    if (this._initialized) {
      this._updateSceneGeometry();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setParam(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return this.getTelemetry();
    const preset = this._getPreset();
    this.param = clamp(num, preset.paramMin, preset.paramMax);

    if (this._initialized) {
      this._updateSceneGeometry();
    }

    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleEigen(bool) {
    this.showEigen = Boolean(bool);
    if (this._eigenGroup) {
      this._eigenGroup.visible = this.showEigen;
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  toggleMechatronicsLens(bool) {
    this.mechatronicsLens = Boolean(bool);
    if (this._mechatronicsGroup) {
      this._mechatronicsGroup.visible = this.mechatronicsLens;
    }
    const telemetry = this.getTelemetry();
    this._emitTelemetry(telemetry);
    return telemetry;
  }

  setCameraPreset(preset) {
    const valid = preset === 'front' || preset === 'iso' ? preset : '3d';
    this.cameraPreset = valid;
    if (!this._initialized || !this.camera || !this.controls) return;

    const to = this._getCameraPose(valid);
    this._camTransition = {
      startTime: performance.now(),
      duration: 740,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
    };
  }

  /**
   * Smoothly animate morph 0 -> 1 over ~2.2s with smooth easing
   * (or 1 -> 0 -> 1 if already at 1), emitting telemetry each frame and calling onDone when finished.
   */
  animateTransform(onDone) {
    this._cancelMorphAnimation();

    const roundTrip = this.morph >= 0.98;
    const startMorph = this.morph;

    this._morphAnim = {
      startTime: performance.now(),
      duration: 2200,
      roundTrip,
      startMorph,
      onDone: typeof onDone === 'function' ? onDone : null,
    };

    if (!roundTrip) {
      this.morph = 0;
      if (this._initialized) {
        this._updateSceneGeometry();
      }
      this._emitTelemetry();
    }

    return () => this._cancelMorphAnimation();
  }

  _cancelMorphAnimation() {
    this._morphAnim = null;
  }

  getTelemetry() {
    const preset = this._getPreset();
    const M = preset.matrixAt(this.param);
    const analysis = analyzeMatrix3x3(M);
    const morphedDet = det3x3(this._getMorphedMatrix(this.morph));

    return {
      presetId: preset.id,
      label: preset.label,
      mechatronicsLabel: preset.mechatronicsLabel,
      morph: this.morph,
      param: this.param,
      paramLabel: preset.paramLabel,
      paramMin: preset.paramMin,
      paramMax: preset.paramMax,
      paramStep: preset.paramStep,
      paramUnit: preset.paramUnit || '',
      det: analysis.det,
      morphedDet,
      trace: analysis.trace,
      rank: analysis.rank,
      isSingular: analysis.isSingular,
      orientation: analysis.orientation,
      eigenvalues: analysis.eigenvalues,
      realEigenvectors: analysis.realEigenvectors,
      matrixLatex: analysis.matrixLatex,
      eigenLatex: analysis.eigenLatex,
      showEigen: this.showEigen,
      mechatronicsLens: this.mechatronicsLens,
    };
  }

  _emitTelemetry(telemetry = this.getTelemetry()) {
    if (this.onTelemetry) {
      this.onTelemetry(telemetry);
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
  // 8. ANIMATION LOOP (60FPS)
  // --------------------------------------------------------------------------

  _animate() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._onAnimate);

    const now = performance.now();
    const elapsed = this._clock.getElapsedTime();

    // 1. Live morph transform animation (0 -> 1 or 1 -> 0 -> 1 over ~2.2s)
    if (this._morphAnim) {
      const anim = this._morphAnim;
      const u = clamp((now - anim.startTime) / anim.duration, 0, 1);

      if (anim.roundTrip) {
        if (u < 0.34) {
          this.morph = anim.startMorph * (1 - easeInOutCubic(u / 0.34));
        } else if (u < 0.42) {
          this.morph = 0;
        } else {
          this.morph = easeInOutCubic((u - 0.42) / 0.58);
        }
      } else {
        this.morph = easeInOutCubic(u);
      }

      if (u >= 1) {
        this.morph = 1;
      }

      this._updateSceneGeometry();
      this._emitTelemetry();

      if (u >= 1) {
        const doneCb = anim.onDone;
        this._morphAnim = null;
        if (doneCb) doneCb();
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

    // 3. Living Spline micro-animations (studio rim breathing, origin halo, gimbal pulse)
    if (this._plinthRimMat) {
      this._plinthRimMat.emissiveIntensity = 1.08 + Math.sin(elapsed * 1.7) * 0.14;
    }

    if (this._originHalo) {
      this._originHalo.rotation.z = elapsed * 0.8;
      this._originHalo.rotation.x = Math.sin(elapsed * 1.2) * 0.55;
      this._originHalo.scale.setScalar(0.105 + Math.sin(elapsed * 2.8) * 0.008);
    }

    if (this._gimbalInnerRing && this.mechatronicsLens) {
      this._gimbalInnerRing.rotation.y = elapsed * 0.9;
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
  // 9. FULL GPU & DOM RESOURCE CLEANUP (ZERO WEBGL LEAKS)
  // --------------------------------------------------------------------------

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._initialized = false;
    this._camTransition = null;
    this._morphAnim = null;

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

/**
 * EIGENLAB — Lab F2.1: Switching Power (Buck), Parasitic L/C & PDN Ripple
 * Live 60 FPS dead-front synchronous buck converter schematic + synchronized
 * 3-channel mixed-signal oscilloscope visualizing MOSFET switching-loop
 * parasitic LC ringing, inductor current ripple (CCM/DCM), output voltage
 * switching ripple, and dynamic GPU/actuator load-step PDN droop.
 *
 * Native ES Module (zero external dependencies).
 */

const COLORS = Object.freeze({
  bg: '#0A0C10',
  panel: '#12151C',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  gridMajor: 'rgba(255, 255, 255, 0.055)',
  gridMinor: 'rgba(255, 255, 255, 0.022)',
  wireIdle: 'rgba(139, 151, 176, 0.36)',
  wireActive: 'rgba(226, 234, 248, 0.78)',
  emerald: '#00E676',
  emeraldRgb: '0, 230, 118',
  cyan: '#00E5FF',
  cyanRgb: '0, 229, 255',
  amber: '#FFB300',
  amberRgb: '255, 179, 0',
  crimson: '#FF1744',
  crimsonRgb: '255, 23, 68',
  violet: '#A78BFA',
  violetRgb: '167, 139, 250',
  textPrimary: '#F3F6FC',
  textMuted: '#8B97B0',
  textDim: 'rgba(165, 176, 199, 0.55)',
});

export const POWER_CONSTANTS = Object.freeze({
  vIn: 24.0,           // 24 V battery / robot DC bus
  fSwHz: 200_000,      // 200 kHz synchronous buck switching frequency
  cOssF: 450e-12,      // 450 pF MOSFET output capacitance
  rParOhm: 2.4,        // 2.4 Ω high-frequency switching loop AC damping resistance
  tRiseS: 28e-9,       // 28 ns gate-drive switching rise time
  tCommS: 135e-9,      // 135 ns inductive commutation kick time constant
  iBaseA: 1.6,         // 1.6 A idle quiescent bus current
  esrMinOhm: 0.0025,   // 2.5 mΩ low-ESR polymer/MLCC floor
  esrKOhmUf: 1.6,      // ESR(C_out) = 2.5 mΩ + 1600 mΩ·µF / C_out(µF)
  kzLoop: 0.062,       // Closed-loop current-mode PDN impedance scaling on sqrt(L/C_out)
  kParOhmPerNh: 0.0004,// High-di/dt parasitic bus impedance contribution
  vDsLimitV: 36.0,     // 36 V MOSFET V_DS overvoltage limit
  brownoutFrac: 0.08,  // >8% rail dip below target triggers BROWNOUT!
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function finiteOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Pure analytical synchronous buck converter + parasitic ringing + PDN droop solver.
 * Guarantees exact steady-state & transient electrical metrics with zero NaNs
 * across the entire parameter domain.
 *
 * @param {object} rawParams
 * @returns {object} Computed steady-state, ringing, and load-step metrics
 */
export function computeBuckMetrics(rawParams = {}) {
  const C = POWER_CONSTANTS;

  const duty = clamp(finiteOr(rawParams.duty, 0.5), 0.15, 0.8);
  const inductanceUh = clamp(finiteOr(rawParams.inductanceUh, 22), 4, 68);
  const cOutUf = clamp(finiteOr(rawParams.cOutUf, 120), 15, 330);
  const lParNh = clamp(finiteOr(rawParams.lParNh, 10), 2, 50);
  const loadStepA = clamp(finiteOr(rawParams.loadStepA, 6), 0, 28);

  const vIn = C.vIn;
  const vOut = duty * vIn;
  const lH = inductanceUh * 1e-6;
  const cOutF = cOutUf * 1e-6;
  const lParH = lParNh * 1e-9;

  // Exact buck inductor current ripple: ΔI_L = (V_in - V_out) * D / (f_sw * L)
  const deltaI = ((vIn - vOut) * duty) / (C.fSwHz * lH);

  // Conduction mode (CCM vs DCM) evaluated at quiescent idle load
  const iQuiescent = C.iBaseA;
  const iPeakLoad = C.iBaseA + loadStepA;
  const iValleyBase = iQuiescent - 0.5 * deltaI;
  const isDcm = iValleyBase <= 0;
  // Active conduction fraction in DCM (equals 1 at BCM boundary and in CCM)
  const dcmScale = isDcm ? Math.sqrt(Math.max(0, (2 * iQuiescent) / Math.max(deltaI, 1e-9))) : 1.0;

  // Parasitic switching-loop LC ringing: f_ring = 1 / (2π √(L_par * C_oss))
  const omegaR = 1.0 / Math.sqrt(lParH * C.cOssF);
  const fRingHz = omegaR / (2.0 * Math.PI);
  const fRingMhz = fRingHz * 1e-6;
  const z0Par = Math.sqrt(lParH / C.cOssF);
  const zeta = clamp(C.rParOhm / (2.0 * z0Par), 0.06, 0.85);

  // Finite rise-time excitation + inductive commutation energy kick
  const edgeRatio = fRingHz * C.tRiseS;
  const aEdge = 1.0 / Math.sqrt(1.0 + edgeRatio * edgeRatio);
  const kKick = (lParH * iPeakLoad) / (C.tCommS * vIn);
  const aRing = aEdge + kKick;

  // Exact analytical peak of e^(-zeta * u) * sin(u) occurs at u* = atan(1 / zeta)
  const uPeak = Math.atan(1.0 / zeta);
  const mPeak = (1.0 / Math.sqrt(1.0 + zeta * zeta)) * Math.exp(-zeta * uPeak);
  const vSwPeak = vIn * (1.0 + aRing * mPeak);
  const vSwOvershootV = vSwPeak - vIn;
  const isOvervoltage = vSwPeak > C.vDsLimitV;

  // Output bulk capacitor ESR & exact switching ripple: ΔV_pp = ΔI_L * (ESR + 1 / (8 * f_sw * C_out))
  const esrOhm = C.esrMinOhm + C.esrKOhmUf / cOutUf;
  const esrMohm = esrOhm * 1000.0;
  const capReactanceOhm = 1.0 / (8.0 * C.fSwHz * cOutF);
  const rippleV = deltaI * (esrOhm + capReactanceOhm);
  const rippleMv = rippleV * 1000.0;

  // Load-step PDN transient droop from ESR + closed-loop LC target impedance + parasitic trace
  const zPdnOhm = esrOhm + C.kzLoop * Math.sqrt(lH / cOutF) + C.kParOhmPerNh * lParNh;
  const droopV = Math.min(vOut * 0.68, loadStepA * zPdnOhm);
  const droopPct = (droopV / Math.max(vOut, 1e-6)) * 100.0;
  const vOutMin = Math.max(0.2, vOut - droopV - 0.5 * rippleV);
  const totalDipFrac = (droopV + 0.5 * rippleV) / Math.max(vOut, 1e-6);
  const isBrownout = totalDipFrac > C.brownoutFrac;
  const isFault = isOvervoltage || isBrownout;

  return {
    duty,
    inductanceUh,
    cOutUf,
    lParNh,
    loadStepA,
    vIn,
    vOut,
    fSwHz: C.fSwHz,
    deltaI,
    iQuiescent,
    iPeakLoad,
    iValleyBase,
    isDcm,
    dcmScale,
    omegaR,
    fRingHz,
    fRingMhz,
    z0Par,
    zeta,
    aRing,
    mPeak,
    vSwPeak,
    vSwOvershootV,
    isOvervoltage,
    esrOhm,
    esrMohm,
    rippleV,
    rippleMv,
    zPdnOhm,
    droopV,
    droopPct,
    vOutMin,
    isBrownout,
    isFault,
    vDsLimitV: C.vDsLimitV,
    brownoutLimitV: vOut * (1.0 - C.brownoutFrac),
  };
}

/**
 * Evaluates the exact damped sinusoidal rising-edge ringing waveform:
 *   V_sw(t) = V_in * (1 + A_ring * exp(-zeta * omega_r * t) * sin(omega_r * t))
 */
export function evaluateVswRinging(tauSec, metrics) {
  if (tauSec <= 0) return metrics.vIn;
  const u = metrics.omegaR * tauSec;
  return metrics.vIn * (1.0 + metrics.aRing * Math.exp(-metrics.zeta * u) * Math.sin(u));
}

/**
 * Evaluates the normalized load-step PDN droop transient envelope in [0, 1]
 * for a load step starting at t = 0 and releasing at t = stepDurSec.
 * Combines fast ESR dip + underdamped LC/loop sag + clean recovery.
 */
function evaluateDroopEnvelope(elapsedSec, stepDurSec) {
  if (elapsedSec < 0) return 0;
  if (elapsedSec <= stepDurSec) {
    // Fast initial dip peaking around ~70ms visual scope time, then closed-loop recovery
    const rise = 1.0 - Math.exp(-elapsedSec / 0.022);
    const recover = Math.exp(-elapsedSec / 0.24);
    // Normalize peak to ~1.0 at t ~ 0.055 s
    const transientSag = 1.48 * rise * recover;
    // Slight steady-state ESR/IR offset while high load remains active
    const steadyOffset = 0.18 * (1.0 - Math.exp(-elapsedSec / 0.03));
    return clamp(transientSag + steadyOffset, 0, 1.06);
  }
  // Load release overshoot (mild positive bounce when 24A load drops off)
  const after = elapsedSec - stepDurSec;
  if (after < 0.45) {
    const bounce = -0.34 * (1.0 - Math.exp(-after / 0.024)) * Math.exp(-after / 0.14);
    return bounce;
  }
  return 0;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/**
 * Factory creating the FrontierLessonShell descriptor for Lab F2.1.
 */
export function createF21PowerLab() {
  return {
    nodeId: 'F2.1',
    tier: 1,
    badge: 'TIER 1 • POWER ELECTRONICS & PDN',
    title: 'Switching Power (Buck), Parasitic L/C & PDN Ripple',
    subtitle:
      'Watch MOSFET switching edges excite PCB parasitic ringing and actuator/GPU load steps droop the voltage rail',

    breakMode: {
      buttonLabel: '⚡ Break the System — High PCB Parasitics + 25A Load Surge',
      activeLabel: '🔥 PDN FAULT ACTIVE',
      activeBanner:
        '🔥 PDN FAULT! — 42 nH PCB Loop Parasitic Ringing (44 V V_DS) + 22 µF Starved Rail Brownout',
      triggerLabel: '⚡ Break: 42nH Loop + 24A Surge',
      recoverLabel: '✓ Restore Tight Layout (6nH / 220µF)',
      description:
        'Cranks PCB switching-loop parasitic inductance to 42 nH, starves output bulk capacitance to 22 µF, and injects a 24 A GPU/actuator load surge — triggering simultaneous MOSFET V_DS overvoltage ringing and crimson rail brownout.',
      failureSymptom:
        'CH1 V_sw spikes past 44 V (>36 V limit) from sloppy PCB loop inductance while CH3 V_out collapses >30% below target during the 24 A current step.',
      recoveryHint:
        'Tighten PCB Loop Parasitic L_par → 6 nH and raise Output Cap C_out → 220 µF (or click Restore) to immediately recover clean Emerald power integrity even under heavy load!',
      faultControls: {
        lParNh: 42,
        cOutUf: 22,
        loadStepA: 24,
      },
    },

    telemetryDefs: [
      {
        id: 'vout',
        key: 'vout',
        label: 'Rail V_out',
        unit: 'V',
        initialValue: '12.00',
        color: 'emerald',
      },
      {
        id: 'vswPeak',
        key: 'vswPeak',
        label: 'V_sw Peak',
        unit: 'V',
        initialValue: '31.5',
        color: 'cyan',
      },
      {
        id: 'droopPct',
        key: 'droopPct',
        label: 'Load Droop',
        unit: '%',
        initialValue: '-2.3',
        color: 'emerald',
      },
      {
        id: 'pdnStatus',
        key: 'pdnStatus',
        label: 'PDN Integrity',
        unit: '',
        initialValue: 'CLEAN • CCM',
        color: 'emerald',
      },
    ],

    equationSpec: {
      caption: 'Synchronous Buck Regulation, Parasitic Ringing & PDN Ripple (200 kHz, V_in = 24 V)',
      parts: [
        {
          type: 'var',
          key: 'vout',
          symbol: 'V_{\\text{out}}',
          label: 'Regulated Output Rail (D·V_in)',
          color: 'emerald',
          unit: 'V',
          decimals: 2,
          initialValue: 12.0,
          tooltip:
            'Steady-state buck output voltage set by volt-second balance V_out = D · V_in (24 V bus). Hover to highlight the regulated Emerald rail.',
        },
        { type: 'op', text: '= D·V_in  |' },
        {
          type: 'var',
          key: 'deltaI',
          symbol: '\\Delta I_L',
          label: 'Inductor Current Ripple ΔI_L',
          color: 'amber',
          unit: 'A',
          decimals: 2,
          initialValue: 1.36,
          tooltip:
            'Peak-to-peak triangular inductor ripple ΔI_L = (V_in − V_out)·D / (f_sw·L). If I_load − ΔI_L/2 ≤ 0, the converter enters Discontinuous Conduction Mode (DCM).',
        },
        { type: 'op', text: ' | ' },
        {
          type: 'var',
          key: 'rippleMv',
          symbol: '\\Delta V_{\\text{out}}',
          label: 'Output Ripple ΔV_out (pp)',
          color: 'emerald',
          unit: 'mV',
          decimals: 1,
          initialValue: 28.7,
          tooltip:
            'Steady-state switching ripple ΔV_pp = ΔI_L·(ESR + 1/(8·f_sw·C_out)). Adding parallel low-ESR decoupling C_out shrinks both ripple and load-step droop.',
        },
        { type: 'op', text: ' | ' },
        {
          type: 'var',
          key: 'vswPeak',
          symbol: 'V_{\\text{sw,pk}}',
          label: 'Switch-Node Ringing Peak V_sw',
          color: 'cyan',
          unit: 'V',
          decimals: 1,
          initialValue: 31.5,
          tooltip:
            'Peak rising-edge overshoot excited across PCB parasitic loop inductance L_par and MOSFET C_oss. Exceeding 36 V triggers MOSFET V_DS overvoltage!',
        },
        { type: 'op', text: ' @ ' },
        {
          type: 'var',
          key: 'fRing',
          symbol: 'f_{\\text{ring}}',
          label: 'Parasitic Ringing Frequency f_ring',
          color: 'violet',
          unit: 'MHz',
          decimals: 1,
          initialValue: 75.0,
          tooltip:
            'Natural LC ringing frequency f_ring = 1 / (2π√(L_par·C_oss)). Longer PCB traces increase L_par, lowering f_ring and reducing damping ζ.',
        },
      ],
    },

    controls: [
      {
        id: 'duty',
        type: 'range',
        label: 'Duty Cycle D (V_in=24V)',
        min: 0.15,
        max: 0.8,
        step: 0.05,
        value: 0.5,
        unit: '',
        color: 'emerald',
        hint: 'Sets regulated rail V_out = D · 24 V (0.50 → 12.0 V, 0.20 → 4.8 V)',
      },
      {
        id: 'inductanceUh',
        type: 'range',
        label: 'Power Inductor L',
        min: 4,
        max: 68,
        step: 2,
        value: 22,
        unit: 'µH',
        color: 'amber',
        hint: 'Smaller L enlarges ΔI_L triangle (hitting 0 A triggers DCM); larger L slows load slew',
      },
      {
        id: 'cOutUf',
        type: 'range',
        label: 'Output Cap C_out',
        min: 15,
        max: 330,
        step: 5,
        value: 120,
        unit: 'µF',
        color: 'emerald',
        hint: 'Parallel low-ESR decoupling tank that suppresses ΔV_out ripple and load-step droop',
      },
      {
        id: 'lParNh',
        type: 'range',
        label: 'PCB Loop Parasitic L_par',
        min: 2,
        max: 50,
        step: 2,
        value: 10,
        unit: 'nH',
        color: 'violet',
        hint: 'Stray copper inductance in the Q1–Q2–C_in switching loop exciting V_sw ringing',
      },
      {
        id: 'loadStepA',
        type: 'range',
        label: 'Dynamic Load Step ΔI',
        min: 0,
        max: 28,
        step: 2,
        value: 6,
        unit: 'A',
        color: 'cyan',
        hint: 'Repeating GPU/servo current surge testing PDN transient droop immunity',
      },
    ],

    presets: [
      {
        label: '12V Bus (Balanced)',
        values: { duty: 0.5, inductanceUh: 22, cOutUf: 120, lParNh: 10, loadStepA: 6 },
        breakMode: false,
      },
      {
        label: '5V Tight PDN',
        values: { duty: 0.2, inductanceUh: 18, cOutUf: 220, lParNh: 6, loadStepA: 8 },
        breakMode: false,
      },
      {
        label: 'Light-Load DCM',
        values: { duty: 0.5, inductanceUh: 6, cOutUf: 120, lParNh: 10, loadStepA: 0 },
        breakMode: false,
      },
      {
        label: '24A Hardened PDN',
        values: { duty: 0.5, inductanceUh: 22, cOutUf: 220, lParNh: 6, loadStepA: 24 },
        breakMode: false,
      },
    ],

    steps: {
      concept: {
        title: 'Ideal Buck Conversion vs. Real PCB Parasitics',
        body:
          'A synchronous buck converter steps down a 24 V robot battery bus by alternating high-side MOSFET Q1 and low-side MOSFET Q2 at 200 kHz. By inductor volt-second balance, the average output rail equals V_out = D · V_in — but real copper traces and capacitors never behave ideally.',
        bullets: [
          'During ON time (D·T_s), Q1 connects V_in across L, ramping inductor current i_L up while energizing the load.',
          'During OFF time ((1−D)·T_s), Q2 freewheels inductor current smoothly to ground — unless i_L hits 0 A (DCM).',
          'Every nanosecond switching edge excites stray PCB loop inductance L_par against MOSFET C_oss, ringing V_sw far above 24 V.',
          'When a GPU or actuator draws a sudden ΔI surge, output cap C_out and its ESR must hold up V_out until the inductor catches up.',
        ],
        callout:
          'Click directly on the GPU / Servo Load module in the schematic at any time to fire an immediate transient load surge!',
      },
      explore: {
        title: 'Probe Switching Ripple, DCM & Transient Droop',
        body:
          'Sweep the five hardware parameters while watching the live animated current loops (top) and 3-channel oscilloscope (bottom) react in real time.',
        bullets: [
          'Slide Duty Cycle D between 0.20 (4.8 V logic) and 0.50 (12.0 V bus) to see Q1/Q2 conduction timing and V_out shift immediately.',
          'Drop Power Inductor L to 6 µH with small load step ΔI: watch CH2 i_L hit 0 A and flag Amber "DCM (Discontinuous)".',
          'Raise PCB Loop Parasitic L_par above 30 nH: notice L_par glow Amber/Crimson on the schematic as CH1 ringing slows in f_ring and breaches 36 V.',
        ],
      },
      linkedMath: {
        title: 'Cross-Highlight Circuit Physics & Scope Traces',
        body:
          'Hover or tap any term in the Live Linked Equation below the oscilloscope — or hover directly over L_par, L, C_out, or V_out in the schematic — to link math to waveform geometry.',
        bullets: [
          'V_out (Emerald): locks onto the target rail and regulated CH3 trace.',
          'ΔI_L (Amber): illuminates the Power Inductor L and peak-to-peak current caliper on CH2.',
          'V_sw,pk & f_ring (Cyan/Violet): pulses PCB parasitic L_par and highlights the damped ringing spike on CH1.',
          'ΔV_out (Emerald): illuminates Output Cap C_out + ESR and the CH3 switching-ripple & droop window.',
        ],
      },
      breakSystem: {
        title: 'Break Mode: 42 nH Sloppy Layout + 24 A Load Surge',
        body:
          'Hit "⚡ Break the System — High PCB Parasitics + 25A Load Surge" to combine a long, unoptimized PCB switching loop (L_par = 42 nH) with starved bulk capacitance (C_out = 22 µF) and a 24 A actuator/GPU surge.',
        symptom:
          'CH1 V_sw rings past 44 V ("MOSFET V_DS OVERVOLTAGE!") while CH3 V_out plunges >30% below target ("BROWNOUT!"), flashing both switching and load stages Crimson.',
        recovery:
          'Tighten PCB Loop Parasitic L_par → 6 nH and boost Output Cap C_out → 220 µF (even while keeping the full 24 A surge!) to immediately restore clean Emerald power integrity.',
      },
    },

    intuitionCheck: {
      question:
        'On a 24 V→12 V buck regulator driving a robot GPU, you observe BOTH 44 V high-frequency ringing spikes on the V_sw switch node AND a 25% V_out brownout dip whenever tensor cores wake up. Which hardware fix resolves BOTH root causes?',
      options: [
        {
          id: 'a',
          text: 'Increase the power inductor L from 22 µH to 68 µH while leaving PCB traces and C_out unchanged.',
          correct: false,
          feedback:
            'A larger inductor reduces steady ΔI_L ripple, but it actually slows down di/dt recovery during a load step (worsening V_out droop!) and does nothing to shrink the Q1–Q2 parasitic loop L_par.',
        },
        {
          id: 'b',
          text: 'Tighten the Q1–Q2–C_in PCB switching loop to cut L_par (e.g., 42→6 nH) AND add parallel low-ESR output decoupling capacitance C_out (e.g., 22→220 µF).',
          correct: true,
          feedback:
            'Exact engineering diagnosis! Shrinking switching-loop area slashes L_par (raising f_ring, increasing damping ζ, and eliminating the 44 V V_DS overshoot), while parallel low-ESR C_out lowers PDN impedance Z_pdn to hold up V_out during 24 A surges.',
        },
        {
          id: 'c',
          text: 'Increase duty cycle D from 0.50 to 0.70 so the rail sits higher before each brownout.',
          correct: false,
          feedback:
            'Raising D shifts the nominal steady-state rail to 16.8 V (damaging 12 V silicon) without damping V_sw ringing or reducing PDN impedance.',
        },
        {
          id: 'd',
          text: 'Force the converter into Discontinuous Conduction Mode (DCM) by shrinking L to 4 µH.',
          correct: false,
          feedback:
            'Shrinking L enlarges steady-state ripple ΔI_L and increases peak switching current, which worsens both switching-node overshoot and steady ripple.',
        },
      ],
      correctIndex: 1,
      explanation:
        'MOSFET V_sw overshoot is governed by stray switching-loop inductance L_par resonating with C_oss, while load-step rail brownout is governed by PDN impedance (ESR and C_out). Fixing layout parasitics and low-ESR decoupling capacitance cures both failure modes simultaneously.',
    },

    frontierBridge: {
      headline: 'Powering Humanoid Actuators & 1000 W AI Accelerator Boards',
      whyItMatters:
        'Every humanoid robot and AI server is fundamentally a Power Distribution Network (PDN) problem: 24 V–48 V battery buses must feed 30 A servo bursts and sub-volt 500 A GPU rails with <3% droop and zero MOSFET avalanche breakdown. Sub-10 nH switching-loop PCB layout, multi-phase interleaved bucks, and low-ESR ceramic decoupling arrays separate reliable physical-AI hardware from smoke on the bench.',
      prereqs: [],
      unlocks: ['F2.2', 'F2.3', 'M5.2'],
    },

    /**
     * Mounts the 60 FPS dead-front schematic + 3-channel oscilloscope into `canvasHost`.
     */
    mountCanvas(canvasHost, api = {}) {
      if (!canvasHost) return { destroy() {}, dispose() {} };

      canvasHost.classList.add('deadfront-canvas');
      if (getComputedStyle(canvasHost).position === 'static') {
        canvasHost.style.position = 'relative';
      }

      const canvas = document.createElement('canvas');
      canvas.style.cssText =
        'display:block;width:100%;height:100%;touch-action:none;cursor:default;';
      canvas.setAttribute(
        'aria-label',
        'Interactive synchronous buck converter schematic and 3-channel digital oscilloscope.'
      );
      canvasHost.textContent = '';
      canvasHost.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      // ---- Read initial controls from FrontierLessonShell ----
      const readInitialControl = (id, fallback) => {
        try {
          if (typeof api.getControlValue === 'function') {
            const v = api.getControlValue(id);
            if (v !== undefined) return v;
          }
          if (typeof api.getControl === 'function') {
            const v = api.getControl(id);
            if (v !== undefined) return v;
          }
          if (typeof api.getControls === 'function') {
            const all = api.getControls();
            if (all && all[id] !== undefined) return all[id];
          }
          if (typeof api.getParams === 'function') {
            const all = api.getParams();
            if (all && all[id] !== undefined) return all[id];
          }
        } catch {
          // Ignore shell read error
        }
        return fallback;
      };

      const params = {
        duty: finiteOr(readInitialControl('duty', 0.5), 0.5),
        inductanceUh: finiteOr(readInitialControl('inductanceUh', 22), 22),
        cOutUf: finiteOr(readInitialControl('cOutUf', 120), 120),
        lParNh: finiteOr(readInitialControl('lParNh', 10), 10),
        loadStepA: finiteOr(readInitialControl('loadStepA', 6), 6),
      };

      let metrics = computeBuckMetrics(params);
      let breakActive = Boolean(
        typeof api.isBroken === 'function'
          ? api.isBroken()
          : typeof api.getBreakActive === 'function'
            ? api.getBreakActive()
            : false
      );
      let savedBeforeBreak = {
        lParNh: params.lParNh,
        cOutUf: params.cOutUf,
        loadStepA: params.loadStepA,
      };
      let highlightedVar = null;
      let canvasHoverVar = null;
      let syncingControls = false;

      // ---- Real-Time Animation & Rolling CH3 Oscilloscope State ----
      const STEP_PERIOD_SEC = 2.8;
      const STEP_DUR_SEC = 0.88;
      const CH3_HISTORY_LEN = 220;
      const CH3_DT_SAMPLE = 0.012; // ~2.64s rolling history window on CH3

      const sim = {
        simTime: 0,
        pwmPhase: 0, // [0, 1) visual switching cycle phase (~1.15 Hz slow-motion visualization)
        stepClock: 0.45, // repeating load-step timer
        particleOffset: 0,
        activeLoadFactor: 0, // smooth [0, 1] load-step active level
        instDroopFrac: 0, // current droop envelope in [-0.35, 1.06]
        instLoadA: metrics.iQuiescent,
        instVout: metrics.vOut,
        faultFlash: 0,
        ringPulse: 0,
        ch3Accum: 0,
        ch3Samples: new Float32Array(CH3_HISTORY_LEN),
        ch3RippleAmp: new Float32Array(CH3_HISTORY_LEN),
        ch3LoadActive: new Float32Array(CH3_HISTORY_LEN),
        ch3Cursor: 0,
      };

      function seedCh3History() {
        // Pre-populate rolling CH3 trace with one visible load-step transient
        for (let i = 0; i < CH3_HISTORY_LEN; i++) {
          const tAgo = (CH3_HISTORY_LEN - 1 - i) * CH3_DT_SAMPLE;
          const phaseT = ((sim.stepClock - tAgo) % STEP_PERIOD_SEC + STEP_PERIOD_SEC) % STEP_PERIOD_SEC;
          const env = evaluateDroopEnvelope(phaseT, STEP_DUR_SEC);
          const v = metrics.vOut - env * metrics.droopV;
          sim.ch3Samples[i] = v;
          sim.ch3RippleAmp[i] = metrics.rippleV;
          sim.ch3LoadActive[i] = phaseT <= STEP_DUR_SEC && metrics.loadStepA > 0 ? 1 : 0;
        }
        sim.ch3Cursor = 0;
      }

      seedCh3History();

      // ---- Viewport / Hitbox State ----
      let cssW = 720;
      let cssH = 480;
      let dpr = Math.min(2, window.devicePixelRatio || 1);

      const hitBoxes = {
        lPar: null,
        inductor: null,
        cOut: null,
        load: null,
        vSwNode: null,
      };

      function updateViewport() {
        const rect = canvasHost.getBoundingClientRect();
        cssW = Math.max(320, Math.round(rect.width || 720));
        cssH = Math.max(300, Math.round(rect.height || 480));
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      function pushShellControl(id, value) {
        syncingControls = true;
        try {
          if (typeof api.setControlValue === 'function') api.setControlValue(id, value, { notify: false });
          else if (typeof api.setControl === 'function') api.setControl(id, value);
          else if (typeof api.updateControl === 'function') api.updateControl(id, value);
          else if (typeof api.setParam === 'function') api.setParam(id, value);
        } catch {
          // Ignore shell push errors
        } finally {
          syncingControls = false;
        }
      }

      function recomputeMetrics(reseedOnDutyJump = false) {
        const prevVout = metrics.vOut;
        metrics = computeBuckMetrics(params);
        canvasHost.classList.toggle('is-fault', metrics.isFault);
        if (reseedOnDutyJump && Math.abs(metrics.vOut - prevVout) > 0.05) {
          // Shift rolling history smoothly to new target rail so there is no misleading phantom brownout
          const dv = metrics.vOut - prevVout;
          for (let i = 0; i < CH3_HISTORY_LEN; i++) {
            sim.ch3Samples[i] += dv;
          }
        }
      }

      function triggerLoadSurgeNow() {
        // Jump stepClock right to surge start so user immediately sees the droop pulse
        sim.stepClock = 0.01;
      }

      function applyControl(id, rawValue) {
        if (syncingControls) return;
        const v = Number(rawValue);
        if (!Number.isFinite(v)) return;

        if (id === 'duty') {
          params.duty = clamp(v, 0.15, 0.8);
          recomputeMetrics(true);
        } else if (id === 'inductanceUh') {
          params.inductanceUh = clamp(v, 4, 68);
          recomputeMetrics(false);
        } else if (id === 'cOutUf') {
          params.cOutUf = clamp(v, 15, 330);
          recomputeMetrics(false);
        } else if (id === 'lParNh') {
          params.lParNh = clamp(v, 2, 50);
          recomputeMetrics(false);
        } else if (id === 'loadStepA') {
          params.loadStepA = clamp(v, 0, 28);
          recomputeMetrics(false);
          if (params.loadStepA > 0) {
            triggerLoadSurgeNow();
          }
        }
      }

      function applyBreakMode(active) {
        const next = Boolean(active);
        breakActive = next;
        if (next) {
          savedBeforeBreak = {
            lParNh: params.lParNh,
            cOutUf: params.cOutUf,
            loadStepA: params.loadStepA,
          };
          params.lParNh = 42;
          params.cOutUf = 22;
          params.loadStepA = 24;

          pushShellControl('lParNh', 42);
          pushShellControl('cOutUf', 22);
          pushShellControl('loadStepA', 24);

          recomputeMetrics(false);
          triggerLoadSurgeNow();
          seedCh3History();
        } else {
          // Restore clean low-parasitic, well-decoupled PDN
          params.lParNh = 6;
          params.cOutUf = 220;
          params.loadStepA = savedBeforeBreak.loadStepA ?? 6;

          pushShellControl('lParNh', params.lParNh);
          pushShellControl('cOutUf', params.cOutUf);
          pushShellControl('loadStepA', params.loadStepA);

          recomputeMetrics(false);
          seedCh3History();
        }
      }

      function resetWorld() {
        params.duty = 0.5;
        params.inductanceUh = 22;
        params.cOutUf = 120;
        params.lParNh = 10;
        params.loadStepA = 6;
        breakActive = false;

        pushShellControl('duty', params.duty);
        pushShellControl('inductanceUh', params.inductanceUh);
        pushShellControl('cOutUf', params.cOutUf);
        pushShellControl('lParNh', params.lParNh);
        pushShellControl('loadStepA', params.loadStepA);

        recomputeMetrics(false);
        sim.simTime = 0;
        sim.pwmPhase = 0;
        sim.stepClock = 0.45;
        sim.particleOffset = 0;
        seedCh3History();
      }

      function activeHighlight() {
        return highlightedVar || canvasHoverVar || null;
      }

      // ---- Simulation Step (60 FPS smooth physics & rolling oscilloscope sampling) ----
      function stepSim(dt) {
        sim.simTime += dt;

        // Visual slow-motion PWM phase (~0.85 cycles/sec so ON/OFF conduction loops are unmistakably legible)
        const prevPhase = sim.pwmPhase;
        sim.pwmPhase = (sim.pwmPhase + dt * 0.85) % 1.0;
        if (sim.pwmPhase < prevPhase) {
          // Rising edge just fired -> trigger schematic ringing halo burst
          sim.ringPulse = 1.0;
        }
        sim.ringPulse = Math.max(0, sim.ringPulse - dt * 2.4);

        // Repeating GPU / actuator load step cycle
        sim.stepClock = (sim.stepClock + dt) % STEP_PERIOD_SEC;
        const inSurge = sim.stepClock <= STEP_DUR_SEC && metrics.loadStepA > 0;
        const targetLoadFactor = inSurge ? 1.0 : 0.0;
        sim.activeLoadFactor += (targetLoadFactor - sim.activeLoadFactor) * Math.min(1, dt * 16);

        sim.instDroopFrac = metrics.loadStepA > 0
          ? evaluateDroopEnvelope(sim.stepClock, STEP_DUR_SEC)
          : 0;
        sim.instLoadA = metrics.iQuiescent + sim.activeLoadFactor * metrics.loadStepA;
        sim.instVout = Math.max(0.2, metrics.vOut - sim.instDroopFrac * metrics.droopV);

        // Particle speed scales noticeably with instantaneous load current
        const speedNorm = 0.42 + (sim.instLoadA / 16.0) * 1.15;
        sim.particleOffset = (sim.particleOffset + dt * speedNorm) % 1.0;

        // Fault flash intensity
        const faultTarget = metrics.isFault ? 1.0 : 0.0;
        sim.faultFlash += (faultTarget - sim.faultFlash) * Math.min(1, dt * 8);

        // Sample rolling CH3 buffer at fixed rate
        sim.ch3Accum += dt;
        let guard = 0;
        while (sim.ch3Accum >= CH3_DT_SAMPLE && guard < 8) {
          sim.ch3Accum -= CH3_DT_SAMPLE;
          sim.ch3Samples[sim.ch3Cursor] = sim.instVout;
          sim.ch3RippleAmp[sim.ch3Cursor] = metrics.rippleV;
          sim.ch3LoadActive[sim.ch3Cursor] = inSurge ? 1 : 0;
          sim.ch3Cursor = (sim.ch3Cursor + 1) % CH3_HISTORY_LEN;
          guard++;
        }
      }

      // ---- Drawing Helpers: Top 38% Synchronous Buck Schematic ----
      function drawCoil(ctx, x1, x2, y, loops, radius, strokeStyle, lineWidth, glowColor) {
        const span = x2 - x1;
        const step = span / loops;
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        if (glowColor) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        for (let i = 0; i < loops; i++) {
          const cx = x1 + (i + 0.5) * step;
          ctx.arc(cx, y, Math.min(radius, step * 0.5), Math.PI, 0, false);
        }
        ctx.stroke();
        ctx.restore();
      }

      function drawFlowParticles(ctx, pathPts, count, offset, color, radius, alpha = 0.92) {
        if (!pathPts || pathPts.length < 2 || count <= 0) return;
        // Precompute segment lengths
        const segLens = [];
        let totalLen = 0;
        for (let i = 0; i < pathPts.length - 1; i++) {
          const dx = pathPts[i + 1][0] - pathPts[i][0];
          const dy = pathPts[i + 1][1] - pathPts[i][1];
          const len = Math.hypot(dx, dy);
          segLens.push(len);
          totalLen += len;
        }
        if (totalLen < 1) return;

        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 9;
        ctx.globalAlpha = alpha;

        for (let p = 0; p < count; p++) {
          let dist = ((p / count + offset) % 1.0) * totalLen;
          for (let s = 0; s < segLens.length; s++) {
            if (dist <= segLens[s] || s === segLens.length - 1) {
              const frac = segLens[s] > 1e-4 ? dist / segLens[s] : 0;
              const px = pathPts[s][0] + (pathPts[s + 1][0] - pathPts[s][0]) * frac;
              const py = pathPts[s][1] + (pathPts[s + 1][1] - pathPts[s][1]) * frac;
              ctx.beginPath();
              ctx.arc(px, py, radius, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            dist -= segLens[s];
          }
        }
        ctx.restore();
      }

      function drawSchematicPane(topY, paneH, nowSec) {
        const hi = activeHighlight();
        const padX = Math.max(18, Math.min(34, cssW * 0.04));
        const innerW = cssW - padX * 2;
        const railTopY = topY + paneH * 0.34;
        const railGndY = topY + paneH * 0.82;
        const midY = (railTopY + railGndY) * 0.5;

        // Horizontal node positions across schematic
        const xVin = padX + innerW * 0.05;
        const xQ1L = padX + innerW * 0.16;
        const xQ1R = padX + innerW * 0.28;
        const xSw = padX + innerW * 0.34;
        const xLparL = padX + innerW * 0.39;
        const xLparR = padX + innerW * 0.49;
        const xIndL = padX + innerW * 0.54;
        const xIndR = padX + innerW * 0.69;
        const xCap = padX + innerW * 0.77;
        const xLoad = padX + innerW * 0.90;

        // Conduction phase state
        const onPhase = sim.pwmPhase < metrics.duty;
        const inDcmDead =
          metrics.isDcm &&
          sim.activeLoadFactor < 0.2 &&
          sim.pwmPhase > metrics.dcmScale;

        const isRingHi = hi === 'vswPeak' || hi === 'fRing';
        const isDeltaIHi = hi === 'deltaI';
        const isRippleHi = hi === 'rippleMv';
        const isVoutHi = hi === 'vout';

        // Update interactive hover hitboxes
        hitBoxes.vSwNode = { x: xSw - 20, y: railTopY - 22, w: 40, h: 44 };
        hitBoxes.lPar = { x: xLparL - 10, y: railTopY - 24, w: xLparR - xLparL + 20, h: 48 };
        hitBoxes.inductor = { x: xIndL - 10, y: railTopY - 26, w: xIndR - xIndL + 20, h: 52 };
        hitBoxes.cOut = { x: xCap - 24, y: railTopY - 6, w: 48, h: railGndY - railTopY + 12 };
        hitBoxes.load = { x: xLoad - 34, y: railTopY - 12, w: 68, h: railGndY - railTopY + 22 };

        // Subtle pane header label
        ctx.save();
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.textDim;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('SYNCHRONOUS BUCK POWER STAGE  •  200 kHz PWM', padX, topY + 7);

        // Live conduction state pill (top-right of schematic pane)
        const stateLabel = metrics.isFault
          ? metrics.isOvervoltage && metrics.isBrownout
            ? 'PDN FAULT: V_DS OVERVOLT + BROWNOUT'
            : metrics.isOvervoltage
              ? 'MOSFET V_DS OVERVOLTAGE!'
              : 'RAIL BROWNOUT!'
          : inDcmDead
            ? 'DCM DEAD-TIME (i_L = 0 A)'
            : onPhase
              ? `Q1 ON (D = ${metrics.duty.toFixed(2)})  •  ENERGIZING L`
              : `Q2 ON (1−D = ${(1 - metrics.duty).toFixed(2)})  •  FREEWHEELING`;
        const pillColor = metrics.isFault
          ? COLORS.crimson
          : inDcmDead
            ? COLORS.amber
            : onPhase
              ? COLORS.cyan
              : COLORS.amber;
        const pillRgb = metrics.isFault
          ? COLORS.crimsonRgb
          : inDcmDead
            ? COLORS.amberRgb
            : onPhase
              ? COLORS.cyanRgb
              : COLORS.amberRgb;

        ctx.font = '700 10px "JetBrains Mono", monospace';
        const pillW = ctx.measureText(stateLabel).width + 18;
        const pillX = cssW - padX - pillW;
        const pillY = topY + 4;
        drawRoundedRect(ctx, pillX, pillY, pillW, 18, 9);
        ctx.fillStyle = `rgba(${pillRgb}, ${metrics.isFault ? 0.22 : 0.12})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${pillRgb}, ${metrics.isFault ? 0.85 : 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = pillColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stateLabel, pillX + pillW * 0.5, pillY + 9.5);
        ctx.restore();

        // ---- Base Copper Traces ----
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // GND bus rail
        ctx.strokeStyle = COLORS.wireIdle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xVin, railGndY);
        ctx.lineTo(xLoad, railGndY);
        ctx.stroke();

        // V_in vertical + top feed to Q1
        ctx.strokeStyle = onPhase ? COLORS.cyan : COLORS.wireIdle;
        ctx.lineWidth = onPhase ? 2.4 : 1.8;
        ctx.beginPath();
        ctx.moveTo(xVin, railGndY);
        ctx.lineTo(xVin, railTopY);
        ctx.lineTo(xQ1L, railTopY);
        ctx.stroke();

        // Q1 -> V_sw -> L_par
        const swTraceColor = metrics.isOvervoltage
          ? COLORS.crimson
          : onPhase
            ? COLORS.cyan
            : COLORS.amber;
        ctx.strokeStyle = inDcmDead ? COLORS.wireIdle : swTraceColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(xQ1R, railTopY);
        ctx.lineTo(xLparL, railTopY);
        ctx.stroke();

        // Q2 vertical branch (V_sw down to GND)
        ctx.strokeStyle = !onPhase && !inDcmDead ? COLORS.amber : COLORS.wireIdle;
        ctx.lineWidth = !onPhase && !inDcmDead ? 2.4 : 1.8;
        ctx.beginPath();
        ctx.moveTo(xSw, railTopY);
        ctx.lineTo(xSw, railGndY);
        ctx.stroke();

        // L_par -> Power Inductor L
        ctx.strokeStyle = inDcmDead ? COLORS.wireIdle : COLORS.amber;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(xLparR, railTopY);
        ctx.lineTo(xIndL, railTopY);
        ctx.stroke();

        // Power Inductor L -> V_out Rail -> Cap & Load
        const voutColor = metrics.isBrownout
          ? COLORS.crimson
          : isVoutHi
            ? COLORS.emerald
            : `rgba(${COLORS.emeraldRgb}, 0.88)`;
        ctx.save();
        if (isVoutHi || metrics.isBrownout) {
          ctx.shadowColor = metrics.isBrownout ? COLORS.crimson : COLORS.emerald;
          ctx.shadowBlur = 12;
        }
        ctx.strokeStyle = voutColor;
        ctx.lineWidth = isVoutHi ? 3.2 : 2.4;
        ctx.beginPath();
        ctx.moveTo(xIndR, railTopY);
        ctx.lineTo(xLoad, railTopY);
        ctx.stroke();
        ctx.restore();

        // C_out + ESR vertical branch
        ctx.strokeStyle = isRippleHi
          ? COLORS.emerald
          : metrics.isBrownout
            ? COLORS.crimson
            : 'rgba(139, 151, 176, 0.55)';
        ctx.lineWidth = isRippleHi ? 2.4 : 1.8;
        ctx.beginPath();
        ctx.moveTo(xCap, railTopY);
        ctx.lineTo(xCap, midY - 12);
        ctx.moveTo(xCap, midY + 12);
        ctx.lineTo(xCap, railGndY);
        ctx.stroke();

        ctx.restore();

        // ---- Component 1: 24 V Input Battery Source ----
        ctx.save();
        const batR = Math.min(14, paneH * 0.11);
        ctx.fillStyle = COLORS.panel;
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = onPhase ? 10 : 4;
        ctx.beginPath();
        ctx.arc(xVin, midY, batR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('24V', xVin, midY + 0.5);

        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText('V_in', xVin, railTopY - 14);
        ctx.restore();

        // ---- Component 2: High-Side MOSFET Q1 ----
        ctx.save();
        const q1W = xQ1R - xQ1L;
        const q1H = 22;
        drawRoundedRect(ctx, xQ1L, railTopY - q1H * 0.5, q1W, q1H, 5);
        ctx.fillStyle = onPhase ? `rgba(${COLORS.cyanRgb}, 0.22)` : COLORS.panel;
        ctx.strokeStyle = metrics.isOvervoltage && onPhase
          ? COLORS.crimson
          : onPhase
            ? COLORS.cyan
            : COLORS.wireIdle;
        ctx.lineWidth = onPhase ? 2 : 1.4;
        if (onPhase) {
          ctx.shadowColor = metrics.isOvervoltage ? COLORS.crimson : COLORS.cyan;
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = onPhase ? COLORS.textPrimary : COLORS.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Q1', (xQ1L + xQ1R) * 0.5, railTopY + 0.5);
        ctx.font = '500 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = onPhase ? COLORS.cyan : COLORS.textDim;
        ctx.fillText(onPhase ? 'HS ON' : 'HS OFF', (xQ1L + xQ1R) * 0.5, railTopY - 19);
        ctx.restore();

        // ---- Component 3: Low-Side Sync MOSFET Q2 ----
        ctx.save();
        const q2On = !onPhase && !inDcmDead;
        const q2W = 30;
        const q2H = 22;
        drawRoundedRect(ctx, xSw - q2W * 0.5, midY - q2H * 0.5, q2W, q2H, 5);
        ctx.fillStyle = q2On ? `rgba(${COLORS.amberRgb}, 0.22)` : COLORS.panel;
        ctx.strokeStyle = q2On ? COLORS.amber : COLORS.wireIdle;
        ctx.lineWidth = q2On ? 2 : 1.4;
        if (q2On) {
          ctx.shadowColor = COLORS.amber;
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = q2On ? COLORS.textPrimary : COLORS.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Q2', xSw, midY + 0.5);
        ctx.font = '500 8px "JetBrains Mono", monospace';
        ctx.fillStyle = q2On ? COLORS.amber : COLORS.textDim;
        ctx.textAlign = 'right';
        ctx.fillText(q2On ? 'SYNC ON' : 'OFF', xSw - q2W * 0.5 - 5, midY + 0.5);
        ctx.restore();

        // ---- Switch Node V_sw Junction + Ringing Shockwave ----
        ctx.save();
        const ringSeverity = clamp((metrics.vSwPeak - 27) / 17, 0, 1);
        const swNodeColor = metrics.isOvervoltage
          ? COLORS.crimson
          : ringSeverity > 0.45
            ? COLORS.amber
            : COLORS.cyan;

        if (sim.ringPulse > 0.05 || isRingHi || metrics.isOvervoltage) {
          const pulse = isRingHi
            ? 0.55 + 0.45 * Math.sin(nowSec * 9)
            : Math.max(sim.ringPulse, metrics.isOvervoltage ? 0.5 + 0.35 * Math.sin(nowSec * 14) : 0);
          const ringR = 8 + pulse * (metrics.isOvervoltage ? 16 : 11);
          ctx.strokeStyle = metrics.isOvervoltage
            ? `rgba(${COLORS.crimsonRgb}, ${0.75 * pulse})`
            : isRingHi
              ? `rgba(${COLORS.violetRgb}, ${0.85 * pulse})`
              : `rgba(${COLORS.amberRgb}, ${0.65 * pulse})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(xSw, railTopY, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = swNodeColor;
        ctx.shadowColor = swNodeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(xSw, railTopY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = swNodeColor;
        ctx.textAlign = 'center';
        ctx.fillText('V_sw', xSw, railTopY - 14);
        ctx.restore();

        // ---- Component 4: Parasitic PCB Loop Inductance L_par (Amber/Crimson glow when ringing!) ----
        ctx.save();
        const lParHot = metrics.lParNh >= 16 || isRingHi || metrics.isOvervoltage;
        const lParColor = metrics.isOvervoltage
          ? COLORS.crimson
          : isRingHi
            ? COLORS.violet
            : metrics.lParNh >= 16
              ? COLORS.amber
              : 'rgba(167, 139, 250, 0.85)';

        // Background highlight aura when hot or hovered
        if (lParHot) {
          const glowPulse = 0.65 + 0.35 * Math.sin(nowSec * (metrics.isOvervoltage ? 13 : 6));
          drawRoundedRect(ctx, xLparL - 5, railTopY - 15, xLparR - xLparL + 10, 26, 6);
          ctx.fillStyle = metrics.isOvervoltage
            ? `rgba(${COLORS.crimsonRgb}, ${0.18 * glowPulse})`
            : isRingHi
              ? `rgba(${COLORS.violetRgb}, ${0.2 * glowPulse})`
              : `rgba(${COLORS.amberRgb}, ${0.14 * glowPulse})`;
          ctx.fill();
          ctx.strokeStyle = metrics.isOvervoltage
            ? `rgba(${COLORS.crimsonRgb}, 0.65)`
            : isRingHi
              ? `rgba(${COLORS.violetRgb}, 0.75)`
              : `rgba(${COLORS.amberRgb}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        drawCoil(
          ctx,
          xLparL,
          xLparR,
          railTopY,
          3,
          6,
          lParColor,
          isRingHi || metrics.isOvervoltage ? 2.5 : 1.9,
          lParHot ? lParColor : null
        );

        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = lParColor;
        ctx.textAlign = 'center';
        ctx.fillText(`L_par ${metrics.lParNh}nH`, (xLparL + xLparR) * 0.5, railTopY + 19);
        ctx.restore();

        // ---- Component 5: Power Inductor L ----
        ctx.save();
        const indColor = isDeltaIHi ? '#FFD54F' : COLORS.amber;
        if (isDeltaIHi) {
          drawRoundedRect(ctx, xIndL - 6, railTopY - 19, xIndR - xIndL + 12, 32, 7);
          ctx.fillStyle = `rgba(${COLORS.amberRgb}, 0.16)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${COLORS.amberRgb}, 0.72)`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        drawCoil(
          ctx,
          xIndL,
          xIndR,
          railTopY,
          4,
          10,
          indColor,
          isDeltaIHi ? 3.2 : 2.6,
          COLORS.amber
        );
        // Core lines above inductor
        ctx.strokeStyle = `rgba(${COLORS.amberRgb}, 0.5)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(xIndL + 4, railTopY - 13);
        ctx.lineTo(xIndR - 4, railTopY - 13);
        ctx.stroke();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = indColor;
        ctx.textAlign = 'center';
        ctx.fillText(`L = ${metrics.inductanceUh}µH`, (xIndL + xIndR) * 0.5, railTopY + 19);
        ctx.restore();

        // ---- Component 6: Output Bulk Cap C_out + ESR ----
        ctx.save();
        const capColor = metrics.isBrownout
          ? COLORS.crimson
          : isRippleHi
            ? '#69F0AE'
            : COLORS.emerald;
        if (isRippleHi || metrics.isBrownout) {
          drawRoundedRect(ctx, xCap - 22, railTopY + 4, 44, railGndY - railTopY - 8, 6);
          ctx.fillStyle = metrics.isBrownout
            ? `rgba(${COLORS.crimsonRgb}, 0.14)`
            : `rgba(${COLORS.emeraldRgb}, 0.14)`;
          ctx.fill();
          ctx.strokeStyle = metrics.isBrownout
            ? `rgba(${COLORS.crimsonRgb}, 0.65)`
            : `rgba(${COLORS.emeraldRgb}, 0.65)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Small ESR zigzag resistor above cap plates
        const esrTop = railTopY + (railGndY - railTopY) * 0.16;
        const esrBot = railTopY + (railGndY - railTopY) * 0.34;
        ctx.strokeStyle = capColor;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(xCap, esrTop);
        ctx.lineTo(xCap - 4, esrTop + (esrBot - esrTop) * 0.25);
        ctx.lineTo(xCap + 4, esrTop + (esrBot - esrTop) * 0.5);
        ctx.lineTo(xCap - 4, esrTop + (esrBot - esrTop) * 0.75);
        ctx.lineTo(xCap, esrBot);
        ctx.stroke();

        // Capacitor plates
        const plateY1 = midY + 2;
        const plateY2 = midY + 10;
        ctx.lineWidth = 2.6;
        ctx.shadowColor = capColor;
        ctx.shadowBlur = isRippleHi ? 10 : 4;
        ctx.beginPath();
        ctx.moveTo(xCap - 11, plateY1);
        ctx.lineTo(xCap + 11, plateY1);
        ctx.moveTo(xCap - 11, plateY2);
        ctx.lineTo(xCap + 11, plateY2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = capColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${metrics.cOutUf}µF`, xCap - 14, midY + 7);
        ctx.font = '500 8px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(`${metrics.esrMohm.toFixed(0)}mΩ`, xCap - 14, esrBot + 1);
        ctx.restore();

        // ---- Component 7: Dynamic GPU / Servo Load Module ----
        ctx.save();
        const loadW = Math.min(72, innerW * 0.125);
        const loadH = Math.max(38, railGndY - railTopY - 12);
        const loadX = xLoad - loadW * 0.5;
        const loadY = railTopY + (railGndY - railTopY - loadH) * 0.5;
        const surging = sim.activeLoadFactor > 0.25 && metrics.loadStepA > 0;

        const loadBorder = metrics.isBrownout
          ? COLORS.crimson
          : surging
            ? COLORS.cyan
            : isVoutHi
              ? COLORS.emerald
              : 'rgba(0, 230, 118, 0.55)';

        drawRoundedRect(ctx, loadX, loadY, loadW, loadH, 7);
        ctx.fillStyle = metrics.isBrownout
          ? `rgba(${COLORS.crimsonRgb}, 0.22)`
          : surging
            ? `rgba(${COLORS.cyanRgb}, 0.16)`
            : 'rgba(18, 22, 30, 0.94)';
        ctx.fill();
        ctx.strokeStyle = loadBorder;
        ctx.lineWidth = surging || metrics.isBrownout || isVoutHi ? 2.2 : 1.5;
        if (surging || metrics.isBrownout || isVoutHi) {
          ctx.shadowColor = loadBorder;
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Vertical wire taps into load module
        ctx.strokeStyle = voutColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xLoad, railTopY);
        ctx.lineTo(xLoad, loadY);
        ctx.stroke();
        ctx.strokeStyle = COLORS.wireIdle;
        ctx.beginPath();
        ctx.moveTo(xLoad, loadY + loadH);
        ctx.lineTo(xLoad, railGndY);
        ctx.stroke();

        // Load module label & live current bar
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = metrics.isBrownout ? COLORS.crimson : COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('GPU/SERVO', xLoad, loadY + 5);

        ctx.font = '700 10.5px "JetBrains Mono", monospace';
        ctx.fillStyle = metrics.isBrownout
          ? COLORS.crimson
          : surging
            ? COLORS.cyan
            : COLORS.emerald;
        ctx.fillText(`${sim.instLoadA.toFixed(1)} A`, xLoad, loadY + 17);

        // Current meter bar inside load box
        const barW = loadW - 12;
        const barX = loadX + 6;
        const barY = loadY + loadH - 10;
        const barFill = clamp(sim.instLoadA / 30.0, 0.05, 1.0);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = metrics.isBrownout ? COLORS.crimson : surging ? COLORS.cyan : COLORS.emerald;
        ctx.fillRect(barX, barY, barW * barFill, 4);

        // V_out rail voltage tag above load
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = metrics.isBrownout ? COLORS.crimson : COLORS.emerald;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`V_out ${sim.instVout.toFixed(2)}V`, xLoad - 6, railTopY - 7);
        ctx.restore();

        // ---- Ground Symbol ----
        ctx.save();
        ctx.strokeStyle = COLORS.textDim;
        ctx.lineWidth = 1.6;
        const gx = xSw;
        ctx.beginPath();
        ctx.moveTo(gx, railGndY);
        ctx.lineTo(gx, railGndY + 6);
        ctx.moveTo(gx - 8, railGndY + 6);
        ctx.lineTo(gx + 8, railGndY + 6);
        ctx.moveTo(gx - 5, railGndY + 10);
        ctx.lineTo(gx + 5, railGndY + 10);
        ctx.moveTo(gx - 2, railGndY + 14);
        ctx.lineTo(gx + 2, railGndY + 14);
        ctx.stroke();
        ctx.restore();

        // ---- Animated Glowing Current Loop Particles ----
        if (!inDcmDead) {
          const particleCount = Math.round(7 + clamp(sim.instLoadA / 4.5, 0, 7));
          const pRadius = surging ? 3.1 : 2.5;
          if (onPhase) {
            // Active ON loop: V_in -> Q1 -> L_par -> L -> Load -> GND -> V_in
            const onPath = [
              [xVin, railGndY],
              [xVin, railTopY],
              [xSw, railTopY],
              [xIndR, railTopY],
              [xLoad, railTopY],
              [xLoad, railGndY],
              [xVin, railGndY],
            ];
            const pColor = metrics.isFault
              ? COLORS.crimson
              : surging
                ? '#64FFDA'
                : COLORS.cyan;
            drawFlowParticles(ctx, onPath, particleCount, sim.particleOffset, pColor, pRadius, 0.95);
          } else {
            // Active OFF freewheeling loop: GND -> Q2 -> L_par -> L -> Load -> GND
            const offPath = [
              [xSw, railGndY],
              [xSw, railTopY],
              [xIndR, railTopY],
              [xLoad, railTopY],
              [xLoad, railGndY],
              [xSw, railGndY],
            ];
            const pColor = metrics.isBrownout ? COLORS.crimson : COLORS.amber;
            drawFlowParticles(ctx, offPath, Math.max(6, particleCount - 1), sim.particleOffset, pColor, pRadius, 0.92);
          }
        }
      }

      // ---- Drawing Helpers: Bottom 62% Synchronized 3-Trace Digital Oscilloscope ----
      function drawScopeGraticule(x, y, w, h) {
        ctx.save();
        ctx.strokeStyle = COLORS.gridMinor;
        ctx.lineWidth = 1;
        const cols = 10;
        const rows = 4;
        for (let c = 1; c < cols; c++) {
          const gx = x + (w * c) / cols;
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.lineTo(gx, y + h);
          ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
          const gy = y + (h * r) / rows;
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.lineTo(x + w, gy);
          ctx.stroke();
        }
        ctx.strokeStyle = COLORS.panelBorder;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }

      function drawScopeBadge(text, rightX, topY, color, rgb) {
        ctx.save();
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        const tw = ctx.measureText(text).width;
        const bw = tw + 14;
        const bh = 17;
        const bx = rightX - bw;
        drawRoundedRect(ctx, bx, topY, bw, bh, 4);
        ctx.fillStyle = `rgba(${rgb}, 0.2)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb}, 0.85)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + bw * 0.5, topY + bh * 0.5 + 0.5);
        ctx.restore();
      }

      function drawOscilloscopePane(startY, paneH, nowSec) {
        const hi = activeHighlight();
        const padL = 56;
        const padR = 16;
        const topPad = 14;
        const botPad = 12;
        const laneGap = 8;

        const plotW = Math.max(120, cssW - padL - padR);
        const usableH = paneH - topPad - botPad - laneGap * 2;
        const ch1H = usableH * 0.33;
        const ch2H = usableH * 0.32;
        const ch3H = usableH * 0.35;

        const ch1Y = startY + topPad;
        const ch2Y = ch1Y + ch1H + laneGap;
        const ch3Y = ch2Y + ch2H + laneGap;

        const numCycles = 3.2;
        const phaseScroll = sim.pwmPhase; // synchronized with schematic PWM!

        // ============================================================
        // CHANNEL 1: V_sw (Cyan) + Exact Damped Parasitic LC Ringing
        // ============================================================
        drawScopeGraticule(padL, ch1Y, plotW, ch1H);
        const vMaxCh1 = 50.0;
        const vMinCh1 = -4.0;
        const mapY1 = (v) =>
          ch1Y + ch1H - ((clamp(v, vMinCh1, vMaxCh1) - vMinCh1) / (vMaxCh1 - vMinCh1)) * ch1H;

        // 0 V and 24 V reference lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, mapY1(0));
        ctx.lineTo(padL + plotW, mapY1(0));
        ctx.stroke();

        // 36 V MOSFET V_DS Overvoltage limit line (dashed Crimson)
        const yLimit36 = mapY1(metrics.vDsLimitV);
        ctx.strokeStyle = metrics.isOvervoltage
          ? `rgba(${COLORS.crimsonRgb}, 0.85)`
          : `rgba(${COLORS.crimsonRgb}, 0.38)`;
        ctx.lineWidth = metrics.isOvervoltage ? 1.4 : 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, yLimit36);
        ctx.lineTo(padL + plotW, yLimit36);
        ctx.stroke();
        ctx.setLineDash([]);

        // Y-axis scale labels for CH1
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.crimson;
        ctx.fillText('36V', padL - 6, yLimit36);
        ctx.fillStyle = COLORS.cyan;
        ctx.fillText('24V', padL - 6, mapY1(24));
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText('0V', padL - 6, mapY1(0));
        ctx.restore();

        // Render CH1 V_sw trace using exact damped sinusoidal formula
        // Zoomed edge-ringing timescale preserves authentic f_ring ∝ 1/√L_par & damping ζ
        const isCh1Hi = hi === 'vswPeak' || hi === 'fRing';
        const samples1 = Math.max(240, Math.round(plotW * 0.9));
        // Real edge ringing duration scaled into visual cycle fraction (~32% of ON window at 42nH)
        const timeStretchS = 140e-9; // maps cycle fraction to nanosecond ringing envelope
        const ringTraceColor = metrics.isOvervoltage ? COLORS.crimson : COLORS.cyan;

        let firstPeakPx = null;
        let firstPeakPy = null;

        ctx.save();
        ctx.beginPath();
        ctx.rect(padL, ch1Y, plotW, ch1H);
        ctx.clip();

        ctx.strokeStyle = isCh1Hi ? COLORS.violet : COLORS.cyan;
        ctx.lineWidth = isCh1Hi ? 2.4 : 1.9;
        ctx.shadowColor = isCh1Hi ? COLORS.violet : COLORS.cyan;
        ctx.shadowBlur = isCh1Hi ? 12 : 6;

        ctx.beginPath();
        for (let i = 0; i <= samples1; i++) {
          const u = i / samples1;
          const cyc = (u * numCycles + phaseScroll) % 1.0;
          let vSw = 0;

          if (cyc < metrics.duty) {
            // Exact rising-edge ringing formula: V_in * (1 + A_ring * exp(-zeta * w_r * t) * sin(w_r * t))
            const tauSec = cyc * timeStretchS;
            vSw = evaluateVswRinging(tauSec, metrics);
            // Track first clearly visible ringing peak inside plot for callout
            if (
              firstPeakPx === null &&
              u > 0.14 &&
              u < 0.72 &&
              Math.abs(metrics.omegaR * tauSec - Math.atan(1 / metrics.zeta)) < 0.45
            ) {
              firstPeakPx = padL + u * plotW;
              firstPeakPy = mapY1(metrics.vSwPeak);
            }
          } else {
            // Subtle negative undershoot on falling edge
            const fallTau = (cyc - metrics.duty) * timeStretchS;
            const under =
              -0.14 *
              metrics.aRing *
              metrics.vIn *
              Math.exp(-metrics.zeta * 1.4 * metrics.omegaR * fallTau) *
              Math.sin(metrics.omegaR * fallTau);
            vSw = Math.max(-3.2, under);
          }

          const px = padL + u * plotW;
          const py = mapY1(vSw);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Highlight overshoot region above 36 V in glowing Crimson
        if (metrics.isOvervoltage) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(padL, ch1Y, plotW, Math.max(0, yLimit36 - ch1Y));
          ctx.clip();
          ctx.strokeStyle = COLORS.crimson;
          ctx.lineWidth = 2.6;
          ctx.shadowColor = COLORS.crimson;
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }

        // Peak marker callout on ringing overshoot when overvoltage or equation-hovered
        if (firstPeakPx !== null && (metrics.isOvervoltage || isCh1Hi)) {
          const pulse = 0.65 + 0.35 * Math.sin(nowSec * 9);
          ctx.shadowBlur = 10;
          ctx.shadowColor = ringTraceColor;
          ctx.fillStyle = isCh1Hi ? COLORS.violet : COLORS.crimson;
          ctx.beginPath();
          ctx.arc(firstPeakPx, firstPeakPy, 3.8 + pulse * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.font = '700 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = isCh1Hi ? COLORS.violet : COLORS.crimson;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const tag =
            hi === 'fRing'
              ? `f_ring = ${metrics.fRingMhz.toFixed(1)} MHz`
              : `Peak ${metrics.vSwPeak.toFixed(1)} V`;
          ctx.fillText(tag, Math.min(padL + plotW - 115, firstPeakPx + 8), Math.max(ch1Y + 12, firstPeakPy));
        }
        ctx.restore();

        // CH1 header & status badge
        ctx.save();
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          `CH1  V_sw  •  Peak ${metrics.vSwPeak.toFixed(1)}V  •  f_ring ${metrics.fRingMhz.toFixed(1)}MHz`,
          padL + 8,
          ch1Y + 5
        );
        ctx.restore();

        if (metrics.isOvervoltage) {
          drawScopeBadge(
            'MOSFET V_DS OVERVOLTAGE!',
            padL + plotW - 6,
            ch1Y + 4,
            COLORS.crimson,
            COLORS.crimsonRgb
          );
        }

        // ============================================================
        // CHANNEL 2: i_L (Amber) — Exact Triangular Ripple + DCM Flag
        // ============================================================
        drawScopeGraticule(padL, ch2Y, plotW, ch2H);

        const iAvgNow = sim.instLoadA;
        const inDcmNow = iAvgNow - 0.5 * metrics.deltaI <= 0;
        const iMaxScale = Math.max(8, Math.ceil((metrics.iPeakLoad + 0.5 * metrics.deltaI + 2) / 4) * 4);
        const iMinScale = -0.6;
        const mapY2 = (amps) =>
          ch2Y + ch2H - ((clamp(amps, iMinScale, iMaxScale) - iMinScale) / (iMaxScale - iMinScale)) * ch2H;

        const yZeroA = mapY2(0);
        const yAvgA = mapY2(iAvgNow);

        ctx.save();
        // 0 A floor line
        ctx.strokeStyle = metrics.isDcm
          ? `rgba(${COLORS.amberRgb}, 0.65)`
          : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = metrics.isDcm ? 1.3 : 1;
        ctx.beginPath();
        ctx.moveTo(padL, yZeroA);
        ctx.lineTo(padL + plotW, yZeroA);
        ctx.stroke();

        // Average load current dashed guide
        ctx.strokeStyle = `rgba(${COLORS.amberRgb}, 0.25)`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, yAvgA);
        ctx.lineTo(padL + plotW, yAvgA);
        ctx.stroke();
        ctx.setLineDash([]);

        // Y-axis ticks
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.amber;
        ctx.fillText(`${iMaxScale}A`, padL - 6, ch2Y + 8);
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText('0A', padL - 6, yZeroA);
        ctx.restore();

        // Draw exact triangular inductor waveform i_L(t)
        const isCh2Hi = hi === 'deltaI';
        const samples2 = Math.max(220, Math.round(plotW * 0.85));
        const dcmK = inDcmNow
          ? Math.sqrt(Math.max(0, (2 * iAvgNow) / Math.max(metrics.deltaI, 1e-9)))
          : 1.0;

        ctx.save();
        ctx.beginPath();
        ctx.rect(padL, ch2Y, plotW, ch2H);
        ctx.clip();

        ctx.strokeStyle = isCh2Hi ? '#FFD54F' : COLORS.amber;
        ctx.lineWidth = isCh2Hi ? 2.6 : 2.0;
        ctx.shadowColor = COLORS.amber;
        ctx.shadowBlur = isCh2Hi ? 12 : 6;

        ctx.beginPath();
        for (let i = 0; i <= samples2; i++) {
          const u = i / samples2;
          const cyc = (u * numCycles + phaseScroll) % 1.0;
          let iVal = 0;

          if (!inDcmNow) {
            // Continuous Conduction Mode: exact triangle I_load ± ΔI_L/2
            if (cyc < metrics.duty) {
              const frac = cyc / metrics.duty;
              iVal = iAvgNow - 0.5 * metrics.deltaI + frac * metrics.deltaI;
            } else {
              const frac = (cyc - metrics.duty) / (1.0 - metrics.duty);
              iVal = iAvgNow + 0.5 * metrics.deltaI - frac * metrics.deltaI;
            }
          } else {
            // Discontinuous Conduction Mode: ramps from 0 -> peak -> 0 -> flat 0 A dead-time
            const tOn = metrics.duty * dcmK;
            const tEnd = dcmK;
            const iPkDcm = metrics.deltaI * dcmK;
            if (cyc < tOn && tOn > 1e-5) {
              iVal = (cyc / tOn) * iPkDcm;
            } else if (cyc < tEnd && tEnd - tOn > 1e-5) {
              iVal = (1.0 - (cyc - tOn) / (tEnd - tOn)) * iPkDcm;
            } else {
              iVal = 0;
            }
          }

          const px = padL + u * plotW;
          const py = mapY2(iVal);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // ΔI_L vertical caliper when hovered in equation
        if (isCh2Hi) {
          const calX = padL + plotW * 0.52;
          const iTop = inDcmNow ? metrics.deltaI * dcmK : iAvgNow + 0.5 * metrics.deltaI;
          const iBot = inDcmNow ? 0 : iAvgNow - 0.5 * metrics.deltaI;
          const yT = mapY2(iTop);
          const yB = mapY2(iBot);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#FFD54F';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(calX, yT);
          ctx.lineTo(calX, yB);
          ctx.moveTo(calX - 5, yT);
          ctx.lineTo(calX + 5, yT);
          ctx.moveTo(calX - 5, yB);
          ctx.lineTo(calX + 5, yB);
          ctx.stroke();

          ctx.font = '700 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FFD54F';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(`ΔI_L = ${metrics.deltaI.toFixed(2)} A`, calX + 8, (yT + yB) * 0.5);
        }
        ctx.restore();

        // CH2 header & DCM badge
        ctx.save();
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = COLORS.amber;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          `CH2  i_L  •  I_load ${iAvgNow.toFixed(1)}A  •  ΔI_L ${metrics.deltaI.toFixed(2)}A`,
          padL + 8,
          ch2Y + 5
        );
        ctx.restore();

        if (metrics.isDcm) {
          drawScopeBadge(
            'DCM (Discontinuous)',
            padL + plotW - 6,
            ch2Y + 4,
            COLORS.amber,
            COLORS.amberRgb
          );
        }

        // ============================================================
        // CHANNEL 3: V_out (Emerald) — Switching Ripple + Load-Step Droop
        // ============================================================
        drawScopeGraticule(padL, ch3Y, plotW, ch3H);

        // Adaptive vertical window centered near V_out so both mV ripple and 30% brownout droop are crisp
        const spanDown = Math.max(metrics.vOut * 0.14, metrics.droopV * 1.28 + metrics.rippleV);
        const spanUp = Math.max(metrics.vOut * 0.06, metrics.droopV * 0.42 + metrics.rippleV);
        const vTopCh3 = metrics.vOut + spanUp;
        const vBotCh3 = Math.max(0, metrics.vOut - spanDown);
        const mapY3 = (v) =>
          ch3Y + ch3H - ((clamp(v, vBotCh3, vTopCh3) - vBotCh3) / Math.max(0.05, vTopCh3 - vBotCh3)) * ch3H;

        const yTargetV = mapY3(metrics.vOut);
        const yBrownoutV = mapY3(metrics.brownoutLimitV);
        const isVoutHi = hi === 'vout';
        const isRippleHi = hi === 'rippleMv';

        ctx.save();
        // Target V_out line (Emerald)
        ctx.strokeStyle = isVoutHi
          ? `rgba(${COLORS.emeraldRgb}, 0.85)`
          : `rgba(${COLORS.emeraldRgb}, 0.28)`;
        ctx.lineWidth = isVoutHi ? 1.5 : 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, yTargetV);
        ctx.lineTo(padL + plotW, yTargetV);
        ctx.stroke();

        // -8% Brownout threshold line (dashed Crimson)
        ctx.strokeStyle = metrics.isBrownout
          ? `rgba(${COLORS.crimsonRgb}, 0.85)`
          : `rgba(${COLORS.crimsonRgb}, 0.36)`;
        ctx.lineWidth = metrics.isBrownout ? 1.4 : 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, yBrownoutV);
        ctx.lineTo(padL + plotW, yBrownoutV);
        ctx.stroke();
        ctx.setLineDash([]);

        // Y-axis scale ticks for CH3
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.emerald;
        ctx.fillText(`${metrics.vOut.toFixed(1)}V`, padL - 6, yTargetV);
        ctx.fillStyle = COLORS.crimson;
        ctx.fillText('-8%', padL - 6, yBrownoutV);
        ctx.restore();

        // Draw rolling CH3 output rail with live switching ripple + load-step droop
        ctx.save();
        ctx.beginPath();
        ctx.rect(padL, ch3Y, plotW, ch3H);
        ctx.clip();

        // Subtle switching-ripple translucent band when ΔV_out is hovered
        if (isRippleHi) {
          const halfRipPx = Math.max(
            3.5,
            ((0.5 * metrics.rippleV) / Math.max(0.05, vTopCh3 - vBotCh3)) * ch3H
          );
          ctx.fillStyle = `rgba(${COLORS.emeraldRgb}, 0.14)`;
          ctx.fillRect(padL, yTargetV - halfRipPx, plotW, halfRipPx * 2);
        }

        // Render rolling trace with high-frequency switching ripple riding smoothly on top
        const ch3TraceColor = metrics.isBrownout ? COLORS.crimson : COLORS.emerald;
        let lowestPx = null;
        let lowestPy = -Infinity;
        let lowestVal = Infinity;

        ctx.strokeStyle = ch3TraceColor;
        ctx.lineWidth = isVoutHi || isRippleHi ? 2.5 : 2.0;
        ctx.shadowColor = ch3TraceColor;
        ctx.shadowBlur = isVoutHi || metrics.isBrownout ? 11 : 6;

        ctx.beginPath();
        for (let i = 0; i < CH3_HISTORY_LEN; i++) {
          const idx = (sim.ch3Cursor + i) % CH3_HISTORY_LEN;
          const u = i / (CH3_HISTORY_LEN - 1);
          const baseV = sim.ch3Samples[idx];
          const ripV = sim.ch3RippleAmp[idx];
          // Superpose crisp triangular switching ripple visually proportional to ΔV_pp
          const ripWave = Math.sin(u * 92 + sim.simTime * 18) * (0.5 * ripV);
          const v = baseV + ripWave;
          const px = padL + u * plotW;
          const py = mapY3(v);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          if (v < lowestVal) {
            lowestVal = v;
            lowestPx = px;
            lowestPy = py;
          }
        }
        ctx.stroke();

        // Droop caliper at deepest transient valley if load step > 0
        if (metrics.loadStepA > 0 && lowestPx !== null && metrics.vOut - lowestVal > metrics.vOut * 0.012) {
          ctx.shadowBlur = 0;
          const dipColor = metrics.isBrownout ? COLORS.crimson : COLORS.emerald;
          ctx.strokeStyle = dipColor;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(lowestPx, yTargetV);
          ctx.lineTo(lowestPx, lowestPy);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = dipColor;
          ctx.beginPath();
          ctx.arc(lowestPx, lowestPy, 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = lowestPx > padL + plotW * 0.72 ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          const tx = lowestPx > padL + plotW * 0.72 ? lowestPx - 7 : lowestPx + 7;
          ctx.fillText(
            `−${metrics.droopV.toFixed(2)}V (−${metrics.droopPct.toFixed(1)}%)`,
            tx,
            Math.min(ch3Y + ch3H - 10, lowestPy + 2)
          );
        }

        // Live phosphor dot on right edge of CH3 rolling trace
        const rightY = mapY3(sim.instVout);
        ctx.fillStyle = ch3TraceColor;
        ctx.shadowColor = ch3TraceColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(padL + plotW - 1, rightY, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // CH3 header & BROWNOUT badge
        ctx.save();
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = metrics.isBrownout ? COLORS.crimson : COLORS.emerald;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          `CH3  V_out  •  ${metrics.vOut.toFixed(2)}V  •  ΔV_pp ${metrics.rippleMv.toFixed(1)}mV  •  Droop −${metrics.droopPct.toFixed(1)}%`,
          padL + 8,
          ch3Y + 5
        );
        ctx.restore();

        if (metrics.isBrownout) {
          drawScopeBadge(
            'BROWNOUT! (>8% DIP)',
            padL + plotW - 6,
            ch3Y + 4,
            COLORS.crimson,
            COLORS.crimsonRgb
          );
        }
      }

      function render(nowMs) {
        const nowSec = nowMs * 0.001;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Dead-front pitch-black canvas backdrop
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, cssW, cssH);

        // Subtle crimson fault vignette during overvoltage or brownout
        if (sim.faultFlash > 0.02) {
          const pulse = 0.75 + 0.25 * Math.sin(nowSec * 10);
          const vig = ctx.createRadialGradient(
            cssW * 0.5,
            cssH * 0.5,
            Math.min(cssW, cssH) * 0.25,
            cssW * 0.5,
            cssH * 0.5,
            Math.max(cssW, cssH) * 0.72
          );
          vig.addColorStop(0, 'rgba(255, 23, 68, 0)');
          vig.addColorStop(1, `rgba(255, 23, 68, ${0.18 * sim.faultFlash * pulse})`);
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, cssW, cssH);
        }

        // Exact 38% Top Schematic / 62% Bottom 3-Trace Oscilloscope split
        const splitY = Math.round(cssH * 0.38);

        drawSchematicPane(0, splitY, nowSec);

        // Crisp instrument divider line between Schematic and Oscilloscope
        ctx.save();
        const divGrad = ctx.createLinearGradient(0, splitY, cssW, splitY);
        divGrad.addColorStop(0, 'rgba(255,255,255,0.02)');
        divGrad.addColorStop(0.5, metrics.isFault ? 'rgba(255,23,68,0.45)' : 'rgba(0,229,255,0.28)');
        divGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, splitY + 0.5);
        ctx.lineTo(cssW, splitY + 0.5);
        ctx.stroke();
        ctx.restore();

        drawOscilloscopePane(splitY, cssH - splitY, nowSec);

        ctx.restore();
      }

      // ---- Telemetry & Linked-Equation Push (~20 Hz) ----
      let lastTelemetryPush = 0;
      function pushLiveReadouts(nowMs) {
        if (nowMs - lastTelemetryPush < 50) return;
        lastTelemetryPush = nowMs;

        const voutTone = metrics.isBrownout ? 'crimson' : 'emerald';
        const vswTone = metrics.isOvervoltage ? 'crimson' : metrics.vSwPeak > 33 ? 'amber' : 'cyan';
        const droopTone = metrics.isBrownout ? 'crimson' : metrics.droopPct > 5 ? 'amber' : 'emerald';
        const statusTone = metrics.isFault ? 'crimson' : metrics.isDcm ? 'amber' : 'emerald';

        const statusText = metrics.isOvervoltage && metrics.isBrownout
          ? 'PDN FAULT!'
          : metrics.isOvervoltage
            ? 'V_DS OVERVOLT!'
            : metrics.isBrownout
              ? 'BROWNOUT!'
              : metrics.isDcm
                ? 'DCM MODE'
                : 'CLEAN • CCM';

        const telemetryPayload = {
          vout: {
            value: sim.instVout.toFixed(2),
            color: voutTone,
          },
          vswPeak: {
            value: metrics.vSwPeak.toFixed(1),
            color: vswTone,
          },
          droopPct: {
            value: `-${metrics.droopPct.toFixed(1)}`,
            color: droopTone,
          },
          pdnStatus: {
            value: statusText,
            color: statusTone,
          },
        };

        const eqPayload = {
          vout: { value: metrics.vOut, color: voutTone },
          deltaI: { value: metrics.deltaI, color: 'amber' },
          rippleMv: { value: metrics.rippleMv, color: metrics.isBrownout ? 'crimson' : 'emerald' },
          vswPeak: { value: metrics.vSwPeak, color: vswTone },
          fRing: { value: metrics.fRingMhz, color: metrics.isOvervoltage ? 'crimson' : 'violet' },
        };

        const statusObj = metrics.isFault
          ? { level: 'fault', label: statusText }
          : metrics.isDcm
            ? { level: 'warning', label: 'DCM (Discontinuous)' }
            : { level: 'safe', label: 'CLEAN POWER INTEGRITY' };

        try {
          if (typeof api.updateTelemetry === 'function') api.updateTelemetry(telemetryPayload, statusObj);
          else if (typeof api.setTelemetry === 'function') api.setTelemetry(telemetryPayload, statusObj);

          if (typeof api.updateEquation === 'function') api.updateEquation(eqPayload);
          else if (typeof api.updateEquationValues === 'function') api.updateEquationValues(eqPayload);
          else if (typeof api.setEquationValues === 'function') api.setEquationValues(eqPayload);
        } catch {
          // Keep animation running even if host callback throws
        }
      }

      // ---- Pointer Interaction (Schematic Hover + Click Load to Trigger Surge) ----
      function inBox(x, y, box) {
        return box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
      }

      function detectSchematicHover(sx, sy) {
        if (inBox(sx, sy, hitBoxes.lPar) || inBox(sx, sy, hitBoxes.vSwNode)) return 'vswPeak';
        if (inBox(sx, sy, hitBoxes.inductor)) return 'deltaI';
        if (inBox(sx, sy, hitBoxes.cOut)) return 'rippleMv';
        if (inBox(sx, sy, hitBoxes.load)) return 'vout';
        return null;
      }

      const onPointerMove = (ev) => {
        const rect = canvas.getBoundingClientRect();
        const sx = ev.clientX - rect.left;
        const sy = ev.clientY - rect.top;

        const nextVar = detectSchematicHover(sx, sy);
        canvas.style.cursor = inBox(sx, sy, hitBoxes.load) ? 'pointer' : nextVar ? 'help' : 'default';

        if (nextVar !== canvasHoverVar) {
          canvasHoverVar = nextVar;
          if (!highlightedVar && typeof api.setHighlightedVar === 'function') {
            try {
              api.setHighlightedVar(nextVar);
            } catch {
              // Ignore
            }
          }
        }
      };

      const onPointerDown = (ev) => {
        const rect = canvas.getBoundingClientRect();
        const sx = ev.clientX - rect.left;
        const sy = ev.clientY - rect.top;
        if (inBox(sx, sy, hitBoxes.load)) {
          if (params.loadStepA <= 0) {
            params.loadStepA = 10;
            pushShellControl('loadStepA', 10);
            recomputeMetrics(false);
          }
          triggerLoadSurgeNow();
        }
      };

      const onPointerLeave = () => {
        canvas.style.cursor = 'default';
        if (canvasHoverVar !== null) {
          canvasHoverVar = null;
          if (!highlightedVar && typeof api.setHighlightedVar === 'function') {
            try {
              api.setHighlightedVar(null);
            } catch {
              // Ignore
            }
          }
        }
      };

      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerleave', onPointerLeave);

      // ---- Subscribe to FrontierLessonShell Events ----
      const unsubs = [];
      const registerSub = (fn, handler) => {
        if (typeof fn === 'function') {
          const maybeUnsub = fn(handler);
          if (typeof maybeUnsub === 'function') unsubs.push(maybeUnsub);
        }
      };

      registerSub(api.onControlChange, (id, val) => {
        if (id && typeof id === 'object') {
          for (const [k, v] of Object.entries(id)) applyControl(k, v);
        } else {
          applyControl(id, val);
        }
      });
      registerSub(api.onParamChange, (id, val) => {
        if (id && typeof id === 'object') {
          for (const [k, v] of Object.entries(id)) applyControl(k, v);
        } else {
          applyControl(id, val);
        }
      });
      registerSub(api.onBreakToggle, (active) => applyBreakMode(active));
      registerSub(api.onBreakChange, (active) => applyBreakMode(active));
      registerSub(api.onReset, () => resetWorld());
      registerSub(api.onHoverVar, (key) => {
        highlightedVar = key || null;
      });
      registerSub(api.onHighlightChange, (key) => {
        highlightedVar = key || null;
      });

      // Responsive ResizeObserver
      updateViewport();
      let resizeObserver = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => updateViewport());
        resizeObserver.observe(canvasHost);
      }
      const onWinResize = () => updateViewport();
      window.addEventListener('resize', onWinResize);

      // ---- 60 FPS Animation Loop ----
      let rafId = 0;
      let destroyed = false;
      let lastFrameMs = performance.now();

      function tick(nowMs) {
        if (destroyed) return;
        const dt = clamp((nowMs - lastFrameMs) * 0.001, 0, 0.05);
        lastFrameMs = nowMs;

        stepSim(dt);
        render(nowMs);
        pushLiveReadouts(nowMs);

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);

      // Return imperative control handle compatible with FrontierLessonShell
      const controller = {
        setControl(id, val) {
          applyControl(id, val);
        },
        updateControl(id, val) {
          applyControl(id, val);
        },
        setParam(id, val) {
          applyControl(id, val);
        },
        setParams(obj) {
          if (obj && typeof obj === 'object') {
            for (const [k, v] of Object.entries(obj)) applyControl(k, v);
          }
        },
        setBreakMode(active) {
          applyBreakMode(active);
        },
        onBreakToggle(active) {
          applyBreakMode(active);
        },
        setHighlightedVar(key) {
          highlightedVar = key || null;
        },
        highlightVar(key) {
          highlightedVar = key || null;
        },
        onHoverVar(key) {
          highlightedVar = key || null;
        },
        reset() {
          resetWorld();
        },
        resize() {
          updateViewport();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          cancelAnimationFrame(rafId);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointerleave', onPointerLeave);
          window.removeEventListener('resize', onWinResize);
          if (resizeObserver) resizeObserver.disconnect();
          for (const u of unsubs) {
            try {
              u();
            } catch {
              // Ignore unsubscribe error
            }
          }
          canvasHost.classList.remove('is-fault');
          if (canvas.parentNode === canvasHost) {
            canvasHost.removeChild(canvas);
          }
        },
      };
      controller.dispose = controller.destroy;

      return controller;
    },
  };
}

export default createF21PowerLab;

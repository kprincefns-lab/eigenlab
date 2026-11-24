/**
 * EIGENLAB — Foundation Lab F3.1: Setup/Hold Timing, Clock Skew & Metastability
 * 60 FPS dead-front digital pipeline datapath + bistable potential well +
 * multi-trace nanosecond logic analyzer illustrating FPGA/SoC static timing
 * analysis (STA), clock skew, and flip-flop metastability.
 *
 * Native ES Module (zero external dependencies).
 */

const COLORS = Object.freeze({
  bg: '#0A0C10',
  panel: '#121620',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  gridMajor: 'rgba(255, 255, 255, 0.06)',
  gridMinor: 'rgba(255, 255, 255, 0.022)',
  axisLabel: 'rgba(165, 176, 199, 0.56)',
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
  wireIdle: 'rgba(139, 151, 176, 0.34)',
});

/**
 * Standard-cell flip-flop timing constants (nanoseconds).
 */
export const TIMING_CONSTANTS = Object.freeze({
  tCqNs: 0.6,
  tSuNs: 0.5,
  tHoldNs: 0.4,
});

const PRESET_PARAMS = Object.freeze({
  nominal: Object.freeze({ fClkMhz: 200, tCombNs: 2.2, tSkewNs: 0.0 }),
  'setup-fail': Object.freeze({ fClkMhz: 360, tCombNs: 2.4, tSkewNs: 0.1 }),
  'hold-fail': Object.freeze({ fClkMhz: 150, tCombNs: 0.3, tSkewNs: 0.9 }),
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function finiteOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtSigned(v, decimals = 2) {
  if (!Number.isFinite(v)) return '0.00';
  const sign = v > 0.0005 ? '+' : v < -0.0005 ? '−' : '+';
  return `${sign}${Math.abs(v).toFixed(decimals)}`;
}

/**
 * Pure static timing analysis (STA) calculation for FF1 -> Combinational Logic -> FF2.
 *
 * Equations:
 *   T_clk      = 1000 / f_clk
 *   S_su       = T_clk + t_skew - (t_cq + t_comb + t_su)
 *   S_h        = (t_cq + t_comb) - (t_h + t_skew)
 *   f_max      = 1000 / (t_cq + t_comb + t_su - t_skew)
 *
 * All outputs are strictly finite (zero NaN/Infinity).
 */
export function computeDigitalTiming(fClkMhz, tCombNs, tSkewNs) {
  const safeFClk = clamp(finiteOr(fClkMhz, 200), 10, 2000);
  const safeTComb = clamp(finiteOr(tCombNs, 2.2), 0.05, 20);
  const safeTSkew = clamp(finiteOr(tSkewNs, 0.0), -5, 5);

  const { tCqNs, tSuNs, tHoldNs } = TIMING_CONSTANTS;
  const tClkNs = 1000.0 / safeFClk;
  const tArrivalNs = tCqNs + safeTComb;
  const tRequiredSetupNs = tArrivalNs + tSuNs;
  const setupSlackNs = tClkNs + safeTSkew - tRequiredSetupNs;
  const holdSlackNs = tArrivalNs - (tHoldNs + safeTSkew);

  const rawMinPeriodNs = tCqNs + safeTComb + tSuNs - safeTSkew;
  const setupUnbounded = rawMinPeriodNs <= 0.05;
  const tMinPeriodNs = setupUnbounded ? 0.05 : rawMinPeriodNs;
  const fMaxMhz = setupUnbounded ? 9999 : 1000.0 / tMinPeriodNs;

  const setupViolated = setupSlackNs < -1e-9;
  const holdViolated = holdSlackNs < -1e-9;
  const isMetastable = setupViolated || holdViolated;
  const isTight = !isMetastable && (setupSlackNs < 0.35 || holdSlackNs < 0.25);

  // Metastability severity in [0, 1] scaled by worst negative slack
  const worstNeg = Math.max(0, -setupSlackNs, -holdSlackNs);
  const severity = isMetastable ? clamp(0.28 + worstNeg * 0.95, 0.28, 1.0) : 0;

  return {
    fClkMhz: safeFClk,
    tClkNs,
    tCqNs,
    tCombNs: safeTComb,
    tSkewNs: safeTSkew,
    tSuNs,
    tHoldNs,
    tArrivalNs,
    setupSlackNs,
    holdSlackNs,
    fMaxMhz,
    setupUnbounded,
    setupViolated,
    holdViolated,
    isMetastable,
    isTight,
    severity,
  };
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

function drawDoubleArrow(ctx, x1, y, x2, color, headSize = 5.5) {
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const span = right - left;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  if (span > 4) {
    const hs = Math.min(headSize, span * 0.35);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + hs, y - hs * 0.65);
    ctx.lineTo(left + hs, y + hs * 0.65);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(right, y);
    ctx.lineTo(right - hs, y - hs * 0.65);
    ctx.lineTo(right - hs, y + hs * 0.65);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawLabelPill(ctx, cx, cy, text, accentHex, accentRgb, fontSize = 10) {
  ctx.save();
  ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
  const padX = 6;
  const h = fontSize + 7;
  const w = ctx.measureText(text).width + padX * 2;
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  drawRoundedRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = 'rgba(10, 12, 16, 0.90)';
  ctx.fill();
  ctx.strokeStyle = `rgba(${accentRgb}, 0.55)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = accentHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

/**
 * Factory creating the FrontierLessonShell descriptor for Lab F3.1.
 */
export function createF31TimingLab() {
  return {
    nodeId: 'F3.1',
    tier: 1,
    badge: 'TIER 1 • DIGITAL LOGIC & AI SILICON',
    title: 'Setup/Hold Timing, Clock Skew & Metastability',
    subtitle:
      'Push clock frequency and skew across flip-flop setup/hold apertures to see why real-time FPGA/SoC pipelines fail',

    breakMode: {
      buttonLabel: '⚡ Break: Overclock + Skew Violation',
      activeLabel: '🔥 Metastable Timing Fault',
      activeBanner:
        '🔥 SETUP VIOLATION — f_clk = 360 MHz (T_clk = 2.78 ns) breaches FF2 Setup Aperture (S_su = −0.62 ns) → Metastable Q₂',
      triggerLabel: '⚡ Break: Overclock + Skew Violation',
      recoverLabel: '✓ Restore Nominal 200 MHz Clock',
      description:
        'Cranks clock frequency to 360 MHz (T_clk = 2.78 ns) with t_comb = 2.4 ns and t_skew = +0.10 ns, driving Setup Slack to −0.62 ns and trapping FF2 on the metastable V_DD/2 ridge.',
      failureSymptom:
        'Data D₂ arrives inside FF2’s Amber Setup Aperture: Q₂ collapses into jittering crimson V_DD/2 ringing, the voltage ball balances on the unstable hill peak, and random bit flips corrupt the pipeline.',
      recoveryHint:
        'Lower f_clk below f_max (294 MHz) or shorten t_comb to restore positive Setup Slack — then switch to the Hold Fail preset to discover the silicon bug that slowing the clock CANNOT fix!',
      faultControls: {
        fClkMhz: 360,
        tCombNs: 2.4,
        tSkewNs: 0.1,
        faultPreset: 'setup-fail',
      },
    },

    telemetryDefs: [
      {
        id: 'setupSlack',
        key: 'setupSlack',
        label: 'Setup Slack S_su',
        unit: 'ns',
        initialValue: '+1.70',
        color: 'emerald',
      },
      {
        id: 'holdSlack',
        key: 'holdSlack',
        label: 'Hold Slack S_h',
        unit: 'ns',
        initialValue: '+2.40',
        color: 'emerald',
      },
      {
        id: 'fMax',
        key: 'fMax',
        label: 'Max Safe f_max',
        unit: 'MHz',
        initialValue: '303',
        color: 'cyan',
      },
      {
        id: 'pipelineState',
        key: 'pipelineState',
        label: 'Capture State',
        unit: '',
        initialValue: 'LOCKED • 0 err',
        color: 'emerald',
      },
    ],

    equationSpec: {
      caption: 'Static Timing Analysis (t_cq = 0.6 ns, t_su = 0.5 ns, t_h = 0.4 ns)',
      parts: [
        {
          type: 'var',
          key: 'setupSlack',
          symbol: 'S_{\\text{su}}',
          label: 'Setup Slack S_su',
          color: 'emerald',
          unit: 'ns',
          decimals: 2,
          initialValue: 1.7,
          tooltip:
            'Setup margin T_clk + t_skew − (t_cq + t_comb + t_su). Must be ≥ 0 before CLK₂ ↑ or FF2 samples mid-transition.',
        },
        { type: 'op', text: '=' },
        {
          type: 'var',
          key: 'tClk',
          symbol: 'T_{\\text{clk}}',
          label: 'Clock Period T_clk',
          color: 'cyan',
          unit: 'ns',
          decimals: 2,
          initialValue: 5.0,
          tooltip:
            'Clock cycle period 1000 / f_clk (ns). Increasing T_clk (lowering f_clk) adds Setup Slack, but cancels out of Hold Slack.',
        },
        { type: 'op', text: '+' },
        {
          type: 'var',
          key: 'tSkew',
          symbol: 't_{\\text{skew}}',
          label: 'Clock Skew t_skew',
          color: 'amber',
          unit: 'ns',
          decimals: 2,
          initialValue: 0.0,
          tooltip:
            'Capture clock delay (CLK₂ − CLK₁). Positive skew helps Setup (+t_skew) but directly steals Hold margin (−t_skew)!',
        },
        { type: 'op', text: '− (t_cq +' },
        {
          type: 'var',
          key: 'tComb',
          symbol: 't_{\\text{comb}}',
          label: 'Logic Delay t_comb',
          color: 'cyan',
          unit: 'ns',
          decimals: 2,
          initialValue: 2.2,
          tooltip:
            'Combinational logic propagation delay between FF1 and FF2. Long paths hurt Setup; ultra-short paths risk Hold violations.',
        },
        { type: 'op', text: '+ t_su)   │  ' },
        {
          type: 'var',
          key: 'holdSlack',
          symbol: 'S_{\\text{h}}',
          label: 'Hold Slack S_h',
          color: 'violet',
          unit: 'ns',
          decimals: 2,
          initialValue: 2.4,
          tooltip:
            'Hold margin (t_cq + t_comb) − (t_h + t_skew). Independent of T_clk! If S_h < 0, slowing the clock CANNOT save the chip.',
        },
        { type: 'op', text: '= t_arr − (t_h + t_skew)' },
      ],
    },

    controls: [
      {
        id: 'fClkMhz',
        type: 'range',
        label: 'Clock Frequency f_clk',
        min: 80,
        max: 450,
        step: 5,
        value: 200,
        unit: 'MHz',
        color: 'cyan',
        hint: 'Sets T_clk = 1000 / f_clk. Governs Setup Slack only — never Hold Slack.',
      },
      {
        id: 'tCombNs',
        type: 'range',
        label: 'Logic Path Delay t_comb',
        min: 0.2,
        max: 4.5,
        step: 0.1,
        value: 2.2,
        unit: 'ns',
        color: 'emerald',
        hint: 'Propagation time through LUTs/gates between FF1 and FF2.',
      },
      {
        id: 'tSkewNs',
        type: 'range',
        label: 'Clock Skew t_skew',
        min: -1.0,
        max: 1.4,
        step: 0.05,
        value: 0.0,
        unit: 'ns',
        color: 'amber',
        hint: 'CLK₂ arrival minus CLK₁ arrival. Positive skew helps Setup, hurts Hold.',
      },
      {
        id: 'faultPreset',
        type: 'segmented',
        label: 'Timing Scenario',
        value: 'nominal',
        color: 'crimson',
        options: [
          { value: 'nominal', label: 'Nominal' },
          { value: 'setup-fail', label: 'Setup Fail' },
          { value: 'hold-fail', label: 'Hold Fail' },
        ],
      },
    ],

    presets: [
      {
        label: 'Nominal (200 MHz)',
        values: { fClkMhz: 200, tCombNs: 2.2, tSkewNs: 0.0, faultPreset: 'nominal' },
        breakMode: false,
      },
      {
        label: 'Setup Fail (360 MHz)',
        values: { fClkMhz: 360, tCombNs: 2.4, tSkewNs: 0.1, faultPreset: 'setup-fail' },
        breakMode: true,
      },
      {
        label: 'Hold Fail (Skew +0.9ns)',
        values: { fClkMhz: 150, tCombNs: 0.3, tSkewNs: 0.9, faultPreset: 'hold-fail' },
        breakMode: false,
      },
    ],

    steps: {
      concept: {
        title: 'The Flip-Flop Aperture & Metastability',
        body:
          'Every synchronous FPGA, GPU, and robotic SoC moves bits from a Launch Flip-Flop (FF1) through Combinational Logic into a Capture Flip-Flop (FF2). For FF2 to latch cleanly, its input D₂ must hold completely steady inside a tiny forbidden aperture around the rising capture clock edge CLK₂ ↑.',
        bullets: [
          'Setup Window (Amber, t_su = 0.5 ns before CLK₂ ↑): slow data from the previous launch edge must arrive before this window opens.',
          'Hold Window (Violet, t_h = 0.4 ns after CLK₂ ↑): fast new data from the current launch edge must NOT overwrite D₂ before this window closes.',
          'Violate either aperture and FF2’s internal cross-coupled inverters get caught balancing on the unstable V_DD/2 ridge — metastability — before thermal noise randomly tips Q₂ to the wrong bit!',
        ],
        callout:
          'Watch the Ball-on-Hill potential well in the top-right corner: clean captures snap briskly into 0 V or V_DD, while aperture violations strand the crimson voltage ball trembling on the knife-edge peak.',
      },
      explore: {
        title: 'Sweep Frequency, Logic Depth & Clock Skew',
        body:
          'Use the controls below — or drag the Amber CLK₂ edge directly on the Logic Analyzer — to feel how Setup Slack and Hold Slack trade off in real silicon.',
        bullets: [
          'Push Clock Frequency f_clk past f_max (303 MHz at default delay): watch T_clk shrink until the data arrival edge crashes into the Amber Setup Aperture.',
          'Click the "Hold Fail" scenario (t_comb = 0.3 ns, t_skew = +0.9 ns): Hold Slack drops to −0.40 ns. Now drag f_clk all the way down to 80 MHz — notice Hold Slack NEVER recovers!',
          'Sweep Clock Skew t_skew negative vs. positive: positive skew shifts CLK₂ right (giving Setup more time while starving Hold); negative skew does the opposite.',
        ],
      },
      linkedMath: {
        title: 'Link Every Timing Variable to the Waveform',
        body:
          'Hover or tap any variable in the Live Linked Equation bar below the oscilloscope (or hover the corresponding bracket/block on the canvas) to light up its exact physical geometry.',
        bullets: [
          'T_clk (Cyan period bracket): spans one full CLK₁ cycle. Notice it appears in S_su, but is completely absent from S_h!',
          't_comb (Cyan logic cloud): propagation delay from FF1 to FF2. Longer logic eats Setup margin; shorter logic risks Hold shoot-through.',
          't_skew (Amber CLK₁→CLK₂ offset): enters S_su with a (+) sign and S_h with a (−) sign — the fundamental skew trade-off in clock-tree synthesis.',
        ],
      },
      breakSystem: {
        title: 'Trigger Overclock Setup Violation & Hold Shoot-Through',
        body:
          'Click "⚡ Break: Overclock + Skew Violation" to push the pipeline to 360 MHz (T_clk = 2.78 ns) with t_comb = 2.4 ns and t_skew = +0.10 ns (S_su = −0.62 ns). Then test "Hold Fail" in the scenario selector.',
        symptom:
          'D₂ transitions directly inside FF2’s forbidden window, igniting pulsing crimson overlap zones, ringing V_DD/2 metastability on Q₂, and erratic bit-flip errors in the capture counter.',
        recovery:
          'For Setup Fail, drop f_clk below f_max (294 MHz) or pipeline t_comb into shorter stages. For Hold Fail, slowing the clock does NOTHING — you must insert delay buffers (raise t_comb) or reduce positive clock skew t_skew!',
      },
    },

    intuitionCheck: {
      question:
        'A freshly taped-out robotic SoC fails timing in the lab with a negative Hold Slack (S_h = −0.40 ns) on a short register-to-register path with positive clock skew. The team cuts the clock frequency in half from 300 MHz to 150 MHz. What happens?',
      options: [
        {
          id: 'a',
          text: 'The Hold violation disappears because doubling T_clk gives D₂ twice as much time to settle.',
          correct: false,
          feedback:
            'Lowering clock frequency only increases T_clk in the Setup equation S_su = T_clk + t_skew − (t_cq + t_comb + t_su). Hold is a same-edge race that does not depend on T_clk.',
        },
        {
          id: 'b',
          text: 'The Hold violation persists unchanged at −0.40 ns — lowering clock frequency fixes Setup violations, NEVER Hold violations.',
          correct: true,
          feedback:
            'Exactly right! Hold Slack is S_h = (t_cq + t_comb) − (t_h + t_skew), which contains no T_clk term. Both launch and capture are triggered by the same clock edge cycle, so even at 1 MHz the fast path still races past the skewed capture clock — which is why Hold bugs can brick an ASIC!',
        },
        {
          id: 'c',
          text: 'The Hold violation becomes twice as severe because slower clocks have longer transition times.',
          correct: false,
          feedback:
            'Clock period T_clk does not change S_h = (t_cq + t_comb) − (t_h + t_skew); the slack stays fixed at −0.40 ns regardless of f_clk.',
        },
        {
          id: 'd',
          text: 'A 2-FF synchronizer completely eliminates the synchronous Hold violation without fixing skew or delay.',
          correct: false,
          feedback:
            'A 2-FF synchronizer increases MTBF for asynchronous clock-domain crossings, but it cannot fix a deterministic synchronous Hold violation at FF2’s input — you must add path delay or reduce clock skew.',
        },
      ],
      correctIndex: 1,
      explanation:
        'Setup timing compares data across consecutive clock edges (depending on T_clk), so slowing the clock always adds Setup Slack. Hold timing is a same-edge race S_h = (t_cq + t_comb) − (t_h + t_skew) with zero T_clk dependence — slowing the clock never fixes a Hold violation.',
    },

    frontierBridge: {
      headline: 'Why Static Timing Closure Governs AI Accelerators & Real-Time Robot FPGAs',
      whyItMatters:
        'Every 1000 Hz humanoid torque controller on an FPGA and every 2 GHz tensor-core pipeline in an AI accelerator must close both Setup (bounding peak clock speed f_max) and Hold (preventing unrecoverable shoot-through silicon bugs) across PVT corners — while asynchronous sensor/IMU inputs crossing clock domains rely on 2-FF synchronizers to push metastability MTBF beyond millennia.',
      prereqs: [],
      unlocks: ['F3.2', 'F5.1', 'M5.2'],
    },

    /**
     * Mounts the 60 FPS dead-front Datapath + Metastability Well + Logic Analyzer canvas.
     */
    mountCanvas(canvasHost, api = {}) {
      if (!canvasHost) return { destroy() {}, dispose() {} };

      canvasHost.classList.add('deadfront-canvas');
      if (typeof getComputedStyle === 'function' && getComputedStyle(canvasHost).position === 'static') {
        canvasHost.style.position = 'relative';
      }

      const canvas = document.createElement('canvas');
      canvas.style.cssText =
        'display:block;width:100%;height:100%;touch-action:none;cursor:default;';
      canvas.setAttribute(
        'aria-label',
        'Interactive Digital Timing and Metastability oscilloscope with FF1-Logic-FF2 datapath, bistable potential well, and nanosecond logic analyzer.'
      );
      canvasHost.textContent = '';
      canvasHost.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      const readInitialControl = (id, fallback) => {
        try {
          if (typeof api.getControlValue === 'function') {
            const v = api.getControlValue(id);
            if (v !== undefined) return v;
          }
          if (typeof api.getControls === 'function') {
            const all = api.getControls();
            if (all && all[id] !== undefined) return all[id];
          }
        } catch {
          // Ignore shell read error
        }
        return fallback;
      };

      const params = {
        fClkMhz: finiteOr(readInitialControl('fClkMhz', 200), 200),
        tCombNs: finiteOr(readInitialControl('tCombNs', 2.2), 2.2),
        tSkewNs: finiteOr(readInitialControl('tSkewNs', 0.0), 0.0),
        faultPreset: String(readInitialControl('faultPreset', 'nominal') || 'nominal'),
      };

      let breakActive = Boolean(typeof api.isBroken === 'function' ? api.isBroken() : false);
      let savedBeforeBreak = {
        fClkMhz: params.fClkMhz,
        tCombNs: params.tCombNs,
        tSkewNs: params.tSkewNs,
        faultPreset: params.faultPreset,
      };
      let highlightedVar = null;
      let canvasHoverVar = null;
      let syncBadgeFocused = false;
      let syncingControls = false;

      // ---- Live Simulation State ----
      let simTimeSec = 0;
      let cyclePhase = 0; // [0, 1) visual clock phase for animated datapath packets & bit cycling
      let cycleCount = 0;
      let bitHistory = [0, 1, 0, 1, 1, 0, 1, 0]; // deterministic rich alternating pattern
      let currentLaunchBit = 1;
      let capturedBit = 0;
      let syncOutBit = 0;
      let lastBitCorrupted = false;
      let errorCount = 0;
      let launchFlash = 0;
      let captureFlash = 0;
      let metaResolveTimer = 0;
      let metaResolveDuration = 0;
      let metaResolvedWrong = false;

      // Active travelling data packets along FF1 -> Logic -> FF2
      const packets = [];

      // Ball-on-a-hill physical bistable well state: x in [-1.15, +1.15] (-1 = 0V, +1 = VDD, 0 = VDD/2)
      const wellBall = {
        x: -0.96,
        vx: 0,
        targetSide: -1,
        metastableHold: 0,
        trail: [],
      };

      // Interactive layout hitboxes (refreshed every frame)
      const hitboxes = {
        logicCloud: null,
        skewNode: null,
        syncBadge: null,
        tClkBracket: null,
        tSkewZone: null,
        setupZone: null,
        holdZone: null,
        clk2DragHandle: null,
        waveRect: null,
        windowNs: 12,
        tLaunch1Ns: 6,
      };

      let draggingSkew = false;
      let hoverSyncBadge = false;

      // Viewport metrics
      let cssW = 760;
      let cssH = 480;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      function updateViewport() {
        const rect = canvasHost.getBoundingClientRect();
        cssW = Math.max(300, Math.round(rect.width || canvasHost.clientWidth || 760));
        cssH = Math.max(340, Math.round(rect.height || canvasHost.clientHeight || 480));
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      function syncShellControl(id, val) {
        if (typeof api.setControlValue === 'function') {
          try {
            api.setControlValue(id, val, { notify: false });
          } catch {
            // Ignore shell sync error
          }
        }
      }

      function detectMatchingPreset() {
        for (const [name, p] of Object.entries(PRESET_PARAMS)) {
          if (
            Math.abs(params.fClkMhz - p.fClkMhz) < 1 &&
            Math.abs(params.tCombNs - p.tCombNs) < 0.04 &&
            Math.abs(params.tSkewNs - p.tSkewNs) < 0.02
          ) {
            return name;
          }
        }
        return null;
      }

      function applyPreset(presetName) {
        const p = PRESET_PARAMS[presetName];
        if (!p) return;
        params.fClkMhz = p.fClkMhz;
        params.tCombNs = p.tCombNs;
        params.tSkewNs = p.tSkewNs;
        params.faultPreset = presetName;

        syncingControls = true;
        syncShellControl('fClkMhz', params.fClkMhz);
        syncShellControl('tCombNs', params.tCombNs);
        syncShellControl('tSkewNs', params.tSkewNs);
        syncShellControl('faultPreset', params.faultPreset);
        syncingControls = false;

        if (presetName === 'nominal') {
          errorCount = 0;
          lastBitCorrupted = false;
        }
      }

      function applyControl(id, val) {
        if (syncingControls) return;
        if (id === 'fClkMhz') {
          params.fClkMhz = clamp(finiteOr(val, params.fClkMhz), 80, 450);
          const m = detectMatchingPreset();
          if (m && m !== params.faultPreset) {
            params.faultPreset = m;
            syncingControls = true;
            syncShellControl('faultPreset', m);
            syncingControls = false;
          }
        } else if (id === 'tCombNs') {
          params.tCombNs = clamp(finiteOr(val, params.tCombNs), 0.2, 4.5);
          const m = detectMatchingPreset();
          if (m && m !== params.faultPreset) {
            params.faultPreset = m;
            syncingControls = true;
            syncShellControl('faultPreset', m);
            syncingControls = false;
          }
        } else if (id === 'tSkewNs') {
          params.tSkewNs = clamp(finiteOr(val, params.tSkewNs), -1.0, 1.4);
          const m = detectMatchingPreset();
          if (m && m !== params.faultPreset) {
            params.faultPreset = m;
            syncingControls = true;
            syncShellControl('faultPreset', m);
            syncingControls = false;
          }
        } else if (id === 'faultPreset') {
          const nextPreset = String(val || 'nominal');
          if (PRESET_PARAMS[nextPreset]) {
            applyPreset(nextPreset);
          }
        }
      }

      function applyBreakMode(active) {
        const next = Boolean(active);
        if (next === breakActive) return;
        breakActive = next;
        if (next) {
          savedBeforeBreak = {
            fClkMhz: params.fClkMhz,
            tCombNs: params.tCombNs,
            tSkewNs: params.tSkewNs,
            faultPreset: params.faultPreset,
          };
          applyPreset('setup-fail');
        } else {
          params.fClkMhz = clamp(savedBeforeBreak.fClkMhz || 200, 80, 450);
          params.tCombNs = clamp(savedBeforeBreak.tCombNs || 2.2, 0.2, 4.5);
          params.tSkewNs = clamp(savedBeforeBreak.tSkewNs ?? 0.0, -1.0, 1.4);
          params.faultPreset = savedBeforeBreak.faultPreset || 'nominal';
          // If saved state itself was violated, restore clean nominal so recovery always feels crisp
          const check = computeDigitalTiming(params.fClkMhz, params.tCombNs, params.tSkewNs);
          if (check.isMetastable) {
            applyPreset('nominal');
          } else {
            syncingControls = true;
            syncShellControl('fClkMhz', params.fClkMhz);
            syncShellControl('tCombNs', params.tCombNs);
            syncShellControl('tSkewNs', params.tSkewNs);
            syncShellControl('faultPreset', params.faultPreset);
            syncingControls = false;
            errorCount = 0;
            lastBitCorrupted = false;
          }
        }
      }

      function resetLab() {
        breakActive = false;
        applyPreset('nominal');
        cyclePhase = 0;
        cycleCount = 0;
        errorCount = 0;
        lastBitCorrupted = false;
        packets.length = 0;
        wellBall.x = -0.96;
        wellBall.vx = 0;
        wellBall.targetSide = -1;
        wellBall.metastableHold = 0;
        wellBall.trail.length = 0;
      }

      // ---- Simulation Step (60 FPS smooth physics + bistable well ODE) ----
      function stepSimulation(dt, timing) {
        simTimeSec += dt;
        launchFlash = Math.max(0, launchFlash - dt * 3.8);
        captureFlash = Math.max(0, captureFlash - dt * 3.8);

        // Visual clock cycle rate: proportional to fClkMhz (mapped comfortably to ~0.75 - 2.3 Hz so every packet & capture is legible)
        const visualCyclesPerSec = 0.65 + (timing.fClkMhz / 450) * 1.45;
        const prevPhase = cyclePhase;
        cyclePhase += dt * visualCyclesPerSec;

        // Capture edge phase offset within a visual cycle due to skew
        const skewPhaseShift = clamp(timing.tSkewNs / timing.tClkNs, -0.35, 0.35);
        const capTriggerPhase = ((skewPhaseShift % 1) + 1) % 1;

        // Detect FF1 launch edge (phase wrap 1 -> 0)
        if (cyclePhase >= 1.0) {
          cyclePhase -= 1.0;
          cycleCount++;
          launchFlash = 1.0;

          // Next deterministic alternating bit with occasional double-bits
          const nextBit = cycleCount % 5 === 0 ? currentLaunchBit : 1 - currentLaunchBit;
          currentLaunchBit = nextBit;
          bitHistory.push(nextBit);
          if (bitHistory.length > 12) bitHistory.shift();

          // Spawn glowing data packet travelling FF1 -> Combinational Cloud -> FF2
          packets.push({
            bit: nextBit,
            progress: 0, // 0 at FF1.Q, 1 at FF2.D
            speed: clamp(visualCyclesPerSec * (timing.tClkNs / Math.max(0.55, timing.tArrivalNs)), 0.55, 2.8),
            hitViolation: timing.isMetastable,
            arrived: false,
            fade: 1.0,
          });
        }

        // Detect FF2 capture edge crossing capTriggerPhase
        const crossedCapture =
          prevPhase < capTriggerPhase
            ? prevPhase + dt * visualCyclesPerSec >= capTriggerPhase
            : prevPhase + dt * visualCyclesPerSec >= capTriggerPhase + 1.0;

        if (crossedCapture) {
          captureFlash = 1.0;
          const expectedBit = bitHistory.length >= 2 ? bitHistory[bitHistory.length - 2] : currentLaunchBit;
          const targetSide = expectedBit ? 1.0 : -1.0;
          syncOutBit = capturedBit;

          if (timing.isMetastable) {
            // Kick voltage ball right onto the unstable V_DD/2 ridge!
            wellBall.x = (Math.random() - 0.5) * 0.08;
            wellBall.vx = (Math.random() - 0.5) * 0.35;
            wellBall.metastableHold = 0.24 + timing.severity * 0.34;
            metaResolveDuration = wellBall.metastableHold;
            metaResolveTimer = wellBall.metastableHold;

            // Random flip probability rises sharply with negative slack severity
            const flipProb = clamp(0.32 + timing.severity * 0.36, 0.32, 0.68);
            metaResolvedWrong = Math.random() < flipProb;
            wellBall.targetSide = metaResolvedWrong ? -targetSide : targetSide;

            if (metaResolvedWrong) {
              capturedBit = 1 - expectedBit;
              lastBitCorrupted = true;
              errorCount++;
            } else {
              capturedBit = expectedBit;
              lastBitCorrupted = false;
            }
          } else {
            capturedBit = expectedBit;
            lastBitCorrupted = false;
            metaResolvedWrong = false;
            metaResolveTimer = 0;
            wellBall.metastableHold = 0;
            wellBall.targetSide = targetSide;
            // Strong clean drive toward intended logic rail
            wellBall.vx += (targetSide - wellBall.x) * 4.8;
          }
        }

        // Advance travelling datapath packets
        for (let i = packets.length - 1; i >= 0; i--) {
          const p = packets[i];
          if (!p.arrived) {
            p.progress += dt * p.speed;
            if (p.progress >= 1.0) {
              p.progress = 1.0;
              p.arrived = true;
            }
          } else {
            p.fade -= dt * 3.4;
            if (p.fade <= 0) {
              packets.splice(i, 1);
            }
          }
        }

        // Advance Ball-on-Hill bistable double-well ODE: U(x) = -2 x^2 + x^4  =>  -U'(x) = 4 x (1 - x^2)
        const substeps = 4;
        const subDt = dt / substeps;
        for (let s = 0; s < substeps; s++) {
          if (wellBall.metastableHold > 0) {
            wellBall.metastableHold = Math.max(0, wellBall.metastableHold - subDt);
            metaResolveTimer = wellBall.metastableHold;
            // Knife-edge unstable equilibrium near x = 0 with thermal kT/C jitter
            const jitter = (Math.random() - 0.5) * 2.8;
            const weakRestoring = -10.5 * wellBall.x;
            wellBall.vx += (weakRestoring + jitter - 5.2 * wellBall.vx) * subDt;
            wellBall.x = clamp(wellBall.x + wellBall.vx * subDt, -0.24, 0.24);
            if (wellBall.metastableHold === 0) {
              // Tumble decisively off the ridge into resolved side (often WRONG!)
              wellBall.vx = wellBall.targetSide * (1.8 + Math.random() * 0.9);
            }
          } else {
            const potentialForce = 18.0 * wellBall.x * (1.0 - wellBall.x * wellBall.x);
            const driveBias = timing.isMetastable ? 0 : 14.0 * (wellBall.targetSide - wellBall.x);
            const damping = -6.2 * wellBall.vx;
            wellBall.vx += (potentialForce + driveBias + damping) * subDt;
            wellBall.x = clamp(wellBall.x + wellBall.vx * subDt, -1.12, 1.12);
          }
        }

        wellBall.trail.push({ x: wellBall.x, meta: wellBall.metastableHold > 0 || timing.isMetastable });
        if (wellBall.trail.length > 26) wellBall.trail.shift();
      }

      // ---- Rendering Helpers ----
      function activeHighlight() {
        return highlightedVar || canvasHoverVar;
      }

      function drawBackgroundGrid(W, H, splitY) {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle engineering dot/line grid
        ctx.strokeStyle = COLORS.gridMinor;
        ctx.lineWidth = 1;
        const step = 28;
        ctx.beginPath();
        for (let x = step; x < W; x += step) {
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, H);
        }
        for (let y = step; y < H; y += step) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(W, y + 0.5);
        }
        ctx.stroke();

        // Crisp split divider between Top 35% (Datapath + Well) and Bottom 65% (Logic Analyzer)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, splitY + 0.5);
        ctx.lineTo(W, splitY + 0.5);
        ctx.stroke();
      }

      function drawFlipFlopChip(x, y, w, h, label, clkLabel, clkColor, clkRgb, bitVal, flash, isViolated) {
        ctx.save();
        const borderHex = isViolated ? COLORS.crimson : clkColor;
        const borderRgb = isViolated ? COLORS.crimsonRgb : clkRgb;

        if (isViolated || flash > 0.05) {
          ctx.shadowColor = isViolated ? COLORS.crimson : clkColor;
          ctx.shadowBlur = isViolated ? 14 + Math.sin(simTimeSec * 12) * 5 : flash * 10;
        }

        drawRoundedRect(ctx, x, y, w, h, 7);
        ctx.fillStyle = isViolated ? 'rgba(255, 23, 68, 0.11)' : '#121621';
        ctx.fill();
        ctx.lineWidth = isViolated ? 1.8 : 1.3;
        ctx.strokeStyle = `rgba(${borderRgb}, ${isViolated ? 0.92 : 0.55 + flash * 0.4})`;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Header label
        ctx.font = "700 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textPrimary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x + w * 0.5, y + 6);

        // Pin labels D / Q
        ctx.font = "600 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('D', x + 5, y + h * 0.42);
        ctx.textAlign = 'right';
        ctx.fillText('Q', x + w - 5, y + h * 0.42);

        // Current bit indicator
        const bitStr = isViolated && wellBall.metastableHold > 0 ? '?' : String(bitVal);
        ctx.font = "700 12px 'JetBrains Mono', monospace";
        ctx.fillStyle = isViolated ? COLORS.crimson : bitVal ? COLORS.emerald : COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bitStr, x + w * 0.5, y + h * 0.52);

        // Clock input triangle at bottom-center
        const triY = y + h;
        const triX = x + w * 0.5;
        ctx.beginPath();
        ctx.moveTo(triX - 6, triY);
        ctx.lineTo(triX, triY - 8);
        ctx.lineTo(triX + 6, triY);
        ctx.closePath();
        ctx.strokeStyle = borderHex;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // CLK pin caption just below triangle
        ctx.font = "600 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = clkColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(clkLabel, triX, triY + 4);
        ctx.restore();
      }

      /**
       * TOP 35% PANE: Left = FF1 -> Combinational Logic -> FF2 + 2-FF Sync; Right = Ball-on-Hill Well.
       */
      function renderTopPane(W, topH, timing) {
        const hl = activeHighlight();
        const pad = 12;
        const wellW = clamp(W * 0.31, 155, 275);
        const dpW = W - wellW - pad;

        // Vertical divider between datapath and potential well inset
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dpW + 0.5, 8);
        ctx.lineTo(dpW + 0.5, topH - 8);
        ctx.stroke();

        // Section header: Datapath
        ctx.font = "700 9.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('DATAPATH PIPELINE  •  FF1 → COMBINATIONAL LOGIC → FF2', pad, 8);

        // Coordinates for datapath components
        const compact = dpW < 420;
        const chipW = compact ? 44 : 54;
        const chipH = clamp(topH * 0.42, 48, 66);
        const centerY = topH * 0.47;
        const chipTop = centerY - chipH * 0.5;
        const dataWireY = chipTop + chipH * 0.42;

        const ff1X = pad + (compact ? 6 : 16);
        const syncW = compact ? 52 : 66;
        const syncX = dpW - pad - syncW;
        const ff2X = syncX - (compact ? 16 : 24) - chipW;

        // Combinational Logic cloud scales visually with tCombNs
        const maxCloudGap = Math.max(40, ff2X - (ff1X + chipW) - 24);
        const cloudFrac = clamp((timing.tCombNs - 0.2) / 4.3, 0.12, 1.0);
        const cloudW = clamp(maxCloudGap * (0.42 + 0.46 * cloudFrac), 46, maxCloudGap);
        const cloudH = chipH * 0.84;
        const cloudX = (ff1X + chipW + ff2X) * 0.5 - cloudW * 0.5;
        const cloudY = dataWireY - cloudH * 0.5;

        hitboxes.logicCloud = { x: cloudX, y: cloudY, w: cloudW, h: cloudH };
        hitboxes.syncBadge = { x: syncX, y: chipTop + 5, w: syncW, h: chipH - 10 };

        // ---- Signal Wires ----
        ctx.save();
        ctx.lineWidth = 2;
        // FF1.Q -> Cloud -> FF2.D
        ctx.strokeStyle = hl === 'tComb' ? COLORS.cyan : 'rgba(0, 229, 255, 0.42)';
        ctx.beginPath();
        ctx.moveTo(ff1X + chipW, dataWireY);
        ctx.lineTo(cloudX, dataWireY);
        ctx.moveTo(cloudX + cloudW, dataWireY);
        ctx.lineTo(ff2X, dataWireY);
        ctx.stroke();

        // FF2.Q -> 2-FF Synchronizer
        ctx.strokeStyle = timing.isMetastable
          ? `rgba(${COLORS.crimsonRgb}, 0.85)`
          : `rgba(${COLORS.emeraldRgb}, 0.6)`;
        ctx.beginPath();
        ctx.moveTo(ff2X + chipW, dataWireY);
        ctx.lineTo(syncX, dataWireY);
        ctx.stroke();

        // Clock distribution tree below flip-flops
        const clkBusY = Math.min(topH - 14, chipTop + chipH + 22);
        const ff1ClkX = ff1X + chipW * 0.5;
        const ff2ClkX = ff2X + chipW * 0.5;
        const rootX = ff1ClkX + (ff2ClkX - ff1ClkX) * 0.34;
        const skewBoxW = compact ? 54 : 70;
        const skewBoxH = 16;
        const skewBoxX = (rootX + ff2ClkX) * 0.5 - skewBoxW * 0.5;
        const skewBoxY = clkBusY - skewBoxH * 0.5;
        hitboxes.skewNode = { x: skewBoxX - 4, y: skewBoxY - 4, w: skewBoxW + 8, h: skewBoxH + 8 };

        // Left clock branch (CLK1)
        ctx.lineWidth = hl === 'tClk' ? 2.4 : 1.5;
        ctx.strokeStyle = hl === 'tClk' ? COLORS.cyan : 'rgba(0, 229, 255, 0.52)';
        ctx.beginPath();
        ctx.moveTo(ff1ClkX, chipTop + chipH + 14);
        ctx.lineTo(ff1ClkX, clkBusY);
        ctx.lineTo(rootX, clkBusY);
        ctx.stroke();

        // Right clock branch (CLK2 via Skew Delay element)
        const skewHighlighted = hl === 'tSkew' || Math.abs(timing.tSkewNs) > 0.01;
        ctx.lineWidth = hl === 'tSkew' ? 2.5 : 1.5;
        ctx.strokeStyle = skewHighlighted ? COLORS.amber : 'rgba(255, 179, 0, 0.45)';
        ctx.beginPath();
        ctx.moveTo(rootX, clkBusY);
        ctx.lineTo(skewBoxX, clkBusY);
        ctx.moveTo(skewBoxX + skewBoxW, clkBusY);
        ctx.lineTo(ff2ClkX, clkBusY);
        ctx.lineTo(ff2ClkX, chipTop + chipH + 14);
        ctx.stroke();

        // Root clock dot
        ctx.beginPath();
        ctx.arc(rootX, clkBusY, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.cyan;
        ctx.fill();

        // Skew delay buffer pill
        if (hl === 'tSkew') {
          ctx.shadowColor = COLORS.amber;
          ctx.shadowBlur = 12;
        }
        drawRoundedRect(ctx, skewBoxX, skewBoxY, skewBoxW, skewBoxH, 4);
        ctx.fillStyle = hl === 'tSkew' ? 'rgba(255, 179, 0, 0.24)' : 'rgba(255, 179, 0, 0.11)';
        ctx.fill();
        ctx.strokeStyle = hl === 'tSkew' ? COLORS.amber : 'rgba(255, 179, 0, 0.55)';
        ctx.lineWidth = hl === 'tSkew' ? 1.6 : 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "600 8.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.amber;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`skew ${fmtSigned(timing.tSkewNs, 2)}`, skewBoxX + skewBoxW * 0.5, clkBusY + 0.5);
        ctx.restore();

        // ---- Combinational Logic Cloud (Cyan Glass Block) ----
        ctx.save();
        const cloudActive = hl === 'tComb';
        if (cloudActive) {
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 16;
        }
        drawRoundedRect(ctx, cloudX, cloudY, cloudW, cloudH, 10);
        const grad = ctx.createLinearGradient(cloudX, cloudY, cloudX + cloudW, cloudY + cloudH);
        grad.addColorStop(0, cloudActive ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.09)');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0.03)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = cloudActive ? COLORS.cyan : 'rgba(0, 229, 255, 0.45)';
        ctx.lineWidth = cloudActive ? 1.8 : 1.2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Subtle internal LUT/gate nodes inside cloud
        const gateCols = Math.max(2, Math.min(4, Math.round(timing.tCombNs)));
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.20)';
        ctx.lineWidth = 1;
        for (let g = 0; g < gateCols; g++) {
          const gx = cloudX + ((g + 0.5) / gateCols) * cloudW;
          const gy = cloudY + cloudH * (g % 2 === 0 ? 0.34 : 0.66);
          ctx.beginPath();
          ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 229, 255, 0.38)';
          ctx.fill();
          if (g + 1 < gateCols) {
            const ngx = cloudX + ((g + 1.5) / gateCols) * cloudW;
            const ngy = cloudY + cloudH * ((g + 1) % 2 === 0 ? 0.34 : 0.66);
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(ngx, ngy);
            ctx.stroke();
          }
        }

        ctx.font = "700 9.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOGIC', cloudX + cloudW * 0.5, cloudY + cloudH * 0.35);
        ctx.font = "600 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textPrimary;
        ctx.fillText(`t_comb ${timing.tCombNs.toFixed(1)}ns`, cloudX + cloudW * 0.5, cloudY + cloudH * 0.68);
        ctx.restore();

        // ---- Animated Glowing Data Packets across FF1 -> Logic -> FF2 ----
        const travelStartX = ff1X + chipW;
        const travelEndX = ff2X;
        for (const p of packets) {
          const px = travelStartX + (travelEndX - travelStartX) * p.progress;
          const isBad = p.hitViolation && p.progress > 0.82;
          const pktColor = isBad ? COLORS.crimson : p.bit ? COLORS.emerald : COLORS.cyan;
          const pktRgb = isBad ? COLORS.crimsonRgb : p.bit ? COLORS.emeraldRgb : COLORS.cyanRgb;

          ctx.save();
          ctx.globalAlpha = p.fade;
          ctx.shadowColor = pktColor;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, dataWireY, p.arrived ? 6.5 : 4.6, 0, Math.PI * 2);
          ctx.fillStyle = pktColor;
          ctx.fill();

          // Comet tail
          const tailLen = Math.min(26, (px - travelStartX) * 0.7);
          if (tailLen > 2) {
            const tg = ctx.createLinearGradient(px - tailLen, dataWireY, px, dataWireY);
            tg.addColorStop(0, `rgba(${pktRgb}, 0)`);
            tg.addColorStop(1, `rgba(${pktRgb}, 0.8)`);
            ctx.strokeStyle = tg;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(px - tailLen, dataWireY);
            ctx.lineTo(px, dataWireY);
            ctx.stroke();
          }

          // Shockwave ring on arrival violation
          if (p.arrived && isBad) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(${COLORS.crimsonRgb}, ${p.fade * 0.9})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, dataWireY, 6 + (1 - p.fade) * 14, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // ---- FF1 & FF2 Chips ----
        drawFlipFlopChip(
          ff1X,
          chipTop,
          chipW,
          chipH,
          'FF1',
          'CLK₁',
          COLORS.cyan,
          COLORS.cyanRgb,
          currentLaunchBit,
          launchFlash,
          false
        );

        drawFlipFlopChip(
          ff2X,
          chipTop,
          chipW,
          chipH,
          'FF2',
          'CLK₂',
          COLORS.amber,
          COLORS.amberRgb,
          capturedBit,
          captureFlash,
          timing.isMetastable
        );

        // Violation micro-badge above FF2
        if (timing.isMetastable) {
          const faultTag =
            timing.setupViolated && timing.holdViolated
              ? 'SETUP+HOLD FAIL'
              : timing.setupViolated
                ? 'SETUP FAIL!'
                : 'HOLD FAIL!';
          drawLabelPill(ctx, ff2X + chipW * 0.5, chipTop - 10, faultTag, COLORS.crimson, COLORS.crimsonRgb, 8.5);
        }

        // ---- 2-FF Synchronizer Stage Badge ----
        ctx.save();
        const sbY = chipTop + 5;
        const sbH = chipH - 10;
        const sbHighlight = hoverSyncBadge || syncBadgeFocused;
        drawRoundedRect(ctx, syncX, sbY, syncW, sbH, 7);
        ctx.fillStyle = sbHighlight
          ? 'rgba(167, 139, 250, 0.18)'
          : timing.isMetastable
            ? 'rgba(167, 139, 250, 0.10)'
            : 'rgba(255, 255, 255, 0.035)';
        ctx.fill();
        ctx.strokeStyle = sbHighlight
          ? COLORS.violet
          : timing.isMetastable
            ? 'rgba(167, 139, 250, 0.72)'
            : 'rgba(167, 139, 250, 0.38)';
        ctx.lineWidth = sbHighlight ? 1.6 : 1.1;
        ctx.setLineDash(timing.isMetastable ? [] : [3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = "700 8.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.violet;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2-FF SYNC', syncX + syncW * 0.5, sbY + sbH * 0.30);

        ctx.font = "600 8px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText(timing.isMetastable ? 'CDC MTBF↑' : `Q_s = ${syncOutBit}`, syncX + syncW * 0.5, sbY + sbH * 0.68);
        ctx.restore();

        if (syncBadgeFocused) {
          drawLabelPill(
            ctx,
            syncX + syncW * 0.5 - 24,
            sbY - 10,
            '2nd FF resolves CDC metastability: MTBF ∝ e^(t/τ)',
            COLORS.violet,
            COLORS.violetRgb,
            8
          );
        }

        // ---- Right Inset: Bistable Ball-on-a-Hill Potential Well ----
        renderPotentialWell(dpW + 10, 6, wellW - 8, topH - 12, timing);
      }

      function renderPotentialWell(rx, ry, rw, rh, timing) {
        ctx.save();
        // Header
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = timing.isMetastable ? COLORS.crimson : COLORS.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          timing.isMetastable ? 'METASTABLE HILL • V_DD/2!' : 'POTENTIAL WELL • V(Q₂)',
          rx + 4,
          ry + 2
        );

        const plotX = rx + 14;
        const plotW = rw - 28;
        const plotTop = ry + 26;
        const plotH = Math.max(46, rh - 48);
        const plotBottom = plotTop + plotH;

        // Potential function U(u) for u in [-1.18, 1.18]:
        // Valley at u = -1 and u = +1 (U = -1), Peak at u = 0 (U = 0)
        const evalU = (u) => -2 * u * u + u * u * u * u;
        const uToX = (u) => plotX + ((u + 1.2) / 2.4) * plotW;
        const uToY = (u) => {
          const val = evalU(u); // in [-1, +0.18]
          const norm = (val - -1.05) / 1.45; // 0 at bottom valley, ~0.72 at center peak
          return plotBottom - norm * plotH;
        };

        // Shaded area under curve
        ctx.beginPath();
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const u = -1.18 + (i / steps) * 2.36;
          const px = uToX(u);
          const py = uToY(u);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(uToX(1.18), plotBottom + 6);
        ctx.lineTo(uToX(-1.18), plotBottom + 6);
        ctx.closePath();
        const wellGrad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
        wellGrad.addColorStop(
          0,
          timing.isMetastable ? 'rgba(255, 23, 68, 0.22)' : 'rgba(0, 229, 255, 0.14)'
        );
        wellGrad.addColorStop(1, 'rgba(10, 12, 16, 0.02)');
        ctx.fillStyle = wellGrad;
        ctx.fill();

        // Center unstable peak vertical dashed line (V_DD / 2)
        const midX = uToX(0);
        const peakY = uToY(0);
        ctx.save();
        ctx.strokeStyle = timing.isMetastable
          ? 'rgba(255, 23, 68, 0.55)'
          : 'rgba(255, 179, 0, 0.30)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(midX, plotTop - 4);
        ctx.lineTo(midX, plotBottom + 4);
        ctx.stroke();
        ctx.restore();

        // Peak marker label
        ctx.font = "600 8.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = timing.isMetastable ? COLORS.crimson : COLORS.amber;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('V_DD/2', midX, peakY - 9);

        // Potential energy curve stroke
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = -1.18 + (i / steps) * 2.36;
          const px = uToX(u);
          const py = uToY(u);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = timing.isMetastable
          ? 'rgba(255, 23, 68, 0.85)'
          : 'rgba(0, 229, 255, 0.72)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Trail behind voltage ball
        for (let i = 1; i < wellBall.trail.length; i++) {
          const pt = wellBall.trail[i];
          const prev = wellBall.trail[i - 1];
          const alpha = (i / wellBall.trail.length) * 0.45;
          ctx.strokeStyle = pt.meta
            ? `rgba(${COLORS.crimsonRgb}, ${alpha})`
            : `rgba(${COLORS.emeraldRgb}, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(uToX(prev.x), uToY(prev.x) - 5);
          ctx.lineTo(uToX(pt.x), uToY(pt.x) - 5);
          ctx.stroke();
        }

        // Voltage ball on the energy curve
        const bx = uToX(wellBall.x);
        const by = uToY(wellBall.x) - 5.5;
        const ballMeta = timing.isMetastable || wellBall.metastableHold > 0;
        const ballColor = ballMeta ? COLORS.crimson : COLORS.emerald;
        const ballRgb = ballMeta ? COLORS.crimsonRgb : COLORS.emeraldRgb;

        if (ballMeta) {
          const pulseR = 9 + Math.sin(simTimeSec * 16) * 3;
          ctx.beginPath();
          ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ballRgb}, 0.24)`;
          ctx.fill();
        }

        ctx.shadowColor = ballColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bx, by, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = ballColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(bx - 1.3, by - 1.3, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Valley labels: 0 V (left) and V_DD (right)
        ctx.font = "600 8.5px 'JetBrains Mono', monospace";
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.fillStyle = wellBall.x < -0.5 ? COLORS.emerald : COLORS.textMuted;
        ctx.fillText('0V (0)', uToX(-1.0), plotBottom + 5);

        ctx.fillStyle = wellBall.x > 0.5 ? COLORS.emerald : COLORS.textMuted;
        ctx.fillText('V_DD (1)', uToX(1.0), plotBottom + 5);
        ctx.restore();
      }

      /**
       * BOTTOM 65% PANE: Precision 4-Trace Nanosecond Logic Analyzer.
       * Triggered cleanly on CLK_1 rising edge t_0 so Setup/Hold apertures,
       * skew offset, and slack brackets are rock-solid measurable at 60 FPS.
       */
      function renderLogicAnalyzer(W, splitY, H, timing) {
        const hl = activeHighlight();
        const paneTop = splitY + 8;
        const paneH = H - paneTop - 10;
        const leftGutter = W < 500 ? 58 : 74;
        const rightPad = 16;
        const plotX = leftGutter;
        const plotW = Math.max(160, W - leftGutter - rightPad);
        const headerH = 22;
        const axisFooterH = 20;
        const tracesTop = paneTop + headerH;
        const tracesH = Math.max(130, paneH - headerH - axisFooterH);

        // Dynamic nanosecond timebase window centered around 2 full cycles + skew visibility
        const windowNs = clamp(timing.tClkNs * 2.55, 7.2, 22.0);
        // Anchor launch edge #0 (t0) cleanly inside the left side of the screen
        const t0 = clamp(windowNs * 0.14, 1.1, 2.8);
        const t1 = t0 + timing.tClkNs;
        const t2 = t0 + timing.tClkNs * 2;
        const tCap1 = t1 + timing.tSkewNs; // Capture edge for data launched at t0 (and hold boundary for data launched at t1)
        const tCap0 = t0 + timing.tSkewNs;

        const nsToX = (tNs) => plotX + (tNs / windowNs) * plotW;

        hitboxes.waveRect = { x: plotX, y: tracesTop, w: plotW, h: tracesH };
        hitboxes.windowNs = windowNs;
        hitboxes.tLaunch1Ns = t1;

        // Header bar
        ctx.save();
        ctx.font = "700 9.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
          `LOGIC ANALYZER (TRIGGER: CLK₁ ↑)  •  T_clk = ${timing.tClkNs.toFixed(2)} ns  •  f_max = ${timing.setupUnbounded ? '>9999' : Math.round(timing.fMaxMhz)} MHz`,
          12,
          paneTop + 2
        );

        // Right-side hint
        if (W >= 540) {
          ctx.font = "600 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = 'rgba(255, 179, 0, 0.72)';
          ctx.textAlign = 'right';
          ctx.fillText('DRAG CLK₂ EDGE TO SKEW ↔', W - rightPad, paneTop + 2);
        }
        ctx.restore();

        // Nanosecond vertical gridlines
        const majorStepNs = windowNs > 15 ? 2.0 : 1.0;
        ctx.save();
        ctx.font = "500 9px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let t = 0; t <= windowNs + 0.001; t += majorStepNs) {
          const gx = nsToX(t);
          ctx.strokeStyle = COLORS.gridMajor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx + 0.5, tracesTop);
          ctx.lineTo(gx + 0.5, tracesTop + tracesH);
          ctx.stroke();

          ctx.fillStyle = COLORS.axisLabel;
          ctx.fillText(`${t.toFixed(0)}ns`, gx, tracesTop + tracesH + 5);
        }
        ctx.restore();

        // 4 Trace Vertical Lanes
        const laneH = tracesH / 4;
        const laneCenter = (i) => tracesTop + laneH * (i + 0.5);
        const laneHi = (i) => laneCenter(i) - laneH * 0.27;
        const laneLo = (i) => laneCenter(i) + laneH * 0.27;

        // Horizontal lane separators & channel labels
        const channels = [
          { name: 'CLK₁', sub: 'Launch', color: COLORS.cyan },
          { name: 'CLK₂', sub: 'Capture', color: COLORS.amber },
          { name: 'D₂', sub: 'FF2 In', color: COLORS.textPrimary },
          {
            name: 'Q₂',
            sub: timing.isMetastable ? 'META!' : 'FF2 Out',
            color: timing.isMetastable ? COLORS.crimson : COLORS.emerald,
          },
        ];

        for (let i = 0; i < 4; i++) {
          const ly = tracesTop + laneH * i;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(plotX, ly + 0.5);
          ctx.lineTo(plotX + plotW, ly + 0.5);
          ctx.stroke();

          // Left gutter label
          ctx.font = "700 11px 'JetBrains Mono', monospace";
          ctx.fillStyle = channels[i].color;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(channels[i].name, leftGutter - 10, laneCenter(i) + 1);

          ctx.font = "500 8.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = COLORS.textMuted;
          ctx.textBaseline = 'top';
          ctx.fillText(channels[i].sub, leftGutter - 10, laneCenter(i) + 3);
        }

        // Clip waveform region
        ctx.save();
        ctx.beginPath();
        ctx.rect(plotX, tracesTop - 6, plotW, tracesH + 12);
        ctx.clip();

        // ---- Setup & Hold Aperture Vertical Bands around Capture Edge CLK₂ ↑ (tCap1) ----
        const suStartX = nsToX(tCap1 - timing.tSuNs);
        const capX = nsToX(tCap1);
        const holdEndX = nsToX(tCap1 + timing.tHoldNs);
        const d2Top = tracesTop + laneH * 2;
        const d2Bot = tracesTop + laneH * 3;

        // Setup Aperture (Amber)
        const suActive = hl === 'setupSlack' || timing.setupViolated;
        ctx.fillStyle = `rgba(${COLORS.amberRgb}, ${suActive ? 0.24 : 0.14})`;
        ctx.fillRect(suStartX, d2Top + 2, Math.max(2, capX - suStartX), laneH - 4);
        ctx.strokeStyle = `rgba(${COLORS.amberRgb}, ${suActive ? 0.9 : 0.45})`;
        ctx.lineWidth = suActive ? 1.4 : 1;
        ctx.strokeRect(suStartX + 0.5, d2Top + 2.5, Math.max(2, capX - suStartX), laneH - 5);

        // Hold Aperture (Violet)
        const holdActive = hl === 'holdSlack' || timing.holdViolated;
        ctx.fillStyle = `rgba(${COLORS.violetRgb}, ${holdActive ? 0.28 : 0.16})`;
        ctx.fillRect(capX, d2Top + 2, Math.max(2, holdEndX - capX), laneH - 4);
        ctx.strokeStyle = `rgba(${COLORS.violetRgb}, ${holdActive ? 0.92 : 0.48})`;
        ctx.lineWidth = holdActive ? 1.4 : 1;
        ctx.strokeRect(capX + 0.5, d2Top + 2.5, Math.max(2, holdEndX - capX), laneH - 5);

        // Aperture tiny headers inside D2 lane
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (capX - suStartX > 16) {
          ctx.fillStyle = COLORS.amber;
          ctx.fillText('t_su', (suStartX + capX) * 0.5, d2Top + 4);
        }
        if (holdEndX - capX > 16) {
          ctx.fillStyle = COLORS.violet;
          ctx.fillText('t_h', (capX + holdEndX) * 0.5, d2Top + 4);
        }

        // Capture Edge Vertical Dashed Guide from CLK2 ↑ through D2 and Q2
        ctx.save();
        ctx.strokeStyle = `rgba(${COLORS.amberRgb}, ${hl === 'tSkew' || draggingSkew ? 0.95 : 0.58})`;
        ctx.lineWidth = hl === 'tSkew' || draggingSkew ? 1.8 : 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(capX + 0.5, tracesTop + laneH);
        ctx.lineTo(capX + 0.5, tracesTop + tracesH);
        ctx.stroke();
        ctx.restore();

        // Launch Edge Vertical Guide from CLK1 ↑ (t0 and t1)
        ctx.save();
        ctx.strokeStyle = `rgba(${COLORS.cyanRgb}, ${hl === 'tClk' || hl === 'tComb' ? 0.55 : 0.22})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        for (const tEdge of [t0, t1]) {
          const ex = nsToX(tEdge);
          ctx.beginPath();
          ctx.moveTo(ex + 0.5, tracesTop);
          ctx.lineTo(ex + 0.5, d2Bot);
          ctx.stroke();
        }
        ctx.restore();

        // ---- Helper to draw a crisp 50% duty-cycle clock trace ----
        const drawClockTrace = (laneIdx, phaseOffsetNs, strokeHex, glow) => {
          const yHi = laneHi(laneIdx);
          const yLo = laneLo(laneIdx);
          const period = timing.tClkNs;
          const half = period * 0.5;
          const firstEdge = t0 + phaseOffsetNs - Math.ceil((t0 + phaseOffsetNs) / period + 2) * period;

          ctx.save();
          if (glow) {
            ctx.shadowColor = strokeHex;
            ctx.shadowBlur = 10;
          }
          ctx.strokeStyle = strokeHex;
          ctx.lineWidth = glow ? 2.4 : 1.8;
          ctx.beginPath();
          let started = false;
          for (let t = firstEdge; t < windowNs + period; t += period) {
            const xRise = nsToX(t);
            const xFall = nsToX(t + half);
            const xNext = nsToX(t + period);
            if (!started) {
              ctx.moveTo(xRise, yLo);
              started = true;
            }
            ctx.lineTo(xRise, yHi);
            ctx.lineTo(xFall, yHi);
            ctx.lineTo(xFall, yLo);
            ctx.lineTo(xNext, yLo);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Rising-edge indicator arrowheads
          ctx.fillStyle = strokeHex;
          for (let t = firstEdge; t < windowNs + period; t += period) {
            if (t < -0.2 || t > windowNs + 0.2) continue;
            const xr = nsToX(t);
            const ym = (yHi + yLo) * 0.5;
            ctx.beginPath();
            ctx.moveTo(xr, ym - 4.5);
            ctx.lineTo(xr - 3.5, ym + 2.5);
            ctx.lineTo(xr + 3.5, ym + 2.5);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        };

        // Trace 1: CLK_1 (Cyan)
        drawClockTrace(0, 0, COLORS.cyan, hl === 'tClk');

        // Trace 2: CLK_2 (Amber, shifted by +tSkewNs)
        drawClockTrace(1, timing.tSkewNs, COLORS.amber, hl === 'tSkew' || draggingSkew);

        // Draggable knob on CLK_2 ↑ at tCap1
        const clk2MidY = laneCenter(1);
        hitboxes.clk2DragHandle = { x: capX - 12, y: tracesTop + laneH, w: 24, h: laneH };
        ctx.save();
        ctx.beginPath();
        ctx.arc(capX, clk2MidY, draggingSkew || hl === 'tSkew' ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.amber;
        ctx.shadowColor = COLORS.amber;
        ctx.shadowBlur = draggingSkew ? 12 : 6;
        ctx.fill();
        ctx.restore();

        // ---- T_clk Period Bracket on Trace 1 ----
        const xT0 = nsToX(t0);
        const xT1 = nsToX(t1);
        const clkBracketY = laneHi(0) - 7;
        hitboxes.tClkBracket = { x: xT0, y: tracesTop, w: Math.max(10, xT1 - xT0), h: laneH };
        if (hl === 'tClk' || xT1 - xT0 > 62) {
          drawDoubleArrow(
            ctx,
            xT0 + 2,
            clkBracketY,
            xT1 - 2,
            hl === 'tClk' ? COLORS.cyan : 'rgba(0, 229, 255, 0.55)',
            4.5
          );
          drawLabelPill(
            ctx,
            (xT0 + xT1) * 0.5,
            clkBracketY,
            `T_clk = ${timing.tClkNs.toFixed(2)} ns`,
            COLORS.cyan,
            COLORS.cyanRgb,
            hl === 'tClk' ? 9.5 : 8.5
          );
        }

        // ---- t_skew Offset Bracket between CLK_1 ↑ (t1) and CLK_2 ↑ (tCap1) ----
        const skewBracketY = tracesTop + laneH + 7;
        hitboxes.tSkewZone = {
          x: Math.min(xT1, capX) - 10,
          y: tracesTop + laneH,
          w: Math.abs(capX - xT1) + 20,
          h: laneH,
        };
        if (hl === 'tSkew' || Math.abs(timing.tSkewNs) > 0.015) {
          const skLeft = Math.min(xT1, capX);
          const skRight = Math.max(xT1, capX);
          ctx.fillStyle = `rgba(${COLORS.amberRgb}, ${hl === 'tSkew' ? 0.22 : 0.10})`;
          ctx.fillRect(skLeft, tracesTop + laneH + 2, Math.max(2, skRight - skLeft), laneH - 4);
          if (skRight - skLeft > 6) {
            drawDoubleArrow(ctx, skLeft, skewBracketY, skRight, COLORS.amber, 4.5);
          }
          drawLabelPill(
            ctx,
            (skLeft + skRight) * 0.5,
            skewBracketY + 9,
            `t_skew ${fmtSigned(timing.tSkewNs, 2)}ns`,
            COLORS.amber,
            COLORS.amberRgb,
            hl === 'tSkew' ? 9.5 : 8.5
          );
        }

        // ---- Trace 3: D_2 Data Arrival Envelope at FF2 ----
        const d2Hi = laneHi(2);
        const d2Lo = laneLo(2);
        const d2Mid = laneCenter(2);

        const tArrPrev = t0 - timing.tClkNs + timing.tArrivalNs;
        const tArr0 = t0 + timing.tArrivalNs; // Data launched at t0 (checked for Setup against tCap1)
        const tArr1 = t1 + timing.tArrivalNs; // Next data launched at t1 (checked for Hold against tCap1)
        const tArr2 = t2 + timing.tArrivalNs;

        const arrivals = [tArrPrev, tArr0, tArr1, tArr2];
        const edgeSlopeNs = clamp(timing.tClkNs * 0.03, 0.06, 0.14);

        // Draw crisp differential data-bus eye segments between arrival transitions
        ctx.save();
        for (let idx = 0; idx < arrivals.length - 1; idx++) {
          const segStart = arrivals[idx];
          const segEnd = arrivals[idx + 1];
          const xS = nsToX(segStart);
          const xE = nsToX(segEnd);
          const xSIn = nsToX(segStart + edgeSlopeNs);
          const xEIn = nsToX(segEnd - edgeSlopeNs);

          const isCapturedSegment = idx === 1; // Data launched at t0, captured by CLK2 ↑ at tCap1
          const segColor =
            isCapturedSegment && timing.isMetastable
              ? COLORS.crimson
              : isCapturedSegment
                ? COLORS.cyan
                : 'rgba(0, 229, 255, 0.55)';
          const segFill =
            isCapturedSegment && timing.isMetastable
              ? 'rgba(255, 23, 68, 0.10)'
              : isCapturedSegment
                ? 'rgba(0, 229, 255, 0.09)'
                : 'rgba(0, 229, 255, 0.035)';

          ctx.beginPath();
          ctx.moveTo(xS, d2Mid);
          ctx.lineTo(Math.min(xSIn, (xS + xE) * 0.5), d2Hi);
          ctx.lineTo(Math.max(xEIn, (xS + xE) * 0.5), d2Hi);
          ctx.lineTo(xE, d2Mid);
          ctx.lineTo(Math.max(xEIn, (xS + xE) * 0.5), d2Lo);
          ctx.lineTo(Math.min(xSIn, (xS + xE) * 0.5), d2Lo);
          ctx.closePath();
          ctx.fillStyle = segFill;
          ctx.fill();
          ctx.strokeStyle = segColor;
          ctx.lineWidth = isCapturedSegment ? 2 : 1.4;
          ctx.stroke();

          // Segment data tag
          if (xE - xS > 48) {
            const bitTag = idx === 1 ? `DATA[${cycleCount % 2}]` : `DATA[${(cycleCount + idx) % 2}]`;
            ctx.font = "600 9px 'JetBrains Mono', monospace";
            ctx.fillStyle = isCapturedSegment ? COLORS.textPrimary : COLORS.textMuted;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bitTag, (xS + xE) * 0.5, d2Mid + 0.5);
          }
        }
        ctx.restore();

        // Highlight t_cq + t_comb arrival path when tComb is hovered
        const xArr0 = nsToX(tArr0);
        const xArr1 = nsToX(tArr1);
        if (hl === 'tComb') {
          ctx.save();
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 10;
          drawDoubleArrow(ctx, xT0, d2Top + 9, xArr0, COLORS.cyan, 5.5);
          ctx.restore();
          drawLabelPill(
            ctx,
            (xT0 + xArr0) * 0.5,
            d2Top + 9,
            `t_cq + t_comb = ${timing.tArrivalNs.toFixed(2)} ns`,
            COLORS.cyan,
            COLORS.cyanRgb,
            9
          );
        }

        // ---- Setup Slack Dimension Arrow & Pulsing Crimson Overlap Zone ----
        const suArrowY = d2Bot - 11;
        const pulse = 0.55 + 0.45 * Math.sin(simTimeSec * 10);
        hitboxes.setupZone = {
          x: Math.min(xArr0, suStartX) - 10,
          y: d2Top,
          w: Math.abs(suStartX - xArr0) + Math.max(20, capX - suStartX) + 12,
          h: laneH,
        };

        if (timing.setupViolated) {
          // Pulsing Crimson overlap where tArr0 intrudes past (tCap1 - tSu)
          const ovLeft = Math.min(suStartX, xArr0);
          const ovRight = Math.max(suStartX, xArr0);
          ctx.fillStyle = `rgba(${COLORS.crimsonRgb}, ${0.22 + 0.24 * pulse})`;
          ctx.fillRect(ovLeft, d2Top + 2, Math.max(3, ovRight - ovLeft), laneH - 4);
          ctx.strokeStyle = COLORS.crimson;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(ovLeft + 0.5, d2Top + 2.5, Math.max(3, ovRight - ovLeft), laneH - 5);

          drawDoubleArrow(ctx, ovLeft, suArrowY, ovRight, COLORS.crimson, 5);
          drawLabelPill(
            ctx,
            clamp((ovLeft + ovRight) * 0.5, plotX + 64, plotX + plotW - 64),
            suArrowY,
            `S_su ${fmtSigned(timing.setupSlackNs, 2)}ns VIOLATION`,
            COLORS.crimson,
            COLORS.crimsonRgb,
            8.5
          );
        } else {
          const slackColor = hl === 'setupSlack' || timing.setupSlackNs >= 0.35 ? COLORS.emerald : COLORS.amber;
          const slackRgb = hl === 'setupSlack' || timing.setupSlackNs >= 0.35 ? COLORS.emeraldRgb : COLORS.amberRgb;
          if (suStartX - xArr0 > 4) {
            ctx.save();
            if (hl === 'setupSlack') {
              ctx.shadowColor = slackColor;
              ctx.shadowBlur = 10;
            }
            drawDoubleArrow(ctx, xArr0 + 1, suArrowY, suStartX - 1, slackColor, 5);
            ctx.restore();
          }
          drawLabelPill(
            ctx,
            clamp((xArr0 + suStartX) * 0.5, plotX + 46, suStartX - 24),
            suArrowY,
            `S_su ${fmtSigned(timing.setupSlackNs, 2)}ns`,
            slackColor,
            slackRgb,
            hl === 'setupSlack' ? 9.5 : 8.5
          );
        }

        // ---- Hold Slack Dimension Arrow & Pulsing Crimson Overlap Zone ----
        const holdArrowY = d2Top + 13;
        hitboxes.holdZone = {
          x: Math.min(capX, xArr1) - 8,
          y: d2Top,
          w: Math.abs(xArr1 - capX) + Math.max(24, holdEndX - capX) + 12,
          h: laneH,
        };

        if (timing.holdViolated) {
          // Pulsing Crimson overlap where new data tArr1 arrives BEFORE (tCap1 + tHold)
          const ovLeft = Math.min(xArr1, holdEndX);
          const ovRight = Math.max(xArr1, holdEndX);
          ctx.fillStyle = `rgba(${COLORS.crimsonRgb}, ${0.24 + 0.24 * pulse})`;
          ctx.fillRect(ovLeft, d2Top + 2, Math.max(3, ovRight - ovLeft), laneH - 4);
          ctx.strokeStyle = COLORS.crimson;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(ovLeft + 0.5, d2Top + 2.5, Math.max(3, ovRight - ovLeft), laneH - 5);

          drawDoubleArrow(ctx, ovLeft, holdArrowY, ovRight, COLORS.crimson, 5);
          drawLabelPill(
            ctx,
            clamp((ovLeft + ovRight) * 0.5, plotX + 64, plotX + plotW - 64),
            holdArrowY,
            `S_h ${fmtSigned(timing.holdSlackNs, 2)}ns HOLD FAIL`,
            COLORS.crimson,
            COLORS.crimsonRgb,
            8.5
          );
        } else {
          const hColor = hl === 'holdSlack' ? COLORS.violet : timing.holdSlackNs >= 0.25 ? COLORS.emerald : COLORS.amber;
          const hRgb = hl === 'holdSlack' ? COLORS.violetRgb : timing.holdSlackNs >= 0.25 ? COLORS.emeraldRgb : COLORS.amberRgb;
          if (xArr1 - holdEndX > 4) {
            ctx.save();
            if (hl === 'holdSlack') {
              ctx.shadowColor = hColor;
              ctx.shadowBlur = 10;
            }
            drawDoubleArrow(ctx, holdEndX + 1, holdArrowY, xArr1 - 1, hColor, 5);
            ctx.restore();
          }
          if (holdEndX < plotX + plotW - 24) {
            drawLabelPill(
              ctx,
              clamp((holdEndX + xArr1) * 0.5, holdEndX + 36, plotX + plotW - 48),
              holdArrowY,
              `S_h ${fmtSigned(timing.holdSlackNs, 2)}ns`,
              hColor,
              hRgb,
              hl === 'holdSlack' ? 9.5 : 8.5
            );
          }
        }

        // ---- Trace 4: Q_2 Captured Output (Clean Digital Rail vs. Jittering Crimson Metastability) ----
        const q2Hi = laneHi(3);
        const q2Lo = laneLo(3);
        const q2Mid = laneCenter(3);
        const q2Update0 = tCap0 + timing.tCqNs;
        const q2Update1 = tCap1 + timing.tCqNs;
        const q2Update2 = tCap1 + timing.tClkNs + timing.tCqNs;

        if (!timing.isMetastable) {
          // Crisp, rock-solid digital 0/1 rails in Emerald
          ctx.save();
          ctx.strokeStyle = COLORS.emerald;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = COLORS.emerald;
          ctx.shadowBlur = 6;

          const b0 = cycleCount % 2;
          const b1 = 1 - b0;
          const b2 = b0;
          const y0 = b0 ? q2Hi : q2Lo;
          const y1 = b1 ? q2Hi : q2Lo;
          const y2 = b2 ? q2Hi : q2Lo;

          const xU0 = nsToX(q2Update0);
          const xU1 = nsToX(q2Update1);
          const xU2 = nsToX(q2Update2);

          ctx.beginPath();
          ctx.moveTo(plotX, y0);
          ctx.lineTo(xU0, y0);
          ctx.lineTo(xU0 + 4, y1);
          ctx.lineTo(xU1, y1);
          ctx.lineTo(xU1 + 4, y2);
          ctx.lineTo(xU2, y2);
          ctx.lineTo(xU2 + 4, y1);
          ctx.lineTo(plotX + plotW, y1);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Clean logic level tags
          ctx.font = "700 8.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = COLORS.emerald;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (xU1 - xU0 > 46) {
            ctx.fillText(`Q₂ = ${b1} (VALID)`, (xU0 + xU1) * 0.5, q2Mid);
          }
          if (xU2 - xU1 > 52) {
            ctx.fillText(`Q₂ = ${b2} (VALID)`, (xU1 + xU2) * 0.5, q2Mid);
          }
          ctx.restore();
        } else {
          // METASTABLE WAVEFORM: Mid-rail V_DD/2 hovering + ringing + ghost eye-jitter + wrong bit flips!
          const xU0 = nsToX(q2Update0);
          const xU1 = nsToX(q2Update1);
          const metaSpanNs = clamp(0.45 + timing.severity * (timing.tClkNs * 0.42), 0.5, timing.tClkNs * 0.62);
          const xResolve1 = nsToX(q2Update1 + metaSpanNs);
          const xU2 = nsToX(q2Update2);

          // Mid-rail V_DD/2 reference line
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(plotX, q2Mid);
          ctx.lineTo(plotX + plotW, q2Mid);
          ctx.stroke();
          ctx.restore();

          // Shaded metastable uncertainty envelope after CLK2 ↑
          ctx.fillStyle = `rgba(${COLORS.crimsonRgb}, ${0.14 + 0.12 * pulse})`;
          ctx.fillRect(xU1, q2Hi - 2, Math.max(12, xResolve1 - xU1), q2Lo - q2Hi + 4);

          // Ghost multi-capture eye-diagram traces (showing random resolution to 0 OR 1!)
          for (let g = 0; g < 3; g++) {
            ctx.save();
            ctx.strokeStyle = `rgba(${COLORS.crimsonRgb}, ${0.28 + g * 0.1})`;
            ctx.lineWidth = 1.2;
            const resolveToHigh = g % 2 === 0;
            const targetY = resolveToHigh ? q2Hi : q2Lo;
            const ghostResolveX = nsToX(q2Update1 + metaSpanNs * (0.65 + g * 0.24));

            ctx.beginPath();
            ctx.moveTo(plotX, q2Lo);
            ctx.lineTo(xU0, q2Lo);
            ctx.lineTo(xU0 + 4, q2Hi);
            ctx.lineTo(xU1, q2Hi);

            const segs = 22;
            for (let s = 0; s <= segs; s++) {
              const f = s / segs;
              const px = xU1 + (ghostResolveX - xU1) * f;
              const ring = Math.sin(f * 18 + simTimeSec * 22 + g * 2.1) * (3.5 + timing.severity * 4.5) * (1 - f * 0.3);
              ctx.lineTo(px, q2Mid + ring);
            }
            ctx.lineTo(ghostResolveX + 8, targetY);
            ctx.lineTo(plotX + plotW, targetY);
            ctx.stroke();
            ctx.restore();
          }

          // Primary glowing crimson live trace
          ctx.save();
          ctx.strokeStyle = COLORS.crimson;
          ctx.lineWidth = 2.3;
          ctx.shadowColor = COLORS.crimson;
          ctx.shadowBlur = 11;

          const resolvedY = capturedBit ? q2Hi : q2Lo;
          ctx.beginPath();
          ctx.moveTo(plotX, q2Lo);
          ctx.lineTo(xU0, q2Lo);
          ctx.lineTo(xU0 + 5, q2Hi);
          ctx.lineTo(xU1, q2Hi);

          const liveSegs = 28;
          for (let s = 0; s <= liveSegs; s++) {
            const f = s / liveSegs;
            const px = xU1 + (xResolve1 - xU1) * f;
            const osc =
              Math.sin(f * 26 + simTimeSec * 28) * (4.2 + timing.severity * 5.0) +
              Math.cos(f * 41 - simTimeSec * 19) * 2.1;
            ctx.lineTo(px, q2Mid + osc * (0.95 - 0.25 * f));
          }
          ctx.lineTo(Math.min(xU2, xResolve1 + 10), resolvedY);
          ctx.lineTo(plotX + plotW, resolvedY);
          ctx.stroke();
          ctx.restore();

          // Explicit METASTABLE (V_DD/2) badge
          const badgeX = clamp((xU1 + xResolve1) * 0.5, plotX + 86, plotX + plotW - 86);
          drawLabelPill(
            ctx,
            badgeX,
            q2Hi - 3,
            lastBitCorrupted ? 'METASTABLE (V_DD/2) • BIT FLIP!' : 'METASTABLE (V_DD/2)',
            COLORS.crimson,
            COLORS.crimsonRgb,
            8.5
          );
        }

        // Subtle animated trigger sweep beam across logic analyzer for 60 FPS live oscilloscope presence
        const sweepX = plotX + ((simTimeSec * 0.28) % 1) * plotW;
        const sweepGrad = ctx.createLinearGradient(sweepX - 32, 0, sweepX, 0);
        sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        sweepGrad.addColorStop(1, timing.isMetastable ? 'rgba(255, 23, 68, 0.08)' : 'rgba(0, 229, 255, 0.06)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(sweepX - 32, tracesTop, 32, tracesH);

        ctx.restore(); // end clip
      }

      function render(timing) {
        ctx.save();
        ctx.scale(dpr, dpr);

        const splitY = Math.round(cssH * 0.35);
        drawBackgroundGrid(cssW, cssH, splitY);
        renderTopPane(cssW, splitY, timing);
        renderLogicAnalyzer(cssW, splitY, cssH, timing);

        ctx.restore();
      }

      // ---- Push 60 FPS Telemetry & Linked Equation Updates ----
      let lastHudMs = 0;
      function pushLiveReadouts(nowMs, timing) {
        if (nowMs - lastHudMs < 32) return; // ~30-60 Hz smooth updates without jitter
        lastHudMs = nowMs;

        const suColor = timing.setupViolated
          ? 'crimson'
          : timing.setupSlackNs < 0.35
            ? 'amber'
            : 'emerald';
        const hColor = timing.holdViolated
          ? 'crimson'
          : timing.holdSlackNs < 0.25
            ? 'amber'
            : 'emerald';
        const fMaxColor = timing.setupViolated || timing.holdViolated ? 'crimson' : 'cyan';

        let stateLabel = `LOCKED • ${errorCount} err`;
        let stateColor = 'emerald';
        let statusPill = { state: 'safe', label: 'TIMING CLOSED' };

        if (timing.setupViolated && timing.holdViolated) {
          stateLabel = `META BOTH • ${errorCount} err`;
          stateColor = 'crimson';
          statusPill = { state: 'fault', label: 'SETUP + HOLD VIOLATION' };
        } else if (timing.setupViolated) {
          stateLabel = `META SETUP • ${errorCount} err`;
          stateColor = 'crimson';
          statusPill = { state: 'fault', label: 'METASTABLE (SETUP FAIL)' };
        } else if (timing.holdViolated) {
          stateLabel = `META HOLD • ${errorCount} err`;
          stateColor = 'crimson';
          statusPill = { state: 'fault', label: 'METASTABLE (HOLD FAIL)' };
        } else if (timing.isTight) {
          stateLabel = `TIGHT • ${errorCount} err`;
          stateColor = 'amber';
          statusPill = { state: 'warning', label: 'TIGHT TIMING MARGIN' };
        }

        canvasHost.classList.toggle('is-fault', timing.isMetastable);

        if (typeof api.updateTelemetry === 'function') {
          try {
            api.updateTelemetry(
              {
                setupSlack: { value: fmtSigned(timing.setupSlackNs, 2), color: suColor },
                holdSlack: { value: fmtSigned(timing.holdSlackNs, 2), color: hColor },
                fMax: {
                  value: timing.setupUnbounded ? '>9999' : Math.round(timing.fMaxMhz).toString(),
                  color: fMaxColor,
                },
                pipelineState: { value: stateLabel, color: stateColor },
              },
              statusPill
            );
          } catch {
            // Ignore shell update error
          }
        }

        if (typeof api.updateEquation === 'function') {
          try {
            api.updateEquation({
              tClk: timing.tClkNs,
              tComb: timing.tCombNs,
              tSkew: timing.tSkewNs,
              setupSlack: timing.setupSlackNs,
              holdSlack: timing.holdSlackNs,
            });
          } catch {
            // Ignore shell equation error
          }
        }
      }

      // ---- Pointer Interaction (Direct CLK₂ Skew Drag + Bidirectional Equation Hover) ----
      function inRect(px, py, r) {
        return Boolean(r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
      }

      function getCanvasPoint(ev) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ev.clientX - rect.left,
          y: ev.clientY - rect.top,
        };
      }

      function detectHoverVar(x, y) {
        if (inRect(x, y, hitboxes.logicCloud)) return 'tComb';
        if (inRect(x, y, hitboxes.skewNode) || inRect(x, y, hitboxes.tSkewZone)) return 'tSkew';
        if (inRect(x, y, hitboxes.tClkBracket)) return 'tClk';
        if (inRect(x, y, hitboxes.setupZone)) return 'setupSlack';
        if (inRect(x, y, hitboxes.holdZone)) return 'holdSlack';
        return null;
      }

      const onPointerDown = (ev) => {
        const { x, y } = getCanvasPoint(ev);
        if (inRect(x, y, hitboxes.syncBadge)) {
          syncBadgeFocused = !syncBadgeFocused;
          return;
        }
        if (inRect(x, y, hitboxes.clk2DragHandle)) {
          draggingSkew = true;
          canvas.style.cursor = 'ew-resize';
          try {
            canvas.setPointerCapture(ev.pointerId);
          } catch {
            // Ignore
          }
        }
      };

      const onPointerMove = (ev) => {
        const { x, y } = getCanvasPoint(ev);
        if (draggingSkew && hitboxes.waveRect) {
          const wr = hitboxes.waveRect;
          const tPointerNs = ((x - wr.x) / wr.w) * hitboxes.windowNs;
          const rawSkew = tPointerNs - hitboxes.tLaunch1Ns;
          const snapped = Math.round(clamp(rawSkew, -1.0, 1.4) * 20) / 20;
          if (Math.abs(snapped - params.tSkewNs) >= 0.01) {
            params.tSkewNs = snapped;
            syncingControls = true;
            syncShellControl('tSkewNs', snapped);
            syncingControls = false;
          }
          return;
        }

        hoverSyncBadge = inRect(x, y, hitboxes.syncBadge);
        const overHandle = inRect(x, y, hitboxes.clk2DragHandle);
        canvas.style.cursor = overHandle ? 'ew-resize' : hoverSyncBadge ? 'pointer' : 'default';

        const nextHover = detectHoverVar(x, y);
        if (nextHover !== canvasHoverVar) {
          canvasHoverVar = nextHover;
          if (!highlightedVar && typeof api.setHighlightedVar === 'function') {
            try {
              api.setHighlightedVar(nextHover);
            } catch {
              // Ignore
            }
          }
        }
      };

      const onPointerUp = (ev) => {
        if (!draggingSkew) return;
        draggingSkew = false;
        canvas.style.cursor = 'default';
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch {
          // Ignore
        }
      };

      const onPointerLeave = () => {
        if (!draggingSkew) {
          hoverSyncBadge = false;
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
          canvas.style.cursor = 'default';
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('pointerleave', onPointerLeave);

      // ---- Shell Subscriptions ----
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
      registerSub(api.onBreakToggle, (active) => applyBreakMode(active));
      registerSub(api.onReset, () => resetLab());
      registerSub(api.onHoverVar, (key) => {
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

      // ---- 60 FPS Main Loop ----
      let rafId = 0;
      let destroyed = false;
      let lastFrameMs = performance.now();

      function tick(nowMs) {
        if (destroyed) return;
        const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) * 0.001));
        lastFrameMs = nowMs;

        const timing = computeDigitalTiming(params.fClkMhz, params.tCombNs, params.tSkewNs);
        stepSimulation(dt, timing);
        render(timing);
        pushLiveReadouts(nowMs, timing);

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);

      const controller = {
        setControl(id, val) {
          applyControl(id, val);
        },
        setBreakMode(active) {
          applyBreakMode(active);
        },
        setHighlightedVar(key) {
          highlightedVar = key || null;
        },
        reset() {
          resetLab();
        },
        resize() {
          updateViewport();
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          cancelAnimationFrame(rafId);
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerUp);
          canvas.removeEventListener('pointerleave', onPointerLeave);
          window.removeEventListener('resize', onWinResize);
          if (resizeObserver) resizeObserver.disconnect();
          for (const u of unsubs) {
            try {
              u();
            } catch {
              // Ignore
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

export default createF31TimingLab;

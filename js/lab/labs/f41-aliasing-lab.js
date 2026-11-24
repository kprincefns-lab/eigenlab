/**
 * EIGENLAB — Interactive Lab F4.1: Aliasing, Spectral Leakage & Anti-Aliasing Filters
 * 60 FPS Dead-Front Dual-Pane Oscilloscope + Live Spectrum / Spectral-Folding Analyzer.
 *
 * Demonstrates Shannon–Nyquist sampling, exact spectral folding across f_N = f_s / 2,
 * 2nd-order analog Butterworth anti-aliasing attenuation |H(j f_0)| = 1 / sqrt(1 + (f_0/f_c)^4),
 * and Hann vs. Rectangular finite-record windowed spectral leakage.
 *
 * Native ES Module (zero external dependencies).
 */

const COLORS = Object.freeze({
  bg: '#0A0C10',
  panel: '#12151C',
  divider: 'rgba(255, 255, 255, 0.085)',
  gridMajor: 'rgba(255, 255, 255, 0.058)',
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
});

const SCOPE = Object.freeze({
  timeWindowSec: 0.25, // 250 ms time-domain capture window
  freqMaxHz: 150, // Spectrum horizontal range 0 .. 150 Hz
  fSignalMin: 5,
  fSignalMax: 135,
  fsMin: 40,
  fsMax: 220,
  fcMin: 15,
  fcMax: 90,
  phaseRateRadPerSec: 1.45, // Smooth phase drift exposing wagon-wheel alias reversal
  spectrumBins: 240,
});

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Exact 2nd-order analog Butterworth low-pass magnitude:
 *   |H(j f)| = 1 / sqrt(1 + (f / f_c)^4)
 */
export function butterworthMagnitude(freqHz, cutoffHz) {
  const fc = Math.max(1e-6, Number(cutoffHz) || 35);
  const ratio = Math.max(0, Number(freqHz) || 0) / fc;
  const r2 = ratio * ratio;
  return 1.0 / Math.sqrt(1.0 + r2 * r2);
}

/**
 * Exact 2nd-order analog Butterworth low-pass phase (radians):
 *   ∠H(j f) = -atan2(sqrt(2) * (f / f_c), 1 - (f / f_c)^2)
 */
export function butterworthPhaseRad(freqHz, cutoffHz) {
  const fc = Math.max(1e-6, Number(cutoffHz) || 35);
  const u = Math.max(0, Number(freqHz) || 0) / fc;
  return -Math.atan2(Math.SQRT2 * u, 1.0 - u * u);
}

/**
 * Computes exact Nyquist, spectral-folding, Butterworth anti-aliasing, and
 * status metrics for the current sampling configuration.
 */
export function computeAliasingMetrics({
  fSignal = 24,
  fs = 100,
  aaFilterOn = false,
  aaCutoff = 35,
  windowType = 'hann',
} = {}) {
  const f0 = clamp(Number(fSignal) || 24, SCOPE.fSignalMin, SCOPE.fSignalMax);
  const fSample = clamp(Number(fs) || 100, SCOPE.fsMin, SCOPE.fsMax);
  const fc = clamp(Number(aaCutoff) || 35, SCOPE.fcMin, SCOPE.fcMax);
  const fNyquist = fSample * 0.5;

  // Spectral fold index k = round(f0 / fs)
  const foldZone = Math.round(f0 / fSample);
  // Signed folded frequency f_signed in [-f_N, f_N] preserves exact sample-point phase
  const fSigned = f0 - foldZone * fSample;
  const fAlias = Math.abs(fSigned);

  // Strict aliasing whenever input tone exceeds the Nyquist frequency
  const isAliased = f0 > fNyquist + 1e-9;
  const isNearNyquist = !isAliased && f0 >= fNyquist * 0.9;

  // 2nd-order analog Butterworth filter applied BEFORE ADC sampling
  const rawGain = butterworthMagnitude(f0, fc);
  const aaGain = aaFilterOn ? rawGain : 1.0;
  const aaPhaseRad = aaFilterOn ? butterworthPhaseRad(f0, fc) : 0.0;
  const aaGainDb = 20.0 * Math.log10(Math.max(1e-5, aaGain));

  // Suppresses alias hazard once analog pre-filter achieves >= 12 dB attenuation (gain < 0.25)
  const isAliasSuppressed = isAliased && aaFilterOn && aaGain < 0.25;
  const isFault = isAliased && !isAliasSuppressed;

  const samplePeriodMs = 1000.0 / fSample;
  const sampleCount = Math.max(12, Math.round(fSample * SCOPE.timeWindowSec));
  const binSpacingHz = fSample / sampleCount;

  // Measure fractional bin offset (0 = bin-centered, 0.5 = worst-case scallop & spectral leakage)
  const exactBin = fAlias / binSpacingHz;
  const binMismatch = Math.abs(exactBin - Math.round(exactBin));
  const isRect = windowType === 'rect';

  let statusLevel = 'safe';
  let statusLabel = 'NYQUIST SAFE';
  if (isFault) {
    statusLevel = 'fault';
    statusLabel = 'ALIASING FAULT!';
  } else if (isAliasSuppressed) {
    statusLevel = 'warning';
    statusLabel = 'AA-SUPPRESSED ALIAS';
  } else if (isNearNyquist) {
    statusLevel = 'warning';
    statusLabel = 'NEAR NYQUIST LIMIT';
  }

  return {
    fSignal: f0,
    fs: fSample,
    fNyquist,
    foldZone,
    fSigned,
    fAlias,
    isAliased,
    isNearNyquist,
    aaFilterOn: Boolean(aaFilterOn),
    aaCutoff: fc,
    aaGain,
    aaPhaseRad,
    aaGainDb,
    isAliasSuppressed,
    isFault,
    samplePeriodMs,
    sampleCount,
    binSpacingHz,
    binMismatch,
    windowType: isRect ? 'rect' : 'hann',
    statusLevel,
    statusLabel,
  };
}

/**
 * Computes the continuous-frequency windowed DTFT magnitude curve and discrete
 * FFT bin amplitudes across [0, f_N] for the N-sample ADC capture record.
 * Reveals genuine -13.3 dB Rectangular sidelobe leakage vs -31.5 dB Hann suppression.
 */
export function computeWindowedSpectrum(metrics, numPoints = SCOPE.spectrumBins) {
  const N = metrics.sampleCount;
  const fs = metrics.fs;
  const fNyquist = metrics.fNyquist;
  const f0 = metrics.fSignal;
  const amp = metrics.aaGain;
  const isRect = metrics.windowType === 'rect';

  const weights = new Float64Array(N);
  const samples = new Float64Array(N);
  let wSum = 0;
  const denom = Math.max(1, N - 1);

  // Reference cosine phase yields full coherent peak even right at f_0 = f_N
  for (let n = 0; n < N; n++) {
    const w = isRect ? 1.0 : 0.5 * (1.0 - Math.cos((2.0 * Math.PI * n) / denom));
    weights[n] = w;
    wSum += w;
    samples[n] = w * amp * Math.cos((2.0 * Math.PI * f0 * n) / fs);
  }

  const norm = wSum > 1e-9 ? 2.0 / wSum : 0;

  const evalDtftMag = (freqHz) => {
    const omega = (2.0 * Math.PI * freqHz) / fs;
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const x = samples[n];
      const ang = omega * n;
      re += x * Math.cos(ang);
      im -= x * Math.sin(ang);
    }
    const raw = Math.sqrt(re * re + im * im) * norm;
    // DC and Nyquist bins carry half single-sided scaling
    const edgeScale = freqHz < 1e-6 || Math.abs(freqHz - fNyquist) < 1e-6 ? 0.5 : 1.0;
    return clamp(raw * edgeScale, 0, 1.15);
  };

  const freqs = new Float64Array(numPoints);
  const mags = new Float64Array(numPoints);
  for (let i = 0; i < numPoints; i++) {
    const f = (i / (numPoints - 1)) * fNyquist;
    freqs[i] = f;
    mags[i] = evalDtftMag(f);
  }

  // Discrete FFT bins at k * fs / N for 0 <= k <= floor(N/2)
  const numBins = Math.floor(N / 2) + 1;
  const binFreqs = new Float64Array(numBins);
  const binMags = new Float64Array(numBins);
  for (let k = 0; k < numBins; k++) {
    const fk = (k * fs) / N;
    binFreqs[k] = fk;
    binMags[k] = evalDtftMag(fk);
  }

  return { freqs, mags, binFreqs, binMags };
}

/**
 * Factory creating the FrontierLessonShell descriptor for Lab F4.1.
 */
export function createF41AliasingLab() {
  return {
    nodeId: 'F4.1',
    tier: 1,
    badge: 'TIER 1 • SIGNAL PROCESSING & SENSORS',
    title: 'Aliasing, Spectral Leakage & Anti-Aliasing Filters',
    subtitle:
      'Sample continuous motor/IMU vibrations across the Nyquist wall and watch sub-Nyquist ghost frequencies fold into your control loop',

    breakMode: {
      buttonLabel: '⚡ Break: Sub-Nyquist Motor Aliasing',
      activeLabel: '🔥 Sub-Nyquist Aliasing Active',
      activeBanner:
        '🔥 ALIASING FAULT — 85 Hz Motor Vibration Folded to 15 Hz Ghost + Rectangular Leakage',
      triggerLabel: '⚡ Break: Sub-Nyquist Motor Aliasing',
      recoverLabel: '✓ Restore Safe Sampling',
      description:
        'Injects an unfiltered 85 Hz brushless motor/gearbox vibration into a 100 Hz ADC (Nyquist wall f_N = 50 Hz) with a Rectangular FFT window.',
      failureSymptom:
        'The 85 Hz vibration folds across f_N = 50 Hz into a smooth 15 Hz Crimson phantom oscillation right inside servo control bandwidth, surrounded by massive Rectangular spectral leakage sidelobes.',
      recoveryHint:
        'Turn on the 2nd-Order Anti-Aliasing LPF (f_c = 35 Hz) to crush the 85 Hz tone by −15.5 dB before sampling, OR raise ADC Sample Rate f_s above 170 Hz so f_N > 85 Hz!',
      faultControls: {
        fSignal: 85,
        fs: 100,
        aaFilterOn: false,
        windowType: 'rect',
      },
    },

    telemetryDefs: [
      {
        id: 'fAlias',
        key: 'fAlias',
        label: 'Digital f_alias',
        unit: 'Hz',
        initialValue: '24.0',
        color: 'emerald',
      },
      {
        id: 'fNyquist',
        key: 'fNyquist',
        label: 'Nyquist f_N',
        unit: 'Hz',
        initialValue: '50.0',
        color: 'amber',
      },
      {
        id: 'aaGainDb',
        key: 'aaGainDb',
        label: 'AA Gain |H(f₀)|',
        unit: 'dB',
        initialValue: '0.0',
        color: 'emerald',
      },
      {
        id: 'samplingStatus',
        key: 'samplingStatus',
        label: 'Sampling State',
        unit: '',
        initialValue: 'NYQUIST SAFE',
        color: 'emerald',
      },
    ],

    equationSpec: {
      caption: 'Nyquist Folding & Analog Anti-Aliasing Pre-Filter',
      parts: [
        {
          type: 'var',
          key: 'fAlias',
          symbol: 'f_{\\text{alias}}',
          label: 'Folded Frequency f_alias',
          color: 'crimson',
          unit: 'Hz',
          decimals: 1,
          initialValue: 24.0,
          tooltip:
            'Apparent frequency seen by the digital controller after sampling: |f₀ − round(f₀/f_s)·f_s|.',
        },
        { type: 'op', text: '= |' },
        {
          type: 'var',
          key: 'fSignal',
          symbol: 'f_0',
          label: 'Analog Signal f₀',
          color: 'cyan',
          unit: 'Hz',
          decimals: 0,
          initialValue: 24,
          tooltip:
            'True continuous physical vibration frequency arriving at the IMU or encoder frontend.',
        },
        { type: 'op', text: '− round(f₀ /' },
        {
          type: 'var',
          key: 'fs',
          symbol: 'f_s',
          label: 'ADC Sample Rate f_s',
          color: 'amber',
          unit: 'Hz',
          decimals: 0,
          initialValue: 100,
          tooltip:
            'Discrete analog-to-digital conversion clock rate (sample spacing T_s = 1/f_s).',
        },
        { type: 'op', text: ')·f_s|   •' },
        {
          type: 'var',
          key: 'fNyquist',
          symbol: 'f_N = f_s/2',
          label: 'Nyquist Wall f_N',
          color: 'amber',
          unit: 'Hz',
          decimals: 1,
          initialValue: 50.0,
          tooltip:
            'Shannon–Nyquist ceiling f_N = f_s/2. Any analog energy above this wall reflects back into [0, f_N].',
        },
        { type: 'op', text: '  •' },
        {
          type: 'var',
          key: 'aaGainDb',
          symbol: '|H(f_0)|',
          label: 'Butterworth Gain |H(f₀)|',
          color: 'emerald',
          unit: 'dB',
          decimals: 1,
          initialValue: 0.0,
          tooltip:
            '2nd-order analog Butterworth low-pass attenuation 1/√(1 + (f₀/f_c)⁴) applied BEFORE ADC sampling.',
        },
      ],
    },

    controls: [
      {
        id: 'fSignal',
        type: 'range',
        label: 'Analog Signal f₀',
        min: 5,
        max: 135,
        step: 1,
        value: 24,
        unit: 'Hz',
        color: 'cyan',
        hint: 'Drag slider or grab the cyan tone handle directly on the scope/spectrum',
      },
      {
        id: 'fs',
        type: 'range',
        label: 'ADC Sample Rate f_s',
        min: 40,
        max: 220,
        step: 2,
        value: 100,
        unit: 'Hz',
        color: 'amber',
        hint: 'Sets Nyquist Wall f_N = f_s/2 and ADC sample pin spacing T_s = 1/f_s',
      },
      {
        id: 'aaFilterOn',
        type: 'toggle',
        label: '2nd-Order Anti-Aliasing LPF',
        value: false,
        color: 'emerald',
        hint: 'Analog Butterworth filter |H(j f₀)| = 1/√(1+(f₀/f_c)⁴) before ADC',
      },
      {
        id: 'aaCutoff',
        type: 'range',
        label: 'LPF Cutoff f_c',
        min: 15,
        max: 90,
        step: 1,
        value: 35,
        unit: 'Hz',
        color: 'emerald',
        hint: '−3 dB corner frequency (place safely below Nyquist wall f_N)',
      },
      {
        id: 'windowType',
        type: 'segmented',
        label: 'FFT Window',
        value: 'hann',
        color: 'violet',
        options: [
          { value: 'hann', label: 'Hann Window' },
          { value: 'rect', label: 'Rectangular (Leakage)' },
        ],
        hint: 'Compare Hann (−31.5 dB sidelobes) vs Rectangular (−13.3 dB spectral leakage)',
      },
    ],

    presets: [
      {
        label: 'Clean 24 Hz Signal',
        values: { fSignal: 24, fs: 100, aaFilterOn: false, aaCutoff: 35, windowType: 'hann' },
        breakMode: false,
      },
      {
        label: '85 Hz + AA Shield',
        values: { fSignal: 85, fs: 100, aaFilterOn: true, aaCutoff: 35, windowType: 'hann' },
        breakMode: false,
      },
      {
        label: 'Fast 200 Hz ADC',
        values: { fSignal: 85, fs: 200, aaFilterOn: false, aaCutoff: 35, windowType: 'hann' },
        breakMode: false,
      },
    ],

    steps: {
      concept: {
        title: 'Why High-Frequency Vibrations Masquerade as Slow Drift',
        body:
          'Digital flight controllers, robot IMUs, and servo drives only see snapshots taken at discrete ticks t_n = n / f_s. Whenever an analog vibration exceeds the Nyquist frequency f_N = f_s / 2, infinitely many sinusoids pass through the exact same ADC sample points—causing high-frequency motor noise to impersonate a slow, dangerous ghost wave.',
        bullets: [
          'Shannon–Nyquist Theorem: exact reconstruction requires f_s > 2 f_max (i.e. all energy strictly below f_N = f_s / 2).',
          'Spectral Folding: any tone at f₀ > f_N reflects like a mirror across f_N to f_alias = |f₀ − round(f₀ / f_s) · f_s|.',
          'Analog Pre-Filtering: once a tone aliases into your samples, NO digital filter can ever distinguish it from real motion—you must attenuate it in analog hardware BEFORE the ADC.',
        ],
        callout:
          'Drag the glowing Cyan tone spike right across the Amber Nyquist Wall in the bottom spectrum—watch the Crimson ghost wave bounce backward across f_N while passing through EVERY single Amber ADC dot!',
      },
      explore: {
        title: 'Sweep Across the Nyquist Wall & Test Spectral Windows',
        body:
          'Grab the Cyan tone handle, the Amber Nyquist Wall, or the sliders to explore folding, analog Butterworth attenuation, and finite-window FFT leakage.',
        bullets: [
          'Slowly sweep Analog Signal f₀ from 24 Hz past 50 Hz up to 85 Hz: notice the reconstructed wave flip from Emerald to pulsing Crimson and reverse its scroll direction (wagon-wheel effect)!',
          'Toggle 2nd-Order Anti-Aliasing LPF ON with f_c = 35 Hz: watch |H(j f₀)| crush the 85 Hz amplitude by −15.5 dB before the ADC ever samples it.',
          'Switch FFT Window between Hann and Rectangular (Leakage) at f₀ = 85 Hz (f_alias = 15 Hz): observe how off-bin sampling explodes into wide −13.3 dB Rectangular sidelobes that Hann suppresses cleanly.',
        ],
      },
      linkedMath: {
        title: 'Inspect the Live Folding & Filter Math',
        body:
          'Hover or tap any variable in the Live Linked Equation below the canvas to spotlight its exact physical geometry on both the oscilloscope and spectrum analyzer.',
        bullets: [
          'f_N = f_s/2 (Amber Wall): pulses the Nyquist ceiling dividing faithful reconstruction from the Crimson aliasing danger zone.',
          'f_alias (Crimson Ghost): illuminates the folded low-frequency waveform passing through every ADC pin plus the curved spectral reflection arc.',
          'f₀ (Cyan Tone) & |H(f₀)| (Emerald LPF): compares raw analog excitation against the 2nd-order Butterworth passband/stopband attenuation curve.',
        ],
      },
      breakSystem: {
        title: 'Break: Sub-Nyquist Motor Aliasing Fault',
        body:
          'Click "⚡ Break: Sub-Nyquist Motor Aliasing" to hit a 100 Hz control ADC with an unfiltered 85 Hz motor/gearbox vibration under a Rectangular FFT window.',
        symptom:
          'An 85 Hz vibration folds across f_N = 50 Hz into a deceptive 15 Hz Crimson phantom oscillation directly inside servo control bandwidth, smeared across neighboring FFT bins by Rectangular leakage.',
        recovery:
          'Enable the 2nd-Order Anti-Aliasing LPF (f_c = 35 Hz) to slash the ghost by −15.5 dB before sampling, OR increase ADC Sample Rate f_s above 170 Hz so the Nyquist wall clears 85 Hz!',
      },
    },

    intuitionCheck: {
      question:
        'A quadruped IMU samples at f_s = 100 Hz with no analog anti-aliasing filter. An unbalanced rotor injects a 85 Hz structural vibration. What does the digital controller observe, and can a 30 Hz digital software low-pass filter remove it?',
      options: [
        {
          id: 'a',
          text: 'It observes an 85 Hz spike, which a 30 Hz digital software low-pass filter cleanly removes.',
          correct: false,
          feedback:
            'Not possible! A 100 Hz ADC can only represent frequencies up to f_N = 50 Hz. An 85 Hz tone never appears at 85 Hz in digital memory.',
        },
        {
          id: 'b',
          text: 'It observes a 15 Hz phantom oscillation; a 30 Hz digital filter CANNOT remove it because 15 Hz lies inside the passband.',
          correct: true,
          feedback:
            'Exactly right! f_alias = |85 − 100| = 15 Hz. Once aliased into 15 Hz samples, it is mathematically indistinguishable from true 15 Hz body motion—only an analog anti-aliasing filter before the ADC (or f_s > 170 Hz) prevents it.',
        },
        {
          id: 'c',
          text: 'It observes pure zero (DC) because anything above f_N = 50 Hz is automatically discarded by the ADC.',
          correct: false,
          feedback:
            'ADCs do not discard super-Nyquist energy—they fold it back into [0, f_N]. Only exact integer multiples of f_s fold to DC (0 Hz).',
        },
        {
          id: 'd',
          text: 'Switching the FFT from a Rectangular window to a Hann window eliminates the 15 Hz alias completely.',
          correct: false,
          feedback:
            'A Hann window suppresses spectral leakage sidelobes around the peak, but it cannot undo aliasing—the 15 Hz phantom tone is already baked into the ADC samples.',
        },
      ],
      correctIndex: 1,
      explanation:
        'At f_s = 100 Hz (f_N = 50 Hz), an 85 Hz vibration folds to f_alias = |85 − round(85/100)·100| = 15 Hz. Because 15 Hz sits below 30 Hz, a digital low-pass filter passes it untouched. You must attenuate above f_N in analog hardware BEFORE sampling, or sample faster than 2 f₀ (>170 Hz).',
    },

    frontierBridge: {
      headline: 'Why Flight Controllers & Humanoid IMUs Combine Hardware RC Filters with kHz Sampling',
      whyItMatters:
        'Quadcopter propellers, brushless actuators, and planetary gearboxes vibrate at 80–400 Hz—far above typical 50–100 Hz reinforcement-learning or MPC control loops. Without analog anti-aliasing filters (and oversampled 1–8 kHz IMU frontends with decimation), motor harmonics fold directly into 5–25 Hz body-tilt estimates, causing violent PID chatter, Kalman filter divergence, and resonant frame instability.',
      prereqs: ['F1.1'],
      unlocks: ['F4.2', 'F4.3', 'M3.2'],
    },

    /**
     * Mounts the 60 FPS Dual-Pane Dead-Front Oscilloscope + Spectrum Analyzer.
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
        'Interactive dual-pane oscilloscope and live frequency spectrum analyzer for Nyquist aliasing, Butterworth anti-aliasing filtering, and windowed spectral leakage.'
      );
      canvasHost.textContent = '';
      canvasHost.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      // ---- Shell Control State ----
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
          // Fallback to default
        }
        return fallback;
      };

      const DEFAULTS = Object.freeze({
        fSignal: 24,
        fs: 100,
        aaFilterOn: false,
        aaCutoff: 35,
        windowType: 'hann',
      });

      const params = {
        fSignal: clamp(Number(readInitialControl('fSignal', DEFAULTS.fSignal)), SCOPE.fSignalMin, SCOPE.fSignalMax),
        fs: clamp(Number(readInitialControl('fs', DEFAULTS.fs)), SCOPE.fsMin, SCOPE.fsMax),
        aaFilterOn: Boolean(readInitialControl('aaFilterOn', DEFAULTS.aaFilterOn)),
        aaCutoff: clamp(Number(readInitialControl('aaCutoff', DEFAULTS.aaCutoff)), SCOPE.fcMin, SCOPE.fcMax),
        windowType:
          String(readInitialControl('windowType', DEFAULTS.windowType)) === 'rect' ? 'rect' : 'hann',
      };

      let breakActive = Boolean(typeof api.isBroken === 'function' ? api.isBroken() : false);
      let savedBeforeBreak = { ...params };
      let highlightedVar = null;
      let canvasHoverVar = null;
      let syncingControls = false;

      // Cached metrics & spectrum (recomputed only when parameters change)
      let metrics = computeAliasingMetrics(params);
      let spectrum = computeWindowedSpectrum(metrics);
      let spectrumDirty = false;

      function recomputeDSP() {
        metrics = computeAliasingMetrics(params);
        spectrum = computeWindowedSpectrum(metrics);
        spectrumDirty = false;
        canvasHost.classList.toggle('is-fault', metrics.isFault);
      }

      function pushShellControl(id, val) {
        if (typeof api.setControlValue !== 'function') return;
        syncingControls = true;
        try {
          api.setControlValue(id, val, { notify: false });
        } catch {
          // Ignore shell sync errors
        } finally {
          syncingControls = false;
        }
      }

      function applyControl(id, val) {
        if (syncingControls) return;
        let changed = false;

        if (id === 'fSignal') {
          const next = clamp(Math.round(Number(val)), SCOPE.fSignalMin, SCOPE.fSignalMax);
          if (Number.isFinite(next) && next !== params.fSignal) {
            params.fSignal = next;
            changed = true;
          }
        } else if (id === 'fs') {
          const next = clamp(Math.round(Number(val) / 2) * 2, SCOPE.fsMin, SCOPE.fsMax);
          if (Number.isFinite(next) && next !== params.fs) {
            params.fs = next;
            changed = true;
          }
        } else if (id === 'aaFilterOn') {
          const next = Boolean(val);
          if (next !== params.aaFilterOn) {
            params.aaFilterOn = next;
            changed = true;
          }
        } else if (id === 'aaCutoff') {
          const next = clamp(Math.round(Number(val)), SCOPE.fcMin, SCOPE.fcMax);
          if (Number.isFinite(next) && next !== params.aaCutoff) {
            params.aaCutoff = next;
            changed = true;
          }
        } else if (id === 'windowType') {
          const next = String(val) === 'rect' ? 'rect' : 'hann';
          if (next !== params.windowType) {
            params.windowType = next;
            changed = true;
          }
        }

        if (changed) {
          spectrumDirty = true;
          recomputeDSP();
        }
      }

      function applyBreakMode(active) {
        const next = Boolean(active);
        breakActive = next;
        if (next) {
          savedBeforeBreak = { ...params };
          params.fSignal = 85;
          params.fs = 100;
          params.aaFilterOn = false;
          params.windowType = 'rect';

          pushShellControl('fSignal', params.fSignal);
          pushShellControl('fs', params.fs);
          pushShellControl('aaFilterOn', params.aaFilterOn);
          pushShellControl('windowType', params.windowType);
        } else {
          params.fSignal = savedBeforeBreak.fSignal ?? DEFAULTS.fSignal;
          params.fs = savedBeforeBreak.fs ?? DEFAULTS.fs;
          params.aaFilterOn = savedBeforeBreak.aaFilterOn ?? DEFAULTS.aaFilterOn;
          params.aaCutoff = savedBeforeBreak.aaCutoff ?? DEFAULTS.aaCutoff;
          params.windowType = savedBeforeBreak.windowType ?? DEFAULTS.windowType;

          pushShellControl('fSignal', params.fSignal);
          pushShellControl('fs', params.fs);
          pushShellControl('aaFilterOn', params.aaFilterOn);
          pushShellControl('aaCutoff', params.aaCutoff);
          pushShellControl('windowType', params.windowType);
        }
        recomputeDSP();
      }

      function resetState() {
        breakActive = false;
        params.fSignal = DEFAULTS.fSignal;
        params.fs = DEFAULTS.fs;
        params.aaFilterOn = DEFAULTS.aaFilterOn;
        params.aaCutoff = DEFAULTS.aaCutoff;
        params.windowType = DEFAULTS.windowType;
        savedBeforeBreak = { ...DEFAULTS };
        recomputeDSP();
      }

      // ---- Layout Metrics (Dual Pane: Top 52% Time Scope, Bottom 48% Spectrum) ----
      let cssW = 740;
      let cssH = 480;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const layout = {
        topPaneH: 250,
        botPaneY: 250,
        botPaneH: 230,
        // Top oscilloscope plot rect
        tx: 52,
        ty: 34,
        tw: 660,
        th: 186,
        tMidY: 127,
        tAmpPx: 72,
        // Bottom spectrum plot rect
        fx: 52,
        fy: 284,
        fw: 660,
        fh: 158,
      };

      function updateViewport() {
        const rect = canvasHost.getBoundingClientRect();
        cssW = Math.max(320, Math.round(rect.width || canvasHost.clientWidth || 740));
        cssH = Math.max(340, Math.round(rect.height || canvasHost.clientHeight || 480));
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        const targetW = Math.round(cssW * dpr);
        const targetH = Math.round(cssH * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const padL = cssW < 480 ? 40 : 52;
        const padR = cssW < 480 ? 16 : 24;
        const topH = Math.round(cssH * 0.52);
        const botY = topH;
        const botH = cssH - topH;

        layout.topPaneH = topH;
        layout.botPaneY = botY;
        layout.botPaneH = botH;

        layout.tx = padL;
        layout.ty = 34;
        layout.tw = Math.max(160, cssW - padL - padR);
        layout.th = Math.max(96, topH - 60);
        layout.tMidY = layout.ty + layout.th * 0.5;
        layout.tAmpPx = layout.th * 0.41;

        layout.fx = padL;
        layout.fy = botY + 34;
        layout.fw = layout.tw;
        layout.fh = Math.max(88, botH - 64);
      }

      // Coordinate helpers
      const timeToX = (tSec) => layout.tx + (tSec / SCOPE.timeWindowSec) * layout.tw;
      const ampToY = (a) => layout.tMidY - a * layout.tAmpPx;
      const freqToX = (fHz) => layout.fx + (clamp(fHz, 0, SCOPE.freqMaxHz) / SCOPE.freqMaxHz) * layout.fw;
      const xToFreq = (sx) => ((sx - layout.fx) / layout.fw) * SCOPE.freqMaxHz;
      const magToY = (m) => layout.fy + layout.fh - clamp(m, 0, 1.12) * (layout.fh * 0.9);

      // ---- Interactive Handles & Pointer Dragging ----
      let dragMode = null; // 'fSignal' | 'fNyquist' | 'aaCutoff' | 'scopeFreq'
      let dragStartX = 0;
      let dragStartFSignal = 24;
      let hoverHandle = null;

      function getActiveHighlight() {
        return highlightedVar || canvasHoverVar;
      }

      function getHandlePositions() {
        const f0X = freqToX(metrics.fSignal);
        const f0Y = magToY(metrics.aaGain);
        const fNX = freqToX(Math.min(metrics.fNyquist, SCOPE.freqMaxHz));
        const fNY = layout.fy + 16;
        const fcX = freqToX(metrics.aaCutoff);
        const fcY = magToY(Math.SQRT1_2); // -3 dB point = 0.7071
        const scopeKnobX = layout.tx + layout.tw - 14;
        const scopeKnobY = layout.ty + 18;
        return { f0X, f0Y, fNX, fNY, fcX, fcY, scopeKnobX, scopeKnobY };
      }

      function hitTestHandle(sx, sy) {
        const h = getHandlePositions();
        // Spectrum f0 cyan spike handle (generous hit area along top + stem)
        if (Math.hypot(sx - h.f0X, sy - h.f0Y) <= 18) return 'fSignal';
        if (
          Math.abs(sx - h.f0X) <= 10 &&
          sy >= Math.min(h.f0Y, layout.fy + layout.fh) - 10 &&
          sy <= layout.fy + layout.fh + 8
        ) {
          return 'fSignal';
        }
        // Spectrum Butterworth f_c cutoff handle (when LPF is on)
        if (metrics.aaFilterOn && Math.hypot(sx - h.fcX, sy - h.fcY) <= 16) {
          return 'aaCutoff';
        }
        // Spectrum Nyquist wall drag handle
        if (
          metrics.fNyquist <= SCOPE.freqMaxHz &&
          Math.abs(sx - h.fNX) <= 12 &&
          sy >= layout.fy - 6 &&
          sy <= layout.fy + layout.fh + 6
        ) {
          return 'fNyquist';
        }
        // Top scope drag-frequency region
        if (
          sx >= layout.tx &&
          sx <= layout.tx + layout.tw &&
          sy >= layout.ty &&
          sy <= layout.ty + layout.th
        ) {
          return 'scopeFreq';
        }
        return null;
      }

      function detectHoverVar(sx, sy) {
        const h = getHandlePositions();
        if (Math.hypot(sx - h.f0X, sy - h.f0Y) <= 18) return 'fSignal';
        if (
          metrics.isAliased &&
          Math.abs(sx - freqToX(metrics.fAlias)) <= 14 &&
          sy >= layout.fy &&
          sy <= layout.fy + layout.fh
        ) {
          return 'fAlias';
        }
        if (
          metrics.fNyquist <= SCOPE.freqMaxHz &&
          Math.abs(sx - h.fNX) <= 13 &&
          sy >= layout.fy - 8 &&
          sy <= layout.fy + layout.fh + 8
        ) {
          return 'fNyquist';
        }
        if (
          metrics.aaFilterOn &&
          sy >= layout.fy &&
          sy <= layout.fy + layout.fh &&
          Math.abs(sy - magToY(butterworthMagnitude(clamp(xToFreq(sx), 0, SCOPE.freqMaxHz), metrics.aaCutoff))) <= 12
        ) {
          return 'aaGainDb';
        }
        return null;
      }

      function getCanvasPoint(ev) {
        const rect = canvas.getBoundingClientRect();
        return {
          sx: ev.clientX - rect.left,
          sy: ev.clientY - rect.top,
        };
      }

      const onPointerDown = (ev) => {
        const { sx, sy } = getCanvasPoint(ev);
        const hit = hitTestHandle(sx, sy);
        if (!hit) return;

        dragMode = hit;
        dragStartX = sx;
        dragStartFSignal = params.fSignal;
        canvas.style.cursor = 'ew-resize';
        try {
          canvas.setPointerCapture(ev.pointerId);
        } catch {
          // Ignore pointer capture errors
        }
      };

      const onPointerMove = (ev) => {
        const { sx, sy } = getCanvasPoint(ev);

        if (dragMode) {
          if (dragMode === 'fSignal') {
            const nextF0 = clamp(Math.round(xToFreq(sx)), SCOPE.fSignalMin, SCOPE.fSignalMax);
            if (nextF0 !== params.fSignal) {
              params.fSignal = nextF0;
              pushShellControl('fSignal', nextF0);
              recomputeDSP();
            }
          } else if (dragMode === 'fNyquist') {
            const targetFn = clamp(xToFreq(sx), SCOPE.fsMin * 0.5, SCOPE.fsMax * 0.5);
            const nextFs = clamp(Math.round(targetFn) * 2, SCOPE.fsMin, SCOPE.fsMax);
            if (nextFs !== params.fs) {
              params.fs = nextFs;
              pushShellControl('fs', nextFs);
              recomputeDSP();
            }
          } else if (dragMode === 'aaCutoff') {
            const nextFc = clamp(Math.round(xToFreq(sx)), SCOPE.fcMin, SCOPE.fcMax);
            if (nextFc !== params.aaCutoff) {
              params.aaCutoff = nextFc;
              pushShellControl('aaCutoff', nextFc);
              recomputeDSP();
            }
          } else if (dragMode === 'scopeFreq') {
            const deltaHz = Math.round(((sx - dragStartX) / Math.max(120, layout.tw)) * 90);
            const nextF0 = clamp(dragStartFSignal + deltaHz, SCOPE.fSignalMin, SCOPE.fSignalMax);
            if (nextF0 !== params.fSignal) {
              params.fSignal = nextF0;
              pushShellControl('fSignal', nextF0);
              recomputeDSP();
            }
          }
          return;
        }

        hoverHandle = hitTestHandle(sx, sy);
        if (hoverHandle === 'fSignal' || hoverHandle === 'fNyquist' || hoverHandle === 'aaCutoff') {
          canvas.style.cursor = 'ew-resize';
        } else if (hoverHandle === 'scopeFreq') {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'default';
        }

        const nextVar = detectHoverVar(sx, sy);
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

      const onPointerUp = (ev) => {
        if (!dragMode) return;
        dragMode = null;
        canvas.style.cursor = hoverHandle ? 'ew-resize' : 'default';
        try {
          canvas.releasePointerCapture(ev.pointerId);
        } catch {
          // Ignore
        }
      };

      const onPointerLeave = () => {
        if (dragMode) return;
        hoverHandle = null;
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

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('pointerleave', onPointerLeave);

      // ---- Drawing Helpers ----
      function drawRoundedPill(x, y, w, h, r, fill, stroke) {
        const radius = Math.min(r, w * 0.5, h * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ---- TOP 52% PANE: Time-Domain Sampling Scope ----
      function renderTimeScope(nowMs, phaseRad, activeVar) {
        const { tx, ty, tw, th, tMidY } = layout;
        const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.0075);

        const hlSignal = activeVar === 'fSignal';
        const hlFs = activeVar === 'fs';
        const hlAlias = activeVar === 'fAlias';
        const hlFilter = activeVar === 'aaGainDb';

        // Subtle fault tint in top pane when unattenuated aliasing is active
        if (metrics.isFault) {
          const grad = ctx.createRadialGradient(
            tx + tw * 0.5,
            tMidY,
            10,
            tx + tw * 0.5,
            tMidY,
            tw * 0.65
          );
          grad.addColorStop(0, `rgba(${COLORS.crimsonRgb}, ${0.065 + 0.03 * pulse})`);
          grad.addColorStop(1, 'rgba(10, 12, 16, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(tx, ty, tw, th);
        }

        // Graticule grid
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx, ty, tw, th);
        ctx.clip();

        // Vertical time grid every 25 ms (major every 50 ms)
        for (let ms = 0; ms <= 250; ms += 25) {
          const gx = timeToX(ms * 0.001);
          ctx.beginPath();
          ctx.moveTo(gx, ty);
          ctx.lineTo(gx, ty + th);
          ctx.strokeStyle = ms % 50 === 0 ? COLORS.gridMajor : COLORS.gridMinor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Horizontal amplitude grid (-1, -0.5, 0, +0.5, +1)
        const ampLevels = [-1, -0.5, 0, 0.5, 1];
        for (const a of ampLevels) {
          const gy = ampToY(a);
          ctx.beginPath();
          ctx.moveTo(tx, gy);
          ctx.lineTo(tx + tw, gy);
          ctx.strokeStyle = a === 0 ? 'rgba(255, 255, 255, 0.14)' : COLORS.gridMinor;
          ctx.lineWidth = a === 0 ? 1.15 : 1;
          ctx.stroke();
        }

        // 1) Raw pre-filter analog reference ghost (dashed cyan) when AA LPF is active
        const steps = Math.max(360, Math.round(tw * 1.1));
        if (metrics.aaFilterOn) {
          ctx.save();
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * SCOPE.timeWindowSec;
            const yVal = Math.sin(2.0 * Math.PI * metrics.fSignal * t + phaseRad);
            const px = timeToX(t);
            const py = ampToY(yVal);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = hlFilter
            ? `rgba(${COLORS.cyanRgb}, 0.52)`
            : `rgba(${COLORS.cyanRgb}, 0.24)`;
          ctx.lineWidth = hlFilter ? 1.6 : 1.1;
          ctx.stroke();
          ctx.restore();
        }

        // 2) Continuous physical sensor waveform x(t) entering ADC (Electric Cyan)
        const effAmp = metrics.aaGain;
        const effPhase = phaseRad + metrics.aaPhaseRad;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * SCOPE.timeWindowSec;
          const yVal = effAmp * Math.sin(2.0 * Math.PI * metrics.fSignal * t + effPhase);
          const px = timeToX(t);
          const py = ampToY(yVal);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = hlSignal
          ? COLORS.cyan
          : metrics.isAliased
            ? `rgba(${COLORS.cyanRgb}, 0.48)`
            : `rgba(${COLORS.cyanRgb}, 0.85)`;
        ctx.lineWidth = hlSignal ? 2.8 : metrics.isAliased ? 1.35 : 2.0;
        if (hlSignal) {
          ctx.shadowColor = COLORS.cyan;
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.restore();

        // 3) Reconstructed digital signal x_alias(t) passing through EVERY sample dot
        const aliasColor = metrics.isFault
          ? COLORS.crimson
          : metrics.isAliasSuppressed
            ? COLORS.amber
            : COLORS.emerald;
        const aliasRgb = metrics.isFault
          ? COLORS.crimsonRgb
          : metrics.isAliasSuppressed
            ? COLORS.amberRgb
            : COLORS.emeraldRgb;

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * SCOPE.timeWindowSec;
          // Exact phase-locked folded sine: matches x(t_n) identically at every t_n = n / f_s
          const yVal = effAmp * Math.sin(2.0 * Math.PI * metrics.fSigned * t + effPhase);
          const px = timeToX(t);
          const py = ampToY(yVal);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        // Outer phosphor glow when aliased or hovered
        if (metrics.isAliased || hlAlias) {
          ctx.save();
          ctx.strokeStyle = `rgba(${aliasRgb}, ${hlAlias ? 0.55 : 0.25 + 0.16 * pulse})`;
          ctx.lineWidth = hlAlias ? 8 : 6;
          ctx.stroke();
          ctx.restore();
        }

        ctx.strokeStyle = aliasColor;
        ctx.lineWidth = hlAlias ? 3.2 : metrics.isAliased ? 2.55 : 2.0;
        if (!metrics.isAliased && !hlAlias) {
          ctx.setLineDash([7, 4]);
        }
        ctx.shadowColor = aliasColor;
        ctx.shadowBlur = hlAlias ? 14 : metrics.isFault ? 10 : 4;
        ctx.stroke();
        ctx.restore();

        // 4) Discrete ADC Sample Pins at t_n = n / f_s (Glowing Amber stems + pinheads)
        const dtSample = 1.0 / metrics.fs;
        const maxSamples = Math.floor(SCOPE.timeWindowSec * metrics.fs);
        ctx.save();
        for (let n = 0; n <= maxSamples; n++) {
          const tn = n * dtSample;
          if (tn > SCOPE.timeWindowSec + 1e-9) break;
          const xn = effAmp * Math.sin(2.0 * Math.PI * metrics.fSignal * tn + effPhase);
          const sx = timeToX(tn);
          const sy = ampToY(xn);

          // Vertical stem from 0 axis to sample dot
          ctx.beginPath();
          ctx.moveTo(sx, tMidY);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = hlFs
            ? `rgba(${COLORS.amberRgb}, 0.78)`
            : `rgba(${COLORS.amberRgb}, 0.36)`;
          ctx.lineWidth = hlFs ? 1.8 : 1.2;
          ctx.stroke();

          // Glowing Amber pinhead
          ctx.beginPath();
          ctx.arc(sx, sy, hlFs ? 4.8 : 3.6, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.amber;
          ctx.shadowColor = COLORS.amber;
          ctx.shadowBlur = hlFs ? 12 : 6;
          ctx.fill();

          // Crisp hot core
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFF7DB';
          ctx.fill();
        }
        ctx.restore();

        // When fs is hovered, draw explicit sample-period T_s bracket between n=1 and n=2
        if (hlFs && maxSamples >= 2) {
          const x1 = timeToX(dtSample);
          const x2 = timeToX(2 * dtSample);
          const by = ty + 20;
          ctx.save();
          ctx.strokeStyle = COLORS.amber;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, by - 4);
          ctx.lineTo(x1, by + 4);
          ctx.moveTo(x1, by);
          ctx.lineTo(x2, by);
          ctx.moveTo(x2, by - 4);
          ctx.lineTo(x2, by + 4);
          ctx.stroke();
          ctx.font = "600 10px 'JetBrains Mono', monospace";
          ctx.fillStyle = '#FFD875';
          ctx.textAlign = 'left';
          ctx.fillText(`T_s = ${metrics.samplePeriodMs.toFixed(1)} ms`, x2 + 6, by + 3.5);
          ctx.restore();
        }

        ctx.restore(); // end clip

        // Scope border frame
        ctx.strokeStyle = metrics.isFault
          ? `rgba(${COLORS.crimsonRgb}, 0.38)`
          : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, th);

        // Y-axis amplitude labels
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.axisLabel;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('+1.0', tx - 7, ampToY(1));
        ctx.fillText('0.0', tx - 7, tMidY);
        ctx.fillText('−1.0', tx - 7, ampToY(-1));

        // X-axis time ticks (ms)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let ms = 0; ms <= 250; ms += 50) {
          ctx.fillText(`${ms} ms`, timeToX(ms * 0.001), ty + th + 5);
        }

        // Top Pane Header Bar
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = "700 10.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#9BA8C2';
        ctx.fillText('TIME-DOMAIN SAMPLING SCOPE', tx, 17);

        // Compact legend chips on top-right
        const legendY = 17;
        let rx = tx + tw;
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.textAlign = 'right';

        const statusBadgeText = metrics.isFault
          ? `ALIAS FAULT: ${metrics.fSignal} Hz → ${metrics.fAlias.toFixed(0)} Hz`
          : metrics.isAliasSuppressed
            ? `AA-FILTERED: ${metrics.aaGainDb.toFixed(1)} dB`
            : `RECONSTRUCTED: ${metrics.fAlias.toFixed(0)} Hz`;
        const bw = ctx.measureText(statusBadgeText).width + 16;
        drawRoundedPill(
          rx - bw,
          legendY - 9,
          bw,
          18,
          9,
          `rgba(${aliasRgb}, 0.16)`,
          `rgba(${aliasRgb}, 0.55)`
        );
        ctx.fillStyle = aliasColor;
        ctx.fillText(statusBadgeText, rx - 8, legendY + 0.5);
        rx -= bw + 10;

        if (cssW >= 540) {
          const adcTag = `● ADC ${metrics.fs} Hz`;
          ctx.fillStyle = COLORS.amber;
          ctx.fillText(adcTag, rx, legendY + 0.5);
          rx -= ctx.measureText(adcTag).width + 12;

          const sigTag = `━ x(t) ${metrics.fSignal} Hz`;
          ctx.fillStyle = COLORS.cyan;
          ctx.fillText(sigTag, rx, legendY + 0.5);
        }

        // Subtle drag hint inside bottom-right corner of top scope
        if (!dragMode && cssW >= 460) {
          ctx.font = "500 9.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = 'rgba(139, 151, 176, 0.5)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('⇄ drag horizontally to sweep f₀', tx + tw - 7, ty + th - 5);
        }
      }

      // ---- BOTTOM 48% PANE: Live Frequency-Domain Spectrum (FFT / Folding Map) ----
      function renderSpectrumPane(nowMs, activeVar) {
        const { fx, fy, fw, fh, botPaneY } = layout;
        const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.008);

        const hlSignal = activeVar === 'fSignal';
        const hlFs = activeVar === 'fs';
        const hlNyquist = activeVar === 'fNyquist';
        const hlAlias = activeVar === 'fAlias';
        const hlFilter = activeVar === 'aaGainDb';

        // Crisp divider between Top and Bottom panes
        ctx.beginPath();
        ctx.moveTo(0, botPaneY);
        ctx.lineTo(cssW, botPaneY);
        ctx.strokeStyle = COLORS.divider;
        ctx.lineWidth = 1;
        ctx.stroke();

        const fNClamped = Math.min(metrics.fNyquist, SCOPE.freqMaxHz);
        const xNyquist = freqToX(fNClamped);
        const baseY = fy + fh;

        ctx.save();
        ctx.beginPath();
        ctx.rect(fx, fy, fw, fh);
        ctx.clip();

        // 1) Shaded Super-Nyquist Aliasing Danger Zone (f > f_N)
        if (metrics.fNyquist < SCOPE.freqMaxHz) {
          const dangerW = fx + fw - xNyquist;
          ctx.fillStyle = hlNyquist
            ? `rgba(${COLORS.crimsonRgb}, ${0.14 + 0.05 * pulse})`
            : metrics.isFault
              ? `rgba(${COLORS.crimsonRgb}, ${0.095 + 0.03 * pulse})`
              : `rgba(${COLORS.crimsonRgb}, 0.048)`;
          ctx.fillRect(xNyquist, fy, dangerW, fh);

          // Subtle diagonal hatch inside super-Nyquist zone
          ctx.save();
          ctx.strokeStyle = `rgba(${COLORS.crimsonRgb}, ${hlNyquist ? 0.16 : 0.07})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let hx = xNyquist - fh; hx < fx + fw + fh; hx += 16) {
            ctx.moveTo(hx, baseY);
            ctx.lineTo(hx + fh, fy);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Frequency gridlines (minor every 10 Hz, major every 25 Hz)
        for (let f = 0; f <= SCOPE.freqMaxHz; f += 10) {
          const gx = freqToX(f);
          ctx.beginPath();
          ctx.moveTo(gx, fy);
          ctx.lineTo(gx, baseY);
          ctx.strokeStyle = f % 50 === 0 ? COLORS.gridMajor : COLORS.gridMinor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Magnitude reference lines (1.0 = 0 dB, 0.707 = -3 dB, 0.5 = -6 dB, 0.25 = -12 dB)
        const magRefs = [
          { m: 1.0, dashed: false },
          { m: Math.SQRT1_2, dashed: true },
          { m: 0.5, dashed: false },
          { m: 0.25, dashed: false },
        ];
        for (const ref of magRefs) {
          const gy = magToY(ref.m);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx, gy);
          ctx.lineTo(fx + fw, gy);
          if (ref.dashed) ctx.setLineDash([4, 4]);
          ctx.strokeStyle = ref.dashed
            ? `rgba(${COLORS.emeraldRgb}, ${hlFilter ? 0.42 : 0.16})`
            : COLORS.gridMinor;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // 2) 2nd-Order Butterworth Anti-Aliasing Filter Curve |H(f)| across 0 .. 150 Hz
        const showFilterSolid = metrics.aaFilterOn;
        if (showFilterSolid || hlFilter) {
          const pts = 180;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx, baseY);
          for (let i = 0; i <= pts; i++) {
            const f = (i / pts) * SCOPE.freqMaxHz;
            const hMag = butterworthMagnitude(f, metrics.aaCutoff);
            ctx.lineTo(freqToX(f), magToY(hMag));
          }
          ctx.lineTo(fx + fw, baseY);
          ctx.closePath();

          if (showFilterSolid) {
            const grad = ctx.createLinearGradient(0, fy, 0, baseY);
            grad.addColorStop(0, `rgba(${COLORS.emeraldRgb}, ${hlFilter ? 0.26 : 0.16})`);
            grad.addColorStop(1, `rgba(${COLORS.emeraldRgb}, 0.02)`);
            ctx.fillStyle = grad;
            ctx.fill();
          }

          // Top response curve
          ctx.beginPath();
          for (let i = 0; i <= pts; i++) {
            const f = (i / pts) * SCOPE.freqMaxHz;
            const hMag = butterworthMagnitude(f, metrics.aaCutoff);
            const px = freqToX(f);
            const py = magToY(hMag);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          if (!showFilterSolid) ctx.setLineDash([5, 4]);
          ctx.strokeStyle = showFilterSolid
            ? COLORS.emerald
            : `rgba(${COLORS.emeraldRgb}, 0.58)`;
          ctx.lineWidth = hlFilter ? 2.8 : showFilterSolid ? 2.0 : 1.4;
          if (hlFilter || showFilterSolid) {
            ctx.shadowColor = COLORS.emerald;
            ctx.shadowBlur = hlFilter ? 12 : 6;
          }
          ctx.stroke();
          ctx.restore();

          // Draggable -3 dB Cutoff Dot at f = f_c
          const fcX = freqToX(metrics.aaCutoff);
          const fcY = magToY(Math.SQRT1_2);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fcX, baseY);
          ctx.lineTo(fcX, fcY);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = `rgba(${COLORS.emeraldRgb}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(fcX, fcY, hlFilter || dragMode === 'aaCutoff' ? 6.2 : 4.8, 0, Math.PI * 2);
          ctx.fillStyle = showFilterSolid ? COLORS.emerald : COLORS.bg;
          ctx.strokeStyle = COLORS.emerald;
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          ctx.font = "600 9.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = '#86F7BC';
          ctx.textAlign = 'left';
          ctx.fillText(`f_c=${metrics.aaCutoff}Hz (−3dB)`, fcX + 7, fcY - 6);
          ctx.restore();
        }

        // 3) Live Windowed Spectral Leakage Curve (DTFT + Discrete FFT Bins in [0, f_N])
        const leakColor = metrics.isFault
          ? COLORS.crimson
          : metrics.windowType === 'rect'
            ? COLORS.amber
            : COLORS.violet;
        const leakRgb = metrics.isFault
          ? COLORS.crimsonRgb
          : metrics.windowType === 'rect'
            ? COLORS.amberRgb
            : COLORS.violetRgb;

        ctx.save();
        // Filled leakage skirt area
        ctx.beginPath();
        ctx.moveTo(freqToX(0), baseY);
        for (let i = 0; i < spectrum.freqs.length; i++) {
          const f = spectrum.freqs[i];
          if (f > SCOPE.freqMaxHz) break;
          ctx.lineTo(freqToX(f), magToY(spectrum.mags[i]));
        }
        ctx.lineTo(xNyquist, baseY);
        ctx.closePath();
        const leakGrad = ctx.createLinearGradient(0, fy, 0, baseY);
        leakGrad.addColorStop(0, `rgba(${leakRgb}, ${metrics.windowType === 'rect' ? 0.34 : 0.24})`);
        leakGrad.addColorStop(1, `rgba(${leakRgb}, 0.03)`);
        ctx.fillStyle = leakGrad;
        ctx.fill();

        // Continuous DTFT leakage envelope stroke
        ctx.beginPath();
        for (let i = 0; i < spectrum.freqs.length; i++) {
          const f = spectrum.freqs[i];
          if (f > SCOPE.freqMaxHz) break;
          const px = freqToX(f);
          const py = magToY(spectrum.mags[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${leakRgb}, 0.92)`;
        ctx.lineWidth = metrics.windowType === 'rect' ? 1.85 : 1.65;
        ctx.stroke();

        // Discrete FFT bin stems inside [0, f_N] showing actual bin energy spill
        for (let k = 0; k < spectrum.binFreqs.length; k++) {
          const fk = spectrum.binFreqs[k];
          if (fk > SCOPE.freqMaxHz) break;
          const mk = spectrum.binMags[k];
          if (mk < 0.015) continue;
          const bx = freqToX(fk);
          const by = magToY(mk);
          ctx.beginPath();
          ctx.moveTo(bx, baseY);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = `rgba(${leakRgb}, 0.45)`;
          ctx.lineWidth = 1.25;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = leakColor;
          ctx.fill();
        }
        ctx.restore();

        // 4) Glowing Vertical Nyquist Wall at f_N = f_s / 2
        if (metrics.fNyquist <= SCOPE.freqMaxHz) {
          const wallColor = metrics.isFault ? COLORS.crimson : COLORS.amber;
          const wallRgb = metrics.isFault ? COLORS.crimsonRgb : COLORS.amberRgb;

          ctx.save();
          // Outer vertical glow band
          const wallGlow = ctx.createLinearGradient(xNyquist - 14, 0, xNyquist + 14, 0);
          wallGlow.addColorStop(0, `rgba(${wallRgb}, 0)`);
          wallGlow.addColorStop(0.5, `rgba(${wallRgb}, ${hlNyquist || hlFs ? 0.32 : 0.16})`);
          wallGlow.addColorStop(1, `rgba(${wallRgb}, 0)`);
          ctx.fillStyle = wallGlow;
          ctx.fillRect(xNyquist - 14, fy, 28, fh);

          ctx.beginPath();
          ctx.moveTo(xNyquist, fy);
          ctx.lineTo(xNyquist, baseY);
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = wallColor;
          ctx.lineWidth = hlNyquist || hlFs || dragMode === 'fNyquist' ? 3.0 : 2.0;
          ctx.shadowColor = wallColor;
          ctx.shadowBlur = hlNyquist ? 16 : 8;
          ctx.stroke();
          ctx.setLineDash([]);

          // Top Nyquist Wall Pill Label
          const wallLabel = `f_N = ${metrics.fNyquist.toFixed(0)} Hz`;
          ctx.font = "700 10px 'JetBrains Mono', monospace";
          const lw = ctx.measureText(wallLabel).width + 12;
          const lx = clamp(xNyquist - lw * 0.5, fx + 4, fx + fw - lw - 4);
          drawRoundedPill(
            lx,
            fy + 4,
            lw,
            17,
            8,
            'rgba(10, 12, 16, 0.88)',
            `rgba(${wallRgb}, 0.75)`
          );
          ctx.shadowBlur = 0;
          ctx.fillStyle = wallColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(wallLabel, lx + lw * 0.5, fy + 13);
          ctx.restore();
        }

        // 5) True Analog Tone Spike at f₀ (Electric Cyan — draggable handle!)
        const xF0 = freqToX(metrics.fSignal);
        const yRaw = magToY(1.0);
        const yAtten = magToY(metrics.aaGain);

        ctx.save();
        // If AA filter attenuates the spike, show dashed raw pre-filter peak + downward attenuation arrow
        if (metrics.aaFilterOn && metrics.aaGain < 0.96) {
          ctx.beginPath();
          ctx.moveTo(xF0, yAtten);
          ctx.lineTo(xF0, yRaw);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = `rgba(${COLORS.cyanRgb}, 0.35)`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.setLineDash([]);

          // Hollow raw peak ring
          ctx.beginPath();
          ctx.arc(xF0, yRaw, 3.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${COLORS.cyanRgb}, 0.45)`;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Attenuation drop readout
          if (yAtten - yRaw > 22) {
            ctx.font = "600 9.5px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#86F7BC';
            ctx.textAlign = xF0 > fx + fw - 72 ? 'right' : 'left';
            ctx.fillText(
              `${metrics.aaGainDb.toFixed(1)} dB`,
              xF0 + (xF0 > fx + fw - 72 ? -8 : 8),
              (yRaw + yAtten) * 0.5 + 3
            );
          }
        }

        // Solid Cyan stem
        ctx.beginPath();
        ctx.moveTo(xF0, baseY);
        ctx.lineTo(xF0, yAtten);
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = hlSignal || dragMode === 'fSignal' ? 3.4 : 2.5;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = hlSignal ? 14 : 7;
        ctx.stroke();

        // Glowing draggable diamond/circle handle at tip
        const rTip = hlSignal || dragMode === 'fSignal' || hoverHandle === 'fSignal' ? 6.8 : 5.4;
        ctx.beginPath();
        ctx.arc(xF0, yAtten, rTip, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.cyan;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xF0, yAtten, 2.2, 0, Math.PI * 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Label for f0
        ctx.font = "700 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#80F2FF';
        ctx.textAlign = xF0 > fx + fw - 56 ? 'right' : 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          `f₀=${metrics.fSignal}Hz`,
          xF0 + (xF0 > fx + fw - 56 ? -9 : 9),
          Math.max(fy + 22, yAtten - 4)
        );
        ctx.restore();

        // 6) Folded Alias Ghost Spike at f_alias + Curved Spectral Reflection Arrow across f_N!
        if (metrics.isAliased) {
          const xAlias = freqToX(metrics.fAlias);
          const yAlias = magToY(metrics.aaGain);
          const ghostColor = metrics.isAliasSuppressed ? COLORS.amber : COLORS.crimson;
          const ghostRgb = metrics.isAliasSuppressed ? COLORS.amberRgb : COLORS.crimsonRgb;

          ctx.save();
          // Pulsing Crimson/Amber folded spike
          ctx.beginPath();
          ctx.moveTo(xAlias, baseY);
          ctx.lineTo(xAlias, yAlias);
          ctx.strokeStyle = ghostColor;
          ctx.lineWidth = hlAlias ? 3.8 : 2.8;
          ctx.shadowColor = ghostColor;
          ctx.shadowBlur = hlAlias ? 18 : 8 + 6 * pulse;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(xAlias, yAlias, hlAlias ? 7.2 : 5.6 + 0.9 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = ghostColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(xAlias, yAlias, 2.2, 0, Math.PI * 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFE4E9';
          ctx.fill();

          // Curved Folding Reflection Arc from f_0 across f_N down to f_alias
          const startX = xF0;
          const startY = Math.min(yAtten, baseY - 16);
          const endX = xAlias;
          const endY = Math.min(yAlias, baseY - 16);
          const ctrlX = (startX + endX) * 0.5;
          const arcLift = clamp(Math.abs(startX - endX) * 0.24, 24, 58);
          const ctrlY = Math.max(fy + 16, Math.min(startY, endY) - arcLift);

          ctx.beginPath();
          ctx.moveTo(startX, startY - 6);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY - 8);
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = `rgba(${ghostRgb}, ${hlAlias ? 0.98 : 0.72 + 0.2 * pulse})`;
          ctx.lineWidth = hlAlias ? 2.6 : 1.85;
          ctx.shadowColor = ghostColor;
          ctx.shadowBlur = hlAlias ? 12 : 6;
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrowhead pointing down onto f_alias spike
          const txDir = endX - ctrlX;
          const tyDir = endY - 8 - ctrlY;
          const tLen = Math.hypot(txDir, tyDir) || 1;
          const ux = txDir / tLen;
          const uy = tyDir / tLen;
          const ax = endX;
          const ay = endY - 8;
          const headLen = 8.5;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - ux * headLen - uy * 4.5, ay - uy * headLen + ux * 4.5);
          ctx.lineTo(ax - ux * headLen + uy * 4.5, ay - uy * headLen - ux * 4.5);
          ctx.closePath();
          ctx.fillStyle = ghostColor;
          ctx.fill();

          // Folding badge at apex of arc
          const apexX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
          const apexY = 0.25 * (startY - 6) + 0.5 * ctrlY + 0.25 * (endY - 8);
          const foldTxt = `FOLD ${metrics.fSignal} → ${metrics.fAlias.toFixed(0)} Hz`;
          ctx.shadowBlur = 0;
          ctx.font = "700 9.5px 'JetBrains Mono', monospace";
          const ftw = ctx.measureText(foldTxt).width + 10;
          const ftx = clamp(apexX - ftw * 0.5, fx + 4, fx + fw - ftw - 4);
          const fty = clamp(apexY - 18, fy + 22, baseY - 22);
          drawRoundedPill(
            ftx,
            fty,
            ftw,
            16,
            8,
            'rgba(10, 12, 16, 0.9)',
            `rgba(${ghostRgb}, 0.7)`
          );
          ctx.fillStyle = ghostColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(foldTxt, ftx + ftw * 0.5, fty + 8.5);

          // Ghost label
          ctx.font = "700 10px 'JetBrains Mono', monospace";
          ctx.fillStyle = metrics.isAliasSuppressed ? '#FFD875' : '#FF8096';
          ctx.textAlign = xAlias < fx + 54 ? 'left' : 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            `f_alias=${metrics.fAlias.toFixed(0)}Hz`,
            xAlias + (xAlias < fx + 54 ? 9 : -9),
            Math.max(fy + 38, yAlias - 5)
          );
          ctx.restore();
        }

        ctx.restore(); // end bottom clip

        // Spectrum border frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx, fy, fw, fh);

        // Y-axis magnitude ticks
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = COLORS.axisLabel;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('1.0', fx - 7, magToY(1.0));
        ctx.fillText('−3dB', fx - 7, magToY(Math.SQRT1_2));
        ctx.fillText('0.0', fx - 7, baseY);

        // X-axis frequency ticks (0 .. 150 Hz)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const fStep = cssW < 460 ? 50 : 25;
        for (let f = 0; f <= SCOPE.freqMaxHz; f += fStep) {
          ctx.fillText(`${f} Hz`, freqToX(f), baseY + 5);
        }

        // Bottom Pane Header Bar
        const hdrY = botPaneY + 17;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = "700 10.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#9BA8C2';
        ctx.fillText('LIVE FREQUENCY SPECTRUM & FOLDING MAP', fx, hdrY);

        // Window Type & Leakage Badge (top-right of bottom pane)
        const winText =
          metrics.windowType === 'rect'
            ? 'RECTANGULAR • −13.3 dB LEAKAGE'
            : 'HANN WINDOW • −31.5 dB SIDELOBES';
        const winRgb = metrics.windowType === 'rect' ? COLORS.amberRgb : COLORS.violetRgb;
        const winCol = metrics.windowType === 'rect' ? '#FFD875' : '#D4C4FD';
        ctx.font = "600 9.5px 'JetBrains Mono', monospace";
        const ww = ctx.measureText(winText).width + 14;
        drawRoundedPill(
          fx + fw - ww,
          hdrY - 9,
          ww,
          18,
          9,
          `rgba(${winRgb}, 0.14)`,
          `rgba(${winRgb}, 0.48)`
        );
        ctx.fillStyle = winCol;
        ctx.textAlign = 'right';
        ctx.fillText(winText, fx + fw - 7, hdrY + 0.5);
      }

      // ---- Full Frame Render ----
      function render(nowMs, phaseRad) {
        if (spectrumDirty) recomputeDSP();

        ctx.save();
        ctx.scale(dpr, dpr);

        // Dead-front obsidian background
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, cssW, cssH);

        const activeVar = getActiveHighlight();
        renderTimeScope(nowMs, phaseRad, activeVar);
        renderSpectrumPane(nowMs, activeVar);

        ctx.restore();
      }

      // ---- 60 FPS Telemetry & Linked Equation Updates ----
      let lastUiPushMs = 0;
      function pushLiveReadouts(nowMs, force = false) {
        if (!force && nowMs - lastUiPushMs < 33) return;
        lastUiPushMs = nowMs;

        const aliasColor = metrics.isFault
          ? 'crimson'
          : metrics.isAliasSuppressed
            ? 'amber'
            : 'emerald';

        const statusColor =
          metrics.statusLevel === 'fault'
            ? 'crimson'
            : metrics.statusLevel === 'warning'
              ? 'amber'
              : 'emerald';

        const telemetryPayload = {
          fAlias: { value: metrics.fAlias.toFixed(1), color: aliasColor },
          fNyquist: {
            value: metrics.fNyquist.toFixed(1),
            color: metrics.isFault ? 'crimson' : 'amber',
          },
          aaGainDb: {
            value: metrics.aaGainDb.toFixed(1),
            color: metrics.aaFilterOn ? 'emerald' : 'cyan',
          },
          samplingStatus: {
            value: metrics.statusLabel,
            color: statusColor,
          },
        };

        const statusObj = {
          level: metrics.statusLevel,
          label: metrics.statusLabel,
        };

        const eqPayload = {
          fAlias: metrics.fAlias,
          fSignal: metrics.fSignal,
          fs: metrics.fs,
          fNyquist: metrics.fNyquist,
          aaGainDb: metrics.aaGainDb,
        };

        try {
          if (typeof api.updateTelemetry === 'function') {
            api.updateTelemetry(telemetryPayload, statusObj);
          }
          if (typeof api.updateEquation === 'function') {
            api.updateEquation(eqPayload);
          }
        } catch {
          // Keep animation loop uninterrupted if shell callback throws
        }
      }

      // ---- Shell Event Subscriptions ----
      const unsubs = [];
      const registerSub = (fn, handler) => {
        if (typeof fn === 'function') {
          const u = fn(handler);
          if (typeof u === 'function') unsubs.push(u);
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
      registerSub(api.onReset, () => resetState());
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

      // Initial DSP sync & immediate telemetry push
      recomputeDSP();
      pushLiveReadouts(performance.now(), true);

      // ---- 60 FPS Animation Loop ----
      let rafId = 0;
      let destroyed = false;
      let lastFrameMs = performance.now();
      let animPhaseRad = 0.42;

      function tick(nowMs) {
        if (destroyed) return;
        const dt = Math.min(0.05, Math.max(0, (nowMs - lastFrameMs) * 0.001));
        lastFrameMs = nowMs;

        animPhaseRad = (animPhaseRad + dt * SCOPE.phaseRateRadPerSec) % (Math.PI * 2);

        render(nowMs, animPhaseRad);
        pushLiveReadouts(nowMs);

        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);

      // Clean imperative controller & teardown handle
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
          resetState();
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

export default createF41AliasingLab;

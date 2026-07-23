import { Color } from "three";

export const BREATHE_PEAK_SIZE = 0.112; // puff effect scale
export const FIXED_POINT_COUNT = 14000; // particle density
export const FIXED_TURNS = 12; // spiral loops

// Linear interpolation.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Time-based sine wobble (frequency in radians/sec, amplitude scales the result).
export function wobble(elapsed, frequency, amplitude = 1) {
  return Math.sin(elapsed * frequency) * amplitude;
}

// Build initial spiral points and colors.
export function buildInitialSpiralData(params) {
  const count = FIXED_POINT_COUNT;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseHues = new Float32Array(count);
  const color = new Color();
  const startColor = new Color(params.baseColor);
  const endColor = new Color(params.transitionColor);
  const baseHSL = { h: 0, s: 0, l: 0 };
  startColor.getHSL(baseHSL);
  const baseHue = baseHSL.h;
  const totalTheta = FIXED_TURNS * Math.PI * 2;
  const r0 = 0.1; // starting spiral radius
  const waveAmplitude = params.waveAmp * 1.6; // amplify wave effect

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const theta = t * totalTheta;
    const baseR = r0 + params.growthRate * theta;
    const r = baseR + (Math.random() - 0.5) * params.jitterR;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y =
      waveAmplitude * Math.sin(theta * params.waveFreq) +
      (Math.random() - 0.5) * params.jitterY;
    const i3 = i * 3;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    const blendRatio = (theta % (Math.PI * 2)) / (Math.PI * 2);
    baseHues[i] = (baseHue + blendRatio) % 1;
    color.copy(startColor).lerp(endColor, blendRatio);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  return { positions, colors, baseHues };
}

// Pulse waves as scene gets unstable.
export function getAnimatedWaveFrequency(
  params,
  elapsed,
  instabilityProgress = 0,
) {
  if (instabilityProgress <= 0) {
    return params.waveFreq;
  }

  return (
    params.waveFreq *
    (1 + wobble(elapsed, 2.3, 0.5) * instabilityProgress * 0.6)
  );
}

// Shift colors toward warm tones as instability increases.
export function getInstabilityColorTargets(
  baseColor,
  transitionColor,
  instabilityProgress,
) {
  const colorCurve = Math.pow(instabilityProgress, 0.78);
  return {
    warmBaseTarget: new Color(baseColor).lerp(new Color("#ff8e00"), colorCurve),
    warmTransitionTarget: new Color(transitionColor).lerp(
      new Color("#ff1500"),
      colorCurve,
    ),
  };
}

export function getInstabilityRotationBoost(instabilityProgress, elapsed = 0) {
  const scale = 6.5;
  const wobbleAmount = 1 + wobble(elapsed, 3.1, 0.25);
  return (
    Math.pow(instabilityProgress, 1.6) * scale * Math.max(0.15, wobbleAmount)
  );
}

// Vary point size for dynamic feel.
export function getAnimatedPointRange(
  pointSizeRange,
  instabilityProgress,
  elapsed = 0,
) {
  const pulse = 1 + wobble(elapsed, 9.2, 0.3) * instabilityProgress;
  return (
    pointSizeRange +
    instabilityProgress * Math.min(3.5, pointSizeRange * 1.4 + 1.2) * pulse
  );
}

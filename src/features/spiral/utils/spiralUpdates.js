import { Color } from "three";
import { BREATHE_PEAK_SIZE, FIXED_POINT_COUNT, lerp } from "./spiralUtils";

// Check if params changed enough to rebuild.
export function didParamsChange(prevParams, nextParams) {
  return (
    prevParams.growthRate !== nextParams.growthRate ||
    prevParams.waveAmp !== nextParams.waveAmp ||
    prevParams.waveFreq !== nextParams.waveFreq ||
    prevParams.waveFreqOscillation !== nextParams.waveFreqOscillation ||
    prevParams.instantTransition !== nextParams.instantTransition ||
    prevParams.breatheSpeed !== nextParams.breatheSpeed ||
    prevParams.jitterR !== nextParams.jitterR ||
    prevParams.jitterY !== nextParams.jitterY ||
    prevParams.pointSizeRange !== nextParams.pointSizeRange ||
    prevParams.baseColor !== nextParams.baseColor ||
    prevParams.transitionColor !== nextParams.transitionColor ||
    prevParams.hueShift !== nextParams.hueShift
  );
}

// Morph current geometry toward target.
export function advanceGeometryTransition(
  positionAttr,
  transition,
  targetPositions,
  currentPositionsRef,
  targetColorsRef,
  currentColorsRef,
  delta,
) {
  if (!transition.active || !transition.startPositions || !targetPositions) {
    return false;
  }

  transition.progress = Math.min(
    1,
    transition.progress + delta / transition.duration,
  );
  const t = transition.progress;
  const startPositions = transition.startPositions;
  const array = positionAttr.array;

  for (let i = 0; i < array.length; i += 1) {
    array[i] = lerp(startPositions[i], targetPositions[i], t);
  }

  positionAttr.needsUpdate = true;

  if (t >= 1) {
    transition.active = false;
    currentPositionsRef.current = targetPositions.slice();
    if (targetColorsRef.current && currentColorsRef.current) {
      currentColorsRef.current = targetColorsRef.current.slice();
    }
  }

  return true;
}

// Apply burst distortion: push outward and twist.
export function applyBurstGeometry(
  array,
  basePositions,
  dynamicWaveFreq,
  burstTwist,
  effectiveWaveAmp,
  baseSpeed,
  burst,
) {
  const burstWaveBoost = 0.22; // higher = harder hit
  const burstGrowthBoost = 0.18;
  const burstTurnBoost = 0.15;
  const burstHeightBoost = 0.08;
  const waveFactor = 1 + burst.strength * burstWaveBoost;
  const growthFactor = 1 + burst.strength * burstGrowthBoost;
  const turnFactor = 1 + burst.strength * burstTurnBoost;
  const verticalMod = burst.strength * burstHeightBoost;

  for (let i = 0; i < array.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];
    const radius = Math.hypot(x, z) * growthFactor;
    const baseAngle = Math.atan2(z, x);
    const angle = baseAngle * turnFactor + burstTwist;
    const wave = Math.sin(
      angle * dynamicWaveFreq * waveFactor + baseSpeed + baseAngle * 0.36,
    );

    array[i] = radius * Math.cos(angle);
    array[i + 2] = radius * Math.sin(angle);
    array[i + 1] = y + wave * effectiveWaveAmp * verticalMod;
  }
}

// Apply normal animated wave motion.
export function applyNormalGeometry(
  array,
  basePositions,
  dynamicWaveFreq,
  baseSpeed,
  effectiveWaveAmp,
  instabilityProgress,
  params,
  elapsed,
) {
  const wobbleSpeed = 1.7; // higher = more movement
  const wobbleStrength = 0.5;
  const instabilityBoost = 2.6;
  const growthWobble =
    Math.sin(elapsed * wobbleSpeed) *
    wobbleStrength *
    instabilityProgress *
    params.growthRate;
  const chaosScale = 1 + instabilityProgress * instabilityBoost; // higher = wilder
  const effectiveGrowthRate = Math.max(
    0.05,
    params.growthRate -
      instabilityProgress * (params.growthRate - 0.1) +
      growthWobble,
  );
  const radiusScale = effectiveGrowthRate / params.growthRate;

  for (let i = 0; i < array.length; i += 3) {
    const x = basePositions[i];
    const y = basePositions[i + 1];
    const z = basePositions[i + 2];
    const radius = Math.hypot(x, z) * radiusScale;
    const baseAngle = Math.atan2(z, x);
    const twistSpeed = 2.0; // higher = more twist
    const twistRate = 0.8;
    const twistStrength = 0.16;
    const twist =
      Math.sin(baseAngle * twistSpeed + elapsed * twistRate) *
      twistStrength *
      instabilityProgress;
    const angle = baseAngle + twist;
    const phase = angle * dynamicWaveFreq + baseSpeed + i * 0.00026;
    const waveBaseStrength = 0.9; // higher = stronger waves
    const waveTimeStrength = 0.2;
    const waveTimeSpeed = 1.6;
    const waveTimeStep = 0.0001;
    const wave =
      Math.sin(phase) * waveBaseStrength +
      Math.sin(elapsed * waveTimeSpeed + i * waveTimeStep) *
        waveTimeStrength *
        instabilityProgress;

    array[i] = radius * Math.cos(angle);
    array[i + 2] = radius * Math.sin(angle);
    array[i + 1] =
      y +
      wave * effectiveWaveAmp * 0.12 * chaosScale +
      Math.sin(baseAngle * 3 + elapsed * 0.7) * instabilityProgress * 0.05 +
      Math.sin(baseAngle * 7 + elapsed * 3.3) * instabilityProgress * 0.08;
  }
}

// Update point material size for breathing and burst effects.
export function updatePointMaterialSize(
  material,
  params,
  effectiveBreatheSpeed,
  effectivePointRange,
  burstScale,
) {
  if (!material) return;

  if (params.breathe) {
    const speed = effectiveBreatheSpeed && effectiveBreatheSpeed;
    const swing = Math.max(
      0,
      Math.min(10, effectivePointRange && effectivePointRange),
    );
    const oscillation = Math.sin(performance.now() * 0.001 * speed);
    const minSize = Math.max(
      0.001,
      params.pointSize * Math.max(0.05, 1 - swing * 0.08),
    );
    const maxSize = Math.max(
      params.pointSize,
      params.pointSize + BREATHE_PEAK_SIZE * swing,
    );
    const breathSize =
      (minSize + (maxSize - minSize) * ((oscillation + 1) / 2)) * burstScale;

    material.size = breathSize;
  } else {
    material.size = params.pointSize * burstScale;
  }
}

// Update point colors from hue map and instability state.
export function updatePointColors(
  colorAttr,
  baseHues,
  hueOffsetRef,
  params,
  instabilityProgress,
  warmBaseTarget,
  warmTransitionTarget,
  delta,
) {
  if (!colorAttr || !baseHues) return;

  hueOffsetRef.current =
    (hueOffsetRef.current + delta * 0.03 * (1 + instabilityProgress * 5)) % 1;
  const array = colorAttr.array;
  const tmpColor = new Color();
  const userBaseColor = new Color(params.baseColor);
  const userTransitionColor = new Color(params.transitionColor);
  let baseColor = userBaseColor.clone();
  let transitionColor = userTransitionColor.clone();

  if (instabilityProgress > 0) {
    baseColor.lerp(warmBaseTarget, instabilityProgress);
    transitionColor.lerp(warmTransitionTarget, instabilityProgress);
  }

  for (let i = 0; i < FIXED_POINT_COUNT; i++) {
    const h = (baseHues[i] + hueOffsetRef.current) % 1;
    tmpColor.copy(baseColor).lerp(transitionColor, h);
    const i3 = i * 3;
    array[i3] = tmpColor.r;
    array[i3 + 1] = tmpColor.g;
    array[i3 + 2] = tmpColor.b;
  }

  colorAttr.needsUpdate = true;
}

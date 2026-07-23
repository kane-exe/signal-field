import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  advanceGeometryTransition,
  applyBurstGeometry,
  applyNormalGeometry,
  didParamsChange,
  updatePointColors,
  updatePointMaterialSize,
} from "../utils/spiralUpdates";
import {
  buildInitialSpiralData,
  getAnimatedPointRange,
  getAnimatedWaveFrequency,
  getInstabilityColorTargets,
  getInstabilityRotationBoost,
} from "../utils/spiralUtils";

// Tracks burst moments that shake the spiral.
const INITIAL_BURST_STATE = {
  nextAt: 3,
  start: 0,
  duration: 0,
  strength: 1, // higher = stronger distortion
  active: false,
};

// Morphs the spiral when the prompt changes.
const INITIAL_TRANSITION_STATE = {
  progress: 1, // 0-1: animation progress
  duration: 4, // seconds
  active: false,
  startPositions: null, // snapshot before morphing
  startColors: null, // snapshot before morphing
};

// Tracks calm-to-wild scene progression.
const INITIAL_INSTABILITY_STATE = {
  active: false,
  startTime: 0,
  duration: 16, // 16s: calm-to-wild
  progress: 0,
};

// Updates scene instability (calm-to-wild).
function updateInstabilityState(animation, params, elapsed) {
  if (!params.waveFreqOscillation) {
    animation.instability.active = false;
    animation.instability.progress = 0;
    return 0;
  }

  if (!animation.instability.active) {
    animation.instability.active = true;
    animation.instability.startTime = elapsed;
    animation.instability.progress = 0;
  }

  animation.instability.progress = Math.min(
    1,
    (elapsed - animation.instability.startTime) /
      animation.instability.duration,
  );

  return animation.instability.progress;
}

// Handles burst shake events.
function updateBurstState(animation, params, elapsed, instabilityProgress) {
  const shouldTriggerBurst = params.burst || instabilityProgress > 0.65;
  const burst = animation.burst;
  const burstState = {
    burstScale: 1,
    burstRotation: 0,
    burstTwist: 0,
    burstRotationSpeed: 0,
  };

  if (!shouldTriggerBurst) {
    burst.active = false;
    return { burst, burstState, shouldTriggerBurst };
  }

  if (!burst.active && elapsed >= burst.nextAt) {
    burst.active = true;
    burst.start = elapsed;
    burst.duration = params.burst // longer = smoother
      ? 1.2 + Math.random() * 1.4
      : 0.8 + Math.random() * 1.2;
    burst.strength = params.burst // higher = stronger spikes
      ? 2.2 + Math.random() * 1.8
      : (1.6 + Math.random() * 2.4) * (0.6 + instabilityProgress);
  }

  if (burst.active) {
    const progress = (elapsed - burst.start) / burst.duration;
    if (progress >= 1) {
      burst.active = false;
      burst.nextAt = elapsed + 3 + Math.random() * 8;
    } else {
      burstState.burstScale =
        1 + Math.sin(Math.PI * progress) * (burst.strength - 0.7);
      burstState.burstRotation = 0.18 * burst.strength;
      burstState.burstTwist =
        Math.sin(Math.PI * progress) * 1.2 * burst.strength;
      burstState.burstRotationSpeed = 0.18 * burst.strength * 0.03;
    }
  }

  return { burst, burstState, shouldTriggerBurst };
}

// Updates spiral rotation.
function updatePointRotation(
  points,
  params,
  delta,
  elapsed,
  instabilityProgress,
  burstState,
  burst,
) {
  if (!params.animate && !burst.active) {
    return;
  }

  points.rotation.y +=
    (0.01 + Math.max(0, params.breatheSpeed - 1.6) * 0.05) * delta + // higher = faster spin
    getInstabilityRotationBoost(instabilityProgress, elapsed) * delta +
    burstState.burstRotationSpeed;

  if (burst.active) {
    points.rotation.x = Math.sin(elapsed * 5) * 0.08 * burst.strength;
    points.rotation.z = 0;
  } else {
    points.rotation.x =
      instabilityProgress * 0.04 +
      Math.sin(elapsed * 4.2) * 0.15 * instabilityProgress;
    points.rotation.z =
      Math.sin(elapsed * 2.9 + 0.6) * 0.12 * instabilityProgress;
  }
}

function SpiralPoints({ params }) {
  const pointRef = useRef();
  const materialRef = useRef();
  const geometryRef = useRef();
  const colorAttrRef = useRef();
  const baseHuesRef = useRef(null);
  const currentPositionsRef = useRef(null);
  const currentColorsRef = useRef(null);
  const targetPositionsRef = useRef(null);
  const targetColorsRef = useRef(null);

  const animationRef = useRef({
    burst: { ...INITIAL_BURST_STATE },
    transition: { ...INITIAL_TRANSITION_STATE },
    instability: { ...INITIAL_INSTABILITY_STATE },
    prevParams: params,
    hueOffset: 0,
  });

  // Build initial particle cloud.
  const spiralData = useMemo(() => buildInitialSpiralData(params), [params]);

  // Morph spiral on prompt change.
  useEffect(() => {
    const animation = animationRef.current;
    baseHuesRef.current = spiralData.baseHues;

    if (!currentPositionsRef.current || !currentColorsRef.current) {
      currentPositionsRef.current = spiralData.positions.slice();
      currentColorsRef.current = spiralData.colors.slice();
      targetPositionsRef.current = spiralData.positions.slice();
      targetColorsRef.current = spiralData.colors.slice();
      animation.transition.active = false;
      animation.transition.progress = 1;
      animation.prevParams = params;
      return;
    }

    if (!didParamsChange(animation.prevParams, params)) {
      return;
    }

    if (params.instantTransition) {
      currentPositionsRef.current = spiralData.positions.slice();
      currentColorsRef.current = spiralData.colors.slice();
      targetPositionsRef.current = spiralData.positions.slice();
      targetColorsRef.current = spiralData.colors.slice();
      animation.transition.active = false;
      animation.transition.progress = 1;
      animation.instability.active = false;
      animation.instability.progress = 0;
      animation.hueOffset = 0;

      if (geometryRef.current) {
        geometryRef.current.attributes.position.array.set(spiralData.positions);
        geometryRef.current.attributes.position.needsUpdate = true;
      }

      if (colorAttrRef.current) {
        colorAttrRef.current.array.set(spiralData.colors);
        colorAttrRef.current.needsUpdate = true;
      }
    } else {
      animation.transition = {
        active: true,
        progress: 0,
        duration: 3.2,
        startPositions: currentPositionsRef.current.slice(),
        startColors: currentColorsRef.current.slice(),
      };
      targetPositionsRef.current = spiralData.positions.slice();
      targetColorsRef.current = spiralData.colors.slice();
    }

    if (colorAttrRef.current && baseHuesRef.current) {
      updatePointColors(
        colorAttrRef.current,
        baseHuesRef.current,
        { current: animation.hueOffset },
        params,
        0,
        null,
        null,
        0,
      );
    }

    animation.prevParams = params;
  }, [spiralData, params]);

  // Each frame: update motion, bursts, materials, colors.
  useFrame((state, delta) => {
    const points = pointRef.current;
    if (!points) return;

    const animation = animationRef.current;
    const elapsed = state.clock.elapsedTime;

    // 1. Scene energy level
    const instabilityProgress = updateInstabilityState(
      animation,
      params,
      elapsed,
    );

    // 2. Burst events
    const { burst, burstState } = updateBurstState(
      animation,
      params,
      elapsed,
      instabilityProgress,
    );

    // 3. Spiral rotation
    updatePointRotation(
      points,
      params,
      delta,
      elapsed,
      instabilityProgress,
      burstState,
      burst,
    );

    // 4. Wave animation & colors
    const waveCrawlRate = 3.2 + Math.max(0, params.breatheSpeed - 1.6) * 1.5; // higher = faster waves

    const dynamicWaveFreq = getAnimatedWaveFrequency(
      params,
      elapsed,
      instabilityProgress,
    );

    const baseSpeed = elapsed * waveCrawlRate;

    const effectiveWaveAmp = params.waveAmp * (1 + instabilityProgress * 1.8); // higher = bigger waves at high energy

    const effectiveBreatheSpeed =
      Math.max(0.1, params.breatheSpeed) * (1 + instabilityProgress * 2.4);
    const instabilityCurve = Math.min(1, instabilityProgress * 1.6);
    const { warmBaseTarget, warmTransitionTarget } = getInstabilityColorTargets(
      params.baseColor,
      params.transitionColor,
      instabilityCurve,
    );
    const effectivePointRange = getAnimatedPointRange(
      params.pointSizeRange,
      instabilityProgress,
      elapsed,
    );

    // 5. Update point positions
    if (geometryRef.current && currentPositionsRef.current) {
      const positionAttr = geometryRef.current.attributes.position;
      const transition = animation.transition;
      const didTransition = advanceGeometryTransition(
        positionAttr,
        transition,
        targetPositionsRef.current,
        currentPositionsRef,
        targetColorsRef,
        currentColorsRef,
        delta,
      );

      if (!didTransition) {
        const array = positionAttr.array;

        if (burst.active) {
          applyBurstGeometry(
            array,
            currentPositionsRef.current,
            dynamicWaveFreq,
            burstState.burstTwist,
            effectiveWaveAmp,
            baseSpeed,
            burst,
          );
        } else {
          applyNormalGeometry(
            array,
            currentPositionsRef.current,
            dynamicWaveFreq,
            baseSpeed,
            effectiveWaveAmp,
            instabilityProgress,
            params,
            elapsed,
          );
        }

        positionAttr.needsUpdate = true;
      }
    }

    // 6. Update the point size and color for this frame.
    updatePointMaterialSize(
      materialRef.current,
      params,
      effectiveBreatheSpeed,
      effectivePointRange,
      burstState.burstScale,
    );

    if (geometryRef.current) {
      geometryRef.current.setDrawRange(0, spiralData.positions.length / 3);
    }

    if ((params.hueShift || instabilityProgress > 0) && baseHuesRef.current) {
      updatePointColors(
        colorAttrRef.current,
        baseHuesRef.current,
        { current: animation.hueOffset },
        params,
        instabilityProgress,
        warmBaseTarget,
        warmTransitionTarget,
        delta,
      );
    }
  });

  return (
    <points ref={pointRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={spiralData.positions.length / 3}
          array={spiralData.positions}
          itemSize={3}
        />
        <bufferAttribute
          ref={colorAttrRef}
          attach="attributes-color"
          count={spiralData.colors.length / 3}
          array={spiralData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        vertexColors
        size={params.pointSize}
        sizeAttenuation
      />
    </points>
  );
}

export default SpiralPoints;

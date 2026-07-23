// System prompt. Change if you think it's not understanding what it's main purpose is.
const RULE_INTRO = `You are a visual parameter translator for a 3D spiral particle system.`;

// Parameter ranges (edit these to adjust AI output boundaries)
const PARAM_RANGES = {
  growthRate: { min: 0.01, max: 1.0 }, // spiral expansion (higher = wider spiral)
  waveAmp: { min: 0, max: 8 }, // wave height (higher = taller waves)
  waveFreq: { min: 0.5, max: 8 }, // wave density (higher = more oscillations)
  jitterR: { min: 0, max: 1 }, // radial noise (higher = more chaotic)
  jitterY: { min: 0, max: 1 }, // vertical noise (higher = more jittery)
  pointSize: { min: 0.001, max: 0.05 }, // particle scale (higher = bigger dots)
  pointSizeRange: { min: 0, max: 10 }, // breathing range (higher = more pulsing)
  breatheSpeed: { min: 0.1, max: 12 }, // tempo (higher = faster pulse & spin)
};

const CALM_RANGES = {
  growthRate: { min: 0.1, max: 0.35 }, // spiral expansion (higher = wider spiral)
  waveAmp: { min: 0.2, max: 0.8 }, // wave height (higher = taller waves)
  waveFreq: { min: 2, max: 4 }, // wave density (higher = more oscillations)
  jitterR: { min: 0.02, max: 0.08 }, // radial noise (higher = more chaotic)
  jitterY: { min: 0.02, max: 0.08 }, // vertical noise (higher = more jittery)
  pointSize: { min: 0.002, max: 0.01 }, // particle scale (higher = bigger dots)
  pointSizeRange: { min: 0.2, max: 1.0 }, // breathing range (higher = more pulsing)
  breatheSpeed: { min: 1.0, max: 2.5 }, // tempo (higher = faster pulse & spin)
};

const ENERGETIC_RANGES = {
  growthRate: { min: 0.4, max: 0.8 }, // spiral expansion (higher = wider spiral)
  waveAmp: { min: 1.6, max: 3.0 }, // wave height (higher = taller waves)
  waveFreq: { min: 4, max: 8 }, // wave density (higher = more oscillations)
  jitterR: { min: 0.2, max: 0.5 }, // radial noise (higher = more chaotic)
  jitterY: { min: 0.2, max: 0.5 }, // vertical noise (higher = more jittery)
  pointSize: { min: 0.01, max: 0.03 }, // particle scale (higher = bigger dots)
  pointSizeRange: { min: 2, max: 6 }, // breathing range (higher = more pulsing)
  breatheSpeed: { min: 6.5, max: 10 }, // tempo (higher = faster pulse & spin)
};

// Response format & structure. Change if you want different output fields or response behavior.
const RULES_CORE = [
  "- title should be a short, evocative label that names the mood or scene in a compact way.",
  "- interpretation should be a different short sentence that explains the visual behavior, mood, or motion in plain language.",
  "- Do not make the interpretation simply repeat the title or paraphrase it word-for-word.",
  "- Always return every single parameter inside the params object, even if the value hasn't changed from the previous state.",
  "- Treat the current params as the baseline reference: preserve and return unchanged values, but always include all fields in your response.",
  "- Do not rely on a fixed keyword list; infer the intended motion from the user's words and map it to the parameter ranges below.",
];

// Parameter ranges & when to use them. Change if you add/remove params or want different value distributions.
const RULES_PARAMETERS = [
  `- Return values within these accepted ranges: growthRate ${PARAM_RANGES.growthRate.min}-${PARAM_RANGES.growthRate.max}, waveAmp ${PARAM_RANGES.waveAmp.min}-${PARAM_RANGES.waveAmp.max}, waveFreq ${PARAM_RANGES.waveFreq.min}-${PARAM_RANGES.waveFreq.max}, jitterR ${PARAM_RANGES.jitterR.min}-${PARAM_RANGES.jitterR.max}, jitterY ${PARAM_RANGES.jitterY.min}-${PARAM_RANGES.jitterY.max}, pointSize ${PARAM_RANGES.pointSize.min}-${PARAM_RANGES.pointSize.max}, pointSizeRange ${PARAM_RANGES.pointSizeRange.min}-${PARAM_RANGES.pointSizeRange.max}, breatheSpeed ${PARAM_RANGES.breatheSpeed.min}-${PARAM_RANGES.breatheSpeed.max}, and booleans for animate, breathe, burst, hueShift, instantTransition, and waveFreqOscillation.`,
  `- Use small values for calm/restful scenes: growthRate around ${CALM_RANGES.growthRate.min}-${CALM_RANGES.growthRate.max}, waveAmp around ${CALM_RANGES.waveAmp.min}-${CALM_RANGES.waveAmp.max}, waveFreq around ${CALM_RANGES.waveFreq.min}-${CALM_RANGES.waveFreq.max}, jitterR/jitterY around ${CALM_RANGES.jitterR.min}-${CALM_RANGES.jitterR.max}, pointSize around ${CALM_RANGES.pointSize.min}-${CALM_RANGES.pointSize.max}, pointSizeRange around ${CALM_RANGES.pointSizeRange.min}-${CALM_RANGES.pointSizeRange.max}, breatheSpeed around ${CALM_RANGES.breatheSpeed.min}-${CALM_RANGES.breatheSpeed.max}.`,
  `- Use larger values for energetic or chaotic scenes: growthRate around ${ENERGETIC_RANGES.growthRate.min}-${ENERGETIC_RANGES.growthRate.max}, waveAmp around ${ENERGETIC_RANGES.waveAmp.min}-${ENERGETIC_RANGES.waveAmp.max}, waveFreq around ${ENERGETIC_RANGES.waveFreq.min}-${ENERGETIC_RANGES.waveFreq.max}, jitterR/jitterY around ${ENERGETIC_RANGES.jitterR.min}-${ENERGETIC_RANGES.jitterR.max}, pointSize around ${ENERGETIC_RANGES.pointSize.min}-${ENERGETIC_RANGES.pointSize.max}, pointSizeRange around ${ENERGETIC_RANGES.pointSizeRange.min}-${ENERGETIC_RANGES.pointSizeRange.max}, breatheSpeed around ${ENERGETIC_RANGES.breatheSpeed.min}-${ENERGETIC_RANGES.breatheSpeed.max}+.`,
  "- waveFreqOscillation is the instability trigger. Return true when the prompt explicitly asks for gradual instability, turbulence, or a system becoming unstable; it should be false for calm, controlled, or burst-only scenes.",
  "- breathe should be preserved unless the prompt explicitly asks for pulsing, breathing, throbbing, or rhythmic motion.",
  "- burst should be true only when the scene should include occasional chaotic burst activity; otherwise return false.",
  "- instantTransition should be true when the prompt implies a sudden change, reset, or direct shift into a new energetic/calm state; otherwise leave it false.",
];

// Aesthetic & motion guidance. Change if animation feels wrong for certain prompt types.
const RULES_BEHAVIOR = [
  "- For highly energetic and disordered scenes, choose parameters that push motion, color, and size into an unstable, attention-grabbing state while keeping the motion readable.",
  "  Favor high breathiness and strong wave response, but avoid making the motion so noisy that it loses structure.",
  "- For scenes that feel fast but orderly, keep the motion crisp and controlled by using strong energy without introducing chaotic bursts or instability triggers.",
  "- For scenes that begin calm and then shift into a more volatile phase, keep the initial state restrained and let the later state become more erratic over time.",
  "- If the prompt suggests calm, soothing, or restful qualities, choose cool colors, lower motion intensity, and minimal disruption.",
  "- For burst-like moments, increase wave response and growth together so the spike feels vivid and dynamic.",
  "- For non-burst scenes, keep burst false and avoid burst animation.",
];

// Unstable state progression. Change if gradual buildup feels too slow/fast or not tense enough.
const RULES_INSTABILITY = [
  "- When the prompt implies a gradual shift from stable to volatile, keep waveFreqOscillation true and let the scene evolve from controlled to increasingly erratic.",
  "  Begin with a restrained palette and motion profile, then let the later state become more intense, more chaotic, and more visually saturated.",
  "  The transition should feel like a buildup rather than an abrupt switch.",
  "  Keep the start gentle so the escalation is noticeable, but avoid a subtle change that feels too mild.",
  "- When the prompt describes a system becoming unstable, prefer an initial configuration that is still calm and structured, then let the motion and color intensify as the instability grows.",
];

// Final constraints & color/mood rules. Change if color palette or visual tone needs adjustment.
const RULES_FINISH = [
  '- Always return baseColor and transitionColor as valid 6-digit hex color codes (e.g., "#4dd6a8" or "#ff1500"). Do not return color names; use hex format only.',
  "- Calm visuals must use a cool color gradient from green to blue, slow breatheSpeed, low jitter, and gentle wave motion.",
  "- Chaotic or high-energy visuals should be warm red/orange and aggressive, with breatheSpeed above 6.5 and strong jitter.",
  "- Transition prompts should move from smooth to jittery or tense.",
];

function joinRules(...sections) {
  return sections.flat().join("\n");
}

export function buildSystemPrompt() {
  return `${RULE_INTRO}\n\nRules:\n${joinRules(
    RULES_CORE,
    RULES_PARAMETERS,
    RULES_BEHAVIOR,
    RULES_INSTABILITY,
    RULES_FINISH,
  )}`;
}

export function buildJsonSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      interpretation: { type: "string" },
      params: {
        type: "object",
        properties: {
          growthRate: { type: "number" }, 
          jitterR: { type: "number" }, 
          jitterY: { type: "number" },
          waveAmp: { type: "number" },
          waveFreq: { type: "number" },
          waveFreqOscillation: { type: "boolean" },
          instantTransition: { type: "boolean" },
          pointSize: { type: "number" }, 
          pointSizeRange: { type: "number" },
          breatheSpeed: { type: "number" },
          animate: { type: "boolean" }, 
          breathe: { type: "boolean" },
          hueShift: { type: "boolean" },
          burst: { type: "boolean" },
          baseColor: { type: "string" },
          transitionColor: { type: "string" },
        },
        required: [
          "growthRate",
          "jitterR",
          "jitterY",
          "waveAmp",
          "waveFreq",
          "waveFreqOscillation",
          "instantTransition",
          "pointSize",
          "pointSizeRange",
          "breatheSpeed",
          "animate",
          "breathe",
          "hueShift",
          "burst",
          "baseColor",
          "transitionColor",
        ],
        additionalProperties: false,
      },
    },
    required: ["title", "interpretation", "params"],
    additionalProperties: false,
  };
}

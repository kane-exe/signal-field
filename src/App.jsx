import { useState } from "react";
import AIParamsPanel from "./features/ai/components/AIParamsPanel";
import SpiralPreview from "./features/spiral/components/SpiralPreview";

const defaultParams = {
  growthRate: 0.35,
  jitterR: 0.08,
  jitterY: 0.04,
  waveAmp: 1.2,
  waveFreq: 3.2,
  waveFreqOscillation: false,
  instantTransition: false,
  baseColor: "#66cfff",
  transitionColor: "#ff6b9d",
  pointSize: 0.02,
  pointSizeRange: 0.5,
  breatheSpeed: 1.6,
  animate: true,
  breathe: true,
  burst: false,
  hueShift: true,
};

export default function App() {
  const [params, setParams] = useState(defaultParams);

  const updateParam = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.type === "color"
          ? event.target.value
          : Number(event.target.value);
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const renderSliderControl = (label, key, min, max, step) => (
    <label
      key={key}
      style={{
        display: "grid",
        gap: "6px",
        marginBottom: "12px",
        fontSize: "13px",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{params[key]}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={params[key]}
        onChange={updateParam(key)}
        style={{ width: "100%" }}
      />
    </label>
  );

  return (
    <div
      style={{
        height: "100vh",
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        background: "#02030d",
        color: "#fff",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(380px, 760px) 300px",
          gap: "24px",
          alignItems: "start",
          justifyContent: "center",
          width: "100%",
          maxWidth: "1400px",
        }}
      >
        <div
          style={{
            padding: "16px",
            background: "rgba(4, 9, 20, 0.86)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.3)",

            display: "flex",
            flexDirection: "column",
          }}
        >
          <AIParamsPanel currentParams={params} onApply={setParams} />
        </div>

        <SpiralPreview params={params} />

        <div
          style={{
            padding: "16px",
            background: "rgba(4, 9, 20, 0.86)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            Spiral Parameters
          </div>
          {renderSliderControl("Growth rate", "growthRate", 0.01, 1.0, 0.02)}
          {renderSliderControl("Wave amplitude", "waveAmp", 0, 8, 0.05)}
          {renderSliderControl("Wave frequency", "waveFreq", 0.5, 8, 0.1)}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontWeight: 600 }}>Colors</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#dce7ff",
                }}
              >
                <span>Base</span>
                <input
                  type="color"
                  value={params.baseColor}
                  onChange={updateParam("baseColor")}
                  style={{
                    width: "28px",
                    height: "28px",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#dce7ff",
                }}
              >
                <span>Transition</span>
                <input
                  type="color"
                  value={params.transitionColor}
                  onChange={updateParam("transitionColor")}
                  style={{
                    width: "28px",
                    height: "28px",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          </div>
          {renderSliderControl("Point size", "pointSize", 0.002, 0.5, 0.005)}
          {renderSliderControl("Breathe speed", "breatheSpeed", 0.2, 10, 0.1)}
        </div>
      </div>
    </div>
  );
}

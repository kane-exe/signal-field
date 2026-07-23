import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import SpiralPoints from "./SpiralPoints";

const cameraSettings = { position: [4, 2.2, 16], fov: 55 };
const sceneLighting = [
  { position: [3, 4, 6], intensity: 1.1, color: "#ffffff" },
];

function SpiralPreview({ params }) {
  return (
    <div
      style={{
        position: "relative",
        flex: "0 0 52vw",
        minWidth: "380px",
        width: "min(52vw, 760px)",
        height: "min(52vw, 760px)",
        maxWidth: "760px",
        maxHeight: "760px",
        background: "#050814",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 2,
          padding: "8px 10px",
          borderRadius: "999px",
          background: "rgba(2, 6, 23, 0.72)",
          color: "#dfe8ff",
          fontSize: "11px",
          letterSpacing: "0.02em",
          border: "1px solid rgba(255,255,255,0.12)",
          pointerEvents: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        Drag to orbit • scroll to zoom
      </div>
      <Canvas
        camera={cameraSettings}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <ambientLight intensity={0.45} />
        {sceneLighting.map((light) => (
          <directionalLight
            key={light.position.join("-")}
            position={light.position}
            intensity={light.intensity}
            color={light.color}
          />
        ))}
        <SpiralPoints params={params} />
        <OrbitControls enableDamping target={[0, 0.4, 0]} />
      </Canvas>
    </div>
  );
}

export default SpiralPreview;

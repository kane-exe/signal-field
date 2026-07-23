import { useState } from "react";
import { buildJsonSchema, buildSystemPrompt } from "../utils/aiPromptUtils";

export default function AIParamsPanel({ currentParams, onApply }) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("Signal Field");
  const [interpretation, setInterpretation] = useState(
    "Your prompt is being translated into motion, spacing, color, and rhythm.",
  );

  const endpoint = "/api/ai/@cf/meta/llama-3.1-8b-instruct";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const description = draft.trim();
    if (!description) return;

    setDraft("");
    setIsLoading(true);
    setStatusTone("loading");
    setStatus("Thinking about the scene and generating fresh parameters...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: description },
          ],
          response_format: {
            type: "json_schema",
            json_schema: buildJsonSchema(),
          },
        }),
      });

      const payload = await response.json();
      const responseContent =
        payload?.result?.response && payload.result.response;
      const params =
        responseContent?.params || responseContent?.parameters || currentParams;

      onApply(params);
      setTitle(responseContent?.title || "Signal Field");
      setInterpretation(
        responseContent?.interpretation ||
          "Your prompt is being translated into motion, spacing, color, and rhythm.",
      );
      setStatusTone("idle");
      setStatus("");
    } catch {
      setStatusTone("error");
      setStatus(
        "The AI request failed, so the current visualization stayed in place.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const promptChips = [
    "A calm system gradually becoming unstable",
    "High energy with tightly controlled movement",
    "A quiet atmosphere with occasional bursts of activity",
    "Dense, chaotic, and fast-moving",
    "Zen, calm, and relaxed",
  ];

  const insertPrompt = (prompt) => {
    setDraft((current) => (current ? `${current}\n${prompt}` : prompt));
  };

  return (
    <div
      style={{
        marginBottom: "14px",
        padding: "14px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ paddingTop: "2px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
          {title}
        </div>
        <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#dfe8ff" }}>
          {interpretation}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexShrink: 0,
          alignItems: "stretch",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "2px",
            paddingBottom: "2px",
          }}
        >
          {promptChips.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => insertPrompt(prompt)}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#dfe8ff",
                borderRadius: "999px",
                padding: "7px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your signal field..."
          style={{
            width: "100%",
            minHeight: "100px",
            maxHeight: "220px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(2, 6, 23, 0.9)",
            color: "#fff",
            padding: "12px 12px",
            fontSize: "15px",
            lineHeight: 1.5,
            boxSizing: "border-box",
            outline: "none",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "8px",
            background: isLoading ? "rgba(110, 231, 255, 0.45)" : "#6ee7ff",
            color: "#03111f",
            fontWeight: 700,
            fontSize: "13px",
            padding: "11px 12px",
            cursor: isLoading ? "wait" : "pointer",
            marginTop: "2px",
          }}
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
        <div
          style={{
            fontSize: "12px",
            color: statusTone === "error" ? "#ff8f8f" : "#aabfe0",
            textAlign: "center",
            marginTop: "2px",
            minHeight: "16px",
          }}
        >
          {status}
        </div>
      </form>
    </div>
  );
}

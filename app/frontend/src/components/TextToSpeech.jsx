import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LoaderCircle,
  Play,
  RefreshCw,
  Save,
  Square,
  Volume2,
} from "lucide-react";
import {
  getTtsStatus,
  listTtsModels,
  speakTts,
  startTts,
  stopTts,
} from "../services/api";

const FALLBACK_VOICES = [
  { id: "af_heart", name: "Heart", language: "en-us", gender: "Female" },
  { id: "af_bella", name: "Bella", language: "en-us", gender: "Female" },
  { id: "am_michael", name: "Michael", language: "en-us", gender: "Male" },
  { id: "bf_emma", name: "Emma", language: "en-gb", gender: "Female" },
  { id: "bm_george", name: "George", language: "en-gb", gender: "Male" },
];

function downloadUrl(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function TextToSpeech({
  showAlert,
  showConfirm,
  selectedOutput,
  onOutputsChanged,
  ttsSettings,
  setTtsSettings,
  ttsOutputs = [],
  onDeleteTtsOutput,
  setSelectedTtsOutput,
}) {
  const [status, setStatus] = useState({ ready: false, running: false, runtimeInstalled: false, settings: {}, voices: [] });
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [text, setText] = useState("Hello from Local AI Studio text to speech.");
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const abortRef = useRef(null);

  const installedModels = useMemo(() => models.filter((model) => model.installed), [models]);
  const voices = status.voices?.length ? status.voices : FALLBACK_VOICES;
  const selectedVoice = ttsSettings?.voice || "af_heart";
  const speed = ttsSettings?.speed || 1;

  const updateTtsSetting = (key, value) => {
    setTtsSettings((prev) => ({ ...prev, [key]: value }));
  };

  const refresh = useCallback(async () => {
    const [nextStatus, nextModels] = await Promise.all([
      getTtsStatus(),
      listTtsModels(),
    ]);
    setStatus(nextStatus);
    setModels(nextModels);
    setSelectedModel((current) => {
      const installed = nextModels.filter((model) => model.installed);
      if (current && installed.some((model) => model.filename === current || model.id === current)) return current;
      const active = nextStatus.settings?.model;
      if (active && installed.some((model) => model.filename === active)) return active;
      const preferred = ttsSettings?.model;
      if (preferred && installed.some((model) => model.filename === preferred)) return preferred;
      return installed.find((model) => model.recommended)?.filename || installed[0]?.filename || "";
    });
  }, [ttsSettings?.model]);

  useEffect(() => {
    refresh().catch((err) => showAlert?.({ title: "TTS Status Failed", message: err.message || String(err), danger: true }));
    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [refresh, showAlert]);

  useEffect(() => {
    if (!selectedOutput) return;
    setOutput(selectedOutput);
    setText(selectedOutput.text || "");
    if (selectedOutput.voice) updateTtsSetting("voice", selectedOutput.voice);
    if (selectedOutput.speed) updateTtsSetting("speed", selectedOutput.speed);
    if (selectedOutput.model) setSelectedModel(selectedOutput.model);
  }, [selectedOutput]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleLoadModel = async () => {
    if (!selectedModel) return;
    setIsLoadingModel(true);
    try {
      await startTts(selectedModel, { voice: selectedVoice, speed });
      updateTtsSetting("model", selectedModel);
      await refresh();
    } catch (err) {
      showAlert?.({ title: "TTS Model Load Failed", message: err.message || String(err), danger: true });
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopTts();
      await refresh();
    } catch (err) {
      showAlert?.({ title: "Stop TTS Failed", message: err.message || String(err), danger: true });
    }
  };

  const handleGenerate = async () => {
    if (!text.trim() || !selectedModel) return;
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (!status.ready || status.settings?.model !== selectedModel) {
        setIsLoadingModel(true);
        try {
          await startTts(selectedModel, { voice: selectedVoice, speed });
          updateTtsSetting("model", selectedModel);
          await refresh();
        } finally {
          setIsLoadingModel(false);
        }
      }
      const generated = await speakTts(text, {
        model: selectedModel,
        voice: selectedVoice,
        speed,
        signal: controller.signal,
      });
      setOutput(generated);
      await refresh();
      await onOutputsChanged?.();
    } catch (err) {
      if (err.name !== "AbortError") {
        showAlert?.({ title: "TTS Generation Failed", message: err.message || String(err), danger: true });
      }
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const isLoaded = status.ready && status.settings?.model === selectedModel;

  return (
    <div className="workspace-area speech-workspace">
      <div className="workspace-title-section">
        <h2 className="workspace-title">Text to Speech</h2>
        <p className="workspace-subtitle">
          Generate local WAV narration with Kokoro ONNX.
        </p>
      </div>

      <div className="speech-grid">
        <section className="m3-card speech-panel">
          <div className="speech-panel-header">
            <h3>Runtime</h3>
            <span className={`status-chip ${status.runtimeInstalled ? "" : "offline"}`}>
              {status.runtimeInstalled ? (status.ready ? "Ready" : "Installed") : "Runtime missing"}
            </span>
          </div>

          {status.error && <div className="text-progress error">{status.error}</div>}

          <label className="speech-label">
            Kokoro model
            <select className="m3-input" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
              {installedModels.length === 0 && <option value="">No downloaded TTS models</option>}
              {installedModels.map((model) => (
                <option key={model.id || model.filename} value={model.filename}>
                  {model.name || model.filename}
                </option>
              ))}
            </select>
          </label>

          <div className="speech-controls-row" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <div style={{ display: "flex", gap: "16px", width: "100%" }}>
              <label className="speech-label" style={{ flex: 1 }}>
                Voice
                <select className="m3-input" style={{ width: "100%" }} value={selectedVoice} onChange={(event) => updateTtsSetting("voice", event.target.value)}>
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.gender}, {voice.language})
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="speech-label" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>Speed</span>
                  <span style={{ fontWeight: 700 }}>{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(event) => updateTtsSetting("speed", Math.max(0.5, Math.min(2, Number(event.target.value) || 1)))}
                  style={{ width: "100%", marginTop: "8px", cursor: "pointer" }}
                  disabled={isGenerating}
                />
              </label>
            </div>

            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--md-sys-color-outline)", display: "block", marginBottom: "6px" }}>Voice Shortcuts</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {FALLBACK_VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`m3-btn ${selectedVoice === v.id ? "m3-btn-filled" : "m3-btn-outlined"}`}
                    style={{ height: "30px", padding: "0 10px", fontSize: "0.75rem", borderRadius: "6px", cursor: "pointer" }}
                    onClick={() => updateTtsSetting("voice", v.id)}
                    disabled={isGenerating}
                  >
                    {v.name} ({v.gender === "Female" ? "♀️" : "♂️"})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="speech-button-row">
            <button
              className="m3-btn m3-btn-filled"
              onClick={handleLoadModel}
              disabled={!selectedModel || isLoadingModel || isGenerating || isLoaded}
            >
              {isLoadingModel ? <LoaderCircle className="progress-spinner" size={14} /> : <Play size={14} />}
              <span>{isLoaded ? "Loaded" : isLoadingModel ? "Loading" : "Load"}</span>
            </button>
            <button className="m3-btn m3-btn-outlined" onClick={refresh}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            {status.ready && (
              <button className="m3-btn m3-btn-error" onClick={handleStop}>
                <Square size={14} />
                <span>Stop Runtime</span>
              </button>
            )}
          </div>

          {installedModels.length === 0 && (
            <div className="text-progress">
              Download a Kokoro model from Model Manager, TTS Models first.
            </div>
          )}
        </section>

        <section className="m3-card speech-panel">
          <div className="speech-panel-header">
            <h3>Input</h3>
            <span className="status-chip">{text.trim().length} chars</span>
          </div>
          <textarea
            className="m3-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            maxLength={5000}
            style={{ width: "100%", resize: "vertical", minHeight: "220px", lineHeight: 1.45 }}
            placeholder="Type text to turn into speech..."
          />
          <div className="speech-button-row">
            {isGenerating ? (
              <button className="m3-btn m3-btn-error" onClick={handleCancel}>
                <Square size={14} />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                className="m3-btn m3-btn-filled"
                onClick={handleGenerate}
                disabled={!text.trim() || !selectedModel || !status.runtimeInstalled}
              >
                <Volume2 size={14} />
                <span>Generate WAV</span>
              </button>
            )}
            {isGenerating && <span className="text-progress"><LoaderCircle className="progress-spinner" size={14} /> Generating locally...</span>}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        {/* Left Side: Current Output */}
        <section className="m3-card speech-result-panel" style={{ margin: 0 }}>
          <div className="speech-panel-header">
            <h3>Output</h3>
            <div className="speech-button-row">
              <button className="m3-btn m3-btn-outlined" onClick={() => output?.url && downloadUrl(output.url, output.audioFile || "tts.wav")} disabled={!output?.url}>
                <Save size={14} />
                <span>WAV</span>
              </button>
            </div>
          </div>
          {output?.url ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <audio controls src={output.url} style={{ width: "100%" }} />
              <div className="text-progress">
                {output.voiceName || output.voice} &bull; {output.modelName || output.model} &bull; {new Date(output.createdAt).toLocaleString()}
              </div>
              <textarea
                className="m3-input"
                value={output.text || text}
                onChange={(event) => setOutput((prev) => ({ ...(prev || {}), text: event.target.value }))}
                rows={5}
                style={{ width: "100%", resize: "vertical", minHeight: "120px", lineHeight: 1.45 }}
              />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <Volume2 size={42} />
              <p>Generated speech will appear here.</p>
            </div>
          )}
        </section>

        {/* Right Side: Audio History List */}
        <section className="m3-card speech-result-panel" style={{ margin: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="speech-panel-header">
            <h3>Audio History</h3>
            <span className="status-chip">{ttsOutputs.length} files</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "260px", paddingRight: "4px" }}>
            {ttsOutputs.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--md-sys-color-outline)", fontSize: "0.85rem" }}>
                No previous recordings found.
              </div>
            ) : (
              ttsOutputs.map((item) => {
                const itemId = item.filename || item.metadata || item.audioFile;
                const isActive = output && (output.filename || output.metadata || output.audioFile) === itemId;
                return (
                  <div
                    key={itemId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isActive ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-surface-variant)",
                      border: isActive ? "1px solid var(--md-sys-color-primary)" : "1px solid var(--border-color)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setOutput(item);
                      setText(item.text || "");
                      setSelectedTtsOutput?.(item);
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                       <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isActive ? "var(--md-sys-color-on-primary-container)" : "inherit" }}>
                         {item.text || item.displayName || "TTS Recording"}
                       </span>
                       <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                         Voice: {item.voiceName || item.voice || "Unknown"} &bull; {new Date(item.createdAt || item.modifiedAt).toLocaleDateString()}
                       </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="m3-btn m3-btn-outlined"
                        style={{ height: "26px", width: "26px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", cursor: "pointer" }}
                        onClick={() => downloadUrl(item.url, item.audioFile || "tts.wav")}
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        className="m3-btn m3-btn-error"
                        style={{ height: "26px", width: "26px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", cursor: "pointer" }}
                        onClick={(e) => onDeleteTtsOutput?.(item, e)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

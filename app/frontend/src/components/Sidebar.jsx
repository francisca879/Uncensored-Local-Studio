import React, { memo } from "react";
import { Image, FolderDown, MessageSquare, Mic, Settings, Shield, Terminal, ChevronDown, ChevronUp, Trash2, Volume2 } from "lucide-react";

function formatSidebarDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} ${timeStr}`;
}

function Sidebar({ 
  collapsed = false,
  activeTab, 
  setActiveTab, 
  specs,
  conversations = [],
  activeConversationId,
  setActiveConversationId,
  showHistory,
  setShowHistory,
  onDeleteConversation,
  folders = [],
  addFolder,
  deleteFolder,
  renameFolder,
  toggleFolderCollapse,
  setConversationFolder,
  speechTranscriptions = [],
  selectedSpeechTranscript,
  setSelectedSpeechTranscript,
  showSpeechHistory,
  setShowSpeechHistory,
  onDeleteSpeechTranscription,
  ttsOutputs = [],
  selectedTtsOutput,
  setSelectedTtsOutput,
  showTtsHistory,
  setShowTtsHistory,
  onDeleteTtsOutput
}) {
  const handleAddFolderClick = (e) => {
    e.stopPropagation();
    const name = window.prompt("Enter folder name:");
    if (name && name.trim()) {
      addFolder(name.trim());
    }
  };

  const renderConversationItem = (conv) => {
    const isActive = activeConversationId === conv.id;
    return (
      <div
        key={conv.id}
        onClick={() => {
          setActiveConversationId(conv.id);
          setActiveTab("chat");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px 6px 10px",
          borderRadius: "var(--md-shape-corner-small)",
          fontSize: "0.78rem",
          cursor: "pointer",
          background: isActive ? "var(--md-sys-color-secondary-container)" : "transparent",
          color: isActive ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)",
          border: isActive ? "1px solid var(--md-sys-color-outline-variant)" : "1px solid transparent",
          transition: "background 0.2s"
        }}
        className="sidebar-history-item"
        title={conv.title}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          fontWeight: isActive ? 600 : 400
        }}>
          {conv.title}
        </span>

        <select
          value={conv.folderId || ""}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setConversationFolder(conv.id, e.target.value || null);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--md-sys-color-outline)",
            fontSize: "0.68rem",
            cursor: "pointer",
            marginRight: "4px",
            maxWidth: "60px",
            outline: "none"
          }}
          title="Move to Folder"
        >
          <option value="" style={{ background: "var(--md-sys-color-surface)" }}>Move...</option>
          {folders.map(f => (
            <option key={f.id} value={f.id} style={{ background: "var(--md-sys-color-surface)" }}>{f.name}</option>
          ))}
          {conv.folderId && (
            <option value="" style={{ background: "var(--md-sys-color-surface)" }}>Remove</option>
          )}
        </select>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteConversation(conv.id, e);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--md-sys-color-outline)",
            cursor: "pointer",
            padding: "2px",
            marginLeft: "6px",
            display: "flex",
            alignItems: "center"
          }}
          className="sidebar-history-delete"
          title="Delete Conversation"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div>
        {/* Sidebar Header */}
        <div className="sidebar-logo">
          <Shield className="sidebar-logo-icon" />
          <span className="sidebar-logo-text">Akil AI</span>
        </div>

        {/* Sidebar Navigation Links (Material 3 style) */}
        <div className="nav-list">
          <div
            className={`nav-item ${activeTab === "generator" ? "active" : ""}`}
            onClick={() => setActiveTab("generator")}
          >
            <Image size={20} />
            <span>Image Generator</span>
          </div>

          <div className="nav-item-wrapper" style={{ display: "flex", flexDirection: "column" }}>
            <div
              className={`nav-item ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", boxSizing: "border-box" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <MessageSquare size={20} />
                <span>Text Chat</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistory(!showHistory);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background-color 0.2s"
                }}
                className="history-toggle-arrow"
                title={showHistory ? "Hide Chat History" : "Show Chat History"}
              >
                {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Sidebar Chat History List */}
            {showHistory && (
              <div 
                className="sidebar-history-list" 
                style={{ 
                  paddingLeft: "14px", 
                  marginTop: "6px", 
                  marginBottom: "6px",
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "6px", 
                  maxHeight: "350px", 
                  overflowY: "auto",
                  borderLeft: "2px solid var(--border-color)"
                }}
              >
                {/* Create Folder Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--md-sys-color-outline)" }}>Folders & Chats</span>
                  <button
                    onClick={handleAddFolderClick}
                    style={{
                      background: "var(--md-sys-color-primary-container)",
                      border: "none",
                      color: "var(--md-sys-color-primary)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    + Folder
                  </button>
                </div>

                {/* Render Folders */}
                {folders.map((folder) => {
                  const folderConversations = conversations.filter(c => c.folderId === folder.id);
                  const isExpanded = folder.expanded !== false;
                  return (
                    <div key={folder.id} style={{ display: "flex", flexDirection: "column", gap: "2px", margin: "2px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          background: "var(--md-sys-color-surface-variant)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--md-sys-color-on-surface-variant)"
                        }}
                        onClick={() => toggleFolderCollapse(folder.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <span style={{ fontSize: "0.75rem" }}>{isExpanded ? "📂" : "📁"}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder.name}</span>
                          <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>({folderConversations.length})</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = window.prompt("Rename folder to:", folder.name);
                              if (newName && newName.trim()) renameFolder(folder.id, newName.trim());
                            }}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "0.65rem", opacity: 0.7 }}
                            title="Rename"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete folder "${folder.name}"? Chats will be preserved.`)) {
                                deleteFolder(folder.id);
                              }
                            }}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "0.65rem", opacity: 0.7 }}
                            title="Delete Folder"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px dashed var(--border-color)" }}>
                          {folderConversations.length === 0 ? (
                            <div style={{ padding: "4px 8px", fontSize: "0.7rem", color: "var(--md-sys-color-outline)", opacity: 0.7 }}>
                              Empty folder
                            </div>
                          ) : (
                            folderConversations.map(conv => renderConversationItem(conv))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Render Uncategorized Chats */}
                <div style={{ marginTop: "4px" }}>
                  {folders.length > 0 && (
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--md-sys-color-outline)", padding: "4px 8px", opacity: 0.8 }}>
                      Uncategorized Chats
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {conversations.filter(c => !c.folderId || !folders.some(f => f.id === c.folderId)).length === 0 ? (
                      folders.length > 0 ? null : (
                        <div style={{ padding: "8px 12px", fontSize: "0.78rem", color: "var(--md-sys-color-outline)", opacity: 0.8 }}>
                          No saved chats
                        </div>
                      )
                    ) : (
                      conversations
                        .filter(c => !c.folderId || !folders.some(f => f.id === c.folderId))
                        .map(conv => renderConversationItem(conv))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="nav-item-wrapper" style={{ display: "flex", flexDirection: "column" }}>
            <div
              className={`nav-item ${activeTab === "speech" ? "active" : ""}`}
              onClick={() => setActiveTab("speech")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", boxSizing: "border-box" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mic size={20} />
                <span>Speech Transcriber</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechHistory(!showSpeechHistory);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background-color 0.2s"
                }}
                className="history-toggle-arrow"
                title={showSpeechHistory ? "Hide Transcriptions" : "Show Transcriptions"}
              >
                {showSpeechHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showSpeechHistory && (
              <div
                className="sidebar-history-list"
                style={{
                  paddingLeft: "14px",
                  marginTop: "6px",
                  marginBottom: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  borderLeft: "2px solid var(--border-color)"
                }}
              >
                {speechTranscriptions.length === 0 ? (
                  <div style={{ padding: "8px 12px", fontSize: "0.78rem", color: "var(--md-sys-color-outline)", opacity: 0.8 }}>
                    No saved transcriptions
                  </div>
                ) : (
                  speechTranscriptions.map((item) => {
                    const itemId = item.filename || item.metadata || item.textFile;
                    const isActive = selectedSpeechTranscript && (selectedSpeechTranscript.filename || selectedSpeechTranscript.metadata || selectedSpeechTranscript.textFile) === itemId;
                    const title = item.displayName || item.sourceFilename || item.textFile || item.filename || "Transcript";
                    const date = formatSidebarDate(item.modifiedAt || item.createdAt);
                    return (
                      <div
                        key={itemId}
                        onClick={() => {
                          setSelectedSpeechTranscript(item);
                          setActiveTab("speech");
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 8px 7px 10px",
                          borderRadius: "var(--md-shape-corner-small)",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          background: isActive ? "var(--md-sys-color-secondary-container)" : "transparent",
                          color: isActive ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)",
                          border: isActive ? "1px solid var(--md-sys-color-outline-variant)" : "1px solid transparent",
                          transition: "background 0.2s"
                        }}
                        className="sidebar-history-item"
                        title={title}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isActive ? 600 : 400 }}>
                            {title}
                          </span>
                          {date && (
                            <span style={{ fontSize: "0.68rem", opacity: 0.72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {date}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSpeechTranscription?.(item, e);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--md-sys-color-outline)",
                            cursor: "pointer",
                            padding: "2px",
                            marginLeft: "6px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          className="sidebar-history-delete"
                          title="Delete Transcription"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="nav-item-wrapper" style={{ display: "flex", flexDirection: "column" }}>
            <div
              className={`nav-item ${activeTab === "tts" ? "active" : ""}`}
              onClick={() => setActiveTab("tts")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", boxSizing: "border-box" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Volume2 size={20} />
                <span>Text to Speech</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTtsHistory(!showTtsHistory);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background-color 0.2s"
                }}
                className="history-toggle-arrow"
                title={showTtsHistory ? "Hide TTS Outputs" : "Show TTS Outputs"}
              >
                {showTtsHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showTtsHistory && (
              <div
                className="sidebar-history-list"
                style={{
                  paddingLeft: "14px",
                  marginTop: "6px",
                  marginBottom: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  borderLeft: "2px solid var(--border-color)"
                }}
              >
                {ttsOutputs.length === 0 ? (
                  <div style={{ padding: "8px 12px", fontSize: "0.78rem", color: "var(--md-sys-color-outline)", opacity: 0.8 }}>
                    No saved audio
                  </div>
                ) : (
                  ttsOutputs.map((item) => {
                    const itemId = item.filename || item.metadata || item.audioFile;
                    const isActive = selectedTtsOutput && (selectedTtsOutput.filename || selectedTtsOutput.metadata || selectedTtsOutput.audioFile) === itemId;
                    const title = item.displayName || item.text || item.audioFile || item.filename || "TTS Output";
                    const date = formatSidebarDate(item.modifiedAt || item.createdAt);
                    return (
                      <div
                        key={itemId}
                        onClick={() => {
                          setSelectedTtsOutput(item);
                          setActiveTab("tts");
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 8px 7px 10px",
                          borderRadius: "var(--md-shape-corner-small)",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          background: isActive ? "var(--md-sys-color-secondary-container)" : "transparent",
                          color: isActive ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)",
                          border: isActive ? "1px solid var(--md-sys-color-outline-variant)" : "1px solid transparent",
                          transition: "background 0.2s"
                        }}
                        className="sidebar-history-item"
                        title={title}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isActive ? 600 : 400 }}>
                            {title}
                          </span>
                          {date && (
                            <span style={{ fontSize: "0.68rem", opacity: 0.72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {date}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTtsOutput?.(item, e);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--md-sys-color-outline)",
                            cursor: "pointer",
                            padding: "2px",
                            marginLeft: "6px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          className="sidebar-history-delete"
                          title="Delete TTS Output"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === "models" ? "active" : ""}`}
            onClick={() => setActiveTab("models")}
          >
            <FolderDown size={20} />
            <span>Model Manager</span>
          </div>

          <div
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </div>
      </div>

      {/* Sidebar Footer with Host Telemetry System Specs */}
      <div className="sidebar-footer">
        <div className="sidebar-specs-header">
          <Terminal size={12} />
          <span>Host Specifications</span>
        </div>
        <div className="sidebar-specs-item" title={specs.cpu_name}>
          CPU: {specs.cpu_name}
        </div>
        <div className="sidebar-specs-item" title={specs.gpu_name}>
          GPU: {specs.gpu_name}
        </div>
        <div className="sidebar-specs-item">
          Memory: {specs.ram_total_gb.toFixed(0)} GB RAM ({specs.cpu_cores_physical} Cores)
        </div>
        <div className="sidebar-specs-os">
          OS: {specs.os_name}
        </div>
      </div>
    </div>
  );
}

export default memo(Sidebar);

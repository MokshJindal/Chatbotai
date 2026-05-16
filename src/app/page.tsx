"use client";

import React, { useState, useEffect } from "react";
import ChatInterface from "../components/ChatInterface";
import SettingsPanel from "../components/SettingsPanel";
import ContextManager, {
  ContextFolder,
  createDefaultTree,
} from "../components/ContextManager";
import { BotConfig, DEFAULT_BOT_CONFIG } from "../components/BotConfigPanel";
import { MessageSquare, Settings, FolderOpen, Activity } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    google: "",
  });
  const [botConfig, setBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);
  const [contextTree, setContextTree] = useState<ContextFolder>(
    createDefaultTree()
  );
  const [usageCredits, setUsageCredits] = useState(0);
  const WARNING_THRESHOLD = 5000;

  useEffect(() => {
    // Load settings from local storage on mount
    const savedKeys = localStorage.getItem("apiKeys");
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));

    const savedConfig = localStorage.getItem("botConfig");
    if (savedConfig) setBotConfig(JSON.parse(savedConfig));

    const savedTree = localStorage.getItem("contextFolders");
    if (savedTree) setContextTree(JSON.parse(savedTree));

    const savedUsage = localStorage.getItem("usageCredits");
    if (savedUsage) setUsageCredits(parseInt(savedUsage, 10));
  }, []);

  const handleSaveKeys = (keys: any) => {
    setApiKeys(keys);
    localStorage.setItem("apiKeys", JSON.stringify(keys));
  };

  const handleBotConfigChange = (config: BotConfig) => {
    setBotConfig(config);
    localStorage.setItem("botConfig", JSON.stringify(config));
  };

  const handleContextTreeUpdate = (tree: ContextFolder) => {
    setContextTree(tree);
    localStorage.setItem("contextFolders", JSON.stringify(tree));
  };

  const incrementUsage = (tokens: number) => {
    const newUsage = usageCredits + tokens;
    setUsageCredits(newUsage);
    localStorage.setItem("usageCredits", newUsage.toString());
  };

  return (
    <div
      className="main-content"
      style={{ flexDirection: "row", height: "100vh", overflow: "hidden" }}
    >
      {/* Sidebar */}
      <aside
        className="glass-panel"
        style={{
          width: "280px",
          margin: "1rem",
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--border-color)",
          background: "var(--bg-glass)",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="gold-text"
            style={{
              fontSize: "1.4rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            <Activity color="var(--gold-main)" /> SalesBot Pro
          </h2>
        </div>

        <nav
          style={{
            padding: "1.5rem 1rem",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <button
            className={`btn-secondary ${
              activeTab === "chat" ? "active-nav" : ""
            }`}
            style={{
              justifyContent: "flex-start",
              border:
                activeTab === "chat"
                  ? "1px solid var(--border-gold)"
                  : "1px solid transparent",
            }}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={18} /> Context Chat
          </button>

          <button
            className={`btn-secondary ${
              activeTab === "data" ? "active-nav" : ""
            }`}
            style={{
              justifyContent: "flex-start",
              border:
                activeTab === "data"
                  ? "1px solid var(--border-gold)"
                  : "1px solid transparent",
            }}
            onClick={() => setActiveTab("data")}
          >
            <FolderOpen size={18} /> Context Library
          </button>

          <button
            className={`btn-secondary ${
              activeTab === "settings" ? "active-nav" : ""
            }`}
            style={{
              justifyContent: "flex-start",
              border:
                activeTab === "settings"
                  ? "1px solid var(--border-gold)"
                  : "1px solid transparent",
            }}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} /> Settings & Keys
          </button>
        </nav>

        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid var(--border-color)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <span>Credits Used</span>
            <span style={{ color: "var(--text-primary)" }}>
              {usageCredits}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "4px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${Math.min(
                  (usageCredits / WARNING_THRESHOLD) * 100,
                  100
                )}%`,
                background:
                  usageCredits > WARNING_THRESHOLD
                    ? "var(--danger-color)"
                    : "var(--gold-gradient)",
                boxShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
                borderRadius: "4px",
              }}
            />
          </div>
          {usageCredits > WARNING_THRESHOLD && (
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "0.75rem",
                color: "var(--danger-color)",
              }}
            >
              Warning: High credit usage detected.
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          margin: "1rem 1rem 1rem 0",
        }}
      >
        {usageCredits > WARNING_THRESHOLD && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: "1rem 1.5rem",
              marginBottom: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--danger-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              borderRadius: "12px",
            }}
          >
            <Activity size={18} /> You have exceeded the recommended usage
            threshold ({WARNING_THRESHOLD} credits). The service is still
            active.
          </div>
        )}

        <div
          className="glass-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--bg-glass)",
          }}
        >
          {activeTab === "chat" && (
            <ChatInterface
              apiKeys={apiKeys}
              botConfig={botConfig}
              contextTree={contextTree}
              onBotConfigChange={handleBotConfigChange}
              onUsage={incrementUsage}
            />
          )}
          {activeTab === "settings" && (
            <SettingsPanel apiKeys={apiKeys} onSave={handleSaveKeys} />
          )}
          {activeTab === "data" && (
            <ContextManager
              contextTree={contextTree}
              onUpdateTree={handleContextTreeUpdate}
            />
          )}
        </div>
      </main>
    </div>
  );
}

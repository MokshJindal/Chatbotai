"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Loader2, AlertCircle, MoreVertical } from "lucide-react";
import BotConfigPanel, { BotConfig } from "./BotConfigPanel";
import { ContextFolder } from "./ContextManager";

function getAllItemsFromFolder(tree: ContextFolder): string {
  if (!tree) return "";
  let content = (tree.items || []).map((item) => `--- ${item.name} ---\n${item.content}`).join("\n\n");
  for (const child of (tree.children || [])) {
    const childContent = getAllItemsFromFolder(child);
    if (childContent) {
      content += (content ? "\n\n" : "") + childContent;
    }
  }
  return content;
}

function getContextFromFolder(tree: ContextFolder, folderId: string): string {
  if (!tree) return "";
  if (tree.id === folderId) {
    return getAllItemsFromFolder(tree);
  }
  for (const child of (tree.children || [])) {
    const found = getContextFromFolder(child, folderId);
    if (found) return found;
  }
  return "";
}

// Map model id to display name
function getModelDisplayName(model: string): string {
  const map: Record<string, string> = {
    "google:gemini-1.5-pro": "Gemini 1.5 Pro",
    "google:gemini-1.5-flash": "Gemini 1.5 Flash",
    "anthropic:claude-3-5-sonnet-20240620": "Claude 3.5 Sonnet",
    "anthropic:claude-3-haiku-20240307": "Claude 3 Haiku",
    "openai:gpt-4o": "GPT-4o",
    "openai:gpt-4o-mini": "GPT-4o Mini",
  };
  return map[model] || model;
}

export default function ChatInterface({
  apiKeys,
  botConfig,
  contextTree,
  onBotConfigChange,
  onUsage,
}: {
  apiKeys: any;
  botConfig: BotConfig;
  contextTree: ContextFolder;
  onBotConfigChange: (config: BotConfig) => void;
  onUsage: (tokens: number) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // Gather context content
  const contextContent = getContextFromFolder(
    contextTree,
    botConfig.selectedContextFolderId
  );

  const { messages, append, error, isLoading } = useChat({
    api: "/api/chat",
    body: {
      apiKeys,
      model: botConfig.model,
      temperature: botConfig.temperature,
      maxTokens: botConfig.maxTokens,
      systemPrompt: botConfig.systemPrompt,
      contextContent,
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    append({ 
      role: "user",
      content: input 
    });
    
    setInput("");
    onUsage(Math.floor(Math.random() * 50) + 10);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, error]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
      className="animate-fade-in"
    >
      {/* Header */}
      <header
        style={{
          padding: "1.25rem 2rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h3
            className="gold-text"
            style={{ fontSize: "1.2rem", letterSpacing: "0.5px" }}
          >
            Sales Context Bot
          </h3>
          <span className="model-badge">
            {getModelDisplayName(botConfig.model)}
          </span>
        </div>
        <button
          className="three-dot-btn"
          onClick={() => setShowConfig(true)}
          title="Bot Configuration"
        >
          <MoreVertical size={18} />
        </button>
      </header>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--text-secondary)",
              maxWidth: "400px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(212, 175, 55, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem auto",
                border: "1px solid var(--border-gold)",
                boxShadow: "0 0 20px rgba(212, 175, 55, 0.1)",
              }}
            >
              <Bot size={40} color="var(--gold-main)" />
            </div>
            <h3
              className="gold-text"
              style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}
            >
              Ready to Assist
            </h3>
            <p style={{ lineHeight: "1.6" }}>
              Start a conversation with the Sales Bot. Ensure your API keys are
              configured in the Settings tab.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const textContent =
              m.content ||
              m.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ||
              "";
            const isUser = m.role === "user";

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  flexDirection: isUser ? "row-reverse" : "row",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isUser
                      ? "var(--gold-gradient)"
                      : "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: isUser ? "none" : "1px solid var(--border-gold)",
                    boxShadow: isUser
                      ? "0 4px 10px rgba(212, 175, 55, 0.3)"
                      : "none",
                  }}
                >
                  {isUser ? (
                    <User size={18} color="#000" />
                  ) : (
                    <Bot size={18} color="var(--gold-light)" />
                  )}
                </div>
                <div
                  style={{
                    background: isUser
                      ? "rgba(212, 175, 55, 0.05)"
                      : "rgba(0,0,0,0.4)",
                    padding: "1.25rem",
                    borderRadius: "16px",
                    border: isUser
                      ? "1px solid rgba(212, 175, 55, 0.2)"
                      : "1px solid rgba(255,255,255,0.05)",
                    maxWidth: "80%",
                    lineHeight: "1.6",
                    color: isUser
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {textContent || (isLoading && !isUser ? "..." : "")}
                </div>
              </div>
            );
          })
        )}

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.2)",
              borderRadius: "12px",
              color: "#ff6b6b",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            <AlertCircle size={18} />
            <div>
              <strong>Error:</strong> {error.message || "Failed to get a response. Please check your API keys and internet connection."}
            </div>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid var(--border-gold)",
              }}
            >
              <Bot size={18} color="var(--gold-light)" />
            </div>
            <div
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "var(--gold-main)",
                background: "rgba(0,0,0,0.4)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Loader2 size={18} className="animate-spin" /> Analyzing
              context...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              animation: "fadeIn 0.3s ease",
              margin: "1rem 0",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <AlertCircle size={18} color="var(--danger-color)" />
            </div>
            <div
              style={{
                padding: "1.25rem",
                color: "var(--danger-color)",
                background: "rgba(239, 68, 68, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontSize: "0.95rem",
              }}
            >
              <strong>Error:</strong>{" "}
              {error.message || "Failed to generate response."}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "1.5rem 2rem",
          borderTop: "1px solid var(--border-color)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ position: "relative" }}>
          <input
            className="input-field"
            style={{
              paddingRight: "4rem",
              padding: "1.25rem 1.5rem",
              borderRadius: "16px",
              fontSize: "1rem",
            }}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the data..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "0.6rem",
              borderRadius: "12px",
              background:
                isLoading || !input.trim()
                  ? "transparent"
                  : "var(--gold-gradient)",
              color:
                isLoading || !input.trim() ? "var(--text-secondary)" : "#000",
              transition: "all 0.3s ease",
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Bot Config Panel */}
      {showConfig && (
        <BotConfigPanel
          config={botConfig}
          contextTree={contextTree}
          onSave={onBotConfigChange}
          onClose={() => setShowConfig(false)}
        />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `,
        }}
      />
    </div>
  );
}

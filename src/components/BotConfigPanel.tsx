"use client";

import React, { useState } from "react";
import {
  X,
  Cpu,
  Thermometer,
  Hash,
  Shield,
  FolderOpen,
} from "lucide-react";
import { ContextFolder } from "./ContextManager";

export interface BotConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  selectedContextFolderId: string;
}

export const DEFAULT_BOT_CONFIG: BotConfig = {
  model: "google:gemini-1.5-pro",
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: "",
  selectedContextFolderId: "root",
};

// Flatten folder tree for dropdown
function flattenFolders(
  folder: ContextFolder,
  depth: number = 0
): { id: string; name: string; depth: number }[] {
  if (!folder) return [];
  const result = [{ id: folder.id, name: folder.name, depth }];
  for (const child of (folder.children || [])) {
    result.push(...flattenFolders(child, depth + 1));
  }
  return result;
}

export default function BotConfigPanel({
  config,
  contextTree,
  onSave,
  onClose,
}: {
  config: BotConfig;
  contextTree: ContextFolder;
  onSave: (config: BotConfig) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BotConfig>({ ...config });

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const folders = flattenFolders(contextTree);

  return (
    <>
      {/* Overlay */}
      <div className="bot-config-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="bot-config-drawer">
        {/* Header */}
        <div className="drawer-header">
          <h3
            className="gold-text"
            style={{ fontSize: "1.2rem", letterSpacing: "0.5px" }}
          >
            Bot Configuration
          </h3>
          <button className="three-dot-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Model Selector */}
          <div className="config-section">
            <label>
              <Cpu size={14} className="label-icon" />
              AI Model
            </label>
            <select
              className="input-field"
              value={draft.model}
              onChange={(e) =>
                setDraft({ ...draft, model: e.target.value })
              }
              style={{ padding: "0.75rem 1rem", fontSize: "0.9rem" }}
            >
              <optgroup label="Google">
                <option value="google:gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="google:gemini-1.5-flash">
                  Gemini 1.5 Flash
                </option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="anthropic:claude-3-5-sonnet-20240620">
                  Claude 3.5 Sonnet
                </option>
                <option value="anthropic:claude-3-haiku-20240307">
                  Claude 3 Haiku
                </option>
              </optgroup>
              <optgroup label="OpenAI">
                <option value="openai:gpt-4o">GPT-4o</option>
                <option value="openai:gpt-4o-mini">GPT-4o Mini</option>
              </optgroup>
            </select>
          </div>

          {/* Temperature */}
          <div className="config-section">
            <label>
              <Thermometer size={14} className="label-icon" />
              Temperature (Creativity)
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <input
                type="range"
                className="range-slider"
                min="0"
                max="2"
                step="0.1"
                value={draft.temperature}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    temperature: parseFloat(e.target.value),
                  })
                }
              />
              <span className="range-value">{draft.temperature.toFixed(1)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                opacity: 0.6,
                marginTop: "-0.25rem",
              }}
            >
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="config-section">
            <label>
              <Hash size={14} className="label-icon" />
              Max Tokens (Response Length)
            </label>
            <input
              type="number"
              className="input-field"
              value={draft.maxTokens}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  maxTokens: parseInt(e.target.value) || 0,
                })
              }
              min={1}
              style={{ padding: "0.75rem 1rem", fontSize: "0.9rem" }}
              placeholder="4096"
            />
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                opacity: 0.6,
              }}
            >
              Controls the maximum length of the AI response. No hard upper
              limit.
            </div>
          </div>

          {/* System Prompt / Guardrails */}
          <div className="config-section">
            <label>
              <Shield size={14} className="label-icon" />
              System Prompt (Guardrails)
            </label>
            <textarea
              className="system-prompt-textarea"
              value={draft.systemPrompt}
              onChange={(e) =>
                setDraft({ ...draft, systemPrompt: e.target.value })
              }
              placeholder={`Write instructions in plain English, e.g.:\n• Only answer questions about our products\n• Never share pricing unless asked\n• Always be polite and professional`}
            />
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                opacity: 0.6,
              }}
            >
              Define rules and behavior for the bot in plain English. These
              instructions are sent as the system prompt.
            </div>
          </div>

          {/* Context Folder Selector */}
          <div className="config-section">
            <label>
              <FolderOpen size={14} className="label-icon" />
              Active Context Folder
            </label>
            <select
              className="input-field"
              value={draft.selectedContextFolderId}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  selectedContextFolderId: e.target.value,
                })
              }
              style={{ padding: "0.75rem 1rem", fontSize: "0.9rem" }}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {"—".repeat(f.depth)} {f.name}
                </option>
              ))}
            </select>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                opacity: 0.6,
              }}
            >
              Context from this folder will be included with every message.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: "0.65rem 1.25rem" }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            style={{ padding: "0.65rem 1.5rem" }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState } from "react";
import { Key } from "lucide-react";

export default function SettingsPanel({ apiKeys, onSave }: { apiKeys: any, onSave: (keys: any) => void }) {
  const [keys, setKeys] = useState(apiKeys);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setKeys(apiKeys);
  }, [apiKeys]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
      <h2 className="gold-text" style={{ marginBottom: "1rem", fontSize: "2rem" }}>API Configurations</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.05rem" }}>
        Enter your API keys below to enable the respective AI models. Keys are securely stored locally in your browser and are sent to the backend only when generating responses.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "rgba(0,0,0,0.3)" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>
              <Key size={16} color="var(--gold-main)" /> Google Gemini API Key
            </label>
            <input 
              type="password" 
              name="google"
              value={keys?.google || ""} 
              onChange={handleChange}
              className="input-field"
              placeholder="AIzaSy..."
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>
              <Key size={16} color="var(--gold-main)" /> Anthropic API Key
            </label>
            <input 
              type="password" 
              name="anthropic"
              value={keys?.anthropic || ""} 
              onChange={handleChange}
              className="input-field"
              placeholder="sk-ant-..."
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>
              <Key size={16} color="var(--gold-main)" /> OpenAI API Key
            </label>
            <input 
              type="password" 
              name="openai"
              value={keys?.openai || ""} 
              onChange={handleChange}
              className="input-field"
              placeholder="sk-proj-..."
            />
          </div>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1.5rem", justifyContent: "flex-end" }}>
          {saved && <span className="gold-text" style={{ fontWeight: "500", animation: "fadeIn 0.3s ease" }}>Settings saved successfully!</span>}
          <button type="submit" className="btn-primary">
            Save Configurations
          </button>
        </div>
      </form>
    </div>
  );
}

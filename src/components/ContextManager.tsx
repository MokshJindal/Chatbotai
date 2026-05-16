"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Folder,
  FolderPlus,
  FileText,
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Plus,
  X,
  Check,
  FolderOpen,
} from "lucide-react";

export interface ContextItem {
  id: string;
  name: string;
  content: string;
  size: number;
}

export interface ContextFolder {
  id: string;
  name: string;
  children: ContextFolder[];
  items: ContextItem[];
}

export function createDefaultTree(): ContextFolder {
  return {
    id: "root",
    name: "Contexts",
    children: [],
    items: [],
  };
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Deep clone + update helpers
function findFolder(tree: ContextFolder, id: string): ContextFolder | null {
  if (tree.id === id) return tree;
  for (const child of (tree.children || [])) {
    const found = findFolder(child, id);
    if (found) return found;
  }
  return null;
}

function updateFolderInTree(
  tree: ContextFolder,
  id: string,
  updater: (f: ContextFolder) => ContextFolder
): ContextFolder {
  if (tree.id === id) return updater({ ...tree });
  return {
    ...tree,
    children: (tree.children || []).map((c) => updateFolderInTree(c, id, updater)),
  };
}

function deleteFolderFromTree(
  tree: ContextFolder,
  id: string
): ContextFolder {
  return {
    ...tree,
    children: (tree.children || [])
      .filter((c) => c.id !== id)
      .map((c) => deleteFolderFromTree(c, id)),
  };
}

export default function ContextManager({
  contextTree,
  onUpdateTree,
}: {
  contextTree: ContextFolder;
  onUpdateTree: (tree: ContextFolder) => void;
}) {
  const [activeFolderId, setActiveFolderId] = useState("root");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["root"])
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFolder = findFolder(contextTree, activeFolderId) || contextTree;

  const toggleExpand = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSubfolder = (parentId: string) => {
    const newFolder: ContextFolder = {
      id: generateId(),
      name: "New Folder",
      children: [],
      items: [],
    };
    const updated = updateFolderInTree(contextTree, parentId, (f) => ({
      ...f,
      children: [...(f.children || []), newFolder],
    }));
    onUpdateTree(updated);
    setExpandedFolders((prev) => new Set([...prev, parentId]));
    setEditingId(newFolder.id);
    setEditingName("New Folder");
  };

  const renameFolder = (id: string) => {
    if (!editingName.trim()) return;
    const updated = updateFolderInTree(contextTree, id, (f) => ({
      ...f,
      name: editingName.trim(),
    }));
    onUpdateTree(updated);
    setEditingId(null);
  };

  const deleteFolder = (id: string) => {
    if (id === "root") return;
    const updated = deleteFolderFromTree(contextTree, id);
    onUpdateTree(updated);
    if (activeFolderId === id) setActiveFolderId("root");
  };

  const addItem = (name: string, content: string) => {
    const item: ContextItem = {
      id: generateId(),
      name,
      content,
      size: new Blob([content]).size,
    };
    const updated = updateFolderInTree(contextTree, activeFolderId, (f) => ({
      ...f,
      items: [...(f.items || []), item],
    }));
    onUpdateTree(updated);
  };

  const deleteItem = (itemId: string) => {
    const updated = updateFolderInTree(contextTree, activeFolderId, (f) => ({
      ...f,
      items: (f.items || []).filter((i) => i.id !== itemId),
    }));
    onUpdateTree(updated);
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          
          const response = await fetch("/api/parse", {
            method: "POST",
            body: formData,
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              addItem(file.name, data.text);
            }
          } else {
            console.error(`Failed to parse ${file.name}`);
            // Fallback to basic text read if API fails
            const text = await file.text();
            addItem(file.name, text);
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          // Fallback to basic text read
          try {
            const text = await file.text();
            addItem(file.name, text);
          } catch {
            console.error(`Could not read ${file.name}`);
          }
        }
      }
      setIsUploading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFolderId, contextTree]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const name = pasteName.trim() || `Note ${(activeFolder.items || []).length + 1}`;
    addItem(name, pasteText);
    setPasteText("");
    setPasteName("");
  };

  // Recursive folder tree renderer
  const renderFolder = (folder: ContextFolder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const isEditing = editingId === folder.id;
    const hasChildren = (folder.children || []).length > 0;

    return (
      <div key={folder.id}>
        <div
          className={`folder-item ${isActive ? "active" : ""}`}
          onClick={() => {
            setActiveFolderId(folder.id);
            if (hasChildren) toggleExpand(folder.id);
          }}
        >
          {hasChildren || folder.id === "root" ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span style={{ width: 14 }} />
          )}
          {isActive ? (
            <FolderOpen size={16} color="var(--gold-main)" />
          ) : (
            <Folder size={16} />
          )}

          {isEditing ? (
            <div
              style={{ display: "flex", gap: 4, alignItems: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                className="inline-edit-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameFolder(folder.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
              />
              <button
                className="icon-btn-sm"
                onClick={() => renameFolder(folder.id)}
              >
                <Check size={14} />
              </button>
              <button
                className="icon-btn-sm"
                onClick={() => setEditingId(null)}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {folder.name}
            </span>
          )}

          {!isEditing && (
            <div
              className="folder-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="icon-btn-sm"
                title="Add subfolder"
                onClick={() => addSubfolder(folder.id)}
              >
                <FolderPlus size={14} />
              </button>
              {folder.id !== "root" && (
                <>
                  <button
                    className="icon-btn-sm"
                    title="Rename"
                    onClick={() => {
                      setEditingId(folder.id);
                      setEditingName(folder.name);
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className="icon-btn-sm danger"
                    title="Delete folder"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="folder-children">
            {(folder.children || []).map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
      }}
      className="animate-fade-in"
    >
      {/* Folder Sidebar */}
      <div
        style={{
          width: "280px",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            className="gold-text"
            style={{ fontSize: "1rem", letterSpacing: "0.5px" }}
          >
            Context Library
          </h3>
          <button
            className="icon-btn-sm"
            title="New folder"
            onClick={() => addSubfolder("root")}
          >
            <Plus size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="folder-tree">{renderFolder(contextTree)}</div>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 2rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <FolderOpen size={18} color="var(--gold-main)" />
          <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>
            {activeFolder.name}
          </h3>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginLeft: "auto",
            }}
          >
            {(activeFolder.items || []).length} item
            {(activeFolder.items || []).length !== 1 ? "s" : ""}
          </span>
        </div>

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
          {/* Upload Dropzone */}
          <div
            className={`upload-dropzone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={36} className="dropzone-icon" />
            <div style={{ fontSize: "1rem", fontWeight: 500 }}>
              {isUploading ? "Processing files..." : "Drop files here or click to upload"}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                marginTop: "0.25rem",
                opacity: 0.6,
              }}
            >
              {isUploading ? "Extracting text content..." : "Supports PDF, DOCX, XLSX, CSV, TXT, JSON, MD & more"}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Paste Text */}
          <div
            className="glass-panel"
            style={{
              padding: "1.5rem",
              background: "rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.25rem",
              }}
            >
              <FileText size={16} color="var(--gold-main)" />
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Paste Context
              </span>
            </div>
            <input
              className="input-field"
              placeholder="Name (optional)"
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              style={{ padding: "0.7rem 1rem", fontSize: "0.9rem" }}
            />
            <textarea
              className="input-field"
              style={{
                height: "120px",
                resize: "vertical",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
              placeholder="Paste document text here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn-primary"
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.8rem" }}
              >
                <Plus size={14} /> Add to Folder
              </button>
            </div>
          </div>

          {/* Items List */}
          {!(activeFolder.items && activeFolder.items.length > 0) ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={24} color="var(--gold-main)" />
              </div>
              <p style={{ fontSize: "0.95rem" }}>
                No context items in this folder yet
              </p>
              <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                Upload files or paste text to add context
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.25rem",
                }}
              >
                Saved Items
              </div>
              {(activeFolder.items || []).map((item) => (
                <div key={item.id} className="context-item">
                  <FileText size={18} color="var(--gold-main)" style={{ flexShrink: 0 }} />
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-size">{formatSize(item.size)}</div>
                  </div>
                  <button
                    className="item-delete"
                    onClick={() => deleteItem(item.id)}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, FileText, Upload,
  ChevronDown, ChevronRight, Star, X, Check
} from 'lucide-react';
import { createSession, deleteSession, renameSession, uploadDocument, deleteDocument } from '../lib/api';

export default function Sidebar({
  sessions, documents,
  activeSessionId, onSelectSession,
  onSessionCreated, onSessionDeleted,
  onDocumentUploaded, onDocumentDeleted,
}) {
  const [docsOpen, setDocsOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const fileRef = useRef();

  async function handleNewChat() {
    const session = await createSession();
    onSessionCreated(session);
  }

  async function handleDeleteSession(e, id) {
    e.stopPropagation();
    await deleteSession(id);
    onSessionDeleted(id);
  }

  function startEdit(e, session) {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  }

  async function commitEdit(id) {
    const updated = await renameSession(id, editTitle);
    onSessionCreated(updated); // reuse to refresh list
    setEditingId(null);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      onDocumentUploaded(doc);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  }

  async function handleDeleteDoc(e, id) {
    e.stopPropagation();
    await deleteDocument(id);
    onDocumentDeleted(id);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold text-white">AstroRAG</span>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="text-xs text-gray-500 uppercase px-2 py-1 font-semibold tracking-wider">
          Conversaciones
        </p>
        {sessions.length === 0 && (
          <p className="text-xs text-gray-600 px-2">Sin conversaciones</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectSession(s.id)}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
              activeSessionId === s.id
                ? 'bg-indigo-700 text-white'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {editingId === s.id ? (
              <input
                autoFocus
                className="flex-1 bg-gray-700 text-white text-xs rounded px-1 outline-none"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit(s.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate" onDoubleClick={(e) => startEdit(e, s)}>
                {s.title}
              </span>
            )}
            {editingId === s.id ? (
              <Check
                className="w-3 h-3 text-green-400 shrink-0"
                onClick={(e) => { e.stopPropagation(); commitEdit(s.id); }}
              />
            ) : (
              <Trash2
                className="w-3 h-3 text-gray-500 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteSession(e, s.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Documents section */}
      <div className="border-t border-gray-700 p-2">
        <button
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white w-full px-2 py-1 transition-colors"
          onClick={() => setDocsOpen(!docsOpen)}
        >
          {docsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="uppercase font-semibold tracking-wider">Documentos ({documents.length})</span>
        </button>

        {docsOpen && (
          <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
            {documents.map((doc) => (
              <div key={doc.id} className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 text-xs text-gray-400">
                <FileText className="w-3 h-3 shrink-0 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-300">{doc.name}</p>
                  <p className="text-gray-600">{formatSize(doc.file_size)}</p>
                </div>
                {doc.is_indexed && <Check className="w-3 h-3 text-green-500 shrink-0" />}
                <Trash2
                  className="w-3 h-3 text-gray-600 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={(e) => handleDeleteDoc(e, doc.id)}
                />
              </div>
            ))}

            <label className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
              uploading ? 'bg-gray-700 text-gray-500' : 'hover:bg-gray-800 text-indigo-400 hover:text-indigo-300'
            }`}>
              <Upload className="w-3 h-3" />
              {uploading ? 'Indexando...' : 'Subir PDF'}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}

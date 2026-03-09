'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { getSessions, getDocuments, getSession } from './lib/api';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
    getDocuments().then(setDocuments).catch(console.error);
  }, []);

  function handleSessionCreated(session) {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === session.id);
      if (exists) return prev.map((s) => (s.id === session.id ? session : s));
      return [session, ...prev];
    });
    setActiveSessionId(session.id);
  }

  function handleSessionDeleted(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  }

  function handleDocumentUploaded(doc) {
    setDocuments((prev) => [doc, ...prev]);
  }

  function handleDocumentDeleted(id) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleTitleChange(sessionId) {
    const updated = await getSession(sessionId);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s)));
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar
        sessions={sessions}
        documents={documents}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onSessionCreated={handleSessionCreated}
        onSessionDeleted={handleSessionDeleted}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentDeleted={handleDocumentDeleted}
      />
      <ChatWindow
        sessionId={activeSessionId}
        onTitleChange={handleTitleChange}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { getSession, sendMessage } from '../lib/api';

export default function ChatWindow({ sessionId, onTitleChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    if (!sessionId) return;
    setFetching(true);
    getSession(sessionId)
      .then((data) => {
        setMessages(data.messages);
      })
      .finally(() => setFetching(false));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setLoading(true);

    try {
      const aiMsg = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, aiMsg]);
      if (onTitleChange) onTitleChange(sessionId);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-gray-600">
        <Bot className="w-16 h-16 mb-4 text-indigo-800" />
        <p className="text-lg font-medium text-gray-500">Seleccioná o creá una conversación</p>
        <p className="text-sm mt-1">Podés preguntarme sobre astronomía y tus PDFs</p>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-indigo-600 mb-3" />
            <p className="text-gray-400 font-medium">¿En qué puedo ayudarte hoy?</p>
            <p className="text-gray-600 text-sm mt-1">Preguntame sobre astronomía o tus documentos PDF</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2 items-end bg-gray-800 rounded-2xl px-4 py-2 border border-gray-700 focus-within:border-indigo-600 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu pregunta… (Enter para enviar)"
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 resize-none outline-none text-sm py-1 max-h-40"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="mb-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-700 text-center mt-2">Shift+Enter para nueva línea</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-gray-700' : 'bg-indigo-700'
      }`}>
        {isUser ? <User className="w-4 h-4 text-gray-200" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-indigo-700 text-white rounded-tr-none'
          : 'bg-gray-800 text-gray-100 rounded-tl-none'
      }`}>
        {message.content}
      </div>
    </div>
  );
}

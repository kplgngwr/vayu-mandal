'use client';

import { useState } from 'react';

interface ChatMessage { role: 'user' | 'model'; content: string }

export default function Chatbot({ context }: { context?: Record<string, any> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setMessages(prev => [...prev, { role: 'user', content }]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }], context }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => [...prev, { role: 'model', content: json.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I could not generate a response.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Network error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Floating button bottom-left */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 rounded-full bg-purple-600 text-white px-4 py-3 shadow-lg hover:bg-purple-700"
        aria-label="Open chat"
      >
        Vayu Ashtra
      </button>

      {/* Popup chat modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-surface-light dark:bg-surface-dark border rounded-2xl shadow-xl m-4">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                {/* Wind/Fan glyph */}
                <span className="material-symbols-outlined text-purple-600">air</span>
                <p className="font-semibold">Vayu Ashtra</p>
              </div>
              <button className="text-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="p-3 h-[360px] overflow-y-auto space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-text-muted-light dark:text-text-muted">Start the conversation. Ask for personalized guidance based on current AQI and weather.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {sending && <p className="text-xs text-text-muted-light dark:text-text-muted">Thinking…</p>}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
                placeholder="Type your question…"
              />
              <button onClick={sendMessage} disabled={sending} className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

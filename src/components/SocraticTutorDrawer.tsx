import React, { useState } from 'react';
import { CourseLesson } from '../types';
import { MessageSquare, Send, Sparkles, X, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';

interface SocraticTutorDrawerProps {
  lesson: CourseLesson;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const SocraticTutorDrawer: React.FC<SocraticTutorDrawerProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello! I am your Socratic AI Tutor for "${lesson.title}". What concept would you like to explore or challenge?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newHistory: Message[] = [...messages, { role: 'user', text }];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutoring/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          lessonId: lesson.id,
          history: newHistory.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply || 'Let us reflect on that.' }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: 'Notice how the system boundary handles asynchronous message ordering. What would happen if Node A sent a timestamp earlier than Node B?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Socratic AI Tutor</h3>
            <p className="text-[11px] text-slate-500">Active Guidance & Deep Recall</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Socratic Inquiries */}
      <div className="px-4 py-2 bg-indigo-50/40 border-b border-indigo-100/50 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => handleSendMessage('Can you explain this using an everyday intuition or analogy?')}
          className="px-2 py-1 bg-white hover:bg-indigo-50 text-[11px] text-indigo-700 border border-indigo-200/60 rounded-md transition-colors"
        >
          Intuition Analogy
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('Give me a progressive hint on how the clocks increment.')}
          className="px-2 py-1 bg-white hover:bg-indigo-50 text-[11px] text-indigo-700 border border-indigo-200/60 rounded-md transition-colors"
        >
          Progressive Hint
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('What is a classic edge-case failure mode for this concept?')}
          className="px-2 py-1 bg-white hover:bg-indigo-50 text-[11px] text-indigo-700 border border-indigo-200/60 rounded-md transition-colors"
        >
          Edge-Case Failure
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {m.role === 'user' ? 'You' : 'Socratic Tutor'}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2 italic">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span>Reasoning through Socratic question...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or explain your intuition..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

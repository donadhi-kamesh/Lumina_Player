import React, { useRef, useEffect } from 'react';
import { ChatMessage, Sender } from '../types';
import { SendIcon, SparklesIcon, XIcon } from './Icons';

interface AIAssistantProps {
  messages: ChatMessage[];
  isAnalyzing: boolean;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  messages,
  isAnalyzing,
  onSendMessage,
  onClose,
  isOpen,
}) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-violet-400">
          <SparklesIcon className="w-5 h-5" />
          <h2 className="font-semibold text-zinc-100">Gemini Vision</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-10 space-y-2">
            <SparklesIcon className="w-12 h-12 mx-auto opacity-20" />
            <p>Pause the video and ask me anything about the current frame.</p>
            <p className="text-sm">"Describe this scene"<br/>"Translate the text"<br/>"What mood is this?"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === Sender.USER
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-none border border-zinc-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this frame..."
            className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-zinc-700 transition-all"
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isAnalyzing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-full hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

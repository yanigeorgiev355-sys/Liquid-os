import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, RefreshCcw } from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * 1. DYNAMIC WIDGETS (The "Generative" Components)
 * ------------------------------------------------------------------
 */

// Widget 1: Interactive Coin Flip
const CoinFlipWidget = () => {
  const [result, setResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const flip = () => {
    setIsFlipping(true);
    setResult(null);
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setResult(outcome);
      setIsFlipping(false);
    }, 1000);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-64 flex flex-col items-center gap-4 shadow-lg">
      <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
        Liquid Decider
      </div>
      
      <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 text-xl font-bold transition-all duration-500
        ${isFlipping ? 'animate-spin border-blue-500 border-t-transparent' : 'border-slate-600 bg-slate-900 text-white'}
        ${result === 'HEADS' ? 'bg-emerald-900/50 border-emerald-500' : ''}
        ${result === 'TAILS' ? 'bg-amber-900/50 border-amber-500' : ''}
      `}>
        {isFlipping ? '' : result || '?'}
      </div>

      <button 
        onClick={flip}
        disabled={isFlipping}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        <RefreshCcw size={16} />
        {result ? 'Flip Again' : 'Flip Coin'}
      </button>
    </div>
  );
};

// Widget 2: Breathing Exercise (CSS Animation)
const BreathingWidget = () => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-[300px] flex flex-col items-center gap-6 shadow-lg overflow-hidden relative">
      <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider z-10">
        Mindfulness Mode
      </div>
      
      {/* CSS Animation defined in style tag below */}
      <div className="relative flex items-center justify-center h-32 w-32">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping-slow"></div>
        <div className="h-24 w-24 bg-indigo-500/80 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-breathe">
          <span className="text-white font-medium text-xs animate-pulse">inhale</span>
        </div>
      </div>

      <p className="text-slate-300 text-center text-sm z-10">
        Sync your breath with the circle.
      </p>

      {/* Inline styles for custom keyframes not in default Tailwind */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * ------------------------------------------------------------------
 * 2. MESSAGE COMPONENT (The Router)
 * ------------------------------------------------------------------
 */

const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Render Logic based on Type */}
          {message.type === 'text' && (
            <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
              isUser 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }`}>
              {message.content}
            </div>
          )}

          {message.type === 'component' && (
            <div className="mt-1">
              {message.data === 'coin' && <CoinFlipWidget />}
              {message.data === 'focus' && <BreathingWidget />}
            </div>
          )}
          
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * ------------------------------------------------------------------
 * 3. MAIN APPLICATION (LiquidOS Logic)
 * ------------------------------------------------------------------
 */

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'system', 
      type: 'text', 
      content: 'Welcome to LiquidOS. Try typing "Flip coin" or "Focus".', 
      timestamp: 'Just now' 
    }
  ]);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');

    // 1. Add User Message
    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      type: 'text',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Update state with user message first
    setMessages(prev => [...prev, newUserMsg]);

    // 2. Liquid Logic Processing (Simulated Latency)
    setTimeout(() => {
      let responseMsg = null;
      const cleanInput = userText.trim().toLowerCase();

      // LOGIC: Check triggers
      if (cleanInput === 'flip coin') {
        responseMsg = {
          id: Date.now() + 1,
          role: 'system',
          type: 'component', // <--- COMPONENT TYPE
          data: 'coin',      // <--- DATA PAYLOAD
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (cleanInput === 'focus') {
        responseMsg = {
          id: Date.now() + 1,
          role: 'system',
          type: 'component',
          data: 'focus',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        // Fallback text
        responseMsg = {
          id: Date.now() + 1,
          role: 'system',
          type: 'text',
          content: `I received "${userText}", but I only have widgets for "Flip coin" and "Focus" right now.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      setMessages(prev => [...prev, responseMsg]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="font-bold tracking-tight text-white flex items-center gap-2">
            LiquidOS <Sparkles size={14} className="text-blue-400" />
          </h1>
        </div>
        <div className="text-xs text-slate-500">v0.1 Prototype</div>
      </header>

      {/* Messages Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area (Fixed Bottom) */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form 
          onSubmit={handleSend}
          className="max-w-4xl mx-auto relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'Flip coin' or 'Focus'..."
            className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

    </div>
  );
    }


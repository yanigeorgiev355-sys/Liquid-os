import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Smartphone, Wind, RotateCcw } from 'lucide-react';

// --- THE WIDGETS (Lego Bricks) ---

const CoinFlipper = () => {
  const [result, setResult] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);

  const flip = () => {
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      setResult(Math.random() > 0.5 ? 'HEADS' : 'TAILS');
      setFlipping(false);
    }, 1000);
  };

  useEffect(() => { flip(); }, []);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full max-w-sm mx-auto text-center shadow-xl">
      <div className="flex justify-center mb-4">
        <div className={`w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center text-2xl font-bold bg-slate-900 ${flipping ? 'animate-spin' : ''}`}>
          {result ? result[0] : '?'}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">{result || 'Flipping...'}</h3>
      <button onClick={flip} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 rounded-xl font-bold active:scale-95 transition-all">
        <RotateCcw size={18} /> Flip Again
      </button>
    </div>
  );
};

const FocusTimer = () => {
  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-sm mx-auto text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
      <Wind className="mx-auto mb-4 text-blue-400 animate-bounce" size={48} />
      <h2 className="text-2xl font-bold mb-2">Inhale</h2>
      <p className="text-slate-400">Sync your breath with the circle.</p>
    </div>
  );
};

// --- THE MAIN APP ---

function App() {
  const [messages, setMessages] = useState<Array<{type: 'text' | 'component', content: any, sender: 'user' | 'ai'}>>([
    { type: 'text', content: 'Voice Module Online. Tap the Mic and say "Flip Coin".', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // HANDLE SEND
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');

    // 2. MOCK AI BRAIN (The Logic)
    setTimeout(() => {
      const lower = text.toLowerCase();
      
      if (lower.includes('flip') || lower.includes('coin')) {
        setMessages(prev => [...prev, { type: 'component', content: 'coin', sender: 'ai' }]);
      } 
      else if (lower.includes('focus') || lower.includes('breathe')) {
        setMessages(prev => [...prev, { type: 'component', content: 'focus', sender: 'ai' }]);
      } 
      else {
        setMessages(prev => [...prev, { type: 'text', content: `I heard "${text}", but I only know "Flip Coin" and "Focus" right now.`, sender: 'ai' }]);
      }
    }, 600);
  };

  // VOICE RECOGNITION (The Iron Man Part)
  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript); // Auto-send when speaking stops
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert("Voice not supported in this browser. Try Chrome.");
    }
  };

  const stopListening = () => {
    setIsListening(false);
    // Logic to manually stop if needed
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold tracking-wider text-sm">LIQUID OS v0.2</span>
        </div>
        <Smartphone size={18} className="text-slate-600" />
      </div>

      {/* STREAM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.type === 'text' ? (
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            ) : (
              // RENDER COMPONENT
              <div className="w-full">
                {msg.content === 'coin' && <CoinFlipper />}
                {msg.content === 'focus' && <FocusTimer />}
              </div>
            )}
            
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-2 max-w-lg mx-auto">
          
          <button 
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-6 focus:outline-none focus:border-blue-500 transition-colors"
          />
          
          <button 
            onClick={() => handleSend(input)}
            className="p-4 bg-blue-600 rounded-full text-white font-bold active:scale-90 transition-transform"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

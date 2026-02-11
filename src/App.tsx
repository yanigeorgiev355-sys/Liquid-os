import React, { useState, useEffect, useRef } from 'react';

// --- WIDGETS (No Icons, Just CSS & Emojis) ---

const CoinFlipper = () => {
  const [result, setResult] = useState(null);
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
          {result ? result[0] : '❓'}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{result || 'Flipping...'}</h3>
      <button onClick={flip} className="w-full py-3 bg-blue-600 rounded-xl font-bold text-white active:scale-95 transition-all">
        🔄 Flip Again
      </button>
    </div>
  );
};

const FocusTimer = () => {
  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-sm mx-auto text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
      <div className="text-6xl animate-bounce mb-4">💨</div>
      <h2 className="text-2xl font-bold mb-2 text-white">Inhale</h2>
      <p className="text-slate-400">Sync your breath.</p>
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const [messages, setMessages] = useState([
    { type: 'text', content: 'System Online. Press 🎤 to speak.', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (text) => {
    if (!text || !text.trim()) return;

    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes('flip') || lower.includes('coin')) {
        setMessages(prev => [...prev, { type: 'component', content: 'coin', sender: 'ai' }]);
      } 
      else if (lower.includes('focus') || lower.includes('breathe')) {
        setMessages(prev => [...prev, { type: 'component', content: 'focus', sender: 'ai' }]);
      } 
      else {
        setMessages(prev => [...prev, { type: 'text', content: `I heard "${text}". Try "Flip Coin".`, sender: 'ai' }]);
      }
    }, 600);
  };

  const toggleMic = () => {
    // Safety check for browser support
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice not supported on this browser. Try Chrome.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error(e);
        setIsListening(false);
      };
      
      recognition.start();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold tracking-wider text-sm">LIQUID OS</span>
        </div>
        <span>📱</span>
      </div>

      {/* CHAT STREAM */}
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
      <div className="p-4 bg-slate-900 border-t border-slate-800 pb-8">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button 
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
              isListening ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-slate-800'
            }`}
          >
            {isListening ? '🛑' : '🎤'}
          </button>

          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isListening ? "Listening..." : "Type..."}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 focus:outline-none focus:border-blue-500"
          />
          
          <button 
            onClick={() => handleSend(input)}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold"
          >
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

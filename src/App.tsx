import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- CSS STYLES ---
const styleTag = `
  @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
  .animate-spin-fast { animation: spin 1s ease-out forwards; }
  .mic-button { transition: all 0.2s; }
  .mic-button:active { transform: scale(0.9); }
  .mic-active { box-shadow: 0 0 15px #ef4444; background: #ef4444 !important; }
  .setup-input { width: 100%; padding: 10px; margin: 5px 0; background: #334155; border: 1px solid #475569; color: white; border-radius: 8px; }
`;

// --- SETUP COMPONENT (Protects your keys in Public Repo) ---
const SetupScreen = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [fbKey, setFbKey] = useState('');
  
  const save = () => {
    if(!apiKey || !fbKey) return alert("Keys required");
    const config = { 
      gemini: apiKey, 
      firebase: {
        apiKey: fbKey,
        authDomain: "liquid-os-5da31.firebaseapp.com",
        projectId: "liquid-os-5da31",
        storageBucket: "liquid-os-5da31.firebasestorage.app",
        messagingSenderId: "1091307817494",
        appId: "1:1091307817494:web:437b4013da4ad0bdc60337"
      }
    };
    localStorage.setItem('liquid_config', JSON.stringify(config));
    onSave(config);
  };

  return (
    <div style={{ padding: 30, color: 'white', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ borderBottom: '1px solid #334155', paddingBottom: 10 }}>🔐 Liquid Security</h2>
      <p style={{color:'#94a3b8', fontSize: '0.9rem', marginBottom: 20}}>
        Your Repo is Public. Do not commit keys.<br/>
        Enter them here. They are saved ONLY to this phone.
      </p>
      
      <label style={{fontWeight:'bold', fontSize:'0.9rem'}}>Gemini API Key (AI Studio)</label>
      <input className="setup-input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste AIza key here..." />
      
      <label style={{marginTop: 20, display:'block', fontWeight:'bold', fontSize:'0.9rem'}}>Firebase API Key (Google Cloud)</label>
      <input className="setup-input" value={fbKey} onChange={e => setFbKey(e.target.value)} placeholder="Paste AIza key here..." />
      
      <button onClick={save} style={{ width:'100%', marginTop: 30, padding: 15, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: '1rem' }}>
        💾 Save & Boot OS
      </button>
    </div>
  );
};

// --- WIDGETS ---
const FinanceTracker = ({ db }) => {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    if(!db) return;
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(5));
    getDocs(q).then(snap => {
      const list = [];
      snap.forEach(doc => {
        const d = doc.data();
        if(d.type === 'finance') list.push(d);
      });
      setItems(list);
    });
  }, [db]);

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', color: 'white' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #334155', paddingBottom: 10 }}>💳 Recent Spending</h3>
      {items.length === 0 ? <div style={{color:'#64748b'}}>No recent spending</div> : 
        items.map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom: 10, fontSize:'0.9rem' }}>
            <span>{item.item}</span>
            <span style={{color: '#ef4444'}}>-${item.amount}</span>
          </div>
        ))
      }
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [config, setConfig] = useState(null);
  const [db, setDb] = useState(null);
  
  // Load Config from Phone Memory
  useEffect(() => {
    const saved = localStorage.getItem('liquid_config');
    if(saved) {
      const c = JSON.parse(saved);
      setConfig(c);
      try {
        const app = initializeApp(c.firebase);
        setDb(getFirestore(app));
      } catch(e) { console.error(e); }
    }
  }, []);

  const [messages, setMessages] = useState([{ type: 'text', content: 'Liquid OS Online. Try "Spent $10 on food".', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `You are LiquidOS. User said: "${text}". 
            
            TOOLS:
            1. "finance": Use if user mentions spending money, buying things, or prices.
               Extract: { "item": string, "amount": number }
            2. "text": Normal conversation.

            Reply ONLY in JSON: 
            {"tool": "finance"|"text", "reply": "confirmation text", "data": { ...extracted_data } }`
          }]
        }]
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      
      if (!data.candidates) throw new Error("AI Silent");

      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const toolData = JSON.parse(cleanJson);

      if (toolData.tool === 'finance') {
        if(db) {
          await addDoc(collection(db, "history"), {
            type: 'finance',
            item: toolData.data.item || 'Unknown',
            amount: toolData.data.amount || 0,
            timestamp: new Date().toISOString()
          });
        }
        setMessages(prev => [...prev, { type: 'component', content: 'finance', sender: 'ai' }]);
        setMessages(prev => [...prev, { type: 'text', content: `Saved: $${toolData.data.amount} for ${toolData.data.item}`, sender: 'ai' }]);
      } else {
        setMessages(prev => [...prev, { type: 'text', content: toolData.reply, sender: 'ai' }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { type: 'text', content: 'Error: ' + e.message, sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) { alert("Use Chrome"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      handleSend(text);
    };
    recognition.start();
  };

  if(!config) return <SetupScreen onSave={(c) => { setConfig(c); try { const app = initializeApp(c.firebase); setDb(getFirestore(app)); } catch(e){} }} />;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <style>{styleTag}</style>
      <div style={{ padding: '15px', borderBottom: '1px solid #1e293b', textAlign: 'center', fontWeight: 'bold', display:'flex', justifyContent:'space-between' }}>
        <span>LIQUID OS</span>
        {loading && <span className="animate-spin-fast">⚡</span>}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            {msg.type === 'text' ? (
              <div style={{ background: msg.sender === 'user' ? '#2563eb' : '#1e293b', padding: '12px', borderRadius: '12px' }}>{msg.content}</div>
            ) : (
              <div style={{ width: '280px' }}>
                {msg.content === 'finance' && <FinanceTracker db={db} />}
              </div>
            )}
          </div>
        ))}
        {loading && <div style={{color: '#94a3b8', fontSize: '0.8rem'}}>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '15px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleMic} className={`mic-button ${isListening ? 'mic-active' : ''}`} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#1e293b', border: 'none', color: 'white', fontSize: '1.2rem' }}>{isListening ? '🛑' : '🎤'}</button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder="Speak..." style={{ flex: 1, background: '#1e293b', border: 'none', borderRadius: '20px', padding: '12px 20px', color: 'white', outline: 'none' }} />
          <button onClick={() => handleSend(input)} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#7c3aed', border: 'none', color: 'white' }}>➡️</button>
        </div>
      </div>
    </div>
  );
}

export default App;

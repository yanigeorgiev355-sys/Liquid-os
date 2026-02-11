import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc } from "firebase/firestore";

// --- CSS STYLES ---
const styleTag = `
  @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
  .animate-spin-fast { animation: spin 1s ease-out forwards; }
  .setup-input { width: 100%; padding: 10px; margin: 5px 0; background: #334155; border: 1px solid #475569; color: white; border-radius: 8px; }
  .mic-button { transition: all 0.2s; }
  .mic-button:active { transform: scale(0.9); }
  .mic-active { box-shadow: 0 0 15px #ef4444; background: #ef4444 !important; }
`;

// --- SETUP SCREEN (Keeps keys safe) ---
const SetupScreen = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [fbKey, setFbKey] = useState('');
  const save = () => {
    if(!apiKey || !fbKey) return alert("Keys required");
    const config = { 
      gemini: apiKey, 
      firebase: { apiKey: fbKey, authDomain: "liquid-os-5da31.firebaseapp.com", projectId: "liquid-os-5da31", storageBucket: "liquid-os-5da31.firebasestorage.app", messagingSenderId: "1091307817494", appId: "1:1091307817494:web:437b4013da4ad0bdc60337" }
    };
    localStorage.setItem('liquid_config', JSON.stringify(config));
    onSave(config);
  };
  return (
    <div style={{ padding: 30, color: 'white', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2>🔐 Liquid Security</h2>
      <input className="setup-input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Gemini API Key" />
      <input className="setup-input" value={fbKey} onChange={e => setFbKey(e.target.value)} placeholder="Firebase API Key" />
      <button onClick={save} style={{ marginTop: 20, padding: 15, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10 }}>Save & Boot</button>
    </div>
  );
};

// --- THE "GENERATIVE" WIDGET (The AI Controls This) ---
const DynamicWidget = ({ db }) => {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState({ title: "History", color: "#3b82f6", icon: "📜" });

  // Load the latest "Config" from AI's last decision
  useEffect(() => {
    if(!db) return;
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(10));
    getDocs(q).then(snap => {
      const list = [];
      let lastUI = null;
      snap.forEach(doc => {
        const d = doc.data();
        if(d.type === 'ui_config') lastUI = d; // AI decided the UI look
        if(d.type === 'data_entry') list.push({ ...d, id: doc.id });
      });
      if(lastUI) setConfig(lastUI); // Apply AI's design
      setData(list);
    });
  }, [db, data]); // Refresh when data changes

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: `1px solid ${config.color}`, color: 'white' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #334155', paddingBottom: 10, color: config.color }}>
        {config.icon} {config.title}
      </h3>
      {data.length === 0 ? <div style={{color:'#64748b'}}>Empty...</div> : 
        data.map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom: 8, fontSize:'0.9rem' }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 'bold' }}>{item.value}</span>
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('liquid_config');
    if(saved) {
      const c = JSON.parse(saved);
      setConfig(c);
      try { const app = initializeApp(c.firebase); setDb(getFirestore(app)); } catch(e){}
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    // Add user message to local chat history
    const newHistory = [...messages, { type: 'text', content: text, sender: 'user' }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini}`;
      
      // 🟢 CRITICAL: Send CHAT HISTORY to AI so it has Context
      const chatContext = newHistory.map(m => `${m.sender}: ${m.content}`).join("\n");

      const payload = {
        contents: [{
          parts: [{
            text: `SYSTEM: You are LiquidOS, a Generative UI engine.
            
            YOUR GOAL: Manage the user's data and the INTERFACE itself.
            
            HISTORY OF CHAT:
            ${chatContext}

            AVAILABLE ACTIONS (JSON):
            1. { "action": "chat", "reply": "..." } -> Just talk.
            2. { "action": "update_ui", "title": "...", "color": "hex", "icon": "emoji", "reply": "..." } -> Change how the widget looks (e.g., if user talks about money, make it "Expenses" and Red. If movies, make it "Watchlist" and Blue).
            3. { "action": "add_data", "label": "...", "value": "...", "reply": "..." } -> Add an item to the list.
            4. { "action": "delete_last", "reply": "..." } -> Remove the last item if user says "mistake" or "undo".

            RULES:
            - Decide the UI structure based on the CONTEXT.
            - If the user changes topics (e.g. from Money to Movies), send an "update_ui" action to re-skin the widget.
            - Always reply with valid JSON only.`
          }]
        }]
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      
      if (!data.candidates) throw new Error("AI Silent");
      const aiText = data.candidates[0].content.parts[0].text;
      const toolData = JSON.parse(aiText.replace(/```json/g, '').replace(/```/g, '').trim());

      // EXECUTE AI DECISION
      if (toolData.action === 'add_data') {
        if(db) await addDoc(collection(db, "history"), { type: 'data_entry', label: toolData.label, value: toolData.value, timestamp: new Date().toISOString() });
        setMessages(prev => [...prev, { type: 'text', content: toolData.reply || "Added.", sender: 'ai' }]);
      } 
      else if (toolData.action === 'update_ui') {
        if(db) await addDoc(collection(db, "history"), { type: 'ui_config', title: toolData.title, color: toolData.color, icon: toolData.icon, timestamp: new Date().toISOString() });
        setMessages(prev => [...prev, { type: 'text', content: toolData.reply || "Interface updated.", sender: 'ai' }]);
      }
      else if (toolData.action === 'delete_last') {
        // Simple logic to find latest entry and delete
        // Note: In a real app we'd need exact IDs, but this works for MVP
        if(db) {
            const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(1));
            const snap = await getDocs(q);
            snap.forEach(async doc => await deleteDoc(doc.ref));
        }
        setMessages(prev => [...prev, { type: 'text', content: toolData.reply || "Undone.", sender: 'ai' }]);
      }
      else {
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
        <span>LIQUID OS (Generative)</span>
        {loading && <span className="animate-spin-fast">⚡</span>}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* THE DYNAMIC WIDGET IS ALWAYS VISIBLE NOW */}
        <DynamicWidget db={db} />
        
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
             <div style={{ background: msg.sender === 'user' ? '#2563eb' : '#1e293b', padding: '12px', borderRadius: '12px', fontSize: '0.9rem' }}>{msg.content}</div>
          </div>
        ))}
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

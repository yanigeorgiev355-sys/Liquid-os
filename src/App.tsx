import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- THE LIQUID COMPONENT ENGINE ---
// These are the "Atomic Blocks" the AI uses to build your interface.
const AtomicElement = ({ type, props, onAction }) => {
  const baseStyle = { padding: '14px', borderRadius: '16px', marginBottom: '12px', width: '100%', boxSizing: 'border-box' };
  
  switch (type) {
    case 'button':
      return <button onClick={() => onAction(props.label)} style={{ ...baseStyle, background: props.color || '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{props.label}</button>;
    case 'slider':
      return (
        <div style={{ ...baseStyle, background: '#1e293b' }}>
          <label style={{display:'block', fontSize:'0.85rem', marginBottom:8, color: '#94a3b8'}}>{props.label}: {props.value}</label>
          <input type="range" style={{width:'100%', accentColor: '#6366f1'}} value={props.value} readOnly />
        </div>
      );
    case 'status':
      return (
        <div style={{ ...baseStyle, background: '#1e293b', borderLeft: `4px solid ${props.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{fontSize: '0.9rem'}}>{props.label}</span>
          <span style={{ color: props.color, fontWeight: 'bold', background: `${props.color}22`, padding: '4px 10px', borderRadius: '8px' }}>{props.value}</span>
        </div>
      );
    case 'text':
      return <p style={{ fontSize: '0.95rem', opacity: 0.9, padding: '0 5px', lineHeight: '1.5' }}>{props.content}</p>;
    default:
      return null;
  }
};

// --- THE SETUP PORTAL (RESTORED) ---
const SetupScreen = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [fbKey, setFbKey] = useState('');
  
  const save = () => {
    if(!apiKey || !fbKey) return alert("Both keys are required.");
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

  const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 20px 0', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '10px', boxSizing: 'border-box' };

  return (
    <div style={{ padding: 40, color: 'white', background: '#020617', height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>🔐 Secure Boot</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 30 }}>Enter your keys to manifest the OS. These are stored only on your device.</p>
      
      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>GEMINI API KEY</label>
      <input style={inputStyle} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." />
      
      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>FIREBASE API KEY</label>
      <input style={inputStyle} value={fbKey} onChange={e => setFbKey(e.target.value)} placeholder="AIza..." />
      
      <button onClick={save} style={{ width: '100%', padding: '16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
        Initialize Liquid OS
      </button>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [config, setConfig] = useState(null);
  const [db, setDb] = useState(null);
  const [messages, setMessages] = useState([]);
  const [appState, setAppState] = useState({ ui: { title: "Liquid OS", color: "#6366f1", icon: "💧" }, elements: [{ type: 'text', props: { content: "System ready. Describe a tool you need." } }] });
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
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
    const newHistory = [...messages, { sender: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `SYSTEM: You are a Generative UI Engine. Do not just reply with text. Manifest INTERFACES.
            
            CURRENT UI STATE: ${JSON.stringify(appState)}
            HISTORY: ${newHistory.map(m => `${m.sender}: ${m.content}`).join("\n")}

            INSTRUCTION: 
            Generate the NEW TOTAL STATE. Use "elements" to build the tool.
            
            ELEMENT TYPES:
            - "button": { "label": string, "color": hex }
            - "slider": { "label": string, "value": number }
            - "status": { "label": string, "value": string, "color": hex }
            - "text": { "content": string }

            REPLY ONLY IN JSON:
            {
              "ui": { "title": "...", "color": "hex", "icon": "emoji" },
              "elements": [ { "type": "...", "props": {...} } ],
              "chat_reply": "Verbal confirmation"
            }`
          }]
        }]
      };

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      const newState = JSON.parse(aiResponse.substring(jsonStart, jsonEnd + 1));

      setAppState(newState);
      setMessages(prev => [...prev, { sender: 'ai', content: newState.chat_reply }]);
      if(db) await addDoc(collection(db, "history"), { state: newState, timestamp: new Date().toISOString() });

    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', content: "Interface sync failed. Try re-phrasing." }]);
    } finally {
      setLoading(false);
    }
  };

  if(!config) return <SetupScreen onSave={(c) => { setConfig(c); try { const app = initializeApp(c.firebase); setDb(getFirestore(app)); } catch(e){} }} />;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* MANIFESTATION SPACE */}
        <div style={{ 
          background: '#0f172a', 
          padding: '24px', 
          borderRadius: '28px', 
          border: `1px solid ${appState.ui?.color || '#334155'}`, 
          boxShadow: `0 20px 40px -20px ${appState.ui?.color}66`,
          transition: 'all 0.5s ease' 
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: appState.ui?.color }}>
            {appState.ui?.icon} {appState.ui?.title}
          </h2>
          {appState.elements?.map((el, i) => (
            <AtomicElement key={i} type={el.type} props={el.props} onAction={(btn) => handleSend(`I clicked: ${btn}`)} />
          ))}
        </div>

        {/* CHAT LOG */}
        <div style={{ display:'flex', flexDirection:'column', gap: '12px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#1e40af' : '#1e293b', padding: '12px 16px', borderRadius: '18px', fontSize: '0.9rem', maxWidth: '85%' }}>
              {m.content}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '20px', background: '#020617', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder="Design a tool..." style={{ flex: 1, background: '#1e293b', border: 'none', borderRadius: '24px', padding: '14px 24px', color: 'white', outline: 'none' }} />
        <button onClick={() => handleSend(input)} style={{ background: '#6366f1', border: 'none', borderRadius: '50%', width: 52, height: 52, color: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '1.4rem' }}>{loading ? '⏳' : '🪄'}</button>
      </div>
    </div>
  );
}

export default App;

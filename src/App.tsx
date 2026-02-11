import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- THE LIQUID COMPONENT ENGINE ---
// This renders WHATEVER type the AI decides to manifest.
const AtomicElement = ({ type, props, onAction }) => {
  const baseStyle = { padding: '12px', borderRadius: '12px', marginBottom: '10px', width: '100%' };
  
  switch (type) {
    case 'button':
      return <button onClick={() => onAction(props.label)} style={{ ...baseStyle, background: props.color || '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold' }}>{props.label}</button>;
    case 'slider':
      return (
        <div style={baseStyle}>
          <label style={{display:'block', fontSize:'0.8rem', marginBottom:5}}>{props.label}: {props.value}</label>
          <input type="range" style={{width:'100%'}} value={props.value} readOnly />
        </div>
      );
    case 'status':
      return (
        <div style={{ ...baseStyle, background: '#1e293b', border: `1px solid ${props.color}`, display: 'flex', justifyContent: 'space-between' }}>
          <span>{props.label}</span>
          <span style={{ color: props.color, fontWeight: 'bold' }}>{props.value}</span>
        </div>
      );
    case 'text':
      return <p style={{ fontSize: '0.9rem', opacity: 0.8, padding: '0 5px' }}>{props.content}</p>;
    default:
      return null;
  }
};

// --- THE MANIFESTATION SPACE ---
const ManifestationSpace = ({ state, onAction }) => {
  if (!state) return null;
  return (
    <div style={{ 
      background: '#0f172a', 
      padding: '20px', 
      borderRadius: '28px', 
      border: `1px solid ${state.ui?.color || '#334155'}`, 
      boxShadow: `0 10px 30px -10px ${state.ui?.color}44`,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: state.ui?.color }}>
        {state.ui?.icon} {state.ui?.title}
      </h2>
      
      {state.elements?.map((el, i) => (
        <AtomicElement key={i} type={el.type} props={el.props} onAction={onAction} />
      ))}
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [config, setConfig] = useState(null);
  const [db, setDb] = useState(null);
  const [messages, setMessages] = useState([]);
  const [appState, setAppState] = useState({ ui: { title: "Liquid OS", color: "#3b82f6", icon: "💧" }, elements: [{ type: 'text', props: { content: "I am ready to manifest your intent." } }] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('liquid_config');
    if(saved) {
      const c = JSON.parse(saved);
      setConfig(c);
      try { const app = initializeApp(c.firebase); setDb(getFirestore(app)); } catch(e){}
    }
  }, []);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const newHistory = [...messages, { sender: 'user', content: text }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `SYSTEM: You are a Generative UI Engine. Text is not enough. You must build INTERFACES.
            
            CURRENT UI STATE: ${JSON.stringify(appState)}
            USER HISTORY: ${newHistory.map(m => `${m.sender}: ${m.content}`).join("\n")}

            YOUR TASK: 
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
              "chat_reply": "Short verbal confirmation"
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
      setMessages(prev => [...prev, { sender: 'ai', content: "Glitch in reality. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if(!config) return <div style={{color:'white', padding:20}}>Security Keys Required in LocalStorage.</div>;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        <ManifestationSpace state={appState} onAction={(btn) => handleSend(`I clicked the ${btn} button.`)} />

        <div style={{ display:'flex', flexDirection:'column', gap: '12px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#1e40af' : '#1e293b', padding: '12px 16px', borderRadius: '18px', fontSize: '0.9rem', maxWidth: '85%', border: m.sender === 'ai' ? '1px solid #334155' : 'none' }}>
              {m.content}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', background: '#020617', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder="Describe what you want to see..." style={{ flex: 1, background: '#1e293b', border: 'none', borderRadius: '24px', padding: '14px 24px', color: 'white', outline: 'none' }} />
        <button onClick={() => handleSend(input)} style={{ background: '#6366f1', border: 'none', borderRadius: '50%', width: 50, height: 50, color: 'white', fontSize: '1.2rem' }}>🪄</button>
      </div>
    </div>
  );
}

export default App;

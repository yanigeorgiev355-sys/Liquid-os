import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. THE DEFENSIVE ENGINE (v6.3)
// ==========================================

// A. SAFE ATOM WRAPPER (Prevents White Screens)
const SafeAtom = ({ atom, data, onAction, index }: any) => {
  try {
    if (!atom) return null;
    const props = atom.props || {};

    // 🛡️ DATA BINDING (CRASH PROOF)
    // We force everything to String() before calling .replace()
    // This fixes the "Number.replace is not a function" crash.
    let displayValue = props.value;
    
    if (displayValue !== undefined && displayValue !== null) {
       const strValue = String(displayValue); // FORCE STRING
       if (strValue.includes('{')) {
          displayValue = strValue.replace(/\{([^}]+)\}/g, (match, key) => {
             const val = data[key];
             if (val === undefined) return match;
             if (typeof val === 'object') return JSON.stringify(val);
             return String(val);
          });
       }
    }

    // 🛡️ SCRIPT FINDER
    const script = atom.script || atom.action || props.script || props.action;

    switch (atom.type) {
      case 'hero':
        return (
          <div className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
            <h2 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">{props.label}</h2>
            <div className="text-5xl font-black text-white truncate" style={{ color: props.color || '#fff' }}>
              {displayValue}
            </div>
          </div>
        );
      case 'button':
        return (
          <button
            onClick={() => onAction(script)}
            className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: props.color || '#3b82f6' }}
          >
            {props.label}
          </button>
        );
      case 'box':
        return (
          <div className={`flex gap-3 ${props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
             {/* Recursive calls are safe because AtomRender handles the map */}
             <AtomRender layout={props.children} onAction={onAction} data={data} />
          </div>
        );
      case 'input':
         return (
           <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
             <label className="text-xs text-slate-500 uppercase font-bold block mb-1">{props.label}</label>
             <input className="bg-transparent w-full text-white outline-none" placeholder={props.placeholder} />
           </div>
         );
      case 'text':
        return <p className="text-slate-400 text-center text-sm">{props.label}</p>;
      default:
        return null;
    }
  } catch (err) {
    // 🛡️ IF A COMPONENT CRASHES, RENDER THIS INSTEAD OF WHITE SCREEN
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 text-xs p-2 rounded">
        ⚠️ Render Error in Atom #{index}
      </div>
    );
  }
};

const AtomRender = ({ layout, onAction, data }: { layout: any[], onAction: any, data: any }) => {
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {layout.map((atom, index) => (
        // Key is index to ensure re-render if order changes
        <SafeAtom key={index} index={index} atom={atom} data={data} onAction={onAction} />
      ))}
    </div>
  );
};

// ==========================================
// 2. SYSTEM CONFIG
// ==========================================
const SYSTEM_CONFIG = {
  modelName: "gemini-2.5-flash",
  storageKey: "liquid_os_v6_3_defensive", // New Key -> Fresh Start
  apiVersion: "v1beta"
};

const SYSTEM_PROMPT = `
You are Liquid OS.
Reply with JSON only.

Logic Protocol:
1. "state": Define initial variables (e.g., {"balance": 1000}).
2. "script": For buttons, define the logic.
   - {"cmd": "add", "key": "balance", "val": 100}
   - {"cmd": "subtract", "key": "balance", "val": 50}

Example:
{
  "chat": "Bank account created.",
  "tool": {
    "state": { "balance": 1000 },
    "layout": [
      { "type": "hero", "props": { "label": "Balance", "value": "${balance}" } },
      { "type": "button", "props": { "label": "Deposit $100" }, "script": { "cmd": "add", "key": "balance", "val": 100 } }
    ]
  }
}
`;

// ==========================================
// 3. MAIN APP
// ==========================================
export default function App() {
  const [config, setConfig] = useState<any>(null);
  const [setupMode, setSetupMode] = useState(true);
  const [history, setHistory] = useState<any[]>([{ role: 'ai', text: 'Defensive Mode Online.' }]);
  
  const [activeTool, setActiveTool] = useState<any[] | null>(null);
  const [toolData, setToolData] = useState<any>({}); 
  const [debugJson, setDebugJson] = useState<string>(""); 
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_CONFIG.storageKey);
      if (saved) {
        setConfig(JSON.parse(saved));
        setSetupMode(false);
      }
    } catch (e) {
      localStorage.removeItem(SYSTEM_CONFIG.storageKey);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSave = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newConfig = { geminiKey: fd.get('geminiKey'), userName: fd.get('userName') };
    localStorage.setItem(SYSTEM_CONFIG.storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
    setSetupMode(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput("");
    setHistory(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${SYSTEM_CONFIG.apiVersion}/models/${SYSTEM_CONFIG.modelName}:generateContent?key=${config.geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: SYSTEM_PROMPT + `\n\nUSER: ${userText}` }]
            }]
          })
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      setDebugJson(cleanJson);

      let payload;
      try {
        payload = JSON.parse(cleanJson);
      } catch (e) {
        throw new Error("Invalid JSON from AI");
      }

      setHistory(prev => [...prev, { role: 'ai', text: payload.chat || "Done." }]);
      
      if (payload.tool && Array.isArray(payload.tool.layout)) {
        setActiveTool(payload.tool.layout);
        setToolData(payload.tool.state || {});
      }

    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleScript = (script: any) => {
    if (!script) return alert("Button has no script!");
    
    // 1. Text Logic (e.g. "increment")
    if (typeof script === 'string') {
       if (script.toLowerCase().includes('add') || script.toLowerCase().includes('increment')) {
          const key = Object.keys(toolData)[0];
          if(key) {
             setToolData((p: any) => ({ ...p, [key]: Number(p[key]) + 1 }));
             return;
          }
       }
       return alert("Unknown action: " + script);
    }

    // 2. JSON Logic
    const { cmd, key, val } = script;
    if (!key) return alert("Script missing 'key'");

    setToolData((prev: any) => {
      const newState = { ...prev };
      const currentVal = Number(newState[key] || 0);
      const changeVal = Number(val);

      if (cmd === 'add') newState[key] = currentVal + changeVal;
      if (cmd === 'subtract') newState[key] = currentVal - changeVal;
      if (cmd === 'set') newState[key] = changeVal;

      return newState;
    });
  };

  // 🖥️ RENDER: SETUP
  if (setupMode) return (
    <div className="h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800">
        <h1 className="text-xl font-bold mb-4">Liquid OS <span className="text-blue-500">Defense</span></h1>
        <input name="userName" placeholder="Name" className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-2" />
        <input name="geminiKey" type="password" placeholder="Gemini Key" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-4" />
        <button className="w-full bg-blue-600 p-3 rounded font-bold">Start System</button>
      </form>
    </div>
  );

  // 🖥️ RENDER: MAIN
  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-green-400">v6.3</span></h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-red-500">Factory Reset</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-4">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500 animate-pulse">Designing...</div>}
        <div ref={chatEndRef} />
      </div>

      {activeTool && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto z-10">
          <div className="flex justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Tool</span>
            <button onClick={() => setActiveTool(null)} className="text-slate-500">✕</button>
          </div>
          <AtomRender layout={activeTool} onAction={handleScript} data={toolData} />
          
          <details className="mt-8 pt-4 border-t border-slate-800">
            <summary className="text-xs text-slate-600 cursor-pointer">Debug JSON</summary>
            <pre className="text-[10px] text-slate-500 mt-2 overflow-x-auto">{debugJson}</pre>
          </details>
        </div>
      )}

      <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 z-20">
        <input 
          value={input} onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Command..." className="flex-1 bg-slate-800 p-3 rounded-xl outline-none" 
        />
        <button onClick={handleSend} className="bg-blue-600 px-4 rounded-xl font-bold">↑</button>
      </div>
    </div>
  );
}

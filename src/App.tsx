import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. THE ATOMIC ENGINE (UI LAYER)
// ==========================================
const AtomRender = ({ layout, onAction, data }: { layout: any[], onAction: any, data: any }) => {
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {layout.map((atom, index) => {
        if (!atom) return null;
        const props = atom.props || {};
        
        // 🔮 DATA BINDING: Replace "{var_name}" with actual data
        let displayValue = props.value;
        if (typeof displayValue === 'string' && displayValue.startsWith('{') && displayValue.endsWith('}')) {
          const varName = displayValue.slice(1, -1); // remove { }
          displayValue = data[varName] !== undefined ? data[varName] : '...';
        }

        switch (atom.type) {
          case 'hero':
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
                <h2 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">{props.label}</h2>
                <div className="text-5xl font-black text-white" style={{ color: props.color || '#fff' }}>
                  {displayValue}
                </div>
              </div>
            );
          case 'button':
            return (
              <button
                key={index}
                // Pass the ENTIRE script to the handler
                onClick={() => onAction(atom.script)} 
                className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: props.color || '#3b82f6' }}
              >
                {props.label}
              </button>
            );
          case 'box':
            return (
              <div key={index} className={`flex gap-3 ${props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
                <AtomRender layout={props.children} onAction={onAction} data={data} />
              </div>
            );
          case 'input':
             return (
               <div key={index} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                 <label className="text-xs text-slate-500 uppercase font-bold block mb-1">{props.label}</label>
                 <input className="bg-transparent w-full text-white outline-none" placeholder={props.placeholder} />
               </div>
             );
          case 'text':
            return <p key={index} className="text-slate-400 text-center text-sm">{props.label}</p>;
          default:
            return null;
        }
      })}
    </div>
  );
};

// ==========================================
// 2. THE SYSTEM CONFIG
// ==========================================
const SYSTEM_CONFIG = {
  modelName: "gemini-2.5-flash",
  storageKey: "liquid_os_v6_universal", // New Key for Universal Logic
  apiVersion: "v1beta"
};

const SYSTEM_PROMPT = `
You are Liquid OS.
Reply with JSON only.

Logic Protocol:
1. "state": Define the initial variables (e.g., {"score": 0, "money": 100}).
2. "script": For buttons, define HOW to change the state.
   - {"cmd": "add", "key": "score", "val": 1}
   - {"cmd": "subtract", "key": "money", "val": 50}
   - {"cmd": "set", "key": "status", "val": "Active"}

Example Output:
{
  "chat": "I built a scoreboard.",
  "tool": {
    "state": { "home": 0, "away": 0 },
    "layout": [
      { "type": "hero", "props": { "label": "Home", "value": "{home}" } },
      { "type": "button", "props": { "label": "Goal!", "color": "blue" }, "script": { "cmd": "add", "key": "home", "val": 1 } }
    ]
  }
}
`;

// ==========================================
// 3. THE APP (BRAIN + UNIVERSAL LOGIC)
// ==========================================
export default function App() {
  const [config, setConfig] = useState<any>(null);
  const [setupMode, setSetupMode] = useState(true);
  const [history, setHistory] = useState<any[]>([{ role: 'ai', text: 'Universal Logic Engine Online.' }]);
  
  // 🧠 UNIVERSAL STATE (Can hold water, money, score, anything)
  const [activeTool, setActiveTool] = useState<any[] | null>(null);
  const [toolData, setToolData] = useState<any>({}); 
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🚀 BOOT
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
      const payload = JSON.parse(cleanJson);

      setHistory(prev => [...prev, { role: 'ai', text: payload.chat || "Done." }]);
      
      // 🛡️ MOUNT TOOL + INITIAL STATE
      if (payload.tool && Array.isArray(payload.tool.layout)) {
        setActiveTool(payload.tool.layout);
        // Initialize the tool's specific memory (e.g., { water: 0 } or { bank: 1000 })
        setToolData(payload.tool.state || {});
      }

    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ UNIVERSAL LOGIC HANDLER (The "Interpreter")
  // This is the code that replaces all the "if water / if coffee" checks.
  const handleScript = (script: any) => {
    if (!script) return alert("No script attached to this button.");
    
    const { cmd, key, val } = script;

    setToolData((prev: any) => {
      const newState = { ...prev };
      const currentVal = newState[key] || 0;

      // The 3 Universal Commands
      if (cmd === 'add') newState[key] = Number(currentVal) + Number(val);
      if (cmd === 'subtract') newState[key] = Number(currentVal) - Number(val);
      if (cmd === 'set') newState[key] = val;

      return newState;
    });
  };

  if (setupMode) return (
    <div className="h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800">
        <h1 className="text-xl font-bold mb-4">Liquid OS <span className="text-blue-500">Universal</span></h1>
        <input name="userName" placeholder="Name" className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-2" />
        <input name="geminiKey" type="password" placeholder="Gemini Key" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-4" />
        <button className="w-full bg-blue-600 p-3 rounded font-bold">Start System</button>
      </form>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-purple-400">v6.0</span></h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-red-500">Reset</button>
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
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto z-10">
          <div className="flex justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Tool</span>
            <button onClick={() => setActiveTool(null)} className="text-slate-500">✕</button>
          </div>
          {/* We pass the 'toolData' (State) and 'handleScript' (Logic) to the renderer */}
          <AtomRender layout={activeTool} onAction={handleScript} data={toolData} />
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

import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. THE ATOMIC ENGINE (Moved inside to prevent import errors)
// ==========================================
const AtomRender = ({ layout, onAction }: { layout: any[], onAction: any }) => {
  // 🛡️ CRASH PROTECTION: If layout is not a list, stop rendering immediately.
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {layout.map((atom, index) => {
        if (!atom) return null;
        const props = atom.props || {};
        // 🛡️ ACTION FINDER: Look everywhere
        const actionId = atom.action || props.action || props.action_id || 'unknown';

        switch (atom.type) {
          case 'hero':
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
                <h2 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">{props.label || 'Metric'}</h2>
                <div className="text-5xl font-black text-white" style={{ color: props.color || '#fff' }}>
                  {props.value || '--'}
                </div>
              </div>
            );
          case 'button':
            return (
              <button
                key={index}
                onClick={() => onAction(actionId)}
                className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: props.color || '#3b82f6' }}
              >
                {props.label || 'Action'}
              </button>
            );
          case 'box':
            return (
              <div key={index} className={`flex gap-3 ${props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
                <AtomRender layout={props.children} onAction={onAction} />
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
  storageKey: "liquid_os_v5_nuclear", // New Key = Fresh Start
  apiVersion: "v1beta"
};

const SYSTEM_PROMPT = `
You are Liquid OS.
Reply with JSON only.
Format:
{
  "chat": "Your reply here",
  "tool": {
    "layout": [
      { "type": "hero", "props": { "label": "Count", "value": "{count}" } },
      { "type": "button", "props": { "label": "+1", "color": "green" }, "action": "increment" }
    ]
  }
}
`;

// ==========================================
// 3. THE APP (BRAIN)
// ==========================================
export default function App() {
  const [config, setConfig] = useState<any>(null);
  const [setupMode, setSetupMode] = useState(true);
  const [history, setHistory] = useState<any[]>([{ role: 'ai', text: 'System Online.' }]);
  const [activeTool, setActiveTool] = useState<any[] | null>(null);
  const [toolData, setToolData] = useState({ count: 0 });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🚀 BOOT & RECOVERY
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_CONFIG.storageKey);
      if (saved) {
        setConfig(JSON.parse(saved));
        setSetupMode(false);
      }
    } catch (e) {
      console.error("Corrupted Storage. Wiping.");
      localStorage.removeItem(SYSTEM_CONFIG.storageKey);
    }
  }, []);

  // 📜 AUTO SCROLL
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
      // 🛡️ SAFE FETCH
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
      
      // 🛡️ SAFE TOOL MOUNTING
      if (payload.tool && Array.isArray(payload.tool.layout)) {
        setActiveTool(payload.tool.layout);
        setToolData({ count: 0 });
      }

    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  // 💉 DATA INJECTION (Prevent Crash)
  const injectData = (nodes: any[]): any[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map(node => {
      const newNode = { ...node, props: { ...node.props } };
      if (newNode.props.value === "{count}") newNode.props.value = toolData.count;
      if (newNode.props.children) newNode.props.children = injectData(newNode.props.children);
      return newNode;
    });
  };

  const handleAction = (id: string) => {
    if (id === 'increment') setToolData(p => ({ ...p, count: p.count + 1 }));
    else if (id === 'decrement') setToolData(p => ({ ...p, count: p.count - 1 }));
    else alert("Action: " + id);
  };

  // 🖥️ RENDER SETUP
  if (setupMode) return (
    <div className="h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800">
        <h1 className="text-xl font-bold mb-4">Liquid OS <span className="text-blue-500">Recovery</span></h1>
        <input name="userName" placeholder="Name" className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-2" />
        <input name="geminiKey" type="password" placeholder="Gemini Key" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-4" />
        <button className="w-full bg-blue-600 p-3 rounded font-bold">Start System</button>
      </form>
    </div>
  );

  // 🖥️ RENDER MAIN
  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-green-500">v5.0</span></h1>
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
        {loading && <div className="text-xs text-slate-500 animate-pulse">Computing...</div>}
        <div ref={chatEndRef} />
      </div>

      {activeTool && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto z-10">
          <div className="flex justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Tool</span>
            <button onClick={() => setActiveTool(null)} className="text-slate-500">✕</button>
          </div>
          <AtomRender layout={injectData(activeTool)} onAction={handleAction} />
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

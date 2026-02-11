import React, { useState, useEffect, useRef } from 'react';
import { AtomRender } from './components/AtomRender';

// ==========================================
// ⚙️ SYSTEM SETTINGS
// ==========================================
const SYSTEM_CONFIG = {
  modelName: "gemini-2.5-flash",
  storageKey: "liquid_os_config_v4_hybrid", // Updated version
  apiVersion: "v1beta"
};

// 🧠 HYBRID PROTOCOL: Text + UI
const SYSTEM_PROMPT = `
You are Liquid OS. You are a helpful AI Assistant that can build interfaces.
When a user asks for something, you must reply with a JSON object containing:
1. "chat": A friendly, short response to the user.
2. "tool": (Optional) A UI definition if a tool is needed.

AVAILABLE ATOMS:
- hero (props: label, value, color)
- button (props: label, color, action_id)
- input (props: label, placeholder)
- text (props: label)
- box (props: direction, children=[])

EXAMPLE JSON:
{
  "chat": "I have created a counter for you.",
  "tool": {
    "tool_id": "counter",
    "layout": [
      { "type": "hero", "props": { "label": "Count", "value": "{count}" } },
      { "type": "button", "props": { "label": "+1" }, "action": "increment" }
    ]
  }
}
`;

interface UserConfig {
  geminiKey: string;
  userName: string;
}

interface Message {
  role: 'user' | 'ai';
  text?: string;
  tool?: any; // The UI Payload
}

function App() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [setupMode, setSetupMode] = useState(true);
  
  // 📜 CHAT HISTORY + TOOL STATE
  const [history, setHistory] = useState<Message[]>([
    { role: 'ai', text: 'Liquid OS Online. I can build tools for you.' }
  ]);
  const [activeTool, setActiveTool] = useState<any>(null); // The currently displayed tool
  const [toolData, setToolData] = useState({ count: 0 }); // Live Data
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    const saved = localStorage.getItem(SYSTEM_CONFIG.storageKey);
    if (saved) {
      setConfig(JSON.parse(saved));
      setSetupMode(false);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const newConfig = {
      geminiKey: fd.get('geminiKey') as string,
      userName: fd.get('userName') as string || 'Architect',
    };
    if (!newConfig.geminiKey) return alert("Key Required");
    localStorage.setItem(SYSTEM_CONFIG.storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
    setSetupMode(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !config) return;
    
    // 1. Add User Message to Chat
    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/${SYSTEM_CONFIG.apiVersion}/models/${SYSTEM_CONFIG.modelName}:generateContent?key=${config.geminiKey}`;

      // 🧠 CONTEXT WINDOW: We send the last few messages so it remembers
      const context = history.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + `\n\nHISTORY:\n${context}\n\nUser: ${userMsg}` }]
          }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("AI Silent");

      // 🧹 SNIPER
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const payload = JSON.parse(cleanJson);
      
      // 2. Add AI Response to Chat
      setHistory(prev => [...prev, { role: 'ai', text: payload.chat }]);

      // 3. Mount Tool (If exists)
      if (payload.tool) {
        setActiveTool(payload.tool.layout);
        setToolData({ count: 0 }); // Reset data for new tool
      }

    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ LOGIC ENGINE
  const handleAction = (id: string) => {
    if (id === 'increment') setToolData(p => ({ ...p, count: p.count + 1 }));
    else if (id === 'decrement') setToolData(p => ({ ...p, count: p.count - 1 }));
    else alert(`Action: ${id}`);
  };

  // 💉 DATA INJECTOR
  const renderWithData = (nodes: any[]): any[] => {
    return nodes.map(node => {
      const newNode = { ...node, props: { ...node.props } };
      if (newNode.props.value === "{count}") newNode.props.value = toolData.count;
      if (newNode.props.children) newNode.props.children = renderWithData(newNode.props.children);
      return newNode;
    });
  };

  if (setupMode) return <div className="p-10 bg-slate-900 text-white">Setup Mode...</div>;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. TOP BAR */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-10">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-blue-400">Hybrid</span></h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-slate-500">Reset</button>
      </div>

      {/* 2. SPLIT VIEW: Chat (Top) + Tool (Bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* A. CHAT SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-slate-500 text-xs animate-pulse">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* B. ACTIVE TOOL OVERLAY (The "Liquid" Part) */}
        {activeTool && (
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-4 rounded-t-3xl shadow-2xl transition-all duration-300 max-h-[50vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs uppercase text-slate-400 tracking-wider">Active Tool</span>
              <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <AtomRender layout={renderWithData(activeTool)} onAction={handleAction} />
          </div>
        )}

      </div>

      {/* 3. INPUT AREA */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2 z-20">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Chat or request a tool..." 
          className="flex-1 bg-slate-800 p-3 rounded-xl outline-none focus:ring-1 ring-blue-500"
        />
        <button onClick={handleSend} disabled={loading} className="bg-blue-600 px-4 rounded-xl font-bold">
          ↑
        </button>
      </div>
    </div>
  );
}

export default App;

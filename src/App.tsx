import React, { useState, useEffect, useRef } from 'react';
import { AtomRender } from './components/AtomRender';

// ==========================================
// ⚙️ SYSTEM SETTINGS
// ==========================================
const SYSTEM_CONFIG = {
  modelName: "gemini-2.5-flash",
  storageKey: "liquid_os_config_v4_hybrid",
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
  tool?: any; 
}

function App() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [setupMode, setSetupMode] = useState(true);
  
  // 📜 CHAT HISTORY + TOOL STATE
  const [history, setHistory] = useState<Message[]>([
    { role: 'ai', text: 'Liquid OS Online. I can build tools for you.' }
  ]);
  const [activeTool, setActiveTool] = useState<any>(null); 
  const [toolData, setToolData] = useState({ count: 0 }); 
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
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
    
    // 1. User Message
    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const url = `https://generativelanguage.googleapis.com/${SYSTEM_CONFIG.apiVersion}/models/${SYSTEM_CONFIG.modelName}:generateContent?key=${config.geminiKey}`;

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
      
      // Error check
      if (data.error) throw new Error(data.error.message);

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("AI Silent");

      // 🧹 SNIPER
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let payload;
      try {
        payload = JSON.parse(cleanJson);
      } catch (e) {
        // Fallback if AI just talks text without JSON
        payload = { chat: cleanJson };
      }
      
      // 2. AI Response
      setHistory(prev => [...prev, { role: 'ai', text: payload.chat }]);

      // 3. Mount Tool
      if (payload.tool) {
        setActiveTool(payload.tool.layout);
        setToolData({ count: 0 }); 
      }

    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id: string) => {
    if (id === 'increment') setToolData(p => ({ ...p, count: p.count + 1 }));
    else if (id === 'decrement') setToolData(p => ({ ...p, count: p.count - 1 }));
    else alert(`Action: ${id}`);
  };

  const renderWithData = (nodes: any[]): any[] => {
    return nodes.map(node => {
      const newNode = { ...node, props: { ...node.props } };
      if (newNode.props.value === "{count}") newNode.props.value = toolData.count;
      if (newNode.props.children) newNode.props.children = renderWithData(newNode.props.children);
      return newNode;
    });
  };

  // 🖥️ RESTORED SETUP SCREEN
  if (setupMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <form onSubmit={handleSave} className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl">
          <h1 className="text-xl font-bold mb-4 text-center">Liquid OS <span className="text-blue-500">Login</span></h1>
          <div className="mb-4">
             <label className="text-xs text-slate-400">Your Name</label>
             <input name="userName" placeholder="Architect" className="w-full bg-slate-800 p-3 rounded border border-slate-700 mt-1" />
          </div>
          <div className="mb-6">
             <label className="text-xs text-slate-400">Gemini API Key</label>
             <input name="geminiKey" type="password" placeholder="AIza..." required className="w-full bg-slate-800 p-3 rounded border border-slate-700 mt-1" />
          </div>
          <button className="w-full bg-blue-600 p-3 rounded font-bold hover:bg-blue-500 transition-colors">Initialize System</button>
        </form>
      </div>
    );
  }

  // 🖥️ MAIN UI
  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-10">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-blue-400">Hybrid</span></h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-slate-500 hover:text-red-400">Reset</button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-slate-500 text-xs animate-pulse ml-2">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* TOOL DRAWER */}
        {activeTool && (
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-4 rounded-t-3xl shadow-2xl transition-all duration-300 max-h-[50vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <span className="text-xs uppercase text-slate-400 tracking-wider font-bold">Generated Tool</span>
              <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white px-2">✕</button>
            </div>
            <AtomRender layout={renderWithData(activeTool)} onAction={handleAction} />
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2 z-20">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Describe a tool..." 
          className="flex-1 bg-slate-800 p-3 rounded-xl outline-none focus:ring-1 ring-blue-500 text-white"
        />
        <button onClick={handleSend} disabled={loading} className="bg-blue-600 px-4 rounded-xl font-bold text-white">
          ↑
        </button>
      </div>
    </div>
  );
}

export default App;

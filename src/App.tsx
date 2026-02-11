import React, { useState, useEffect } from 'react';
import { AtomRender } from './components/AtomRender';

// ==========================================
// ⚙️ SYSTEM SETTINGS (CONTROL PANEL)
// Change these values to update the system
// ==========================================
const SYSTEM_CONFIG = {
  modelName: "gemini-2.5-flash", // 🟢 Your proven model
  storageKey: "liquid_os_config_v3",
  apiVersion: "v1beta"
};

// ==========================================
// 🧠 THE BRAIN DEFINITION
// ==========================================
const SYSTEM_PROMPT = `
You are Liquid OS. You do NOT speak text. You speak JSON.
User input will be a request for a tool.
You must return a JSON object describing a UI using ONLY these atoms:
- hero (props: label, value, color)
- button (props: label, color, action_id)
- input (props: label, placeholder)
- text (props: label)
- box (props: direction, children=[])

EXAMPLE JSON:
{
  "tool_id": "example",
  "layout": [
    { "type": "text", "props": { "label": "Hello World" } }
  ]
}

Respond ONLY with raw JSON. No markdown formatting.
`;

// 📐 TYPES
interface UserConfig {
  geminiKey: string;
  userName: string;
}

function App() {
  // 🔒 STATE
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [setupMode, setSetupMode] = useState(true);
  const [uiState, setUiState] = useState([
    { type: 'hero', props: { label: 'Liquid OS', value: 'Ready', color: '#64748b' } },
    { type: 'text', props: { label: `Running on ${SYSTEM_CONFIG.modelName}` } }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚀 BOOT
  useEffect(() => {
    const saved = localStorage.getItem(SYSTEM_CONFIG.storageKey);
    if (saved) {
      setConfig(JSON.parse(saved));
      setSetupMode(false);
    }
  }, []);

  // 💾 SAVE CONFIG
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

  // 🧠 MANIFEST (THE API CALL)
  const handleManifest = async () => {
    if (!input.trim() || !config) return;
    setLoading(true);

    try {
      // 🟢 DYNAMIC URL CONSTRUCTION
      const url = `https://generativelanguage.googleapis.com/${SYSTEM_CONFIG.apiVersion}/models/${SYSTEM_CONFIG.modelName}:generateContent?key=${config.geminiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + `\n\nUser: ${input}` }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("AI Silent");

      // 🧹 SNIPER
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const blueprint = JSON.parse(cleanJson);
      
      if (blueprint.layout) setUiState(blueprint.layout);

    } catch (e: any) {
      alert(`Error (${SYSTEM_CONFIG.modelName}): ${e.message}`);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // ⚡ ACTION HANDLER
  const handleAction = (id: string) => {
    alert(`⚡ Action: ${id}\n(Simulated Database Write)`);
  };

  // 🖥️ RENDER SETUP
  if (setupMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <form onSubmit={handleSave} className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800">
          <h1 className="text-xl font-bold mb-4">Liquid OS <span className="text-blue-500">Setup</span></h1>
          <input name="userName" placeholder="Your Name" className="w-full bg-slate-800 p-3 rounded mb-3 border border-slate-700" />
          <input name="geminiKey" type="password" placeholder="Gemini API Key" required className="w-full bg-slate-800 p-3 rounded mb-4 border border-slate-700" />
          <button className="w-full bg-blue-600 p-3 rounded font-bold">Initialize</button>
        </form>
      </div>
    );
  }

  // 🖥️ RENDER MAIN
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <h1 className="font-bold">LIQUID OS <span className="text-xs text-green-500">{SYSTEM_CONFIG.modelName}</span></h1>
        <button onClick={() => { localStorage.removeItem(SYSTEM_CONFIG.storageKey); window.location.reload(); }} className="text-xs text-slate-500">Reset</button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <AtomRender layout={uiState} onAction={handleAction} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleManifest()}
          placeholder="Command..." 
          className="flex-1 bg-slate-800 p-3 rounded-xl outline-none focus:ring-1 ring-blue-500"
        />
        <button onClick={handleManifest} disabled={loading} className="bg-blue-600 px-4 rounded-xl font-bold">
          {loading ? "..." : "Go"}
        </button>
      </div>
    </div>
  );
}

export default App;

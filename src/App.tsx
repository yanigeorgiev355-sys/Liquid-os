import React, { useState, useEffect } from 'react';
import { AtomRender } from './components/AtomRender';

// 🛡️ CONSTANTS
const STORAGE_KEY = 'liquid_os_config_v1';

// ⚙️ TYPES (The Shape of our Settings)
interface SystemConfig {
  geminiKey: string;
  firebaseConfig?: any; // Prepared for future
  userName: string;
}

// 🤖 THE SYSTEM PROMPT (The "Soul" definition)
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

function App() {
  // 🔒 SECURITY STATE
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [setupMode, setSetupMode] = useState(true);

  // 🧠 APP STATE
  const [uiState, setUiState] = useState([
    { type: 'hero', props: { label: 'Liquid OS', value: 'Standby', color: '#64748b' } },
    { type: 'text', props: { label: 'Waiting for instructions...' } }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚀 BOOT SEQUENCE
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
      setSetupMode(false);
    }
  }, []);

  // 💾 SAVE SETTINGS
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newConfig = {
      geminiKey: formData.get('geminiKey') as string,
      userName: formData.get('userName') as string || 'User',
    };
    
    if (!newConfig.geminiKey) return alert("API Key is required");
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
    setSetupMode(false);
  };

  // 🧠 THE BRAIN (Gemini Connection)
  const handleManifest = async () => {
    if (!input.trim() || !config) return;
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: SYSTEM_PROMPT + `\n\nUser Context: Name is ${config.userName}\nUser Request: ` + input }]
            }]
          })
        }
      );

      const data = await response.json();
      
      // Error Handling for Invalid Keys
      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("AI returned empty response");

      // 🧹 CLEANER: Sniper for JSON
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const newBlueprint = JSON.parse(cleanJson);
      
      if (newBlueprint.layout) {
        setUiState(newBlueprint.layout);
      }

    } catch (e: any) {
      alert(`Manifest Error: ${e.message}`);
      // If key is bad, offer to reset
      if (e.message.includes("API_KEY")) {
        if(confirm("API Key appears invalid. Reset settings?")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // ⚡ ACTION HANDLER (Fixed Logic)
  const handleAction = (actionId: string, value?: any) => {
    console.log(`Action Triggered: ${actionId}`);
    
    // 🟢 GENERIC FEEDBACK (Works for 250ml, 500ml, or anything else)
    alert(`⚡ SYSTEM ACTION: ${actionId}\n(Database Write Pending...)`);
  };

  // 🖥️ RENDER: SETUP SCREEN
  if (setupMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <form onSubmit={handleSaveConfig} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Liquid OS <span className="text-blue-500">Setup</span></h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Your Name</label>
              <input name="userName" placeholder="Architect" className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Gemini API Key</label>
              <input name="geminiKey" type="password" required placeholder="AIza..." className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 focus:border-blue-500 outline-none" />
              <p className="text-xs text-slate-500 mt-2">
                Keys are stored locally on your device. Never shared.
              </p>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold transition-all mt-4">
              Initialize System
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 🖥️ RENDER: MAIN OS
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight">LIQUID OS <span className="text-xs text-blue-500">v3.1</span></h1>
        <button 
          onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
          className="text-xs text-slate-500 hover:text-red-400"
        >
          Reset Keys
        </button>
      </div>

      {/* DYNAMIC INTERFACE */}
      <div className="flex-1 overflow-y-auto pb-24">
        <AtomRender layout={uiState} onAction={handleAction} />
      </div>

      {/* INPUT FIELD */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManifest()}
          placeholder={`Command the OS, ${config?.userName}...`}
          className="flex-1 bg-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          onClick={handleManifest}
          disabled={loading}
          className="bg-blue-600 px-6 rounded-xl font-bold disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? "⚡" : "Go"}
        </button>
      </div>

    </div>
  );
}

export default App;

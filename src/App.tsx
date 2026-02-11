import React, { useState } from 'react';
import { AtomRender } from './components/AtomRender';

// 🧪 MOCK BRAIN: This simulates what Gemini sends us
const TEST_BLUEPRINT = [
  { type: 'hero', props: { label: 'Daily Water Goal', value: '750ml / 3000ml', color: '#60a5fa' } },
  { type: 'box', props: { direction: 'row', children: [
      { type: 'button', props: { label: '+250ml Cup', color: '#2563eb' }, action: 'add_250' },
      { type: 'button', props: { label: '+500ml Bottle', color: '#1d4ed8' }, action: 'add_500' }
    ]}
  },
  { type: 'text', props: { label: 'Keep hydrated to maintain peak cognitive function.' } }
];

function App() {
  const [uiState, setUiState] = useState(TEST_BLUEPRINT);

  // The "Nerve Center" - This handles ALL clicks from ANY atom
  const handleAction = (actionId: string, value?: any) => {
    console.log(`⚡ Action Triggered: ${actionId}`);
    
    // TEMPORARY LOGIC: Just to prove it's alive
    if (actionId === 'add_250') {
      alert("🌊 Splash! Added 250ml (Logic not connected yet)");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      
      {/* HEADER */}
      <div className="mb-8 text-center border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight">LIQUID OS <span className="text-xs text-blue-500">v3.0</span></h1>
      </div>

      {/* THE ATOMIC ENGINE */}
      <AtomRender layout={uiState} onAction={handleAction} />

      {/* DEBUG CONSOLE (Visual proof for you) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 text-xs font-mono text-slate-500 border-t border-slate-800">
        Status: Atom Engine Online. Waiting for Gemini...
      </div>
    </div>
  );
}

export default App;

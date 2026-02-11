import React, { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyAhhB16FzCUJtjfEmB7llffOgdavtEOQMU"; 

function App() {
  const [logs, setLogs] = useState("Initializing Diagnostics...\n");

  const log = (text) => setLogs(prev => prev + "\n" + text);

  useEffect(() => {
    const runDiagnostics = async () => {
      log("1. Checking Internet...");
      if (!navigator.onLine) { log("ERROR: Device is offline."); return; }
      log("OK.");

      log("2. Pinging Google API for Model List...");
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        
        if (!response.ok) {
          const errText = await response.text();
          log(`HTTP ERROR: ${response.status}`);
          log(`Details: ${errText}`);
          return;
        }

        const data = await response.json();
        log("SUCCESS! Connection Established.");
        log("\n--- AVAILABLE MODELS FOR YOU ---");
        
        if (data.models) {
          data.models.forEach(m => {
            // Only show models that support generating content
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
              log(`✅ ${m.name.replace('models/', '')}`);
            }
          });
        } else {
          log("WARNING: Model list is empty.");
        }

      } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`);
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div style={{ background: '#0f172a', color: '#33ff00', fontFamily: 'monospace', padding: '20px', height: '100vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
      <h1 style={{ color: 'white', borderBottom: '1px solid #333' }}>SYSTEM DIAGNOSTICS</h1>
      {logs}
    </div>
  );
}

export default App;

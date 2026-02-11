// ... (Previous imports and SetupScreen remain the same) ...

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
          text: `SYSTEM: You are the Soul of Liquid OS. 
          
          LAYER 1 (CONVERSATION): Talk to the user naturally. Be proactive. If they mention a task, offer to build a tool for it.
          
          LAYER 2 (MANIFESTATION): After you decide what to say, you MUST generate a complete, high-fidelity interface that reflects the current state of the conversation. 
          - If the user is vague, build an ADVANCED prototype based on your best guess.
          - Use colors, icons, and multiple elements (buttons, sliders, status) to make it feel like a professional app.

          REPLY ONLY IN THIS JSON FORMAT:
          {
            "chat_reply": "Your verbal response to the user here.",
            "ui": { "title": "...", "color": "hex", "icon": "emoji" },
            "elements": [ 
              { "type": "status", "props": {"label": "...", "value": "...", "color": "..."} },
              { "type": "button", "props": {"label": "...", "color": "..."} },
              { "type": "slider", "props": {"label": "...", "value": 0} }
            ]
          }`
        }]
      }]
    };

    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Sniper for the JSON
    const jsonStart = aiResponse.indexOf('{');
    const jsonEnd = aiResponse.lastIndexOf('}');
    const newState = JSON.parse(aiResponse.substring(jsonStart, jsonEnd + 1));

    // Update the "Body" (The UI) and the "Voice" (The Chat) simultaneously
    setAppState(newState);
    setMessages(prev => [...prev, { sender: 'ai', content: newState.chat_reply }]);
    
    if(db) await addDoc(collection(db, "history"), { state: newState, timestamp: new Date().toISOString() });

  } catch (e) {
    setMessages(prev => [...prev, { sender: 'ai', content: "My reflection layer blurred. Can you repeat that?" }]);
  } finally {
    setLoading(false);
  }
};

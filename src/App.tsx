// Inside App.jsx - Update only the handleSend function logic:

const handleSend = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');
    setIsProcessing(true);

    try {
      // UPGRADED TO GEMINI 2.5 FLASH
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `You are LiquidOS. User says: "${text}". 
      Reply ONLY in JSON: { "tool": "coin"|"focus"|"stats"|"text", "reply": "string" }`;
      
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (data.tool === 'text') {
        setMessages(prev => [...prev, { type: 'text', content: data.reply, sender: 'ai' }]);
      } else {
        setMessages(prev => [...prev, { type: 'component', content: data.tool, sender: 'ai' }]);
        if (data.reply) setMessages(prev => [...prev, { type: 'text', content: data.reply, sender: 'ai' }]);
      }
    } catch (error) {
      // This will tell us if it's a 403 (Permission) or 404 (Model) error
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { type: 'text', content: `Error: ${error.message.substring(0, 50)}...`, sender: 'ai' }]);
    } finally {
      setIsProcessing(false);
    }
  };

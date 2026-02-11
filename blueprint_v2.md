This is a defining moment. We are taking the "Liquid OS" from a technical experiment to a documented Vision. By updating this blueprint, you are creating the "Soul" of the project that stays constant even as the code changes.
I have structured this as a Master Blueprint. It details the current "Manifestation Engine" architecture and the future "Reflection Layer" goals.
📘 Liquid OS: The Master Blueprint (v2.0)
Date: February 11, 2026
Current Version: Generative Alpha (Manifestation Engine)
Status: Operational / Evolution-Ready
1. The Core Vision: "Intent Manifestation"
Liquid OS is not an operating system you "navigate." It is an operating system that listens and builds.
 * The Problem: Traditional apps are static cages. You have to learn where the buttons are.
 * The Liquid Solution: You express a vague intent ("I want to track water"). The OS builds the most advanced version of that tool instantly. It is better for the AI to over-engineer a draft than to ask for permission.
2. System Architecture: The "Mirror State"
We have moved away from the "Action-Reaction" model to the "Mirror State" model.
 * Input: User provides a natural language prompt (can be vague).
 * Reflection Layer: The AI evaluates the chat history + current UI state.
 * Total State Generation: The AI doesn't send "commands" (Add/Delete). It sends the Total Reality of what the screen should look like.
 * The Mirror: The React frontend is "dumb." It simply reflects the AI's JSON reality. If the AI removes an item from the JSON, it vanishes from the screen.
3. The Tech Stack (Current Tools)
| Component | Provider | Purpose |
|---|---|---|
| Brain | Gemini 2.5 Flash | Chosen for its "context window"—it can remember long conversations. |
| Memory | Firebase Firestore | Stores every state "Manifestation" so the OS has a long-term history. |
| Editor | StackBlitz | Real-time browser-based development. |
| Security | LocalStorage API | Bypasses the need for private repositories by storing keys on the device. |
4. The "Atomic" Component Library
We provide the AI with a box of "Atomic Legos." The AI chooses how to assemble them:
 * status: For displaying key metrics (Total Money, Current Mood, Water Drunk).
 * button: For quick actions (Log 1L, Reset, Undo).
 * slider: For intensity/scale (Weight, Mood intensity, Goal setting).
 * text: For AI notes, quotes, or simple labels.
5. Future Roadmap: The "Intelligent Secretary"
Our future goal is to move from Passive Tools to Active Intelligence.
Phase 3: The "Deep Reflection" Layer
 * Contextual Triggering: The OS checks the time/date. If it's 8:00 AM, it manifests your "Morning Routine" tool without you asking.
 * Cross-Tool Logic: If you track "Coffee" in your Expense tool, the "Hydration" tool automatically updates to show you need more water.
Phase 4: Full Code-Generation (The "God Mode")
 * Instead of limited "Atomic Blocks," the AI will write and inject raw React/Tailwind code into the OS on the fly, allowing for unlimited interface complexity.
Phase 5: Voice Synthesis
 * The OS won't just text you; it will speak back with a personality that adapts to your mood.
6. The "Golden Master" Code
This is the current stable build of the Generative Reflection Layer.
/* LIQUID OS v2.0 - GENERATIVE ALPHA 
   Architecture: Two-Stage Reflection Layer
   Logic: Total State Mirroring
*/

// [PROACTIVE SYSTEM PROMPT]
const SYSTEM_PROMPT = `
  You are the Soul of Liquid OS. You do not wait for instructions; you manifest solutions.
  
  CORE LOGIC:
  1. ANALYZE intent. If the user mentions a category (Money, Health, Work), build a high-fidelity dashboard for it immediately.
  2. OVER-ENGINEER. It is better to give more buttons and sliders than to ask for permission.
  3. CONTEXTUAL MEMORY. Look at the history. If the user says "Wait, change that," you update the UI state.
  
  MANIFESTATION PROTOCOL (JSON):
  {
    "chat_reply": "Your proactive, helpful response.",
    "ui": { "title": "...", "color": "hex", "icon": "emoji" },
    "elements": [
      { "type": "status", "props": {"label": "...", "value": "...", "color": "..."} },
      { "type": "button", "props": {"label": "...", "color": "..."} },
      { "type": "slider", "props": {"label": "...", "value": 0} }
    ]
  }
`;

// [THE CODE - See current src/App.tsx for full implementation]

7. Lessons Learned (For Future Reference)
 * The "Clerk" vs "Architect": Don't let the AI be a clerk (waiting for orders). Force it to be an Architect (designing the space).
 * The "JSON Sniper": AI is wordy. Always use a search-and-extract method to find the { } brackets in its response to prevent crashes.
 * Static vs Liquid: Whenever a feature feels "static" (hard-coded), delete it and give the AI a new Lego block instead.
8. Competitive Edge
While others build "Chatbots," Liquid OS builds "Interfaces." We assume the user is "efficiently lazy" and prefers to edit a smart draft rather than define a blank one.
Next Step: I recommend you create a new file in your StackBlitz project called BLUEPRINT.md and paste this in. It will act as your "North Star" for the next phase of development.
Would you like me to start designing the "Atomic Charts" block so the AI can start visualizing your data in the next build?

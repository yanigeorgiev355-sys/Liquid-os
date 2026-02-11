import React from 'react';

// 1. The Atomic Contract (Types)
interface AtomProps {
  type: 'hero' | 'button' | 'input' | 'list' | 'box' | 'text';
  props: any;
  action?: string; // The AI might put it here
}

interface AtomRenderProps {
  layout: AtomProps[];
  onAction: (actionId: string, value?: any) => void;
}

// 2. The Universal Renderer
export const AtomRender: React.FC<AtomRenderProps> = ({ layout, onAction }) => {
  
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {layout.map((atom, index) => {
        
        // 🛡️ ROBUST ACTION FINDER
        // We look in ALL possible places the AI might have put the ID
        const rawAction = atom.action || atom.props?.action || atom.props?.action_id;
        const actionId = rawAction || 'unknown_action';

        switch (atom.type) {
          
          case 'hero':
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
                <h2 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">{atom.props.label}</h2>
                <div className="text-5xl font-black text-white" style={{ color: atom.props.color }}>
                  {atom.props.value}
                </div>
              </div>
            );

          case 'button':
            return (
              <button
                key={index}
                onClick={() => onAction(actionId)}
                className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: atom.props.color || '#3b82f6' }}
              >
                {atom.props.label}
              </button>
            );

          case 'box':
            return (
              <div key={index} className={`flex gap-3 ${atom.props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
                {/* Recursive Rendering */}
                <AtomRender layout={atom.props.children} onAction={onAction} />
              </div>
            );

          case 'text':
            return (
              <p key={index} className="text-slate-400 text-center text-sm p-2 italic">
                {atom.props.label}
              </p>
            );

          case 'input':
             return (
               <div key={index} className="flex flex-col gap-1 bg-slate-800 p-2 rounded-xl border border-slate-700">
                 <label className="text-xs text-slate-500 ml-2 uppercase font-bold">{atom.props.label}</label>
                 <input 
                   type={atom.props.type || 'text'}
                   className="bg-transparent p-2 text-white outline-none w-full font-mono"
                   placeholder={atom.props.placeholder}
                 />
               </div>
             );

          default:
            return null;
        }
      })}
    </div>
  );
};

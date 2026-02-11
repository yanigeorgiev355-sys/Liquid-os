import React from 'react';

// 1. The Atomic Contract (Types)
interface AtomProps {
  type: 'hero' | 'button' | 'input' | 'list' | 'box' | 'text';
  props?: any; // Marked optional to prevent TS errors
  action?: string;
}

interface AtomRenderProps {
  layout: AtomProps[];
  onAction: (actionId: string, value?: any) => void;
}

// 2. The Universal Renderer (Safety Edition)
export const AtomRender: React.FC<AtomRenderProps> = ({ layout, onAction }) => {
  
  // Safety Check: If layout is missing, don't render anything (prevents crash)
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {layout.map((atom, index) => {
        // 🛡️ SHIELD: If atom is null, skip it
        if (!atom) return null;

        // 🛡️ SHIELD: Ensure props object exists even if AI forgot it
        const props = atom.props || {};
        
        // 🛡️ ACTION FINDER: Look everywhere for the ID
        const rawAction = atom.action || props.action || props.action_id;
        const actionId = rawAction || 'unknown_action';

        switch (atom.type) {
          
          case 'hero':
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
                <h2 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
                  {props.label || 'No Label'}
                </h2>
                <div className="text-5xl font-black text-white" style={{ color: props.color || '#fff' }}>
                  {props.value || '--'}
                </div>
              </div>
            );

          case 'button':
            return (
              <button
                key={index}
                onClick={() => onAction(actionId)}
                className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: props.color || '#3b82f6' }}
              >
                {props.label || 'Button'}
              </button>
            );

          case 'box':
            return (
              <div key={index} className={`flex gap-3 ${props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
                {/* Recursive Rendering */}
                <AtomRender layout={props.children || []} onAction={onAction} />
              </div>
            );

          case 'text':
            return (
              <p key={index} className="text-slate-400 text-center text-sm p-2 italic">
                {props.label || ''}
              </p>
            );

          case 'input':
             return (
               <div key={index} className="flex flex-col gap-1 bg-slate-800 p-2 rounded-xl border border-slate-700">
                 <label className="text-xs text-slate-500 ml-2 uppercase font-bold">{props.label || 'Input'}</label>
                 <input 
                   type={props.type || 'text'}
                   className="bg-transparent p-2 text-white outline-none w-full font-mono"
                   placeholder={props.placeholder || 'Type here...'}
                 />
               </div>
             );

          default:
            // Gracefully ignore unknown atoms instead of crashing
            return null;
        }
      })}
    </div>
  );
};

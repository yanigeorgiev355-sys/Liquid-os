import React from 'react';

// 1. The Atomic Contract (Types)
// This defines EXACTLY what the AI is allowed to ask for.
interface AtomProps {
  type: 'hero' | 'button' | 'input' | 'list' | 'box' | 'text';
  props: any; // Flexible props for each atom
  action?: string; // The ID of the action this atom triggers
}

interface AtomRenderProps {
  layout: AtomProps[];
  onAction: (actionId: string, value?: any) => void;
}

// 2. The Universal Renderer
export const AtomRender: React.FC<AtomRenderProps> = ({ layout, onAction }) => {
  
  if (!layout || !Array.isArray(layout)) return null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {layout.map((atom, index) => {
        
        // 🛡️ ERROR BOUNDARY: If AI invents a type, we skip it safely.
        switch (atom.type) {
          
          case 'hero':
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-2xl text-center border border-slate-700 shadow-lg">
                <h2 className="text-slate-400 text-sm uppercase tracking-wider">{atom.props.label}</h2>
                <div className="text-4xl font-bold text-white my-2" style={{ color: atom.props.color }}>
                  {atom.props.value}
                </div>
              </div>
            );

          case 'button':
            return (
              <button
                key={index}
                onClick={() => onAction(atom.action || 'unknown')}
                className="w-full py-4 px-6 rounded-xl font-bold text-white transform transition active:scale-95 shadow-md"
                style={{ backgroundColor: atom.props.color || '#3b82f6' }}
              >
                {atom.props.label}
              </button>
            );

          case 'box':
            return (
              <div key={index} className={`flex gap-3 ${atom.props.direction === 'row' ? 'flex-row' : 'flex-col'}`}>
                {/* Recursive Rendering for nested boxes! */}
                <AtomRender layout={atom.props.children} onAction={onAction} />
              </div>
            );

          case 'text':
            return (
              <p key={index} className="text-slate-300 text-center text-sm p-2">
                {atom.props.label}
              </p>
            );

          case 'input':
             return (
               <div key={index} className="flex flex-col gap-1">
                 <label className="text-xs text-slate-500 ml-2">{atom.props.label}</label>
                 <input 
                   type={atom.props.type || 'text'}
                   className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                   placeholder={atom.props.placeholder}
                 />
               </div>
             );

          default:
            console.warn(`Unknown Atom Type: ${atom.type}`);
            return <div key={index} className="text-red-500 text-xs">⚠️ Missing Atom: {atom.type}</div>;
        }
      })}
    </div>
  );
};

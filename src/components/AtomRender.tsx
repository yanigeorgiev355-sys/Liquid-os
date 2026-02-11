import React from 'react';

/**
 * ATOM RENDERER (The Universal Renderer)
 * Based on Liquid OS: The Master Blueprint (v3.0)
 */

// 1. Define the Atom Library (Placeholders for now as per Sprint 1)
const Hero = ({ label, value, color }: any) => (
  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: color || '#f0f0f0' }}>
    <p>{label}</p>
    <h1>{value}</h1>
  </div>
);

const Button = ({ label, action_id, onClick }: any) => (
  <button onClick={() => onClick(action_id)} style={{ margin: '5px', padding: '10px' }}>
    {label}
  </button>
);

const List = ({ source_collection, label }: any) => (
  <div style={{ marginTop: '10px' }}>
    <h3>{label}</h3>
    <p>History from: {source_collection} (Loading...)</p>
  </div>
);

const Container = ({ direction, children }: any) => (
  <div style={{ display: 'flex', flexDirection: direction === 'row' ? 'row' : 'column', gap: '10px' }}>
    {children}
  </div>
);

// 2. The Universal Renderer Component
const AtomRender = ({ layout, logic, onAction }: { layout: any[], logic: any, onAction: (actionId: string) => void }) => {
  
  // Recursively render components based on the Atomic Protocol
  const renderAtom = (atom: any, index: number) => {
    switch (atom.type) {
      case 'hero':
        return <Hero key={index} {...atom} />;
      
      case 'button':
        return <Button key={index} {...atom} action_id={atom.action} onClick={onAction} />;
      
      case 'list':
        return <List key={index} {...atom} />;
      
      case 'box':
        return (
          <Container key={index} direction={atom.direction}>
            {atom.children?.map((child: any, i: number) => renderAtom(child, i))}
          </Container>
        );
      
      default:
        console.warn(`Unknown atom type: ${atom.type}`);
        return null;
    }
  };

  return (
    <div className="atom-engine-viewport">
      {layout.map((atom, index) => renderAtom(atom, index))}
    </div>
  );
};

export default AtomRender;

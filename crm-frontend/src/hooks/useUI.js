import { useContext } from 'react';
import { UIContext } from '../context/UIContext.jsx';

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}

import React, { createContext, useState } from 'react';

/**
 * Tracks whether the mobile sidebar drawer is open. Desktop ignores this
 * entirely (sidebar is always visible via CSS breakpoints) - this only
 * matters below the md breakpoint.
 */
export const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <UIContext.Provider value={{ mobileSidebarOpen, setMobileSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
}

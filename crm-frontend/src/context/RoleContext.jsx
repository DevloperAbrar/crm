import React, { createContext, useContext, useMemo } from 'react';
import { AuthContext } from './AuthContext.jsx';

export const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { user } = useContext(AuthContext);

  const value = useMemo(
    () => ({
      role: user?.role || null,
      isFounder: user?.role === 'founder',
      isTeamLead: user?.role === 'team_lead',
      isBde: user?.role === 'bde',
    }),
    [user]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

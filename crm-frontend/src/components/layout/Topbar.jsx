import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useRole } from '../../hooks/useRole.js';
import { useUI } from '../../hooks/useUI.js';
import { roleHomeRoute } from '../../routes/roleBasedRoutes.js';
import Button from '../ui/Button.jsx';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { setMobileSidebarOpen } = useUI();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          className="md:hidden text-gray-500 p-1.5 -ml-1.5"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <button
          onClick={() => navigate(roleHomeRoute[role] || '/leads')}
          className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors min-w-0"
          title="Go to Dashboard"
        >
          <Home size={16} className="flex-shrink-0" />
          <span className="truncate">
            Welcome back, <span className="font-medium text-gray-800">{user?.name}</span>
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="hidden sm:inline text-xs px-2 py-1 bg-brand-50 text-brand-500 rounded-full capitalize font-medium">
          {user?.role?.replace('_', ' ')}
        </span>
        <Button variant="ghost" onClick={logout} className="flex items-center gap-1.5 px-2 sm:px-4">
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

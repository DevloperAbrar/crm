import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  KanbanSquare,
  CalendarDays,
  CalendarRange,
  MapPin,
  MapPinned,
  UploadCloud,
  FileBarChart2,
  ShieldAlert,
  ShieldCheck,
  Settings as SettingsIcon,
  ListChecks,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { useRole } from '../../hooks/useRole.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useUI } from '../../hooks/useUI.js';
import { roleHomeRoute } from '../../routes/roleBasedRoutes.js';
import logo from '../../assets/branding/logo.png';

const links = [
  { to: '__dashboard__', label: 'Dashboard', icon: LayoutDashboard, roles: ['founder', 'team_lead', 'bde'] },
  { to: '/leads', label: 'Leads', icon: ListChecks, roles: ['founder', 'team_lead', 'bde'] },
  { to: '/leads-kanban', label: 'Kanban', icon: KanbanSquare, roles: ['founder', 'team_lead', 'bde'] },
  { to: '/calendar', label: 'My Calendar', icon: CalendarDays, roles: ['founder', 'team_lead', 'bde'] },
  { to: '/calendar/team', label: 'Team Calendar', icon: CalendarRange, roles: ['founder', 'team_lead'] },
  { to: '/map', label: 'Map', icon: MapPin, roles: ['founder', 'team_lead', 'bde'] },
  // Coverage Summary: auto-calculated city/state stats - Founder sees org-wide, Team Lead sees own pod's cities.
  { to: '/coverage-summary', label: 'Coverage Summary', icon: MapPinned, roles: ['founder', 'team_lead'] },
  // Coverage Tracker: manual "have we pitched category X in city Y" checklist - Founder only per client request.
  { to: '/coverage-tracker', label: 'Coverage Tracker', icon: ClipboardCheck, roles: ['founder'] },
  { to: '/team', label: 'Team', icon: Users2, roles: ['founder', 'team_lead'] },
  // Import restricted to Founder only per client decision (see import.routes.js).
  { to: '/import', label: 'Import Data', icon: UploadCloud, roles: ['founder'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart2, roles: ['founder', 'team_lead'] },
  { to: '/fraud', label: 'Fraud Review', icon: ShieldAlert, roles: ['founder', 'team_lead'] },
  // Audit Logs: Founder only per requirement - full system trail of every change.
  { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['founder'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['founder'] },
];

export default function Sidebar() {
  const { role } = useRole();
  const { user } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUI();
  const dashboardPath = roleHomeRoute[role] || '/leads';

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="bg-white rounded-lg px-3 py-2 inline-flex shadow-sm">
          <img src={logo} alt="Campussafar" className="h-7 object-contain" />
        </div>
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {links
          .filter((l) => l.roles.includes(role))
          .map((link) => {
            const Icon = link.icon;
            const to = link.to === '__dashboard__' ? dashboardPath : link.to;
            return (
              <NavLink
                key={link.label}
                to={to}
                end={link.to === '__dashboard__' || link.to === '/calendar'}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'text-brand-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} />
                {link.label}
              </NavLink>
            );
          })}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/10 text-xs text-brand-200">
        <p className="font-medium text-white truncate">{user?.name}</p>
        <p className="capitalize truncate">{user?.role?.replace('_', ' ')}</p>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex md:flex-col w-60 flex-shrink-0 bg-brand-500 h-screen p-4 sticky top-0">
        {content}
      </aside>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-brand-500 p-4 flex flex-col z-50 transform transition-transform duration-200 md:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}

import React from 'react';
import { BarChart3, MapPin, ShieldCheck, Users } from 'lucide-react';
import logo from '../../assets/branding/logo.png';

const highlights = [
  {
    icon: Users,
    title: 'Team-wide visibility',
    text: 'Track every Team Lead and BDE with live targets and streaks.',
  },
  {
    icon: MapPin,
    title: 'Territory intelligence',
    text: 'See leads, visits and coverage across states and cities on the map.',
  },
  {
    icon: BarChart3,
    title: 'Pipeline that moves',
    text: 'From first call to closed deal, with reporting built in.',
  },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-brand-500 text-white">
        {/* Decorative background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Campussafar Internal CRM
          </div>

          <div>
            <h1 className="text-3xl xl:text-4xl font-semibold leading-tight tracking-tight">
              Field outreach,
              <br />
              <span className="text-accent-500">organised and accountable.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm xl:text-base text-white/70 leading-relaxed">
              One workspace for your BDE team to manage leads, log every call and visit, and hit
              targets with confidence.
            </p>

            <ul className="mt-10 space-y-5">
              {highlights.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <Icon size={18} className="text-accent-500" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-white/60">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck size={14} />
            Authorised personnel only. Activity is monitored and logged.
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <img src={logo} alt="Campussafar" className="h-10 mb-10 object-contain" />
            {children}
          </div>
        </div>

        <footer className="px-6 py-5 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Campussafar. For internal use only.
        </footer>
      </main>
    </div>
  );
}
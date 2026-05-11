import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code2, 
  Mic2, 
  Trophy, 
  User, 
  Settings,
  HelpCircle,
  LogOut,
  BrainCircuit,
  Map,
  BookOpen,
  PlayCircle,
  BarChart3,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...args) => twMerge(clsx(args));

const Sidebar = () => {
  const { logout, user } = useAuth();
  const userRole = user?.dbUser?.role;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
    { icon: Code2, label: 'Problem Library', path: '/app/problems' },
    { icon: Mic2, label: 'Mock Interview', path: '/app/interviews' },
    { icon: Trophy, label: 'Contests', path: '/app/contests' },
    { icon: BrainCircuit, label: 'Recommendations', path: '/app/recommendations' },
    { icon: Map, label: 'Roadmap', path: '/app/roadmap' },
    { icon: BookOpen, label: 'Learning', path: '/app/learning' },
    { icon: PlayCircle, label: 'Replays', path: '/app/replays' },
    { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
    { icon: Users, label: 'Community', path: '/app/community' },
    { icon: User, label: 'Profile', path: '/app/profile' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  // Admin-only nav item — conditionally appended
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/app/admin', isAdmin: true });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface/50 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col">
      <div className="p-8">
        <h1 className="text-2xl font-bold quantum-text bg-quantum-gradient bg-clip-text text-transparent tracking-tighter">
          SkillConnect AI
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
              isActive 
                ? item.isAdmin
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-primary/10 text-primary border border-primary/20 shadow-neon-cyan" 
                : item.isAdmin
                  ? "text-amber-400/60 hover:bg-amber-500/5 hover:text-amber-400"
                  : "text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
            {/* Active Glow Indicator */}
            <div className={cn(
              "absolute right-2 w-1 h-1 rounded-full transition-opacity duration-300",
              item.isAdmin ? "bg-amber-400 blur-[2px]" : "bg-primary blur-[2px]",
              "group-[.active]:opacity-100 opacity-0"
            )} />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { Bell, Search, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-background/50 backdrop-blur-md border-b border-white/5 z-40 px-8 flex items-center justify-between">
      <div className="relative w-96">
        {/* Search bar temporarily hidden per user request */}
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-muted hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-neon-cyan" />
        </button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.displayName || 'User'}</p>
            <p className="text-xs text-muted">{user?.dbUser?.skillLevel || 'Beginner'}</p>
          </div>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="profile" className="w-10 h-10 rounded-full border border-primary/30 p-0.5" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

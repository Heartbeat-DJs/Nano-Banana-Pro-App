
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="h-16 w-full fixed top-0 z-50 bg-black border-b border-white/5">
      <nav className="mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="size-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-wider text-white uppercase">Nano Banana <span className="text-purple-400">Pro</span></span>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Explore</a>
            <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Library</a>
          </div>
          <button className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Sign In
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

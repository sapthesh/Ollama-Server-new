'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-sm border border-[#2d2d2d]/10 dark:border-[#2d2d2d] 
        bg-white/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 
        hover:text-zinc-800 dark:hover:text-white transition-all 
        flex items-center justify-center group"
      aria-label="Toggle Theme"
    >
      {dark ? (
        <SunIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
      ) : (
        <MoonIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}

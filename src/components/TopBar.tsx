import React from 'react';
import { User } from '../types';
import { Sparkles, Terminal, BookOpen, Layers, Award } from 'lucide-react';

interface TopBarProps {
  activeTab: 'catalog' | 'generator' | 'mastery';
  setActiveTab: (tab: 'catalog' | 'generator' | 'mastery') => void;
  currentUser: User | null;
  onOpenTestHub: () => void;
  onOpenOnboarding: () => void;
  onSwitchPersona: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenTestHub,
  onOpenOnboarding,
  onSwitchPersona,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          onClick={() => setActiveTab('catalog')}
          className="text-xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors focus:outline-none"
        >
          Skolve
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`transition-colors py-1 relative ${
              activeTab === 'catalog'
                ? 'text-slate-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Curriculum Catalog
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`transition-colors py-1 relative ${
              activeTab === 'generator'
                ? 'text-slate-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Curriculum Generator
          </button>
          <button
            onClick={() => setActiveTab('mastery')}
            className={`transition-colors py-1 relative ${
              activeTab === 'mastery'
                ? 'text-slate-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Mastery & Radars
          </button>
          <button
            onClick={onOpenTestHub}
            className="text-slate-600 hover:text-slate-900 transition-colors py-1 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Doc & Test Hub</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onOpenOnboarding}
              title="Edit Learning Profile"
              className="hidden sm:flex items-center gap-2 py-1.5 px-2.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium truncate max-w-[120px]">{currentUser.name}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Course</span>
          </button>
        </div>
      </div>
    </header>
  );
};

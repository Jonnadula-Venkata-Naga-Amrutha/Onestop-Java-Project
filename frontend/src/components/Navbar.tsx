import { useState } from 'react';
import { User } from '../types';
import { Language } from '../data/translations';
import {
  Bell,
  Sparkles,
  Database,
  User as UserIcon,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  lang: Language;
  onToggleLang: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
  onOpenJavaCode: () => void;
  onOpenAssistant: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function Navbar({
  currentUser,
  onOpenAuth,
  onLogout,
  lang,
  onToggleLang,
  unreadCount,
  onOpenNotifications,
  onOpenEmergency,
  onOpenJavaCode,
  onOpenAssistant,
  activeView,
  onNavigate,
}: NavbarProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#F7F5EF]/90 backdrop-blur-md border-b border-[#173D32]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Title (Single text element wordmark) */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('landing');
            }}
            className="flex items-center gap-3 font-brand text-2xl font-bold tracking-tight text-[#173D32] whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-[#173D32] flex items-center justify-center text-[#D6B779] shadow-sm">
              <span className="font-serif-heading text-xl font-bold">O</span>
            </div>
            <span>OneStop</span>
          </a>

          {/* Zone 2: 4-5 Concise Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#252A28]/80">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                activeView === 'landing' ? 'border-[#173D32] text-[#173D32] font-semibold' : 'border-transparent'
              }`}
            >
              {lang === 'en' ? 'Explore Services' : 'సేవలు అన్వేషించండి'}
            </button>
            <button
              onClick={() => onNavigate('discovery')}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                activeView === 'discovery' ? 'border-[#173D32] text-[#173D32] font-semibold' : 'border-transparent'
              }`}
            >
              {lang === 'en' ? 'Find Experts' : 'నిపుణులు'}
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                activeView === 'dashboard' ? 'border-[#173D32] text-[#173D32] font-semibold' : 'border-transparent'
              }`}
            >
              {lang === 'en' ? 'Workflows' : 'డాష్‌బోర్డ్'}
            </button>
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 text-[#173D32] hover:text-[#102B25] transition-colors whitespace-nowrap shrink-0 font-medium"
            >
              <Sparkles className="w-4 h-4 text-[#D6B779]" />
              <span>{lang === 'en' ? 'AI Diagnostic' : 'AI సహాయకుడు'}</span>
            </button>
            <button
              onClick={onOpenJavaCode}
              className="flex items-center gap-1.5 text-[#252A28]/80 hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 font-mono-code text-xs bg-[#173D32]/5 px-2.5 py-1 rounded-md border border-[#173D32]/10"
              title="Inspect Core Java + JDBC DAOs, Servlets, and MySQL Schema"
            >
              <Database className="w-3.5 h-3.5 text-[#173D32]" />
              <span>Java + JDBC</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#173D32]/20 text-[#173D32] hover:bg-[#173D32]/5 transition-colors whitespace-nowrap shrink-0"
              title="Toggle English / తెలుగు"
            >
              {lang === 'en' ? 'తెలుగు' : 'English'}
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenEmergency}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#C84C4C] rounded-lg hover:bg-[#b03b3b] shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
              title="Urgent 45-minute dispatch"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Emergency SOS' : 'ఎమర్జెన్సీ'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-[#252A28] hover:text-[#173D32] hover:bg-[#173D32]/5 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-[#C84C4C] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#173D32] bg-[#A7BDA9]/20 hover:bg-[#A7BDA9]/30 rounded-lg border border-[#173D32]/10 transition-colors whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="font-semibold capitalize">
                    {currentUser.role === 'CUSTOMER' ? 'Customer' : currentUser.role === 'PROVIDER' ? 'Provider' : 'Admin'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#173D32]/10 py-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-gray-100 text-gray-500">
                      <div className="font-semibold text-gray-900">{currentUser.fullName}</div>
                      <div className="text-[11px] truncate">{currentUser.email}</div>
                    </div>
                    <button onClick={() => { onLogout(); setRoleDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-[#173D32] bg-white border border-[#173D32]/20 rounded-lg hover:bg-[#173D32]/5">
                Sign in
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => onNavigate('discovery')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-lg shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
            >
              {lang === 'en' ? 'Book a Pro' : 'బుకింగ్'}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { NetworkStatusType, LanguageType, UserRole } from '../types';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Recycle, Globe, Database, User, Shield, Volume2 } from 'lucide-react';

interface HeaderProps {
  status: NetworkStatusType;
  language: LanguageType;
  userRole: UserRole;
  pendingCount: number;
  onLanguageToggle: () => void;
  onRoleToggle: () => void;
  onOpenInspector: () => void;
  onOpenTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  language,
  userRole,
  pendingCount,
  onLanguageToggle,
  onRoleToggle,
  onOpenInspector,
  onOpenTutorial,
}) => {
  const isHi = language === 'hi';

  const renderStatusBadge = () => {
    switch (status) {
      case 'offline':
        return (
          <span
            id="status-badge-offline"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>🔴 {isHi ? 'ऑफलाइन मोड' : 'Offline Mode'}</span>
          </span>
        );
      case 'syncing':
        return (
          <span
            id="status-badge-syncing"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"
          >
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
            <span>🔄 {isHi ? 'सिंक हो रहा है...' : 'Syncing...'}</span>
          </span>
        );
      case 'synced':
        return (
          <span
            id="status-badge-synced"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>✅ {isHi ? 'सिंक हो गया' : 'Synced'}</span>
          </span>
        );
      case 'online':
      default:
        return (
          <span
            id="status-badge-online"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>🟢 {isHi ? 'ऑनलाइन' : 'Online'}</span>
          </span>
        );
    }
  };

  return (
    <header id="main-app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                Kabad <span className="text-emerald-600">Sathi</span>
              </h1>
              <span className="hidden md:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                E-Waste Offline-First
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {isHi ? 'कबाड़ीवाला और रिसाइक्लर के लिए डिजिटल मंच' : 'Informal Collector to Authorized Recycler Platform'}
            </p>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          {renderStatusBadge()}

          {/* Pending lots count badge if any */}
          {pendingCount > 0 && (
            <span
              title={isHi ? 'सिंक होने के लिए लंबित लॉट' : 'Lots stored locally pending sync'}
              className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{pendingCount} {isHi ? 'पेंडिंग' : 'queued'}</span>
            </span>
          )}

          {/* Tutorial Button with Voice */}
          <button
            id="btn-nav-tutorial"
            type="button"
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition active:scale-95 border border-emerald-600"
            title={isHi ? 'आवाज में ट्यूटोरियल सुनें (हिंदी गाइड)' : 'Voice Guided Tutorial (Hindi)'}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>{isHi ? 'ट्यूटोरियल' : 'Tutorial'}</span>
          </button>

          {/* Role Switcher */}
          <button
            id="btn-role-switcher"
            type="button"
            onClick={onRoleToggle}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
            title={isHi ? 'रोल बदलें' : 'Switch between Collector and Recycler dashboard'}
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">
              {userRole === 'collector'
                ? isHi ? 'कलेक्टर मोड' : 'Collector Mode'
                : isHi ? 'रिसाइक्लर मोड' : 'Recycler Hub'}
            </span>
            <span className="sm:hidden">
              {userRole === 'collector' ? 'कबाड़ी' : 'रिसाइक्लर'}
            </span>
          </button>

          {/* Language Switch */}
          <button
            id="btn-lang-toggle"
            type="button"
            onClick={onLanguageToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
            title="भाषा बदलें / Toggle Language (Hindi / Marathi / English)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'ENG'}</span>
          </button>

          {/* Firebase Inspector Button for SIH judges */}
          <button
            id="btn-inspector-header"
            type="button"
            onClick={onOpenInspector}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1.5 transition"
            title="Inspect Local vs Firebase Cloud Database"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Firebase DB</span>
          </button>
        </div>
      </div>
    </header>
  );
};

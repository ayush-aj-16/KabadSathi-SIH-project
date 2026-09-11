import React from 'react';
import { NetworkStatusType, LanguageType } from '../types';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Play, ArrowRight } from 'lucide-react';

interface OfflineBannerProps {
  status: NetworkStatusType;
  isSimulated: boolean;
  pendingCount: number;
  language: LanguageType;
  onToggleSimulate: (simulateOffline: boolean) => void;
  onForceSync: () => void;
  onOpenInspector?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  status,
  isSimulated,
  pendingCount,
  language,
  onToggleSimulate,
  onForceSync,
  onOpenInspector,
}) => {
  const isHi = language === 'hi';

  return (
    <div id="offline-network-banner" className="w-full">
      {/* SIH Judge Simulation Control Bar */}
      <div id="sih-demo-bar" className="bg-slate-900 text-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
            SIH 2026 Demo Mode
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300">
            {isHi ? 'इंटरनेट सिमुलेशन (टेस्टिंग के लिए):' : 'Network Simulation for Testing:'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Switch */}
          <button
            id="btn-simulate-offline"
            type="button"
            onClick={() => onToggleSimulate(true)}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 ${
              isSimulated || status === 'offline'
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" />
            <span>{isHi ? '🔴 इंटरनेट बंद करें (Simulate Offline)' : '🔴 Disconnect Internet'}</span>
          </button>

          <button
            id="btn-simulate-online"
            type="button"
            onClick={() => onToggleSimulate(false)}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 ${
              !isSimulated && status !== 'offline'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            <span>{isHi ? '🟢 इंटरनेट चालू करें (Online & Sync)' : '🟢 Connect & Sync'}</span>
          </button>

          {pendingCount > 0 && (
            <button
              id="btn-force-sync"
              type="button"
              onClick={onForceSync}
              disabled={status === 'offline' || status === 'syncing'}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{isHi ? `सिंक करें (${pendingCount})` : `Sync Now (${pendingCount})`}</span>
            </button>
          )}

          {onOpenInspector && (
            <button
              id="btn-open-inspector"
              type="button"
              onClick={onOpenInspector}
              className="bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/30 px-2.5 py-1 rounded font-medium transition"
            >
              🔍 {isHi ? 'डेटाबेस जांचें' : 'DB Inspector'}
            </button>
          )}
        </div>
      </div>

      {/* Main Status Notification Card */}
      {status === 'offline' && (
        <div id="banner-offline-active" className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-full text-rose-600 mt-0.5 flex-shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-900 text-base">
                    {isHi ? '🔴 अभी इंटरनेट नहीं है (Offline Mode)' : '🔴 Offline Mode Active'}
                  </span>
                  <span className="bg-rose-200/80 text-rose-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {pendingCount > 0
                      ? isHi
                        ? `${pendingCount} लॉट फोन पर सेव हैं`
                        : `${pendingCount} lots pending sync`
                      : isHi
                      ? 'लोकल मोड चालू'
                      : 'Local Storage Ready'}
                  </span>
                </div>
                <p className="text-sm text-rose-800 mt-0.5 font-medium">
                  {isHi
                    ? 'आप काम जारी रख सकते हैं। जानकारी इंटरनेट आने पर अपने आप सेव हो जाएगी।'
                    : 'You can continue working. Lots and details are safely saved on your phone and will sync automatically when internet returns.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs text-rose-700 bg-rose-100 px-2.5 py-1 rounded border border-rose-200 font-mono">
                Device Cache Active
              </span>
            </div>
          </div>
        </div>
      )}

      {status === 'syncing' && (
        <div id="banner-syncing-active" className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 rounded-full text-amber-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="font-bold text-sm">
                  {isHi ? '🔄 जानकारी सेव हो रही है...' : '🔄 Syncing your data with Firebase...'}
                </span>
                <span className="text-xs text-amber-700 ml-2 hidden sm:inline">
                  {isHi ? 'कृपया प्रतीक्षा करें, फोन से क्लाउड पर डेटा भेजा जा रहा है' : 'Uploading pending offline lots safely'}
                </span>
              </div>
            </div>
            <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
              {isHi ? 'सिंक जारी है' : 'Uploading...'}
            </span>
          </div>
        </div>
      )}

      {status === 'synced' && (
        <div id="banner-synced-active" className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm">
                  {isHi ? '✅ जानकारी सेव हो गई (All data synced)' : '✅ All Data Synced Successfully'}
                </span>
                <span className="text-xs text-emerald-700 ml-2 hidden sm:inline">
                  {isHi ? 'सभी लॉट और लेन-देन Firebase डेटाबेस में सुरक्षित अपडेट हो गए हैं' : 'All pending offline records are now live on Firebase Firestore'}
                </span>
              </div>
            </div>
            <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
              {isHi ? '100% सुरक्षित' : 'Cloud Verified'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

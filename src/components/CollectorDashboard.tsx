import React from 'react';
import { EWasteLot, MaterialPrice, TransactionRecord, UserProfile, LanguageType, NetworkStatusType } from '../types';
import {
  Camera,
  Coins,
  Truck,
  Package,
  Wallet,
  BookOpen,
  ShieldCheck,
  Volume2,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Scale
} from 'lucide-react';

interface CollectorDashboardProps {
  user: UserProfile;
  lots: EWasteLot[];
  prices: MaterialPrice[];
  transactions: TransactionRecord[];
  networkStatus: NetworkStatusType;
  language: LanguageType;
  onNavigate: (tab: 'dashboard' | 'lots' | 'prices' | 'recyclers' | 'safety') => void;
  onOpenCreateModal: () => void;
  onSyncNow: () => void;
  onOpenTutorial?: () => void;
}

export const CollectorDashboard: React.FC<CollectorDashboardProps> = ({
  user,
  lots,
  prices,
  transactions,
  networkStatus,
  language,
  onNavigate,
  onOpenCreateModal,
  onSyncNow,
  onOpenTutorial,
}) => {
  const isHi = language === 'hi';
  const isMr = language === 'mr';

  const pendingLots = lots.filter(l => l.syncState === 'pending' || l.syncState === 'failed');
  const pendingCount = pendingLots.length;
  const totalKg = lots.reduce((acc, l) => acc + (l.approxWeightKg || 0), user.totalCollectedKg);
  const totalValue = lots.reduce((acc, l) => acc + (l.estimatedTotalValue || 0), user.totalEarnings);

  return (
    <div id="collector-dashboard" className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Profile & Status Strip */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {user.name}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-600" />
                <span>{user.badge}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              📍 {user.location}
            </p>
          </div>
        </div>

        {/* Voice Tour Start Button */}
        {onOpenTutorial && (
          <button
            id="btn-dashboard-voice-tour"
            type="button"
            onClick={onOpenTutorial}
            className="bg-teal-50 hover:bg-teal-100 active:scale-95 text-teal-800 border border-teal-200 font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-xs flex items-center gap-1.5 transition text-xs sm:text-sm"
            title={isHi ? 'आवाज में ट्यूटोरियल गाइड सुनें' : isMr ? 'आवाजात ट्यूटोरिअल ऐका' : 'Voice Walkthrough'}
          >
            <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
            <span className="hidden sm:inline">{isHi ? 'बोलकर समझें' : isMr ? 'बोलून समजा' : 'Voice Tour'}</span>
            <span className="sm:hidden">{isHi ? 'गाइड' : 'Guide'}</span>
          </button>
        )}
      </div>

      {/* 2. PRIMARY HERO ACTION CARD (Section 16 Mandate) */}
      {/* # 📷 */}
      {/* # **कचरा जोड़ें** */}
      <div className="text-center">
        <button
          id="btn-hero-add-scrap"
          type="button"
          onClick={onOpenCreateModal}
          className="w-full bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 active:scale-98 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-emerald-400/50 transition flex flex-col items-center justify-center group"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-5xl sm:text-6xl shadow-inner mb-3 group-hover:scale-105 transition">
            📷
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-xs">
            {isHi ? 'कचरा जोड़ें' : isMr ? 'कचरा जोडा' : 'Add Scrap'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
            {isHi
              ? 'फोटो खींचें → AI अपने आप पहचानेगा'
              : isMr
              ? 'फोटो काढा → AI आपोआप ओळखेल'
              : 'Snap photo → AI automatically detects & values'}
          </p>
        </button>
      </div>

      {/* 3. SIX LARGE CLEAN TOUCH CARDS (Section 16 Mandate) */}
      {/* 💰 आज का भाव */}
      {/* 🚚 Recycler खोजें */}
      {/* 📦 मेरे Lot */}
      {/* 💵 मेरी कमाई */}
      {/* 📖 Tutorial */}
      {/* 🛡️ सुरक्षित तरीका */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">

        {/* 1. 💰 आज का भाव */}
        <button
          type="button"
          onClick={() => onNavigate('prices')}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            💰
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'आज का भाव' : isMr ? 'आजचा भाव' : "Today's Rates"}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {prices.length} {isHi ? 'सामग्रियों के रेट' : isMr ? 'वस्तूंचे दर' : 'live prices'}
            </span>
          </div>
        </button>

        {/* 2. 🚚 Recycler खोजें */}
        <button
          type="button"
          onClick={() => onNavigate('recyclers')}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-sky-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            🚚
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'Recycler खोजें' : isMr ? 'Recycler शोधा' : 'Find Recyclers'}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {isHi ? 'CPCB अधिकृत केंद्र' : isMr ? 'अधिकृत केंद्रे' : 'Certified hubs'}
            </span>
          </div>
        </button>

        {/* 3. 📦 मेरे Lot */}
        <button
          type="button"
          onClick={() => onNavigate('lots')}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            📦
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'मेरे Lot' : isMr ? 'माझे Lot' : 'My Lots'}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {lots.length} {isHi ? 'दर्ज लॉट' : isMr ? 'नोंदवलेले लॉट' : 'total lots'}
            </span>
          </div>
        </button>

        {/* 4. 💵 मेरी कमाई */}
        <button
          type="button"
          onClick={() => onNavigate('lots')}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-teal-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            💵
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-emerald-700 leading-tight">
              ₹{totalValue.toLocaleString()}
            </div>
            <span className="text-xs font-bold text-slate-700 mt-0.5 block">
              {isHi ? 'मेरी कमाई' : isMr ? 'माझी कमाई' : 'My Earnings'}
            </span>
          </div>
        </button>

        {/* 5. 📖 Tutorial */}
        <button
          type="button"
          onClick={onOpenTutorial || (() => onNavigate('safety'))}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            📖
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'Tutorial' : isMr ? 'ट्यूटोरिअल' : 'Tutorial'}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {isHi ? '🔊 ऑडियो गाइड' : isMr ? '🔊 ऑडिओ गाइड' : 'Voice Walkthrough'}
            </span>
          </div>
        </button>

        {/* 6. 🛡️ सुरक्षित तरीका */}
        <button
          type="button"
          onClick={() => onNavigate('safety')}
          className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-rose-400 p-4 sm:p-5 rounded-3xl shadow-xs transition text-left flex flex-col justify-between group active:scale-98 min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold mb-2 group-hover:scale-105 transition">
            🛡️
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'सुरक्षित तरीका' : isMr ? 'सुरक्षित पद्धत' : 'Safe Handling'}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {isHi ? 'बैटरी व गैस से बचाव' : isMr ? 'बॅटरी सुरक्षा' : 'Hazard protection'}
            </span>
          </div>
        </button>
      </div>

      {/* 4. Offline Queue Banner (If lots are waiting to sync) */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-800 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {pendingCount} {isHi ? 'लॉट फोन में सुरक्षित हैं' : isMr ? 'लॉट फोनमध्ये सेव्ह आहेत' : 'Lots saved offline'}
              </h4>
              <p className="text-xs text-amber-800">
                {isHi
                  ? 'इंटरनेट जुड़ने पर अपने आप सिंक हो जाएंगे'
                  : isMr
                  ? 'इंटरनेट जोडल्यावर आपोआप सिंक होतील'
                  : 'Will automatically sync to cloud when connected'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSyncNow}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl transition shadow-xs flex-shrink-0"
          >
            {isHi ? 'अभी सिंक करें' : isMr ? 'आताच सिंक करा' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* 5. Recent Lots List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>{isHi ? 'हाल के लॉट्स' : isMr ? 'नुकतेच नोंदवलेले लॉट' : 'Recent Lots'}</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('lots')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>{isHi ? 'सभी देखें' : isMr ? 'सर्व पहा' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {lots.slice(0, 3).map((lot) => (
            <div
              key={lot.localId}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  📦
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block truncate text-sm">
                    {lot.materialName}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">
                    {lot.localId} • {lot.approxWeightKg} kg
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-black text-emerald-700 text-sm block">
                  ₹{lot.estimatedTotalValue.toLocaleString()}
                </span>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  lot.syncState === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {lot.syncState === 'synced' ? '✅ Synced' : '🔴 Phone'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

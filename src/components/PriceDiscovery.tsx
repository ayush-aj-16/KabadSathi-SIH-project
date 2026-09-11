import React from 'react';
import { MaterialPrice, LanguageType, NetworkStatusType } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, Calendar, Sparkles, Scale, Info } from 'lucide-react';

interface PriceDiscoveryProps {
  prices: MaterialPrice[];
  lastSyncedTimestamp: number;
  networkStatus: NetworkStatusType;
  language: LanguageType;
  onRefreshPrices: () => void;
  onSelectMaterialForLot: (materialName: string) => void;
}

export const PriceDiscovery: React.FC<PriceDiscoveryProps> = ({
  prices,
  lastSyncedTimestamp,
  networkStatus,
  language,
  onRefreshPrices,
  onSelectMaterialForLot,
}) => {
  const isHi = language === 'hi';
  const isOffline = networkStatus === 'offline';

  const formattedDate = new Date(lastSyncedTimestamp).toLocaleString(isHi ? 'hi-IN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id="price-discovery-container" className="space-y-4">
      {/* Header card with Live vs Cached Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h2 className="text-lg font-black text-slate-900">
                {isHi ? 'ई-कचरा मंडी भाव (E-Waste Market Rates)' : 'E-Waste Market Price Discovery'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isHi
                ? 'अधिकृत रिसाइक्लर्स द्वारा निर्धारित निष्पक्ष पारदर्शी खरीद मूल्य'
                : 'Direct transparent purchase rates from CPCB authorized dismantling hubs'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOffline && (
              <button
                type="button"
                onClick={onRefreshPrices}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHi ? 'ताज़ा भाव लें' : 'Refresh Rates'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Status Display based on Connectivity */}
        {isOffline ? (
          /* REQUIREMENT 6: OFFLINE PRICE DISPLAY */
          <div id="offline-price-warning-box" className="mt-4 p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>⚠️ {isHi ? 'पिछली अपडेट की गई कीमत' : 'Last Successfully Synchronized Prices'}</span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              {isHi
                ? 'अभी इंटरनेट नहीं है, इसलिए फोन में सेव की गई पिछली कीमतें दिखाई जा रही हैं। यह आज के लाइव मंडी भाव नहीं हैं।'
                : 'Offline mode active: Showing last successfully cached rates. Internet connection required to refresh today\'s live market rates.'}
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-700 font-mono">
              <Calendar className="w-3 h-3" />
              <span>{isHi ? `अंतिम अपडेट समय: ${formattedDate}` : `Last Updated: ${formattedDate}`}</span>
            </div>
          </div>
        ) : (
          <div id="online-price-live-box" className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">
                🟢 {isHi ? 'लाइव मंडी भाव (सत्यापित रेट्स)' : 'Live Market Rates Active'}
              </span>
            </div>
            <span className="text-emerald-700 font-mono text-[11px]">
              {isHi ? `अपडेट: ${formattedDate}` : `Updated: ${formattedDate}`}
            </span>
          </div>
        )}
      </div>

      {/* Materials Price Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((item) => (
          <div
            key={item.id}
            id={`price-card-${item.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {item.category}
                </span>
                {/* Trend indicator */}
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  item.trend === 'up'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.trend === 'down'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                  {item.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-600" />}
                  {item.trend === 'stable' && <Minus className="w-3 h-3 text-slate-500" />}
                  <span>{item.trend === 'up' ? '+2.4%' : item.trend === 'down' ? '-1.8%' : 'Stable'}</span>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1">
                {isHi ? item.nameHi : item.nameEn}
              </h3>

              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {isOffline
                    ? isHi ? 'कैश्ड दर' : 'Cached Rate'
                    : isHi ? 'वर्तमान दर' : 'Current Rate'}
                </span>
                <span className="text-xl font-black text-slate-900">
                  ₹{item.pricePerKg}
                  <span className="text-xs font-semibold text-slate-500">/{item.unit}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectMaterialForLot(item.nameEn)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
              >
                <span>➕</span>
                <span>{isHi ? 'लॉट बनाएं' : 'Create Lot'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

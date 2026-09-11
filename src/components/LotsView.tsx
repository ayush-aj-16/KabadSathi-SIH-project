import React, { useState } from 'react';
import { EWasteLot, LanguageType, NetworkStatusType } from '../types';
import { Package, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Filter, Plus, Calendar, Tag, Shield } from 'lucide-react';

interface LotsViewProps {
  lots: EWasteLot[];
  networkStatus: NetworkStatusType;
  language: LanguageType;
  onOpenCreateModal: () => void;
  onSyncNow: () => void;
}

export const LotsView: React.FC<LotsViewProps> = ({
  lots,
  networkStatus,
  language,
  onOpenCreateModal,
  onSyncNow,
}) => {
  const isHi = language === 'hi';
  const [filter, setFilter] = useState<'all' | 'pending' | 'synced'>('all');

  const filteredLots = lots.filter((lot) => {
    if (filter === 'pending') return lot.syncState === 'pending' || lot.syncState === 'failed' || lot.syncState === 'syncing';
    if (filter === 'synced') return lot.syncState === 'synced';
    return true;
  });

  const pendingCount = lots.filter(l => l.syncState === 'pending' || l.syncState === 'failed').length;

  return (
    <div id="lots-view-container" className="space-y-4">
      {/* Top action bar & filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>{isHi ? 'मेरे ई-कचरा लॉट्स (Saved Lots)' : 'My E-Waste Lots'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHi
              ? 'फोन में सेव किए गए और Firebase पर सिंक हुए सभी लॉट की स्थिति'
              : 'Status of lots stored locally and synchronized to Firebase Cloud'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHi ? `सभी (${lots.length})` : `All (${lots.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{isHi ? '🔴 फोन पर सेव' : '🔴 Pending Sync'}</span>
              {pendingCount > 0 && (
                <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter('synced')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'synced' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHi ? '✅ सिंक हो चुके' : '✅ Synced'}
            </button>
          </div>

          {/* New Lot Button */}
          <button
            id="btn-create-lot-lotsview"
            type="button"
            onClick={onOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isHi ? 'नया लॉट जोड़ें' : 'Add New Lot'}</span>
          </button>
        </div>
      </div>

      {/* Sync Action Prompt if pending */}
      {pendingCount > 0 && (
        <div id="pending-sync-prompt" className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {isHi
                ? `${pendingCount} लॉट आपके फोन में सुरक्षित हैं। इंटरनेट जुड़ते ही अपने आप सिंक हो जाएंगे।`
                : `${pendingCount} lots are saved locally on your phone and ready to sync.`}
            </span>
          </div>
          {networkStatus !== 'offline' && (
            <button
              type="button"
              onClick={onSyncNow}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isHi ? 'अभी सिंक करें' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      )}

      {/* Lots Grid / Cards */}
      {filteredLots.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {isHi ? 'कोई लॉट नहीं मिला' : 'No lots found in this filter'}
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="text-xs text-emerald-600 font-bold hover:underline inline-block"
          >
            + {isHi ? 'नया लॉट बनाएं' : 'Create your first lot'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLots.map((lot) => {
            const isSynced = lot.syncState === 'synced';
            const isSyncing = lot.syncState === 'syncing';
            const isPending = lot.syncState === 'pending' || lot.syncState === 'failed';

            return (
              <div
                key={lot.localId}
                id={`lot-card-${lot.localId}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3"
              >
                {/* Header: IDs and Sync Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {lot.localId}
                      </span>
                      {isSynced && lot.firebaseDocId && (
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {lot.firebaseDocId.substring(0, 14)}...
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(lot.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </span>
                  </div>

                  {/* Sync State Badge */}
                  <div>
                    {isSynced ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isHi ? '✅ सिंक हो गया' : 'Synced'}</span>
                      </span>
                    ) : isSyncing ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                        <span>{isHi ? '🔄 सिंक जारी...' : 'Syncing...'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span>🔴 {isHi ? 'फोन पर सेव (पेंडिंग)' : 'Pending Sync'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Material & Specs */}
                <div className="flex gap-3 items-center">
                  {lot.photoUrl ? (
                    <img
                      src={lot.photoUrl}
                      alt={lot.materialName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {lot.materialName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-3 h-3" />
                      <span>{lot.materialCategory}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="font-semibold text-slate-700">
                        ⚖️ {lot.approxWeightKg} kg
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="font-black text-emerald-700">
                        ₹{lot.estimatedTotalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes or Guidance */}
                {lot.aiClassification && (
                  <div className="text-[11px] bg-teal-50/70 border border-teal-100 rounded-lg p-2 text-teal-900 flex items-start gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{lot.aiClassification.recyclingGuidance}</span>
                  </div>
                )}

                {/* Footer status */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {isSynced
                      ? isHi ? 'Firebase में सुरक्षित' : 'Verified in Firebase cloud'
                      : isHi ? 'ऑफलाइन कतार में सुरक्षित' : 'Queued in local device storage'}
                  </span>
                  <span className="font-semibold uppercase text-slate-600">
                    {lot.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

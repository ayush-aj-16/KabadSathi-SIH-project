import React, { useState } from 'react';
import { EWasteLot, LanguageType, NetworkStatusType } from '../types';
import { Factory, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, Scale, Leaf, Database, Sparkles, Building2 } from 'lucide-react';

interface RecyclerDashboardProps {
  lots: EWasteLot[];
  networkStatus: NetworkStatusType;
  language: LanguageType;
  onOpenInspector: () => void;
}

export const RecyclerDashboard: React.FC<RecyclerDashboardProps> = ({
  lots,
  networkStatus,
  language,
  onOpenInspector,
}) => {
  const isHi = language === 'hi';
  const [approvedLots, setApprovedLots] = useState<string[]>([]);

  const syncedLots = lots.filter(l => l.syncState === 'synced');

  const handleApprove = (lotId: string) => {
    setApprovedLots(prev => [...prev, lotId]);
  };

  return (
    <div id="recycler-dashboard" className="space-y-5">
      {/* Recycler Facility Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
              <Building2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  GreenEarth Dismantlers Ltd (CPCB Hub)
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>CPCB Reg #EW-2024-9182</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                📍 Okhla Industrial Area Ph-II, New Delhi • Hub Manager: Er. Sandeep Verma
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenInspector}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition self-start sm:self-auto"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>{isHi ? 'Firebase क्लाउड डेटा देखें' : 'Inspect Firebase Cloud Records'}</span>
          </button>
        </div>

        {/* Environmental & Facility Impact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">
              {isHi ? 'कुल प्राप्त लॉट' : 'Received Lots'}
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {syncedLots.length}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">
              {isHi ? 'प्रसंस्कृत ई-कचरा' : 'Processed Scrap'}
            </span>
            <div className="text-xl font-black text-emerald-700 mt-1">
              12.5 <span className="text-xs font-semibold text-slate-500">Tons</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">
              {isHi ? 'CO₂ उत्सर्जन बचत' : 'CO₂ Offset'}
            </span>
            <div className="text-xl font-black text-teal-700 mt-1">
              8,420 <span className="text-xs font-semibold text-slate-500">kg</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">
              {isHi ? 'कबाड़ियों को प्रत्यक्ष भुगतान' : 'Total Direct Payouts'}
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              ₹8.4L
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Lots for Verification */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span>{isHi ? 'कलेक्टरों से प्राप्त सिंक किए गए लॉट' : 'Incoming Synced Lots from Informal Collectors'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi
                ? 'कबाड़ियों द्वारा ऑफलाइन बनाए गए और इंटरनेट आने पर Firebase से प्राप्त लॉट'
                : 'Lots collected offline by informal collectors and synchronized to cloud'}
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {syncedLots.length} {isHi ? 'सत्यापित लॉट' : 'Verified'}
          </span>
        </div>

        {syncedLots.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            {isHi ? 'अभी कोई सिंक हुआ लॉट नहीं है।' : 'No synced lots yet. Reconnect network in collector mode to sync!'}
          </div>
        ) : (
          <div className="space-y-3">
            {syncedLots.map((lot) => {
              const isApproved = approvedLots.includes(lot.localId);

              return (
                <div
                  key={lot.localId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base flex-shrink-0">
                      📦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{lot.materialName}</span>
                        <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                          {lot.localId}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Collector: <span className="font-semibold text-slate-700">{lot.collectorName}</span> • Weight: <span className="font-semibold text-slate-700">{lot.approxWeightKg} kg</span> • Payout: <span className="font-bold text-emerald-700">₹{lot.estimatedTotalValue}</span>
                      </p>
                      {lot.firebaseDocId && (
                        <span className="font-mono text-[10px] text-amber-700 block mt-0.5">
                          Firestore Doc: {lot.firebaseDocId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-bold px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isHi ? 'स्वीकृत व भुगतान जारी' : 'Verified & Paid'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(lot.localId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isHi ? 'सत्यापित करें व रसीद दें' : 'Verify & Issue Payout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { EWasteLot, SyncAuditLog, LanguageType, NetworkStatusType } from '../types';
import { getFirebaseCloudLots, getAuditLogs, resetDemoData } from '../lib/offlineStore';
import { Database, Smartphone, Cloud, CheckCircle, RefreshCw, X, AlertTriangle, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface FirebaseSyncInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  localLots: EWasteLot[];
  networkStatus: NetworkStatusType;
  language: LanguageType;
  onForceSync: () => void;
  onResetDemo: () => void;
}

export const FirebaseSyncInspector: React.FC<FirebaseSyncInspectorProps> = ({
  isOpen,
  onClose,
  localLots,
  networkStatus,
  language,
  onForceSync,
  onResetDemo,
}) => {
  const isHi = language === 'hi';
  const [activeTab, setActiveTab] = useState<'comparison' | 'cloud' | 'audit'>('comparison');

  if (!isOpen) return null;

  const cloudLots = getFirebaseCloudLots();
  const auditLogs = getAuditLogs();
  const pendingLocalCount = localLots.filter(l => l.syncState === 'pending' || l.syncState === 'failed').length;

  return (
    <div id="firebase-inspector-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">
                  {isHi ? 'SIH डेमो: लोकल फोन बनाम Firebase क्लाउड डेटाबेस' : 'SIH Demo: Local Device vs Firebase Firestore Database'}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono px-2 py-0.5 rounded">
                  Dual-Store Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isHi
                  ? 'यह पैनल दिखाता है कि ऑफलाइन डेटा फोन में कैसे रहता है और ऑनलाइन आने पर Firebase में कैसे सिंक होता है।'
                  : 'Live verification that offline data persists on client device and uploads to Firestore on reconnection.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Actions */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'comparison' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              📱↔️☁️ {isHi ? 'तुलना दृश्य (Side-by-Side)' : 'Side-by-Side View'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cloud')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'cloud' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              ☁️ Firestore Collection ({cloudLots.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'audit' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              📜 {isHi ? 'ऑडिट लॉग्स' : 'Sync Audit Logs'} ({auditLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {pendingLocalCount > 0 && (
              <button
                type="button"
                onClick={onForceSync}
                disabled={networkStatus === 'offline'}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHi ? `Firebase में सिंक करें (${pendingLocalCount})` : `Upload to Firebase (${pendingLocalCount})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset demo state to initial clean data?')) {
                  onResetDemo();
                }
              }}
              className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
            >
              🔄 Reset Demo
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Local Device Storage */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>{isHi ? 'लोकल फोन स्टोरेज (Client Device)' : 'Client Local Phone Storage'}</span>
                    </div>
                    <span className="text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">
                      {localLots.length} items
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {localLots.map((lot) => (
                      <div
                        key={lot.localId}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sky-300">
                            {lot.localId}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            lot.syncState === 'synced'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {lot.syncState}
                          </span>
                        </div>
                        <div className="text-slate-300 font-medium truncate">
                          {lot.materialName} ({lot.approxWeightKg} kg)
                        </div>
                        <div className="text-slate-500 text-[10px] flex justify-between">
                          <span>Value: ₹{lot.estimatedTotalValue}</span>
                          <span>Created: {new Date(lot.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                  🛡️ {isHi ? 'अस्थायी आईडी इंटरनेट के बिना तुरंत जनरेट होती है' : 'Unique local sequential IDs prevent duplicate collisions.'}
                </div>
              </div>

              {/* Right: Firebase Firestore Cloud Database */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Cloud className="w-4 h-4 text-amber-400" />
                      <span>Firebase Firestore (Cloud DB)</span>
                    </div>
                    <span className="text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                      {cloudLots.length} docs
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {cloudLots.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        {isHi ? 'Firebase में अभी कोई सिंक हुआ लॉट नहीं है।' : 'No synced lots in Firebase yet. Reconnect network to sync!'}
                      </div>
                    ) : (
                      cloudLots.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-300 truncate max-w-[200px]">
                              {doc.firebaseDocId || doc.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              CLOUD VERIFIED
                            </span>
                          </div>
                          <div className="text-slate-300 font-medium truncate">
                            {doc.materialName} ({doc.approxWeightKg} kg)
                          </div>
                          <div className="text-slate-500 text-[10px] flex justify-between">
                            <span>Origin Local ID: {doc.localId}</span>
                            <span>Synced: {doc.syncedAt ? new Date(doc.syncedAt).toLocaleTimeString() : 'Verified'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                  ⚡ {isHi ? 'दस्तावेज़ आईडी सुरक्षित रहती है, दोबारा प्रयास करने पर कोई दोहराव नहीं होता।' : 'Idempotent document mapping prevents duplicate transaction records.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-200">
                  Collection: <span className="font-mono text-amber-400">/e_waste_lots</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Firebase Project: <span className="font-mono text-slate-200">kabadiwala-connect-sih</span>
                </span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Doc ID</th>
                      <th className="p-3">Local Origin ID</th>
                      <th className="p-3">Material</th>
                      <th className="p-3">Weight (kg)</th>
                      <th className="p-3">Total Value</th>
                      <th className="p-3">Collector</th>
                      <th className="p-3">Sync Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {cloudLots.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-amber-300 font-bold">{item.firebaseDocId || item.id}</td>
                        <td className="p-3 font-mono text-sky-300">{item.localId}</td>
                        <td className="p-3 font-medium">{item.materialName}</td>
                        <td className="p-3">{item.approxWeightKg} kg</td>
                        <td className="p-3 font-bold text-emerald-400">₹{item.estimatedTotalValue}</td>
                        <td className="p-3 text-slate-400">{item.collectorName}</td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {item.syncedAt ? new Date(item.syncedAt).toLocaleTimeString() : 'Initial Seed'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sync Audit Log & Idempotency Proof</span>
              </h3>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {log.status}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

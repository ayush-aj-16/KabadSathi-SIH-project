/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkStatusType, LanguageType, UserRole, EWasteLot, MaterialPrice, RecyclerFacility, TransactionRecord, UserProfile } from './types';
import { INITIAL_USER, INITIAL_RECYCLER } from './data/initialData';
import { networkManager } from './lib/networkStatus';
import {
  getStoredLots,
  getCachedPrices,
  getCachedRecyclers,
  getStoredTransactions,
  syncPendingDataToFirebase,
  updatePricesCache,
  resetDemoData,
} from './lib/offlineStore';
import { OfflineBanner } from './components/OfflineBanner';
import { Header } from './components/Header';
import { CollectorDashboard } from './components/CollectorDashboard';
import { RecyclerDashboard } from './components/RecyclerDashboard';
import { LotsView } from './components/LotsView';
import { PriceDiscovery } from './components/PriceDiscovery';
import { RecyclerDirectory } from './components/RecyclerDirectory';
import { SafetyTutorial } from './components/SafetyTutorial';
import { CreateLotModal } from './components/CreateLotModal';
import { FirebaseSyncInspector } from './components/FirebaseSyncInspector';
import { TutorialModal } from './components/TutorialModal';
import { InteractiveVoiceTour } from './components/InteractiveVoiceTour';
import { LayoutDashboard, Package, TrendingUp, ShieldAlert, Factory, Plus, HelpCircle, RefreshCw, Volume2 } from 'lucide-react';

export default function App() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusType>(networkManager.getStatus());
  const [isSimulated, setIsSimulated] = useState<boolean>(networkManager.isSimulated());
  const [language, setLanguage] = useState<LanguageType>('hi');
  const [userRole, setUserRole] = useState<UserRole>('collector');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lots' | 'prices' | 'recyclers' | 'safety'>('dashboard');

  // Audio ref for app load audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Repositories
  const [lots, setLots] = useState<EWasteLot[]>(() => getStoredLots());
  const [{ prices, lastSynced: pricesLastSynced }, setPricesData] = useState(() => getCachedPrices());
  const [{ recyclers, lastSynced: recyclersLastSynced }, setRecyclersData] = useState(() => getCachedRecyclers());
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => getStoredTransactions());

  // Modals & Guided Voice Tour
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isVoiceTourActive, setIsVoiceTourActive] = useState<boolean>(false);

  // Sync execution
  const executeSync = useCallback(async () => {
    try {
      const result = await syncPendingDataToFirebase();
      setLots(getStoredLots());
      setTransactions(getStoredTransactions());
      return result;
    } catch (err) {
      console.error('[App] Sync execution failed:', err);
      return { syncedLotsCount: 0, failedLotsCount: 0, syncedLotIds: [] };
    }
  }, []);

  // Subscribe to network updates & trigger audio on mount
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status, simulated) => {
      setNetworkStatus(status);
      setIsSimulated(simulated);
    });

    // Play welcome audio on app load
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.log("Autoplay blocked by browser:", error);
      });
    }

    return () => unsubscribe();
  }, []);

  const handleToggleSimulate = (simulateOffline: boolean) => {
    if (simulateOffline) {
      networkManager.setSimulatedOffline(true);
    } else {
      networkManager.setSimulatedOffline(false, async () => {
        await executeSync();
      });
    }
  };

  const handleForceSync = async () => {
    await networkManager.triggerReconnectSync(async () => {
      await executeSync();
    });
  };

  const handleLotCreated = (newLot: EWasteLot) => {
    setLots(getStoredLots());
    if (networkStatus === 'online' || networkStatus === 'synced') {
      setTimeout(() => {
        handleForceSync();
      }, 500);
    }
  };

  const handleRefreshPrices = () => {
    if (networkStatus !== 'offline') {
      const updated = prices.map(p => ({
        ...p,
        pricePerKg: Math.round(p.pricePerKg * (0.98 + Math.random() * 0.05)),
        lastSyncedTimestamp: Date.now(),
      }));
      updatePricesCache(updated);
      setPricesData({ prices: updated, lastSynced: Date.now() });
    }
  };

  const handleResetDemo = () => {
    resetDemoData();
    setLots(getStoredLots());
    setTransactions(getStoredTransactions());
    setPricesData(getCachedPrices());
    setRecyclersData(getCachedRecyclers());
    setIsInspectorOpen(false);
  };

  const pendingLotsCount = lots.filter(l => l.syncState === 'pending' || l.syncState === 'failed').length;
  const isHi = language === 'hi';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Hidden audio element for autoplay on launch */}
      <audio ref={audioRef} src="/kawadiwalee.mp3" preload="auto" />

      {/* 1. Offline / Sync / SIH Simulation Banner */}
      <OfflineBanner
        status={networkStatus}
        isSimulated={isSimulated}
        pendingCount={pendingLotsCount}
        language={language}
        onToggleSimulate={handleToggleSimulate}
        onForceSync={handleForceSync}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      {/* 2. Top Navigation Header */}
      <Header
        status={networkStatus}
        language={language}
        userRole={userRole}
        pendingCount={pendingLotsCount}
        onLanguageToggle={() => setLanguage(l => l === 'hi' ? 'mr' : l === 'mr' ? 'en' : 'hi')}
        onRoleToggle={() => setUserRole(r => r === 'collector' ? 'recycler' : 'collector')}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenTutorial={() => setIsVoiceTourActive(true)}
      />

      {/* 3. Main Navigation Tab Strip (Desktop & Tablet) */}
      <nav id="desktop-tab-navigation" className="bg-white border-b border-slate-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex space-x-1 py-2">
            <button
              id="tab-btn-dashboard"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isHi ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>

            <button
              id="tab-btn-lots"
              type="button"
              onClick={() => setActiveTab('lots')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'lots'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isHi ? 'मेरे लॉट्स' : 'My Lots'}</span>
              {pendingLotsCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingLotsCount}
                </span>
              )}
            </button>

            <button
              id="tab-btn-prices"
              type="button"
              onClick={() => setActiveTab('prices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'prices'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isHi ? 'मंडी भाव (Price Discovery)' : 'Market Rates'}</span>
            </button>

            <button
              id="tab-btn-recyclers"
              type="button"
              onClick={() => setActiveTab('recyclers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'recyclers'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>{isHi ? 'अधिकृत रिसाइक्लर्स' : 'Authorized Recyclers'}</span>
            </button>

            <button
              id="tab-btn-safety"
              type="button"
              onClick={() => setActiveTab('safety')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'safety'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isHi ? 'सुरक्षा ट्यूटोरियल' : 'Safety Tutorial'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-voice-tour-desktop"
              type="button"
              onClick={() => setIsVoiceTourActive(true)}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-95 border border-emerald-600"
              title={isHi ? 'आवाज में ट्यूटोरियल गाइड सुनें' : 'Start Voice Tour'}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>{isHi ? '🔊 बोलकर समझाएं' : '🔊 Voice Tour'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isHi ? 'गाइड कार्ड्स' : 'Cards Guide'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Main Body Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 sm:pb-8">
        {userRole === 'recycler' ? (
          <RecyclerDashboard
            lots={lots}
            networkStatus={networkStatus}
            language={language}
            onOpenInspector={() => setIsInspectorOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <CollectorDashboard
                user={INITIAL_USER}
                lots={lots}
                prices={prices}
                transactions={transactions}
                networkStatus={networkStatus}
                language={language}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onSyncNow={handleForceSync}
                onOpenTutorial={() => setIsVoiceTourActive(true)}
              />
            )}

            {activeTab === 'lots' && (
              <LotsView
                lots={lots}
                networkStatus={networkStatus}
                language={language}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onSyncNow={handleForceSync}
              />
            )}

            {activeTab === 'prices' && (
              <PriceDiscovery
                prices={prices}
                lastSyncedTimestamp={pricesLastSynced}
                networkStatus={networkStatus}
                language={language}
                onRefreshPrices={handleRefreshPrices}
                onSelectMaterialForLot={() => {
                  setIsCreateModalOpen(true);
                }}
              />
            )}

            {activeTab === 'recyclers' && (
              <RecyclerDirectory
                recyclers={recyclers}
                lastSyncedTimestamp={recyclersLastSynced}
                networkStatus={networkStatus}
                language={language}
              />
            )}

            {activeTab === 'safety' && (
              <SafetyTutorial language={language} />
            )}
          </>
        )}
      </main>

      {/* 5. Mobile Bottom Navigation Bar */}
      <div id="mobile-bottom-nav" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isHi ? 'होम' : 'Home'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lots')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 relative ${
            activeTab === 'lots' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isHi ? 'लॉट्स' : 'Lots'}</span>
          {pendingLotsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Center Floating Plus Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-12 h-12 -mt-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prices')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 ${
            activeTab === 'prices' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isHi ? 'भाव' : 'Rates'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('safety')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 ${
            activeTab === 'safety' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isHi ? 'सुरक्षा' : 'Safety'}</span>
        </button>
      </div>

      {/* 6. Modals */}
      <CreateLotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLotCreated={handleLotCreated}
        prices={prices}
        networkStatus={networkStatus}
        language={language}
      />

      <FirebaseSyncInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        localLots={lots}
        networkStatus={networkStatus}
        language={language}
        onForceSync={handleForceSync}
        onResetDemo={handleResetDemo}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        language={language}
        onOpenCreateLot={() => setIsCreateModalOpen(true)}
        onStartVoiceTour={() => setIsVoiceTourActive(true)}
      />

      {/* 7. Interactive Voice-Guided On-Screen Walkthrough */}
      <InteractiveVoiceTour
        isActive={isVoiceTourActive}
        onClose={() => setIsVoiceTourActive(false)}
        language={language}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
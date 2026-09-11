import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LanguageType } from '../types';
import { speakOfflineText, stopOfflineSpeech, isSpeaking } from '../lib/speech';
import { Volume2, VolumeX, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2, RotateCcw, ShieldCheck, Flame, Cpu, Eye } from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  requiredTab?: 'dashboard' | 'lots' | 'prices' | 'recyclers' | 'safety';
  icon: string;
  titleHi: string;
  titleEn: string;
  speechHi: string;
  speechEn: string;
  detailHi: string;
  detailEn: string;
  preferredPlacement?: 'top' | 'bottom' | 'auto';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'create-lot',
    targetSelector: '#btn-quick-create-lot',
    requiredTab: 'dashboard',
    icon: '➕',
    titleHi: 'इस बटन से नया ई-कचरा लॉट बनता है',
    titleEn: 'This button creates a new e-waste lot',
    speechHi: 'इस बटन से आप नया ई-कचरा लॉट बना सकते हैं। कबाड़ की फोटो खींचें, वजन डालें, और यह इंटरनेट न होने पर भी आपके फोन में तुरंत सुरक्षित सेव हो जाता है।',
    speechEn: 'Use this button to create a new e-waste lot. Snap a picture, enter weight, and it saves instantly on your phone even without internet.',
    detailHi: '📷 फोटो खींचें + ⚖️ वजन दर्ज करें • बिना इंटरनेट भी 100% काम करेगा',
    detailEn: 'Snap photo + enter weight • Works 100% offline without network',
    preferredPlacement: 'bottom',
  },
  {
    id: 'offline-network-bar',
    targetSelector: '#sih-demo-bar',
    icon: '📶',
    titleHi: 'यहाँ से इंटरनेट स्थिति दिखती है और ऑफलाइन टेस्ट कर सकते हैं',
    titleEn: 'Network status & offline simulation test bar',
    speechHi: 'यहाँ आपको इंटरनेट की स्थिति दिखती है। इस लाल बटन को दबाकर आप इंटरनेट बंद करके देख सकते हैं कि ऐप बिना इंटरनेट भी सौ प्रतिशत काम करता है, और हरा बटन दबाते ही सारा डेटा अपने आप सिंक हो जाता है।',
    speechEn: 'Here you can check internet status. Press the red button to simulate offline mode, and the green button to reconnect and see auto-sync in action.',
    detailHi: '🔴 लाल बटन से ऑफलाइन टेस्ट करें • 🟢 हरा बटन दबाकर ऑटो-सिंक देखें',
    detailEn: 'Test offline mode with red button • Test auto-sync with green button',
    preferredPlacement: 'bottom',
  },
  {
    id: 'prices-nav',
    targetSelector: '#tab-btn-prices',
    icon: '📈',
    titleHi: 'इस बटन से ई-कचरे के ताज़ा मंडी भाव दिखते हैं',
    titleEn: 'This button shows latest fair market scrap prices',
    speechHi: 'इस बटन से आपको ई-कचरे के ताज़ा मंडी भाव मिलते हैं, जैसे मदरबोर्ड, मोबाइल बैटरी और तांबे का सही रेट, ताकि कबाड़ी भाई को कोई कम दाम न दे सके।',
    speechEn: 'This button shows live market prices for motherboards, mobile batteries, and copper wire so collectors never get underpaid.',
    detailHi: '📊 मदरबोर्ड, लिथियम बैटरी और तांबे के पारदर्शी सरकारी व बाजारी रेट',
    detailEn: 'Transparent market rates for PCBs, lithium batteries, and copper',
    preferredPlacement: 'bottom',
  },
  {
    id: 'recyclers-nav',
    targetSelector: '#tab-btn-recyclers',
    icon: '🏭',
    titleHi: 'इस बटन से अधिकृत रिसाइक्लिंग प्लांट और पते मिलते हैं',
    titleEn: 'This button opens the CPCB authorized recyclers directory',
    speechHi: 'इस बटन से आपको प्रदूषण नियंत्रण बोर्ड से अधिकृत रिसाइक्लिंग कंपनियों के पते और फोन नंबर मिलते हैं, ताकि आप सीधे रिसाइक्लर को बेचकर पूरा मुनाफा कमा सकें।',
    speechEn: 'This button shows addresses and contact numbers of CPCB authorized recycling plants so you can sell scrap directly and earn more.',
    detailHi: '🏢 CPCB अधिकृत रिसाइक्लर • सीधा संपर्क व बिचौलियों से पूरी मुक्ति',
    detailEn: 'CPCB approved hubs • Direct contact and no middleman commission',
    preferredPlacement: 'bottom',
  },
  {
    id: 'safety-nav',
    targetSelector: '#tab-btn-safety',
    icon: '🛡️',
    titleHi: 'इस बटन से सुरक्षा नियम और ऑडियो गाइड खुलती है',
    titleEn: 'This button opens safety rules & offline voice guide',
    speechHi: 'इस बटन से आपको लिथियम बैटरी और ई-कचरे को सुरक्षित संभालने के नियम मिलते हैं, जिन्हें आप बिना इंटरनेट आवाज में भी सुन सकते हैं।',
    speechEn: 'This button gives you essential handling safety rules for lithium batteries and toxic monitors with offline voice narration.',
    detailHi: '🔊 लिथियम बैटरी आग व सीआरटी कांच से बचाव की ऑफलाइन ऑडियो गाइड',
    detailEn: 'Offline voice guide for battery fire and toxic chemical safety',
    preferredPlacement: 'bottom',
  },
  {
    id: 'role-switcher',
    targetSelector: '#btn-role-switcher',
    icon: '🔄',
    titleHi: 'इस बटन से कबाड़ी और रिसाइक्लर मोड बदला जाता है',
    titleEn: 'This button switches between Collector & Recycler view',
    speechHi: 'इस बटन से आप कबाड़ी मोड और रिसाइक्लर मोड के बीच बदल सकते हैं, जिससे रिसाइक्लिंग प्लांट वाला कबाड़ को चेक करके सीधे भुगतान जारी कर सके।',
    speechEn: 'Use this button to switch between informal collector mode and authorized recycler verification dashboard.',
    detailHi: '👤 कबाड़ी (कलेक्शन) और 🏭 रिसाइक्लिंग प्लांट के अलग-अलग डैशबोर्ड',
    detailEn: 'Switch views for informal collectors and authorized recyclers',
    preferredPlacement: 'bottom',
  },
  {
    id: 'firebase-inspector',
    targetSelector: '#btn-inspector-header',
    icon: '☁️',
    titleHi: 'इस बटन से फोन मेमोरी और Firebase क्लाउड का लाइव सिंक दिखता है',
    titleEn: 'This button inspects local phone storage vs Firebase Cloud DB',
    speechHi: 'इस बटन से आप अपने फोन की मेमोरी और फायरबेस क्लाउड डेटाबेस को आमने-सामने देख सकते हैं, और जांच सकते हैं कि ऑफलाइन लॉट कैसे ऑनलाइन आते ही सुरक्षित रूप से सिंक हो जाता है।',
    speechEn: 'This button allows you to inspect local device memory versus Firebase Firestore cloud records side-by-side.',
    detailHi: '📱 फोन स्टोरेज बनाम ☁️ फायरबेस क्लाउड डेटाबेस का लाइव सत्यापन',
    detailEn: 'Side-by-side proof of dual-store offline storage & Firestore sync',
    preferredPlacement: 'bottom',
  },
];

interface InteractiveVoiceTourProps {
  isActive: boolean;
  onClose: () => void;
  language: LanguageType;
  onSwitchTab: (tab: 'dashboard' | 'lots' | 'prices' | 'recyclers' | 'safety') => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const InteractiveVoiceTour: React.FC<InteractiveVoiceTourProps> = ({
  isActive,
  onClose,
  language,
  onSwitchTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const isHi = language === 'hi';

  const step = TOUR_STEPS[currentStepIndex];

  // Stop speech when unmounting or closed
  useEffect(() => {
    return () => {
      stopOfflineSpeech();
    };
  }, []);

  // Update target rect and start voice when step changes
  const locateAndSpeak = useCallback((stepIdx: number) => {
    const curStep = TOUR_STEPS[stepIdx];
    if (!curStep) return;

    // Switch tab if step requires it
    if (curStep.requiredTab) {
      onSwitchTab(curStep.requiredTab);
    }

    // Small delay to allow DOM to render or tab to mount
    setTimeout(() => {
      let el = document.querySelector(curStep.targetSelector) as HTMLElement | null;

      // Fallback: if on mobile bottom nav or button not found directly
      if (!el && curStep.id === 'create-lot') {
        el = document.querySelector('#btn-quick-create-lot') as HTMLElement | null;
        if (!el) {
          el = document.querySelector('#mobile-bottom-nav button:nth-child(3)') as HTMLElement | null;
        }
      } else if (!el && curStep.id === 'prices-nav') {
        el = document.querySelector('#mobile-bottom-nav button:nth-child(4)') as HTMLElement | null;
      } else if (!el && curStep.id === 'safety-nav') {
        el = document.querySelector('#mobile-bottom-nav button:nth-child(5)') as HTMLElement | null;
      } else if (!el && curStep.id === 'firebase-inspector') {
        el = document.querySelector('#btn-open-inspector') as HTMLElement | null;
      }

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
          if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        }, 120);
      } else {
        // Center fallback
        setTargetRect(null);
      }

      // Voice read-aloud
      stopOfflineSpeech();
      const textToSpeak = isHi ? curStep.speechHi : curStep.speechEn;
      setIsVoicePlaying(true);
      speakOfflineText(
        textToSpeak,
        isHi ? 'hi' : 'en',
        () => {
          setIsVoicePlaying(false);
        },
        () => {
          setIsVoicePlaying(true);
        }
      );
    }, 150);
  }, [isHi, onSwitchTab]);

  useEffect(() => {
    if (isActive) {
      locateAndSpeak(currentStepIndex);
    } else {
      stopOfflineSpeech();
      setIsVoicePlaying(false);
    }
  }, [isActive, currentStepIndex, locateAndSpeak]);

  // Window resize listener
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      const curStep = TOUR_STEPS[currentStepIndex];
      if (!curStep) return;
      const el = document.querySelector(curStep.targetSelector) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, currentStepIndex]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopOfflineSpeech();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReplayVoice = () => {
    stopOfflineSpeech();
    setIsVoicePlaying(true);
    const textToSpeak = isHi ? step.speechHi : step.speechEn;
    speakOfflineText(
      textToSpeak,
      isHi ? 'hi' : 'en',
      () => {
        setIsVoicePlaying(false);
      },
      () => {
        setIsVoicePlaying(true);
      }
    );
  };

  const handleToggleVoice = () => {
    if (isVoicePlaying) {
      stopOfflineSpeech();
      setIsVoicePlaying(false);
    } else {
      handleReplayVoice();
    }
  };

  // Calculate Tooltip position based on target rect
  const getTooltipStyle = (): React.CSSProperties => {
    const pad = 12;
    const tooltipWidth = Math.min(window.innerWidth - 32, 460);

    if (!targetRect) {
      // Default fixed center
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        zIndex: 9999,
      };
    }

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = 0;
    // Prefer below unless space is restricted
    if (spaceBelow > 260 || spaceBelow > spaceAbove) {
      top = targetRect.bottom + pad;
    } else {
      top = Math.max(16, targetRect.top - 280);
    }

    // Clamp horizontally
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  };

  return (
    <div id="interactive-voice-tour-root" className="fixed inset-0 z-50 pointer-events-auto">
      {/* 1. Backdrop Overlay */}
      <div
        id="tour-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-all duration-300"
      />

      {/* 2. Target Spotlight Highlight Box */}
      {targetRect && (
        <div
          id="tour-spotlight-highlight"
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            zIndex: 9998,
            pointerEvents: 'none',
          }}
          className="rounded-2xl border-4 border-emerald-400 ring-4 ring-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.85)] animate-pulse transition-all duration-200"
        >
          {/* Target Pointer Beacon Tag */}
          <div className="absolute -top-3.5 left-3 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{isHi ? '👉 यह बटन' : '👉 This Button'}</span>
          </div>
        </div>
      )}

      {/* 3. Floating Voice & Instruction Card */}
      <div
        id="tour-tooltip-card"
        style={getTooltipStyle()}
        className="bg-slate-900 border-2 border-emerald-500/80 text-white rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                  {isHi ? `कदम ${currentStepIndex + 1} / ${TOUR_STEPS.length}` : `Step ${currentStepIndex + 1} of ${TOUR_STEPS.length}`}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {isHi ? 'आवाज में ट्यूटोरियल' : 'Voice Walkthrough'}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-voice-tour"
            type="button"
            onClick={() => {
              stopOfflineSpeech();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isHi ? 'ट्यूटोरियल बंद करें' : 'Close Tour'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Highlight Title: "इस बटन से यह होता है" */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{isHi ? 'इस बटन से क्या होता है:' : 'What this control does:'}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
            {isHi ? step.titleHi : step.titleEn}
          </h3>
        </div>

        {/* Hindi Spoken Explanation Bubble with Animated Audio Wave */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              {isVoicePlaying ? (
                <>
                  <Volume2 className="w-4 h-4 animate-bounce text-emerald-400" />
                  <span>{isHi ? '🔊 हिंदी में आवाज़ चल रही है...' : '🔊 Playing Hindi Voice Narration...'}</span>
                  {/* Sound Wave Bars */}
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce" />
                    <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">{isHi ? 'आवाज़ रुकी हुई है' : 'Voice Paused'}</span>
                </>
              )}
            </div>

            <button
              id="btn-toggle-tour-speech"
              type="button"
              onClick={handleToggleVoice}
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition flex items-center gap-1"
            >
              {isVoicePlaying ? (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span>{isHi ? 'रोकें' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3" />
                  <span>{isHi ? 'दोबारा सुनें' : 'Replay'}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            "{isHi ? step.speechHi : step.speechEn}"
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{isHi ? step.detailHi : step.detailEn}</span>
          </div>
        </div>

        {/* Navigation Step Indicators and Next/Prev Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`कदम ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-tour-prev"
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHi ? 'पिछला' : 'Back'}</span>
            </button>

            <button
              id="btn-tour-next"
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>
                {currentStepIndex === TOUR_STEPS.length - 1
                  ? isHi
                    ? 'समाप्त करें ✅'
                    : 'Finish ✅'
                  : isHi
                  ? 'अगला कदम 👉'
                  : 'Next Step 👉'}
              </span>
              {currentStepIndex < TOUR_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

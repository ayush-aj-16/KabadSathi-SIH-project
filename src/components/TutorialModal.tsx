import React, { useState, useEffect } from 'react';
import { LanguageType } from '../types';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Shield, Sparkles, Smartphone, WifiOff, RefreshCw, Scale, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { speakOfflineText, stopOfflineSpeech, isSpeaking } from '../lib/speech';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageType;
  onOpenCreateLot: () => void;
  onStartVoiceTour?: () => void;
}

const STEPS = [
  {
    icon: '📶',
    titleEn: '100% Offline Capability',
    titleHi: '100% ऑफलाइन काम करने की सुविधा',
    descEn: 'Never worry about lost internet or poor cellular signals. You can create scrap lots, weigh items, and record transactions completely offline in your phone.',
    descHi: 'इंटरनेट न होने या कमजोर नेटवर्क पर भी काम कभी नहीं रुकेगा। आप अपने फोन में ऑफलाइन नए लॉट बना सकते हैं, वजन दर्ज कर सकते हैं और रसीद देख सकते हैं।',
    speechHi: 'इंटरनेट न होने या कमजोर नेटवर्क पर भी काम कभी नहीं रुकेगा। आप अपने फोन में ऑफलाइन नए लॉट बना सकते हैं, वजन दर्ज कर सकते हैं और रसीद देख सकते हैं।',
    tipEn: 'Lots receive temporary IDs like OFFLINE-LOT-001 and store safely in your phone storage.',
    tipHi: 'ऑफलाइन बनाए गए लॉट को OFFLINE-LOT-001 जैसी आईडी मिलती है और वे फोन में सुरक्षित रहते हैं।',
  },
  {
    icon: '📷',
    titleEn: 'Photo, Material & Weight Entry',
    titleHi: 'फोटो, सामग्री का चयन और वजन',
    descEn: 'Snap a picture of the scrap. Select from standardized e-waste materials (Motherboard, Mobile PCB, Copper wire, Lithium batteries) and enter weight.',
    descHi: 'कबाड़ की फोटो खींचें। मानकीकृत श्रेणियों (जैसे मदरबोर्ड, मोबाइल प्लेट, तांबे का तार, बैटरी) में से चुनें और वजन दर्ज करें।',
    speechHi: 'कबाड़ की फोटो खींचें। मानकीकृत श्रेणियों जैसे मदरबोर्ड, मोबाइल प्लेट, तांबे का तार और बैटरी में से चुनें और वजन दर्ज करें।',
    tipEn: 'Our offline AI assist identifies hazardous materials and recommends fair market rates automatically.',
    tipHi: 'हमारा ऑफलाइन एआई मॉडल तुरंत सामग्री की पहचान करता है और उचित मंडी भाव सुझाता है।',
  },
  {
    icon: '🔄',
    titleEn: 'Automatic Background Sync',
    titleHi: 'इंटरनेट आने पर अपने आप सिंक',
    descEn: 'As soon as your phone connects to Wi-Fi or mobile data, all pending offline lots upload to Firebase automatically. You never lose a single record!',
    descHi: 'जैसे ही आपके फोन में इंटरनेट वापस आएगा, फोन में सेव सभी लॉट अपने आप Firebase क्लाउड में सेव हो जाएंगे। आपको कुछ करने की जरूरत नहीं!',
    speechHi: 'जैसे ही आपके फोन में इंटरनेट वापस आएगा, फोन में सेव सभी लॉट अपने आप फायरबेस क्लाउड में सेव हो जाएंगे। आपको कुछ करने की जरूरत नहीं!',
    tipEn: 'Built-in duplicate prevention guarantees every lot is counted exactly once.',
    tipHi: 'दोहराव निवारण प्रणाली यह सुनिश्चित करती है कि कोई भी लॉट या लेन-देन दो बार न बने।',
  },
  {
    icon: '🛡️',
    titleEn: 'Safe Handling & Direct Payouts',
    titleHi: 'सुरक्षित काम और सीधा उचित भुगतान',
    descEn: 'Access critical lithium battery and CRT tube safety guides with offline voice narration. Deliver verified scrap directly to CPCB authorized dismantlers.',
    descHi: 'लिथियम बैटरी और टीवी स्क्रीन की सुरक्षा गाइड ऑफलाइन आवाज में सुनें। सीधे प्रदूषण नियंत्रण बोर्ड से अधिकृत रिसाइक्लर को बेचकर पूरा दाम पाएं।',
    speechHi: 'लिथियम बैटरी और टीवी स्क्रीन की सुरक्षा गाइड ऑफलाइन आवाज में सुनें। सीधे प्रदूषण नियंत्रण बोर्ड से अधिकृत रिसाइक्लर को बेचकर पूरा दाम पाएं।',
    tipEn: 'No middlemen—fair transparent rates deposited directly via UPI or Cash.',
    tipHi: 'बिचौलियों से मुक्ति—पूरा पारदर्शी भाव सीधे आपके यूपीआई या खाते में।',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  language,
  onOpenCreateLot,
  onStartVoiceTour,
}) => {
  const isHi = language === 'hi';
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopOfflineSpeech();
      setIsAudioPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handlePlayVoice = (stepIdx: number = currentStep) => {
    stopOfflineSpeech();
    const cur = STEPS[stepIdx];
    const text = isHi ? cur.speechHi : cur.descEn;
    setIsAudioPlaying(true);
    speakOfflineText(
      text,
      isHi ? 'hi' : 'en',
      () => setIsAudioPlaying(false),
      () => setIsAudioPlaying(true)
    );
  };

  const handleNext = () => {
    stopOfflineSpeech();
    setIsAudioPlaying(false);
    if (isLast) {
      onClose();
      onOpenCreateLot();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
    }
  };

  const handlePrev = () => {
    stopOfflineSpeech();
    setIsAudioPlaying(false);
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
    }
  };

  return (
    <div id="tutorial-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <div>
              <h3 className="font-bold text-base">
                {isHi ? 'कबाड़ साथी मार्गदर्शिका' : 'Kabad Sathi Tutorial'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isHi ? `चरण ${currentStep + 1} / ${STEPS.length}` : `Step ${currentStep + 1} of ${STEPS.length}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onStartVoiceTour && (
              <button
                type="button"
                onClick={() => {
                  stopOfflineSpeech();
                  onClose();
                  onStartVoiceTour();
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100 border border-emerald-400/40 flex items-center gap-1 transition"
                title="स्क्रीन पर चलकर समझें"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isHi ? 'लाइव टूर' : 'Live Tour'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopOfflineSpeech();
                onClose();
              }}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-500/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Tour Callout Banner */}
        {onStartVoiceTour && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="font-semibold">
                {isHi ? 'स्क्रीन पर एक-एक बटन को आवाज़ में समझें:' : 'Want an on-screen voice tour?'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopOfflineSpeech();
                onClose();
                onStartVoiceTour();
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1 flex-shrink-0"
            >
              <Volume2 className="w-3 h-3" />
              <span>{isHi ? 'लाइव वॉयस टूर शुरू करें' : 'Start Voice Tour'}</span>
            </button>
          </div>
        )}

        {/* Step Body */}
        <div className="p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-4xl shadow-xs border border-emerald-100">
            {step.icon}
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-900">
              {isHi ? step.titleHi : step.titleEn}
            </h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {isHi ? step.descHi : step.descEn}
            </p>
          </div>

          {/* Voice read-aloud button for this step */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handlePlayVoice()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isAudioPlaying
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAudioPlaying ? (isHi ? 'आवाज चल रही है...' : 'Speaking...') : (isHi ? '🔊 आवाज में सुनें (हिंदी)' : '🔊 Read Aloud')}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left flex items-start gap-2">
            <span className="text-base">💡</span>
            <span className="font-medium">{isHi ? step.tipHi : step.tipEn}</span>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pt-2">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHi ? 'पीछे' : 'Back'}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <span>{isLast ? (isHi ? 'शुरू करें (लॉट बनाएं)' : 'Get Started') : (isHi ? 'आगे बढ़ें' : 'Next')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

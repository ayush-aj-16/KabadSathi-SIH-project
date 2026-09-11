import React, { useState, useEffect } from 'react';
import { SafetyGuideline, LanguageType } from '../types';
import { INITIAL_SAFETY_GUIDELINES } from '../data/initialData';
import { speakOfflineText, stopOfflineSpeech, isSpeaking } from '../lib/speech';
import { ShieldAlert, Volume2, VolumeX, CheckCircle, XCircle, Flame, HardHat, Tv, Cpu, Info, Sparkles } from 'lucide-react';

interface SafetyTutorialProps {
  language: LanguageType;
}

export const SafetyTutorial: React.FC<SafetyTutorialProps> = ({ language }) => {
  const isHi = language === 'hi';
  const [selectedTopic, setSelectedTopic] = useState<SafetyGuideline>(INITIAL_SAFETY_GUIDELINES[0]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopOfflineSpeech();
    };
  }, []);

  const handleToggleAudio = (guideline: SafetyGuideline) => {
    if (playingId === guideline.id) {
      stopOfflineSpeech();
      setPlayingId(null);
    } else {
      stopOfflineSpeech();
      const textToSpeak = isHi ? guideline.audioTextHi : guideline.audioTextEn;
      const started = speakOfflineText(textToSpeak, isHi ? 'hi' : 'en', () => {
        setPlayingId(null);
      });
      if (started) {
        setPlayingId(guideline.id);
      }
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-amber-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case 'HardHat':
      default:
        return <HardHat className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div id="safety-tutorial-container" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-300" />
              <h2 className="text-lg sm:text-xl font-black">
                {isHi ? 'ई-कचरा सुरक्षा एवं स्वास्थ्य ट्यूटोरियल' : 'E-Waste Safety & Health Tutorial'}
              </h2>
            </div>
            <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
              {isHi
                ? 'यह ट्यूटोरियल और ऑडियो गाइड 100% ऑफलाइन काम करता है। कभी भी इंटरनेट के बिना सुन व पढ़ सकते हैं।'
                : 'Offline-ready safety guidelines and audio narration to protect informal collectors from toxic e-waste hazards.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-2 self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isHi ? '🔊 100% ऑफलाइन ऑडियो उपलब्ध' : '🔊 Offline Audio Voice Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Topics Navigator, Right Guideline Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Topics List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
            {isHi ? 'सुरक्षा विषय चुनें:' : 'Safety Modules:'}
          </span>
          {INITIAL_SAFETY_GUIDELINES.map((item) => {
            const isSelected = selectedTopic.id === item.id;
            return (
              <button
                key={item.id}
                id={`btn-safety-topic-${item.id}`}
                type="button"
                onClick={() => setSelectedTopic(item)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  isSelected
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-100 mt-0.5">
                  {renderIcon(item.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {isHi ? item.titleHi : item.titleEn}
                    </span>
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 ${
                    item.hazardLevel === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    item.hazardLevel === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.hazardLevel} Hazard
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Guideline Detail View */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs">
          {/* Header of selected guide */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  {renderIcon(selectedTopic.icon)}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {isHi ? selectedTopic.titleHi : selectedTopic.titleEn}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isHi ? selectedTopic.summaryHi : selectedTopic.summaryEn}
              </p>
            </div>

            {/* Offline Audio Read-Aloud Button */}
            <button
              id="btn-play-offline-audio"
              type="button"
              onClick={() => handleToggleAudio(selectedTopic)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition flex-shrink-0 ${
                playingId === selectedTopic.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm'
              }`}
            >
              {playingId === selectedTopic.id ? (
                <>
                  <VolumeX className="w-4 h-4 animate-pulse" />
                  <span>{isHi ? 'ऑडियो रोकें' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{isHi ? '🔊 ऑडियो सुनें (ऑफ़लाइन)' : '🔊 Read Aloud (Offline)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isHi ? 'सुरक्षित तरीके से काम करने के नियम:' : 'Step-by-Step Safe Handling Procedure:'}
            </h4>
            <div className="space-y-2">
              {(isHi ? selectedTopic.stepsHi : selectedTopic.stepsEn).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Do's and Don'ts Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* DO's */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{isHi ? 'क्या करें (DOs)' : 'Always Do'}</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-emerald-800">
                {(isHi ? selectedTopic.dosHi : selectedTopic.dosEn).map((doItem, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>{doItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'Ts */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{isHi ? 'क्या न करें (DON\'Ts)' : 'Never Do'}</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-rose-800">
                {(isHi ? selectedTopic.dontsHi : selectedTopic.dontsEn).map((dontItem, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span>{dontItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

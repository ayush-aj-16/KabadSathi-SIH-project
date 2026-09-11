import React, { useState, useEffect, useRef } from 'react';
import { EWasteLot, MaterialPrice, LanguageType, NetworkStatusType, AIDetectionResult, DetectedEWasteItem } from '../types';
import { createOfflineLot } from '../lib/offlineStore';
import { classifyEWasteImage } from '../lib/gemini';
import { speakOfflineText, stopOfflineSpeech, listenForSpeech, parseSpokenWeight } from '../lib/speech';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Scale,
  ArrowRight,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  HelpCircle,
  Clock,
  Info
} from 'lucide-react';

interface CreateLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLotCreated: (newLot: EWasteLot) => void;
  prices: MaterialPrice[];
  networkStatus: NetworkStatusType;
  language: LanguageType;
}

// Quick Sample Presets for low-end devices or desktop testing without webcam
const SAMPLE_PRESETS = [
  {
    nameEn: 'Laptop (Complete Device)',
    nameHi: 'लैपटॉप (पूरा डिवाइस)',
    nameMr: 'लॅपटॉप (संपूर्ण डिव्हाइस)',
    icon: '💻',
    tag: 'Whole Device',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=70',
    hint: 'laptop complete device notebook',
    defaultWeight: 2.5,
  },
  {
    nameEn: 'Motherboard / PCB',
    nameHi: 'मदरबोर्ड / सर्किट बोर्ड',
    nameMr: 'मदरबोर्ड / सर्किट बोर्ड',
    icon: '🧠',
    tag: 'Component',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=70',
    hint: 'motherboard pcb server circuit board',
    defaultWeight: 3.2,
  },
  {
    nameEn: 'Smartphone (Mobile)',
    nameHi: 'स्मार्टफोन / मोबाइल',
    nameMr: 'स्मार्टफोन / मोबाइल',
    icon: '📱',
    tag: 'Whole Device',
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=70',
    hint: 'smartphone mobile phone pcb battery',
    defaultWeight: 1.2,
  },
  {
    nameEn: 'Copper Cables & Wires',
    nameHi: 'तांबे के तार व केबल्स',
    nameMr: 'तांब्याची वायर आणि केबल्स',
    icon: '🔗',
    tag: 'Materials',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=70',
    hint: 'copper cables insulated wires',
    defaultWeight: 8.0,
  },
  {
    nameEn: 'Multiple Items Bundle',
    nameHi: 'कई सामान (बंडल)',
    nameMr: 'अनेक वस्तू (बंडल)',
    icon: '📦',
    tag: 'Multiple Objects',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=70',
    hint: 'multiple items combo laptop charger cables mouse',
    defaultWeight: 4.5,
  },
  {
    nameEn: 'Non-Scrap Demo (Coffee Cup)',
    nameHi: 'गैर-कचरा डेमो (कॉफ़ी कप)',
    nameMr: 'ई-कचरा नसलेला डेमो (कप)',
    icon: '☕',
    tag: 'Non-Scrap Test',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=70',
    hint: 'food coffee cup non-scrap bottle human',
    defaultWeight: 0.5,
  },
  {
    nameEn: 'Blurry / Unclear Photo',
    nameHi: 'धुंधली फोटो डेमो',
    nameMr: 'अस्पष्ट फोटो डेमो',
    icon: '🌫️',
    tag: 'Uncertain Test',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=70',
    hint: 'blur dark unclear uncertain photo',
    defaultWeight: 1.0,
  },
];

type ModalStep = 'photo' | 'analyzing' | 'result' | 'weight' | 'success';

export const CreateLotModal: React.FC<CreateLotModalProps> = ({
  isOpen,
  onClose,
  onLotCreated,
  prices,
  networkStatus,
  language,
}) => {
  const isHi = language === 'hi';
  const isMr = language === 'mr';
  const isOnline = networkStatus === 'online' || networkStatus === 'synced';

  // Step state
  const [step, setStep] = useState<ModalStep>('photo');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoHint, setPhotoHint] = useState<string>('');
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedEWasteItem[]>([]);
  const [weightKg, setWeightKg] = useState<number>(5.0);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [spokenFeedback, setSpokenFeedback] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [isAddingCustomItem, setIsAddingCustomItem] = useState<boolean>(false);
  const [createdLot, setCreatedLot] = useState<EWasteLot | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeSpeechController, setActiveSpeechController] = useState<{ stop: () => void } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    const legacyNavigator = navigator as Navigator & {
      webkitGetUserMedia?: (
        constraints: MediaStreamConstraints,
        onSuccess: (stream: MediaStream) => void,
        onError: (error: DOMException) => void,
      ) => void;
    };
    const getLegacyUserMedia = legacyNavigator.webkitGetUserMedia;

    if (!navigator.mediaDevices?.getUserMedia && !getLegacyUserMedia) {
      // Embedded/non-secure previews may not expose getUserMedia. The native image
      // picker still lets mobile browsers open their camera through capture="environment".
      imagePickerRef.current?.click();
      setCameraError(
        window.isSecureContext
          ? 'Live camera preview is unavailable in this embedded browser. Open Kabad Sathi in Chrome, Edge, Firefox, or Safari to use your laptop webcam.'
          : 'Live camera preview requires a secure address. Open the app at http://localhost:3000 on this laptop, or deploy it with HTTPS.',
      );
      return;
    }

    setCameraError('');
    try {
      const constraints: MediaStreamConstraints = {
        // "environment" selects the rear camera on phones; laptops automatically use their webcam.
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      };
      const stream = navigator.mediaDevices?.getUserMedia
        ? await navigator.mediaDevices.getUserMedia(constraints)
        : await new Promise<MediaStream>((resolve, reject) => getLegacyUserMedia!(constraints, resolve, reject));
      mediaStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      const reason = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : 'Could not start the camera. Check that it is available and that this app is opened on HTTPS or localhost.';
      setCameraError(reason);
    }
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    handlePhotoCaptured(image, 'live camera photo');
  };

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      stopOfflineSpeech();
      if (activeSpeechController) activeSpeechController.stop();
      setStep('photo');
      setPhotoPreview('');
      setPhotoHint('');
      setAiResult(null);
      setDetectedItems([]);
      setWeightKg(5.0);
      setSpokenFeedback('');
      setCreatedLot(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => setCameraError('Camera preview could not start. Please try again.'));
    }
  }, [isCameraOpen]);

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  if (!isOpen) return null;

  // Voice narration helper
  const speakText = (text: string) => {
    speakOfflineText(text, language);
  };

  // 1. Handle Photo Selection -> Auto-trigger AI Analysis
  const handlePhotoCaptured = (photoUrlOrBase64: string, hint: string = '') => {
    setPhotoPreview(photoUrlOrBase64);
    setPhotoHint(hint);
    setStep('analyzing');

    // Friendly audio prompt
    const waitMsg = isHi
      ? 'कृपया थोड़ा इंतजार करें। फोटो का विश्लेषण हो रहा है।'
      : isMr
      ? 'कृपया थोडा वेळ थांबा. फोटोची तपासणी सुरू आहे.'
      : 'Please wait a moment. Analyzing electronic scrap.';
    speakText(waitMsg);

    // Call AI vision engine
    setTimeout(async () => {
      try {
        const result = await classifyEWasteImage(photoUrlOrBase64, hint, isOnline, language);
        setAiResult(result);
        setDetectedItems(result.items || []);
        setStep('result');

        // Voice feedback based on detection
        if (!result.is_e_waste) {
          const nonScrapVoice = isHi
            ? result.voiceExplanationHi || 'कृपया इलेक्ट्रॉनिक कचरे की फोटो लें। यह ई-वेस्ट नहीं लगता है।'
            : isMr
            ? result.voiceExplanationMr || 'कृपया इलेक्ट्रॉनिक कचऱ्याचा फोटो घ्या. हा ई-कचरा वाटत नाही.'
            : result.voiceExplanationEn || 'Please take a photo of electronic waste. This does not look like e-waste.';
          speakText(nonScrapVoice);
        } else if (result.uncertain) {
          const uncertainVoice = isHi
            ? result.voiceExplanationHi || 'फोटो साफ नहीं दिख रही है। कृपया अच्छी रोशनी में दोबारा फोटो लें।'
            : isMr
            ? result.voiceExplanationMr || 'फोटो स्पष्ट दिसत नाही. कृपया चांगल्या प्रकाशात पुन्हा फोटो घ्या.'
            : result.voiceExplanationEn || 'The photo is not clear. Please take another photo in good lighting.';
          speakText(uncertainVoice);
        } else {
          const successVoice = isHi
            ? result.voiceExplanationHi
            : isMr
            ? result.voiceExplanationMr
            : result.voiceExplanationEn;
          speakText(successVoice || 'इलेक्ट्रॉनिक सामान पहचाना गया है।');
        }
      } catch (err) {
        console.warn('AI analysis error, fallback to general scrap:', err);
        setStep('result');
      }
    }, 750);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handlePhotoCaptured(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setDetectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selected: item.selected === false ? true : false } : item
      )
    );
  };

  // Add custom manual item
  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    const newItem: DetectedEWasteItem = {
      id: `custom-item-${Date.now()}`,
      nameEn: newItemName.trim(),
      nameHi: newItemName.trim(),
      nameMr: newItemName.trim(),
      category: 'General E-Waste',
      icon: '📦',
      confidence: 1.0,
      confidenceTier: 'high',
      isConfirmedVisible: true,
      status: 'confirmed',
      estimatedRateKg: 150,
      selected: true,
    };
    setDetectedItems(prev => [...prev, newItem]);
    setNewItemName('');
    setIsAddingCustomItem(false);
  };

  // Voice weight listening
  const handleStartVoiceWeight = () => {
    if (isListeningMic) {
      if (activeSpeechController) activeSpeechController.stop();
      setIsListeningMic(false);
      return;
    }

    const controller = listenForSpeech(
      language,
      (transcript) => {
        setIsListeningMic(false);
        const parsed = parseSpokenWeight(transcript);
        if (parsed !== null && parsed > 0) {
          setWeightKg(parsed);
          setSpokenFeedback(`${transcript} -> ${parsed} kg`);
          const confirmMsg = isHi
            ? `${parsed} किलो वजन दर्ज किया गया`
            : isMr
            ? `${parsed} किलो वजन नोंदवले गेले`
            : `Set weight to ${parsed} kilograms`;
          speakText(confirmMsg);
        } else {
          setSpokenFeedback(`सुना: "${transcript}" (वजन समझ नहीं आया)`);
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListeningMic(false);
      }
    );

    if (controller) {
      setActiveSpeechController(controller);
      setIsListeningMic(true);
      setSpokenFeedback(isHi ? 'बोलिए... जैसे "दस किलो" या "5"' : 'Listening... speak weight');
    }
  };

  // Calculate pricing
  const selectedItems = detectedItems.filter(item => item.selected !== false);
  const primaryItem = selectedItems[0] || detectedItems[0];

  // Lookup matching price from Firebase cached prices
  const matchedPrice = prices.find(p =>
    primaryItem && (
      p.category.toLowerCase().includes(primaryItem.category.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(primaryItem.nameEn.toLowerCase())
    )
  );

  const effectiveRate = primaryItem?.estimatedRateKg || matchedPrice?.pricePerKg || 350;
  const estimatedTotal = Math.round(weightKg * effectiveRate);

  // Confirm and save lot
  const handleConfirmAndSaveLot = async () => {
    setIsSaving(true);
    try {
      const lotTitle = primaryItem
        ? isHi ? primaryItem.nameHi : isMr ? primaryItem.nameMr : primaryItem.nameEn
        : 'E-Waste Lot';

      const newLot = await createOfflineLot({
        collectorId: 'USER-COLLECTOR-101',
        collectorName: 'Raju Sharma',
        materialCategory: primaryItem?.category || 'General E-Waste',
        materialName: lotTitle,
        approxWeightKg: weightKg,
        estimatedRatePerKg: effectiveRate,
        estimatedTotalValue: estimatedTotal,
        photoUrl: photoPreview,
        status: 'submitted',
        aiClassification: aiResult ? {
          identifiedItem: aiResult.titleEn || primaryItem?.nameEn || 'Identified Scrap',
          confidence: aiResult.confidence,
          recommendedHazardTier: aiResult.hazardTier || 'Medium',
          recyclingGuidance: isHi ? (aiResult.safetyGuidanceHi || '') : (aiResult.safetyGuidanceEn || ''),
          offlineRuleBased: aiResult.offlineRuleBased,
          uncertain: aiResult.uncertain,
          objectType: aiResult.object_type,
          detectedItems: selectedItems,
        } : undefined,
        detectedItems: selectedItems,
      });

      setCreatedLot(newLot);
      onLotCreated(newLot);
      setStep('success');

      // Audio confirmation
      const successAudio = isHi
        ? 'लॉट तैयार हो गया है और फोन में सुरक्षित सेव कर दिया गया है।'
        : isMr
        ? 'लॉट तयार झाला आहे आणि फोनमध्ये सुरक्षित सेव्ह केला आहे.'
        : 'Lot created successfully and saved on phone.';
      speakText(successAudio);
    } catch (err) {
      console.error('Failed to create lot:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="create-lot-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div id="create-lot-card" className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* 1. Accessible Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
              📷
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg leading-tight">
                {isHi ? 'कचरा जोड़ें (AI पहचान)' : isMr ? 'कचरा जोडा (AI ओळख)' : 'Add E-Waste (AI Scan)'}
              </h2>
              <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
                {networkStatus === 'offline' ? (
                  <span className="font-semibold text-rose-200">🔴 {isHi ? 'ऑफलाइन AI मोड' : isMr ? 'ऑफलाइन AI मोड' : 'Offline AI Mode'}</span>
                ) : (
                  <span className="font-semibold text-emerald-200">🟢 {isHi ? 'ऑनलाइन AI सक्रिय' : isMr ? 'ऑनलाइन AI सक्रिय' : 'Online AI Active'}</span>
                )}
                <span>•</span>
                <span>{isHi ? 'फोटो से ऑटो-पहचान' : isMr ? 'फोटोवरून स्वयंचलित ओळख' : 'Visual First'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Flow Steps Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 'photo' ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'photo' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>{isHi ? 'फोटो' : isMr ? 'फोटो' : 'Photo'}</span>
          </div>
          <div className="w-4 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'analyzing' || step === 'result' ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'analyzing' || step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>{isHi ? 'AI पहचान' : isMr ? 'AI ओळख' : 'AI Analysis'}</span>
          </div>
          <div className="w-4 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'weight' ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'weight' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>{isHi ? 'वजन' : isMr ? 'वजन' : 'Weight'}</span>
          </div>
          <div className="w-4 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
            <span>{isHi ? 'Lot तैयार' : isMr ? 'लॉट तयार' : 'Lot Done'}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* =============================================================== */}
          {/* STEP 1: PHOTO CAPTURE / UPLOAD / SAMPLES                         */}
          {/* =============================================================== */}
          {step === 'photo' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900">
                  {isHi ? 'इलेक्ट्रॉनिक कचरे की फोटो लें' : isMr ? 'इलेक्ट्रॉनिक कचऱ्याचा फोटो घ्या' : 'Take a photo of electronic scrap'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHi
                    ? 'AI अपने आप पहचान लेगा कि यह क्या है और इसमें क्या कीमती सामान है'
                    : isMr
                    ? 'AI आपोआप ओळखेल की ही काय वस्तू आहे आणि यामध्ये काय मौल्यवान घटक आहेत'
                    : 'AI will automatically detect the item, recoverable parts, and estimated price.'}
                </p>
              </div>

              {isCameraOpen ? (
                <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-slate-950 shadow-sm">
                  <video ref={videoRef} autoPlay playsInline muted className="block max-h-80 w-full object-cover" />
                  <div className="flex gap-3 bg-slate-900 p-3">
                    <button type="button" onClick={stopCamera} className="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white">
                      {isHi ? 'रद्द करें' : isMr ? 'रद्द करा' : 'Cancel'}
                    </button>
                    <button type="button" onClick={captureCameraPhoto} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white">
                      {isHi ? 'फोटो लें' : isMr ? 'फोटो घ्या' : 'Capture Photo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={startCamera} className="block rounded-3xl border-3 border-dashed border-emerald-400 bg-emerald-50 p-6 text-center shadow-sm transition hover:bg-emerald-100/70 active:scale-98">
                    <div className="mb-3 flex justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg"><Camera className="h-10 w-10" /></span></div>
                    <div className="text-lg font-black text-emerald-900">{isHi ? 'कैमरा खोलें' : isMr ? 'कॅमेरा उघडा' : 'Open Camera'}</div>
                    <p className="mt-1 text-xs font-medium text-emerald-700">{isHi ? 'लाइव फोटो लेने के लिए' : isMr ? 'थेट फोटो घेण्यासाठी' : 'Take a live photo'}</p>
                  </button>
                  <label className="cursor-pointer block rounded-3xl border-3 border-dashed border-emerald-400 bg-emerald-50 p-6 text-center shadow-sm transition hover:bg-emerald-100/70 active:scale-98">
                    <div className="mb-3 flex justify-center"><span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg"><Upload className="h-10 w-10" /></span></div>
                    <div className="text-lg font-black text-emerald-900">{isHi ? 'फोटो अपलोड करें' : isMr ? 'फोटो अपलोड करा' : 'Upload Photo'}</div>
                    <p className="mt-1 text-xs font-medium text-emerald-700">{isHi ? 'फोन की गैलरी से चुनें' : isMr ? 'फोन गॅलरीमधून निवडा' : 'Choose from your gallery'}</p>
                    <input ref={imagePickerRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
              {cameraError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{cameraError}</p>}

              {/* Quick Sample Presets for Testing */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isHi ? '⚡ या तुरंत टेस्ट के लिए नमूना चुनें:' : isMr ? '⚡ किंवा त्वरित चाचणीसाठी नमुना निवडा:' : '⚡ Or tap a quick test sample:'}
                  </span>
                  <span className="text-[10px] text-slate-400">1-Tap Demo</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePhotoCaptured(preset.url, preset.hint)}
                      className="p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition flex flex-col justify-between group active:scale-95 bg-white shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {preset.tag}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">
                          {isHi ? preset.nameHi : isMr ? preset.nameMr : preset.nameEn}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 2: AI ANALYZING ANIMATION                                  */}
          {/* =============================================================== */}
          {step === 'analyzing' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-xl">
                {photoPreview ? (
                  <img src={photoPreview} alt="Scrap preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
                {/* Radar Scanning Line Animation */}
                <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>{isOnline ? 'Google Gemini AI' : 'Offline Rule Engine'}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {isHi ? '🤖 फोटो समझ रहे हैं...' : isMr ? '🤖 फोटो समजून घेत आहोत...' : '🤖 Analyzing Photo...'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {isHi
                    ? 'सामान, अंदर के पुर्जे और सुरक्षा की जांच की जा रही है'
                    : isMr
                    ? 'वस्तू, आतील घटक आणि सुरक्षिततेची तपासणी सुरू आहे'
                    : 'Detecting device, internal components, and safety hazards...'}
                </p>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 3: AI RESULT & CONFIRMATION                                */}
          {/* =============================================================== */}
          {step === 'result' && aiResult && (
            <div className="space-y-4">

              {/* CASE A: NON-SCRAP DETECTED */}
              {!aiResult.is_e_waste ? (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-rose-900">
                      {isHi ? 'यह ई-वेस्ट नहीं लगता' : isMr ? 'हा ई-कचरा वाटत नाही' : 'This does not look like e-waste'}
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 max-w-sm mx-auto leading-relaxed">
                      {isHi
                        ? 'AI ने पहचाना कि यह इलेक्ट्रॉनिक कचरा नहीं है। कृपया लैपटॉप, मोबाइल, तार, टीवी, या सर्किट बोर्ड की फोटो लें।'
                        : isMr
                        ? 'AI ला आढळले की हा इलेक्ट्रॉनिक कचरा नाही. कृपया लॅपटॉप, मोबाइल, वायर, टीव्ही किंवा सर्किट बोर्डचा फोटो घ्या.'
                        : 'AI detected that this is not electronic scrap. Please take a photo of computers, phones, cables, TVs, or circuit boards.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakText(isHi ? aiResult.voiceExplanationHi : isMr ? aiResult.voiceExplanationMr : aiResult.voiceExplanationEn)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold shadow-xs hover:bg-rose-100/50"
                    >
                      <Volume2 className="w-4 h-4 text-rose-600" />
                      <span>{isHi ? '🔊 आवाज में सुनें' : isMr ? '🔊 आवाजात ऐका' : '🔊 Listen'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('photo');
                      setPhotoPreview('');
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl shadow-md transition text-base flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{isHi ? '📷 फिर से फोटो लें' : isMr ? '📷 पुन्हा फोटो घ्या' : '📷 Retake Photo'}</span>
                  </button>
                </div>
              ) : aiResult.uncertain ? (
                /* CASE B: UNCERTAIN / BLURRY PHOTO */
                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl">
                    🤔
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-amber-900">
                      {isHi ? 'पहचान पक्की नहीं है' : isMr ? 'ओळख खात्रीशीर नाही' : 'Uncertain Identification'}
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 max-w-sm mx-auto leading-relaxed">
                      {isHi
                        ? 'फोटो साफ नहीं दिख रही है। अच्छी रोशनी में फिर से फोटो लेने की सलाह दी जाती है।'
                        : isMr
                        ? 'फोटो स्पष्ट दिसत नाही. चांगल्या प्रकाशात पुन्हा फोटो घेण्याचा सल्ला दिला जातो.'
                        : 'The photo is blurry or dark. It is recommended to retake the photo in bright lighting.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('photo');
                        setPhotoPreview('');
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-2xl shadow-sm transition text-sm flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isHi ? '📷 फिर से फोटो लें' : isMr ? '📷 पुन्हा फोटो घ्या' : '📷 Retake Photo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('weight')}
                      className="flex-1 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 font-bold py-3.5 rounded-2xl transition text-sm flex items-center justify-center gap-1.5"
                    >
                      <span>{isHi ? 'फिर भी आगे बढ़ें' : isMr ? 'तरीही पुढे जा' : 'Proceed Anyway'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* CASE C: SUCCESSFUL E-WASTE IDENTIFICATION */
                <div className="space-y-4">
                  {/* Identification Header Banner */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-emerald-300 shadow-sm flex-shrink-0 relative">
                        {photoPreview && (
                          <img src={photoPreview} alt="Detected" className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
                          {aiResult.object_type === 'complete_device' ? 'Device' : 'Parts'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            {isHi ? 'AI ने पहचाना:' : isMr ? 'AI ने ओळखले:' : 'AI Detected:'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            aiResult.confidenceTier === 'high'
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}>
                            {aiResult.confidenceTier === 'high'
                              ? isHi ? '🟢 पक्की पहचान' : isMr ? '🟢 खात्रीशीर' : '🟢 Clearly Identified'
                              : isHi ? '🟡 संभावित' : isMr ? '🟡 संभाव्य' : '🟡 Likely'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                          {isHi ? aiResult.titleHi : isMr ? aiResult.titleMr : aiResult.titleEn}
                        </h3>
                      </div>
                    </div>

                    {/* Audio Listen Button */}
                    <button
                      type="button"
                      onClick={() => speakText(isHi ? aiResult.voiceExplanationHi : isMr ? aiResult.voiceExplanationMr : aiResult.voiceExplanationEn)}
                      className="w-11 h-11 rounded-2xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center transition shadow-xs active:scale-95 flex-shrink-0"
                      title={isHi ? 'आवाज में सुनें' : 'Listen voice explanation'}
                    >
                      <Volume2 className="w-5 h-5 text-emerald-700 animate-pulse" />
                    </button>
                  </div>

                  {/* Components / Recoverable Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📦</span>
                        <span>
                          {aiResult.object_type === 'complete_device'
                            ? isHi ? 'इसमें ये सामान हो सकता है:' : isMr ? 'यामध्ये या वस्तू असू शकतात:' : 'Recoverable Parts Detected:'
                            : isHi ? 'पहचाने गए सामान:' : isMr ? 'आढळलेल्या वस्तू:' : 'Detected Items:'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {selectedItems.length} {isHi ? 'चुने गए' : isMr ? 'निवडले' : 'selected'}
                      </span>
                    </div>

                    {/* Component Item Cards */}
                    <div className="space-y-2">
                      {detectedItems.map((item) => {
                        const isSelected = item.selected !== false;
                        const itemName = isHi ? item.nameHi : isMr ? item.nameMr : item.nameEn;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                                : 'bg-slate-50/60 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Checkbox Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleItemSelection(item.id)}
                                className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                              </button>

                              {/* Item Icon */}
                              <span className="text-2xl">{item.icon || '📦'}</span>

                              {/* Item Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 leading-tight">
                                    {itemName}
                                  </span>
                                  {item.status === 'confirmed' ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                      {isHi ? 'पुष्ट' : isMr ? 'पुष्ट' : 'Confirmed'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                      {isHi ? 'संभावित' : isMr ? 'संभाव्य' : 'Possible'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {isHi ? 'अनुमानित भाव:' : isMr ? 'अंदाजे दर:' : 'Benchmark:'} ₹{item.estimatedRateKg || 350}/kg
                                </div>
                              </div>
                            </div>

                            {/* Voice Button per item */}
                            <button
                              type="button"
                              onClick={() => speakText(itemName)}
                              className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Listen"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Custom Item Button */}
                    {!isAddingCustomItem ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomItem(true)}
                        className="mt-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isHi ? '➕ कोई दूसरा सामान जोड़ें' : isMr ? '➕ दुसरी वस्तू जोडा' : '➕ Add Other Component'}</span>
                      </button>
                    ) : (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder={isHi ? 'सामान का नाम लिखें' : 'Enter component name'}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomItem}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                        >
                          {isHi ? 'जोड़ें' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomItem(false)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Decision Box: क्या सही है? */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4">
                    <div className="text-center font-bold text-slate-800 text-sm mb-3">
                      {isHi ? 'क्या यह पहचान सही है?' : isMr ? 'ही ओळख बरोबर आहे का?' : 'Is this identification correct?'}
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('photo');
                          setPhotoPreview('');
                        }}
                        className="flex-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-bold py-3.5 rounded-2xl transition text-sm flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-500" />
                        <span>{isHi ? '❌ गलत है / फिर से लें' : isMr ? '❌ चूक / पुन्हा घ्या' : '❌ Retake'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep('weight')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-md transition text-sm flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>{isHi ? '✅ हाँ, सही है (वजन दर्ज करें)' : isMr ? '✅ होय, बरोबर आहे' : '✅ Yes, Correct'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 4: ⚖️ WEIGHT & VALUE ESTIMATION                           */}
          {/* =============================================================== */}
          {step === 'weight' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900">
                  {isHi ? '⚖️ वजन कितना है?' : isMr ? '⚖️ वजन किती आहे?' : '⚖️ What is the weight?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHi ? 'बटन दबाकर या बोलकर वजन दर्ज करें' : isMr ? 'बटण दाबून किंवा बोलून वजन नोंदवा' : 'Tap buttons or use your voice'}
                </p>
              </div>

              {/* Large Accessible Stepper */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 text-center">
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setWeightKg(prev => Math.max(0.5, Math.round((prev - 1.0) * 10) / 10))}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-800 font-black text-2xl flex items-center justify-center shadow-xs active:scale-95 transition"
                  >
                    -1
                  </button>

                  <div className="min-w-[130px]">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {weightKg.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-500 ml-1">kg</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWeightKg(prev => Math.round((prev + 1.0) * 10) / 10)}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-800 font-black text-2xl flex items-center justify-center shadow-xs active:scale-95 transition"
                  >
                    +1
                  </button>
                </div>

                {/* Micro step adjustments */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setWeightKg(prev => Math.max(0.1, Math.round((prev - 0.1) * 10) / 10))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    -0.1 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightKg(prev => Math.round((prev + 0.1) * 10) / 10)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +0.1 kg
                  </button>
                </div>
              </div>

              {/* Quick Weight Chips */}
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 5, 10, 25, 50].map((kg) => (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setWeightKg(kg)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      weightKg === kg
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {kg} kg
                  </button>
                ))}
              </div>

              {/* 🎙️ Voice Weight Input Button */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleStartVoiceWeight}
                  className={`w-full py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 border-2 ${
                    isListeningMic
                      ? 'bg-rose-50 border-rose-500 text-rose-800 animate-pulse'
                      : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {isListeningMic ? (
                    <>
                      <MicOff className="w-5 h-5 text-rose-600" />
                      <span>{isHi ? 'सुन रहे हैं... वजन बोलिए' : isMr ? 'ऐकत आहोत... वजन बोला' : 'Listening... Speak Weight'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-emerald-700" />
                      <span>{isHi ? '🎙️ बोलकर वजन बताएं' : isMr ? '🎙️ बोलून वजन सांगा' : '🎙️ Speak Weight in Hindi/English'}</span>
                    </>
                  )}
                </button>
                {spokenFeedback && (
                  <div className="text-center text-[11px] font-semibold text-emerald-700">
                    {spokenFeedback}
                  </div>
                )}
              </div>

              {/* 💰 Estimated Value Card */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 font-bold block">
                      {isHi ? '💰 अनुमानित कीमत (Estimated Value):' : isMr ? '💰 अंदाजे किंमत:' : '💰 Estimated Scrap Value:'}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">
                      {weightKg} kg × ₹{effectiveRate}/kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                      ₹{estimatedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {isHi ? 'अंतिम कीमत रिसाइक्लर जांच के बाद तय करेगा' : isMr ? 'अंतिम किंमत रिसायकलर ठरवेल' : 'Subject to recycler verification'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => speakText(
                      isHi
                        ? `अनुमानित कीमत ${estimatedTotal} रुपये है। अंतिम कीमत रिसाइक्लर जांच के बाद तय करेगा।`
                        : `Estimated value is ${estimatedTotal} rupees.`
                    )}
                    className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isHi ? 'सुनें' : 'Listen'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('result')}
                  className="w-14 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  disabled={isSaving || weightKg <= 0}
                  onClick={handleConfirmAndSaveLot}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition text-base flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>📦</span>
                  <span>
                    {isSaving
                      ? isHi ? 'सेव हो रहा है...' : 'Saving...'
                      : networkStatus === 'offline'
                      ? isHi ? 'लॉट फोन में सेव करें (Offline)' : 'Save Lot on Phone (Offline)'
                      : isHi ? 'Lot तैयार करें (Create Lot)' : 'Create Lot'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 5: SUCCESS / CREATED LOT CARD                              */}
          {/* =============================================================== */}
          {step === 'success' && createdLot && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {isHi ? '📦 Lot तैयार हो गया!' : isMr ? '📦 लॉट तयार झाला!' : '📦 Lot Created Successfully!'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {networkStatus === 'offline'
                    ? isHi ? 'लॉट आपके फोन पर सेव है। इंटरनेट आने पर सिंक होगा।' : 'Saved on phone. Will sync when online.'
                    : isHi ? 'लॉट Firebase क्लाउड में दर्ज हो चुका है।' : 'Lot synced to Firebase cloud.'}
                </p>
              </div>

              {/* Digital Lot Badge Box */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {isHi ? 'लॉट नंबर (Lot ID):' : 'Lot Reference ID:'}
                  </span>
                  <span className="font-mono font-black text-sm bg-slate-200 text-slate-900 px-2.5 py-1 rounded-xl">
                    {createdLot.localId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{isHi ? 'सामग्री:' : 'Material:'}</span>
                  <span className="font-bold text-slate-800 text-sm">{createdLot.materialName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{isHi ? 'वजन:' : 'Weight:'}</span>
                  <span className="font-bold text-slate-800 text-sm">{createdLot.approxWeightKg} kg</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500">{isHi ? 'अनुमानित कुल कमाई:' : 'Estimated Value:'}</span>
                  <span className="text-lg font-black text-emerald-700">₹{createdLot.estimatedTotalValue.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition text-base shadow-md"
              >
                {isHi ? 'ठीक है (लॉट सूची देखें)' : isMr ? 'ठीक आहे (लॉट यादी पहा)' : 'Done (View in My Lots)'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

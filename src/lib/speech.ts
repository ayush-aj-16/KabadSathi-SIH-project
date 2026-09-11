// Speech Synthesis engine for offline audio read-aloud (Hindi & English)
// Operates 100% client-side without any internet or external API call.

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (cachedVoices.length === 0) {
      cachedVoices = window.speechSynthesis.getVoices();
    }
    return cachedVoices;
  }
  return [];
}

export function speakOfflineText(
  text: string,
  lang: 'hi' | 'mr' | 'en' = 'hi',
  onEnd?: () => void,
  onStart?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[Speech] Speech synthesis not supported in this environment');
    if (onEnd) onEnd();
    return false;
  }

  try {
    // Cancel any active speech first
    window.speechSynthesis.cancel();

    // Resume if in paused state (browser security edge cases)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    const voices = getAvailableVoices();
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      // Look for Hindi voice
      const hindiVoice = voices.find(
        v =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.lang.toLowerCase().includes('hi-in') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('swara')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    } else if (lang === 'mr') {
      utterance.lang = 'mr-IN';
      const marathiVoice = voices.find(
        v =>
          v.lang.toLowerCase().startsWith('mr') ||
          v.lang.toLowerCase().includes('mr-in') ||
          v.name.toLowerCase().includes('marathi')
      );
      if (marathiVoice) {
        utterance.voice = marathiVoice;
      } else {
        // Fallback to Hindi voice which phonetically pronounces Devanagari Marathi well
        const hiFallback = voices.find(
          v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );
        if (hiFallback) utterance.voice = hiFallback;
      }
    } else {
      utterance.lang = 'en-IN';
      const engVoice = voices.find(
        v =>
          v.lang === 'en-IN' ||
          v.lang.startsWith('en-IN') ||
          v.lang === 'en-GB' ||
          v.lang === 'en-US'
      );
      if (engVoice) utterance.voice = engVoice;
    }

    utterance.rate = 0.95; // slightly slower for crisp clarity on phones
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[Speech] Error speaking text:', e);
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[Speech] Failed to speak:', err);
    if (onEnd) onEnd();
    return false;
  }
}

// Convert spoken Hindi / Marathi / English numbers to digits
export function parseSpokenWeight(rawSpoken: string): number | null {
  if (!rawSpoken) return null;
  const s = rawSpoken.toLowerCase().trim();

  // Direct digits match (e.g. "10", "10.5", "5 kg")
  const digitMatch = s.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (digitMatch) {
    const num = parseFloat(digitMatch[1]);
    if (!isNaN(num) && num > 0) return num;
  }

  // Common spoken numbers in Hindi & Marathi
  const wordToNum: Record<string, number> = {
    'आधा': 0.5,
    'एक': 1,
    'दोन': 2,
    'दो': 2,
    'तीन': 3,
    'चार': 4,
    'पाच': 5,
    'पांच': 5,
    'पाँच': 5,
    'सहा': 6,
    'छह': 6,
    'सात': 7,
    'आठ': 8,
    'नऊ': 9,
    'नौ': 9,
    'दहा': 10,
    'दस': 10,
    'अकरा': 11,
    'ग्यारह': 11,
    'बारा': 12,
    'बारह': 12,
    'पंधरा': 15,
    'पंद्रह': 15,
    'वीस': 20,
    'बीस': 20,
    'पंचवीस': 25,
    'पच्चीस': 25,
    'तीस': 30,
    'चाळीस': 40,
    'चालीस': 40,
    'पन्नास': 50,
    'पचास': 50,
    'शंभर': 100,
    'सौ': 100,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'fifteen': 15,
    'twenty': 20,
    'twenty five': 25,
    'fifty': 50,
  };

  for (const [word, val] of Object.entries(wordToNum)) {
    if (s.includes(word)) {
      return val;
    }
  }

  return null;
}

// Browser Web Speech recognition helper for voice input
export function listenForSpeech(
  lang: 'hi' | 'mr' | 'en',
  onResult: (text: string) => void,
  onError?: (err: any) => void
): { stop: () => void } | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError(new Error('Speech recognition not supported in browser'));
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (e: any) => {
      if (onError) onError(e);
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

export function stopOfflineSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch (e) {
      console.warn('[Speech] stop error:', e);
    }
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}


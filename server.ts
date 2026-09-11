import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

interface RequestBody {
  photoBase64?: string;
  language?: 'hi' | 'mr' | 'en';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large photo payloads (up to 25MB)
  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: Date.now(),
    });
  });

  // AI Vision E-Waste Recognition Endpoint
  app.post('/api/analyze-image', async (req, res) => {
    const { photoBase64, language = 'hi' } = req.body as RequestBody;

    if (!photoBase64) {
      return res.status(400).json({ error: 'photoBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured on server',
        fallbackNeeded: true,
      });
    }

    try {
      let mimeType = 'image/jpeg';
      let cleanBase64 = photoBase64;

      // Check if data URL
      if (photoBase64.startsWith('data:')) {
        const match = photoBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        }
      } else if (photoBase64.startsWith('http://') || photoBase64.startsWith('https://')) {
        // Fetch remote sample image and convert to base64
        try {
          const fetched = await fetch(photoBase64);
          const arrayBuffer = await fetched.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = fetched.headers.get('content-type');
          if (contentType) mimeType = contentType;
          cleanBase64 = buffer.toString('base64');
        } catch (fetchErr) {
          console.warn('[Server] Failed to fetch remote sample image:', fetchErr);
        }
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are the visual AI e-waste intelligence for "Kabad Sathi" in India, assisting informal scrap collectors with very low literacy.
Inspect this photograph with utmost precision.

CRITICAL INSTRUCTIONS:

1. NON-SCRAP CHECK:
Return "is_e_waste": false ONLY when the image is clearly and confidently an unrelated non-electronic object (e.g. food, animal/pet, road/street, cloth, wooden chair, or plastic water bottle). Do not reject an item simply because it is old, damaged, dismantled, dirty, partially visible, or resembles an ordinary household item.
- "is_e_waste": false
- "object_type": "non_scrap"
- "confidence": 0.95
- "confidenceTier": "high"
- "titleEn": "Not E-Waste"
- "titleHi": "यह ई-वेस्ट नहीं लगता"
- "titleMr": "हा ई-कचरा वाटत नाही"
- "voiceExplanationEn": "Please take a photo of electronic waste. This does not look like e-waste."
- "voiceExplanationHi": "कृपया इलेक्ट्रॉनिक कचरे की फोटो लें। यह ई-वेस्ट नहीं लगता है।"
- "voiceExplanationMr": "कृपया इलेक्ट्रॉनिक कचऱ्याचा फोटो घ्या. हा ई-कचरा वाटत नाही."
- "items": []

2. UNCERTAIN CHECK:
If the photo is blurry, dark, unclear, or you cannot confidently distinguish e-waste from another object, keep "is_e_waste": true and use the uncertain response below. When in doubt, prefer this response over a non-scrap rejection.
- "is_e_waste": true
- "uncertain": true
- "confidence": 0.45
- "confidenceTier": "low"
- "titleEn": "Unclear Photo / Uncertain"
- "titleHi": "पहचान पक्की नहीं है"
- "titleMr": "ओळख खात्रीशीर नाही"
- "voiceExplanationEn": "The photo is not clear. Please take another photo in good lighting."
- "voiceExplanationHi": "फोटो साफ नहीं दिख रही है। कृपया अच्छी रोशनी में दोबारा फोटो लें।"
- "voiceExplanationMr": "फोटो स्पष्ट दिसत नाही. कृपया चांगल्या प्रकाशात पुन्हा फोटो घ्या."
- "items": [
    {
      "id": "item-uncertain",
      "nameEn": "Uncertain Electronic Scrap",
      "nameHi": "अनिश्चित ई-कचरा",
      "nameMr": "अनिश्चित ई-कचरा",
      "category": "Mixed Scrap",
      "icon": "❓",
      "confidence": 0.45,
      "confidenceTier": "low",
      "isConfirmedVisible": false,
      "status": "possible",
      "estimatedRateKg": 120
    }
  ]

3. WHOLE DEVICE DETECTION:
If the image is a COMPLETE ELECTRONIC DEVICE (such as Laptop, Desktop Computer / CPU Tower, Mobile Phone / Smartphone, CRT / LCD Television, Refrigerator, Printer, Monitor, Washing Machine, Microwave, Router, UPS, Keyboard, Mixer/Grinder):
- "is_e_waste": true
- "uncertain": false
- "object_type": "complete_device"
- "primaryLabelEn": "<Device Name e.g. Laptop>",
  "primaryLabelHi": "<Device Name in Hindi e.g. लैपटॉप>",
  "primaryLabelMr": "<Device Name in Marathi e.g. लॅपटॉप>",
- "titleEn": "<Device Name>",
- "titleHi": "<Device Name in Hindi>",
- "titleMr": "<Device Name in Marathi>",
- "voiceExplanationEn": "This looks like a complete <Device>. It may contain a battery, motherboard, and other valuable parts.",
- "voiceExplanationHi": "यह फोटो एक <Device> की लग रही है। इसमें बैटरी, मदरबोर्ड और दूसरी इलेक्ट्रॉनिक चीजें हो सकती हैं।",
- "voiceExplanationMr": "हा फोटो एका <Device>चा वाटतो. यामध्ये बॅटरी, मदरबोर्ड आणि इतर इलेक्ट्रॉनिक वस्तू असू शकतात.",
- In "items":
  First item: The complete device body itself (e.g. Laptop Body, icon: "💻", status: "confirmed", isConfirmedVisible: true, estimatedRateKg: 350)
  Subsequent items: Major recoverable components that can reasonably be present inside this device (e.g. Battery [icon: "🔋", status: "possible", isConfirmedVisible: false, estimatedRateKg: 195], Motherboard [icon: "🧠", status: "possible", isConfirmedVisible: false, estimatedRateKg: 480], Storage Drive [icon: "💾", status: "possible", isConfirmedVisible: false, estimatedRateKg: 280], RAM [icon: "⚡", status: "possible", isConfirmedVisible: false, estimatedRateKg: 700], Charger/Adapter [icon: "🔌", status: "possible", isConfirmedVisible: false, estimatedRateKg: 120], Display/Screen [icon: "🖥️", status: "possible", isConfirmedVisible: false, estimatedRateKg: 90]).
  IMPORTANT: Mark internal components as status: "possible" (संभावित) rather than claiming facts.

4. MULTIPLE OBJECTS DETECTION:
If the photo clearly shows MULTIPLE DISTINCT ELECTRONIC ITEMS (e.g. Laptop + Charger + Mouse + Cables, or 2 Phones + Battery):
- "is_e_waste": true
- "uncertain": false
- "object_type": "multiple_objects"
- "titleEn": "Multiple Items Detected",
- "titleHi": "मुझे ये सामान मिले",
- "titleMr": "मला या वस्तू आढळल्या",
- "voiceExplanationHi": "फोटो में कई सामान दिखे हैं। आप अपनी जरूरत के अनुसार सामान चुन सकते हैं।",
- "items": List each distinct visible object with status: "confirmed", isConfirmedVisible: true, individual icon, nameEn, nameHi, nameMr, estimatedRateKg.

5. SINGLE COMPONENT / MATERIAL:
If it is a single component (e.g. Motherboard, PCB, Battery, RAM, HDD, Copper Cables):
- "is_e_waste": true
- "uncertain": false
- "object_type": "component" or "materials"
- "items": [
    {
      "id": "item-1",
      "nameEn": "Motherboard",
      "nameHi": "मदरबोर्ड",
      "nameMr": "मदरबोर्ड",
      "category": "Circuit Boards (PCB)",
      "icon": "🧠",
      "confidence": 0.94,
      "confidenceTier": "high",
      "isConfirmedVisible": true,
      "status": "confirmed",
      "estimatedRateKg": 480,
      "materialsEn": ["PCB", "Copper", "Gold plating", "Electronic components"],
      "materialsHi": ["पीसीबी", "तांबा", "गोल्ड प्लेटिंग", "इलेक्ट्रॉनिक पुर्जे"],
      "materialsMr": ["पीसीबी", "तांबे", "गोल्ड प्लेटिंग", "इलेक्ट्रॉनिक घटक"]
    }
  ]

Standard Benchmark Indian Scrap Rates:
- Motherboard: ₹480/kg
- Mobile PCB: ₹1250/kg
- Copper cables: ₹640/kg
- Lithium Battery: ₹195/kg
- Complete Laptop: ₹350/kg
- Desktop CPU Tower: ₹180/kg
- CRT / LCD Display: ₹38/kg
- Mixed e-waste: ₹120/kg
- Appliances / Motors: ₹52/kg

Respond STRICTLY with valid JSON following this format:
{
  "is_e_waste": true,
  "uncertain": false,
  "object_type": "complete_device",
  "confidence": 0.94,
  "confidenceTier": "high",
  "primaryLabelEn": "Laptop",
  "primaryLabelHi": "लैपटॉप",
  "primaryLabelMr": "लॅपटॉप",
  "titleEn": "Laptop",
  "titleHi": "लैपटॉप",
  "titleMr": "लॅपटॉप",
  "voiceExplanationEn": "This looks like a laptop. It may contain a battery, motherboard, and other parts.",
  "voiceExplanationHi": "यह फोटो एक लैपटॉप की लग रही है। इसमें बैटरी, मदरबोर्ड और दूसरी इलेक्ट्रॉनिक चीजें हो सकती हैं।",
  "voiceExplanationMr": "हा फोटो एका लॅपटॉपचा वाटतो. यामध्ये बॅटरी, मदरबोर्ड आणि इतर इलेक्ट्रॉनिक वस्तू असू शकतात.",
  "hazardTier": "Medium",
  "safetyGuidanceEn": "Separate lithium battery with care.",
  "safetyGuidanceHi": "खोलने से पहले लिथियम बैटरी को सावधानी से अलग करें।",
  "safetyGuidanceMr": "खोलण्यापूर्वी लिथियम बॅटरी काळजीपूर्वक वेगळी करा.",
  "items": [
    {
      "id": "item-1",
      "nameEn": "Laptop Body",
      "nameHi": "लैपटॉप बॉडी",
      "nameMr": "लॅपटॉप बॉडी",
      "category": "Appliances",
      "icon": "💻",
      "confidence": 0.94,
      "confidenceTier": "high",
      "isConfirmedVisible": true,
      "status": "confirmed",
      "estimatedRateKg": 350,
      "materialsEn": ["Plastic", "Aluminum", "Frame"],
      "materialsHi": ["प्लास्टिक", "एल्यूमीनियम", "बॉडी"],
      "materialsMr": ["प्लास्टिक", "अॅल्युमिनियम", "बॉडी"]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return res.json(parsed);
    } catch (err: any) {
      console.error('[Server] Gemini vision analysis error:', err?.message || err);
      return res.status(500).json({
        error: 'AI analysis failed',
        details: err?.message || String(err),
        fallbackNeeded: true,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kabad Sathi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

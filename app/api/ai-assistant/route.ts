import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { prompt, language = 'mr', history = [] } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback knowledge engine if API key is not yet set in environment
      const fallbackResponse = getFallbackResponse(prompt, language);
      return NextResponse.json({ text: fallbackResponse, source: 'knowledge_base' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are "Chai Guru" (चाय गुरु), an expert mentor and competitive exam coach for Maharashtra & Indian exams (MPSC, UPSC, PSI, STI, ASO, Talathi, Police Bharti, TET/TAIT, Saralseva).
Your personality: Encouraging, concise, academically precise, culturally grounded in Maharashtra, warm like a cup of tea during a study break.
Language instruction: Respond primarily in ${language === 'mr' ? 'authentic, polished Marathi (मराठी)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
Guidelines:
1. Break down complex constitutional articles, geography concepts, or history events into crisp bullet points.
2. Provide memory mnemonics or tricks where applicable.
3. Recommend relevant revision materials from "Chai Revision" (e.g. MPSC Polity Revision Notes, Maharashtra Geography Maps, TCS/IBPS Grammar).
4. Keep the answer structured, scannable, and directly helpful for exam preparation. Avoid fluff.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return NextResponse.json({ text: response.text || 'उत्तर उपलब्ध होऊ शकले नाही.', source: 'gemini' });
  } catch (error: any) {
    console.error('AI assistant error:', error);
    return NextResponse.json({
      text: getFallbackResponse('', 'mr'),
      source: 'fallback',
      error: error?.message,
    });
  }
}

function getFallbackResponse(prompt: string, lang: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('कलम ३२') || p.includes('article 32') || p.includes('उपाययोजना')) {
    return `☕ **चाय रिव्हिजन — कलम ३२ (घटनात्मक उपाययोजनांचा हक्क):**

डॉ. बाबासाहेब आंबेडकरांनी कलम ३२ ला **"राज्यघटनेचा आत्मा आणि हृदय"** (Heart and Soul of the Constitution) म्हटले आहे.

📌 **महत्त्वाचे ५ प्राधिकृत आदेश (Writs):**
1. **बंदी प्रत्यक्षीकरण (Habeas Corpus):** बेकायदेशीर डांबून ठेवलेल्या व्यक्तीला २४ तासांत न्यायालयासमोर हजर करणे.
2. **परमादेश (Mandamus):** शासकीय अधिकाऱ्याला त्याचे कर्तव्य बजावण्याचा आदेश.
3. **प्रतिषेध (Prohibition):** कनिष्ठ न्यायालयाने आपल्या अधिकारक्षेत्राबाहेर काम न करण्याचा मनाई हुकूम.
4. **उत्प्रेषण (Certiorari):** कनिष्ठ न्यायालयाकडील खटला वरिष्ठ न्यायालयात वर्ग करणे.
5. **अधिकार पृच्छा (Quo-Warranto):** कोणत्या कायदेशीर अधिकाराने सार्वजनिक पद धारण केले आहे याची विचारणा.

💡 **MPSC परीक्षेसाठी टीप:** सर्वोच्च न्यायालय कलम ३२ नुसार, तर उच्च न्यायालय कलम २२६ नुसार रिट्स काढू शकते. उच्च न्यायालयाचे अधिकारक्षेत्र याबाबतीत अधिक व्यापक आहे.`;
  }

  if (p.includes('नदी') || p.includes('river') || p.includes('गोदावरी') || p.includes('सह्याद्री')) {
    return `☕ **चाय रिव्हिजन — महाराष्ट्रातील प्रमुख नद्यांचे क्विक रिव्हिजन:**

1. **गोदावरी नदी:**
   - उगम: त्र्यंबकेश्वर (नाशिक), ब्रह्मगिरी पर्वत
   - लांबी: महाराष्ट्रात ६६८ किमी (एकूण १,४६५ किमी)
   - खोरे: महाराष्ट्राचे ४९.५% क्षेत्र व्यापते (दक्षिण गंगा).
   - उपनद्या: प्रवरा, मुळा, दारणा, सिंधफणा, मांजरा (उजवीकडून); कादवा, शिवना, दुधना, प्राणहिता, इंद्रावती (डावीकडून).

2. **भीमा नदी:**
   - उगम: भीमाशंकर (पुणे)
   - लांबी: महाराष्ट्रात ४५१ किमी (एकूण ८६१ किमी)
   - उपनद्या: कुकडी, घोड, सीना (डावीकडून); भामा, मुळा-मुठा, नीरा (उजवीकडून).

3. **कृष्णा नदी:**
   - उगम: महाबळेश्वर (सातारा)
   - महाराष्ट्रातील लांबी: २८२ किमी.
   - उपनद्या: कोयना, वेण्णा, वारणा, पंचगंगा, दूधगंगा.`;
  }

  return `☕ **चाय गुरु स्टडी टीप:**

स्पर्धा परीक्षेमध्ये यश मिळवण्यासाठी ३ गोष्टी सर्वात महत्त्वाच्या आहेत:
1. **मायक्रो-सिलॅबसवर पकड:** आधी आयोगाचा अभ्यासक्रम समजून घ्या.
2. **मागील वर्षांचे प्रश्न (PYQs):** प्रत्येक घटकानंतर किमान ५० PYQs सोडवा.
3. **वारंवार रिव्हिजन:** आठवड्यातील किमान १ दिवस केवळ आधी वाचलेल्या घटकांच्या उजळणीसाठी ठेवा.

तुम्हाला कोणत्या विशिष्ट विषयावर माहिती हवी आहे? (उदा. राज्यघटना, इतिहास, भूगोल, गणित किंवा चालू घडामोडी) मला विचारा!`;
}

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: {
    mr: string;
    en: string;
  };
}

export interface QuizQuestion {
  id: string;
  category: string;
  subject: string;
  exam: string;
  question: {
    mr: string;
    en: string;
  };
  options: QuizOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: {
    mr: string;
    en: string;
  };
  marks: number;
  negativeMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizSet {
  id: string;
  title: {
    mr: string;
    en: string;
  };
  description: {
    mr: string;
    en: string;
  };
  exam: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: boolean;
  negativeRatio: string;
  badge?: string;
  questions: QuizQuestion[];
}

export const QUIZ_SETS_DATA: QuizSet[] = [
  {
    id: 'quiz-mpsc-polity-1',
    title: {
      mr: 'MPSC राज्यघटना व पंचायतराज — Timed Mock Test',
      en: 'MPSC Indian Polity & Maharashtra Panchayat Raj Mock',
    },
    description: {
      mr: 'MPSC राज्यसेवा व संयुक्त गट ब/क परीक्षेच्या पॅटर्नवर आधारित १० दर्जेदार प्रश्न व स्पष्टीकरण.',
      en: '10 High-yield questions with detailed explanations based on MPSC Prelims standard.',
    },
    exam: 'MPSC / Combine',
    subject: 'Polity & Constitution',
    durationMinutes: 10,
    totalQuestions: 10,
    totalMarks: 20,
    negativeMarking: true,
    negativeRatio: '1/4 (-0.50 Mark)',
    badge: 'Trending Mock',
    questions: [
      {
        id: 'q-pol-1',
        category: 'Polity',
        subject: 'Indian Constitution',
        exam: 'MPSC',
        question: {
          mr: 'भारतीय राज्यघटनेच्या कोणत्या कलमानुसार राज्यपालांना वटहुकूम (Ordinance) काढण्याचा कायदेशीर अधिकार प्राप्त आहे?',
          en: 'Under which Article of the Indian Constitution does the Governor have the power to promulgate an Ordinance?',
        },
        options: [
          { id: 'A', text: { mr: 'कलम १२३ (Article 123)', en: 'Article 123' } },
          { id: 'B', text: { mr: 'कलम २१३ (Article 213)', en: 'Article 213' } },
          { id: 'C', text: { mr: 'कलम १६१ (Article 161)', en: 'Article 161' } },
          { id: 'D', text: { mr: 'कलम १६४ (Article 164)', en: 'Article 164' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'कलम २१३ अन्वये राज्य विधानमंडळाचे अधिवेशन चालू नसताना राज्यपालांना वटहुकूम काढण्याचा अधिकार आहे. तर राष्ट्रपतींचा वटहुकूम अधिकार कलम १२३ मध्ये आहे.',
          en: 'Article 213 empowers the Governor to promulgate ordinances when the state legislature is in recess. The President derives similar ordinance power under Article 123.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Medium',
      },
      {
        id: 'q-pol-2',
        category: 'Polity',
        subject: 'Panchayat Raj',
        exam: 'MPSC / Combine',
        question: {
          mr: 'महाराष्ट्रामध्ये त्रिस्तरीय पंचायत राज पद्धतीची स्थापना कोणत्या समितीच्या शिफारशीनुसार करण्यात आली?',
          en: 'On the recommendation of which committee was the 3-tier Panchayati Raj system established in Maharashtra?',
        },
        options: [
          { id: 'A', text: { mr: 'बलवंतराय मेहता समिती', en: 'Balwant Rai Mehta Committee' } },
          { id: 'B', text: { mr: 'वसंतराव नाईक समिती', en: 'Vasantrao Naik Committee' } },
          { id: 'C', text: { mr: 'पी. बी. पाटील समिती', en: 'P. B. Patil Committee' } },
          { id: 'D', text: { mr: 'एल. एन. बोंगिरवार समिती', en: 'L. N. Bongirwar Committee' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'महाराष्ट्रात १ मे १९६२ रोजी वसंतराव नाईक समितीच्या शिफारशीनुसार जिल्हा परिषदेला केंद्रस्थानी मानून त्रिस्तरीय पंचायत राज व्यवस्था लागू झाली. महाराष्ट्र हे पंचायत राज स्वीकारणारे देशातील ९ वे राज्य ठरले.',
          en: 'On May 1, 1962, Maharashtra adopted the 3-tier Panchayati Raj system placing Zilla Parishad at the center based on Vasantrao Naik Committee recommendations. Maharashtra was the 9th state in India to adopt Panchayati Raj.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-3',
        category: 'Polity',
        subject: 'Constitutional Amendments',
        exam: 'MPSC',
        question: {
          mr: 'कोणत्या घटनादुरुस्ती कायद्याद्वारे मतदाराचे वय २१ वर्षांवरून १८ वर्षे करण्यात आले?',
          en: 'By which Constitutional Amendment Act was the voting age reduced from 21 years to 18 years in India?',
        },
        options: [
          { id: 'A', text: { mr: '४२ वी घटनादुरुस्ती १९७६', en: '42nd Amendment Act 1976' } },
          { id: 'B', text: { mr: '४४ वी घटनादुरुस्ती १९७८', en: '44th Amendment Act 1978' } },
          { id: 'C', text: { mr: '६१ वी घटनादुरुस्ती १९८८', en: '61st Amendment Act 1988' } },
          { id: 'D', text: { mr: '७३ वी घटनादुरुस्ती १९९२', en: '73rd Amendment Act 1992' } },
        ],
        correctOption: 'C',
        explanation: {
          mr: '६१ व्या घटनादुरुस्ती कायदा १९८८ (अंमलबजावणी २८ मार्च १९८९) द्वारे कलम ३२६ मध्ये सुधारणा करून मतदानाचे वय २१ वरून १८ वर्षे करण्यात आले.',
          en: 'The 61st Constitutional Amendment Act 1988 amended Article 326 reducing the minimum voting age for Lok Sabha and Legislative Assemblies from 21 to 18 years.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-4',
        category: 'Polity',
        subject: 'Fundamental Rights',
        exam: 'MPSC',
        question: {
          mr: 'डॉ. बाबासाहेब आंबेडकरांनी भारतीय राज्यघटनेच्या कोणत्या कलमाला "घटनेचा आत्मा आणि हृदय" (Heart & Soul of Constitution) असे संबोधले आहे?',
          en: 'Which Article of the Indian Constitution was described by Dr. B.R. Ambedkar as the "Heart and Soul of the Constitution"?',
        },
        options: [
          { id: 'A', text: { mr: 'कलम १४ (कायद्यासमोर समानता)', en: 'Article 14 (Equality before Law)' } },
          { id: 'B', text: { mr: 'कलम १९ (स्वातंत्र्याचा अधिकार)', en: 'Article 19 (Right to Freedom)' } },
          { id: 'C', text: { mr: 'कलम २१ (जीविताचे रक्षण)', en: 'Article 21 (Protection of Life)' } },
          { id: 'D', text: { mr: 'कलम ३२ (घटनात्मक उपाययोजना)', en: 'Article 32 (Constitutional Remedies)' } },
        ],
        correctOption: 'D',
        explanation: {
          mr: 'कलम ३२ द्वारे मूलभूत हक्कांच्या उल्लंघनाविरुद्ध सर्वोच्च न्यायालयात दाद मागता येते. सर्वोच्च न्यायालय बंदीप्रत्यक्षीकरण, परमादेश, प्रतिषेध, उत्प्रेषण व अधिकारपृच्छा हे ५ प्राधिलेख काढू शकते.',
          en: 'Article 32 guarantees the Right to Constitutional Remedies empowering citizens to directly approach the Supreme Court via 5 constitutional writs.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-5',
        category: 'Polity',
        subject: 'State Legislature',
        exam: 'MPSC / Combine',
        question: {
          mr: 'महाराष्ट्र विधानपरिषदेची (Legislative Council) एकूण सदस्य संख्या किती आहे?',
          en: 'What is the total sanctioned strength of the Maharashtra Legislative Council (Vidhan Parishad)?',
        },
        options: [
          { id: 'A', text: { mr: '७८ सदस्य (78 Members)', en: '78 Members' } },
          { id: 'B', text: { mr: '२८८ सदस्य (288 Members)', en: '288 Members' } },
          { id: 'C', text: { mr: '६० सदस्य (60 Members)', en: '60 Members' } },
          { id: 'D', text: { mr: '१०० सदस्य (100 Members)', en: '100 Members' } },
        ],
        correctOption: 'A',
        explanation: {
          mr: 'महाराष्ट्र विधानसभेत २८८ सदस्य असून विधानपरिषदेत ७८ सदस्य आहेत. विधानपरिषद हे स्थायी सभागृह असून दर दोन वर्षांनी १/३ सदस्य निवृत्त होतात.',
          en: 'Maharashtra Legislative Assembly has 288 members while the Legislative Council (Vidhan Parishad) has 78 members. Members serve a 6-year tenure with one-third retiring every two years.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-6',
        category: 'Polity',
        subject: 'Panchayat Administration',
        exam: 'Combine / Talathi',
        question: {
          mr: 'ग्रामसभेचे अध्यक्षस्थान कोण भूषवतो?',
          en: 'Who presides over the meetings of the Gram Sabha in Maharashtra?',
        },
        options: [
          { id: 'A', text: { mr: 'ग्रामसेवक', en: 'Gram Sevak' } },
          { id: 'B', text: { mr: 'सरपंच (त्यांच्या अनुपस्थितीत उपसरपंच)', en: 'Sarpanch (or Upa-Sarpanch in absence)' } },
          { id: 'C', text: { mr: 'तलाठी', en: 'Talathi' } },
          { id: 'D', text: { mr: 'तहसीलदार', en: 'Tehsildar' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'ग्रामसभेचे अध्यक्षपद सरपंचांकडे असते; सरपंचांच्या अनुपस्थितीत उपसरपंच अध्यक्षस्थान भूषवितात. ग्रामसेवक हा ग्रामसभेचा सचिव असतो व इतिवृत्त लिहितो.',
          en: 'The Sarpanch presides over all Gram Sabha meetings, and in their absence, the Upa-Sarpanch takes the chair. The Gram Sevak acts as the administrative secretary.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-7',
        category: 'Polity',
        subject: 'Judiciary',
        exam: 'MPSC',
        question: {
          mr: 'मुंबई उच्च न्यायालयाची (Bombay High Court) तीन खंडपीठे (Benches) खालीलपैकी कोणत्या ठिकाणी आहेत?',
          en: 'Which of the following are the three permanent benches of the Bombay High Court?',
        },
        options: [
          { id: 'A', text: { mr: 'नागपूर, पुणे आणि कोल्हापूर', en: 'Nagpur, Pune, and Kolhapur' } },
          { id: 'B', text: { mr: 'नागपूर, औरंगाबाद (छत्रपती संभाजीनगर) आणि पणजी (गोवा)', en: 'Nagpur, Chhatrapati Sambhaji Nagar, and Panaji (Goa)' } },
          { id: 'C', text: { mr: 'नाशिक, अमरावती आणि सोलापूर', en: 'Nashik, Amravati, and Solapur' } },
          { id: 'D', text: { mr: 'नागपूर, नांदेड आणि ठाणे', en: 'Nagpur, Nanded, and Thane' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'मुंबई उच्च न्यायालयाची स्थापना १४ ऑगस्ट १८६२ रोजी झाली. मुख्य पीठ मुंबई येथे असून नागपूर, छत्रपती संभाजीनगर आणि पणजी (गोवा) येथे तीन अधिकृत खंडपीठे आहेत.',
          en: 'The Bombay High Court was established on August 14, 1862. Its principal seat is in Mumbai with benches at Nagpur, Chhatrapati Sambhajinagar, and Panaji (Goa).',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Medium',
      },
      {
        id: 'q-pol-8',
        category: 'Polity',
        subject: 'Constitutional Bodies',
        exam: 'MPSC',
        question: {
          mr: 'महाराष्ट्र लोकसेवा आयोगाच्या (MPSC) अध्यक्ष व सदस्यांची नेमणूक कोण करते?',
          en: 'Who appoints the Chairman and members of the Maharashtra Public Service Commission (MPSC)?',
        },
        options: [
          { id: 'A', text: { mr: 'मुख्यमंत्री', en: 'Chief Minister' } },
          { id: 'B', text: { mr: 'राज्यपाल (Governor)', en: 'Governor of Maharashtra' } },
          { id: 'C', text: { mr: 'राष्ट्रपती', en: 'President of India' } },
          { id: 'D', text: { mr: 'मुख्य न्यायाधीश (Bombay High Court)', en: 'Chief Justice of Bombay High Court' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'कलम ३१६(१) नुसार राज्य लोकसेवा आयोगाच्या अध्यक्ष व सदस्यांची नियुक्ती राज्यपाल करतात. मात्र त्यांना पदावरून दूर करण्याचा अधिकार केवळ राष्ट्रपतींनाच आहे (कलम ३१७).',
          en: 'Under Article 316(1), the Governor appoints the Chairman and Members of the State Public Service Commission. However, only the President has the authority to remove them under Article 317.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Medium',
      },
      {
        id: 'q-pol-9',
        category: 'Polity',
        subject: 'Emergency Provisions',
        exam: 'MPSC',
        question: {
          mr: 'घटनेच्या कोणत्या कलमान्वये राज्यात राष्ट्रपती राजवट (President’s Rule / State Emergency) लागू केली जाते?',
          en: 'Under which Article of the Constitution can President’s Rule be proclaimed in a State?',
        },
        options: [
          { id: 'A', text: { mr: 'कलम ३५२', en: 'Article 352' } },
          { id: 'B', text: { mr: 'कलम ३५६', en: 'Article 356' } },
          { id: 'C', text: { mr: 'कलम ३६०', en: 'Article 360' } },
          { id: 'D', text: { mr: 'कलम ३६८', en: 'Article 368' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'कलम ३५६ अंतर्गत राज्यात घटनात्मक यंत्रणा अयशस्वी झाल्यास राष्ट्रपती राजवट लागू केली जाते. (कलम ३५२: राष्ट्रीय आणीबाणी, कलम ३६०: वित्तीय आणीबाणी).',
          en: 'Article 356 allows the President to impose President’s Rule upon receipt of a report from the Governor indicating breakdown of constitutional machinery in the state.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-pol-10',
        category: 'Polity',
        subject: 'Preamble',
        exam: 'MPSC',
        question: {
          mr: '४२ व्या घटनादुरुस्ती कायदा १९७६ द्वारे भारतीय संविधानाच्या सरनाम्यात (Preamble) कोणते तीन नवीन शब्द जोडण्यात आले?',
          en: 'Which three new words were added to the Preamble of the Indian Constitution by the 42nd Constitutional Amendment Act of 1976?',
        },
        options: [
          { id: 'A', text: { mr: 'सार्वभौम, लोकशाही, प्रजासत्ताक', en: 'Sovereign, Democratic, Republic' } },
          { id: 'B', text: { mr: 'समाजवादी, धर्मनिरपेक्ष, एकात्मता', en: 'Socialist, Secular, Integrity' } },
          { id: 'C', text: { mr: 'न्याय, स्वातंत्र्य, समता', en: 'Justice, Liberty, Equality' } },
          { id: 'D', text: { mr: 'बंधुता, स्वातंत्र्य, ऐक्य', en: 'Fraternity, Liberty, Unity' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: '१९७६ च्या ४२ व्या घटनादुरुस्तीने सरनाम्यात "समाजवादी" (Socialist), "धर्मनिरपेक्ष" (Secular) आणि "एकात्मता" (Integrity) हे तीन शब्द जोडले गेले.',
          en: 'The 42nd Amendment Act of 1976 amended the Preamble to insert the words "Socialist", "Secular", and "Integrity".',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'quiz-geo-maharashtra-1',
    title: {
      mr: 'महाराष्ट्र भूगोल व नकाशे — Speed Revision Test',
      en: 'Maharashtra Geography & Physical Maps Speed Quiz',
    },
    description: {
      mr: 'नद्या, घाट, शिखरे, मृदा व वने यावर आधारित MPSC व पोलीस भरती वारंवार विचारलेले प्रश्न.',
      en: 'High-frequency exam questions on Maharashtra rivers, mountain passes, peaks and soils.',
    },
    exam: 'MPSC / Police Bharti / Talathi',
    subject: 'Maharashtra Geography',
    durationMinutes: 8,
    totalQuestions: 10,
    totalMarks: 20,
    negativeMarking: true,
    negativeRatio: '1/4 (-0.50 Mark)',
    badge: 'High Frequency',
    questions: [
      {
        id: 'q-geo-1',
        category: 'Geography',
        subject: 'Physical Geography',
        exam: 'MPSC / Police',
        question: {
          mr: 'महाराष्ट्रातील सर्वोच्च शिखर "कळसूबाई" (१६४६ मी.) हे कोणत्या जिल्ह्यात व डोंगररांगेत आहे?',
          en: 'The highest peak in Maharashtra, "Kalsubai" (1646 m), is located in which district and mountain range?',
        },
        options: [
          { id: 'A', text: { mr: 'नाशिक (सातमाळा रांग)', en: 'Nashik (Satmala Range)' } },
          { id: 'B', text: { mr: 'अहमदनगर / अहिल्यानगर (हरिश्चंद्रगड रांग)', en: 'Ahilyanagar (Harishchandragad Range)' } },
          { id: 'C', text: { mr: 'पुणे (सह्याद्री मुख्य रांग)', en: 'Pune (Sahyadri Main Range)' } },
          { id: 'D', text: { mr: 'सातारा (महाबळेश्वर पठार)', en: 'Satara (Mahabaleshwar Plateau)' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'कळसूबाई (१,६४६ मीटर) हे अहिल्यानगर (अहमदनगर) जिल्ह्यातील अकोले तालुक्यात हरिश्चंद्रगड उपरांगेत वसलेले आहे.',
          en: 'Mount Kalsubai stands at 1,646 meters in Akole taluka of Ahilyanagar (Ahmednagar) district in the Harishchandragad mountain range.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-2',
        category: 'Geography',
        subject: 'Passes (Ghats)',
        exam: 'Combine / Talathi',
        question: {
          mr: 'मुंबई ते नाशिक या राष्ट्रीय महामार्गावर सह्याद्री ओलांडणारा प्रसिद्ध घाट कोणता?',
          en: 'Which mountain pass crosses the Sahyadri ranges on the Mumbai-Nashik National Highway?',
        },
        options: [
          { id: 'A', text: { mr: 'बोर घाट (Bor Ghat)', en: 'Bor Ghat' } },
          { id: 'B', text: { mr: 'थळ घाट / कसारा घाट (Thal Ghat)', en: 'Thal Ghat / Kasara Ghat' } },
          { id: 'C', text: { mr: 'माळशेज घाट (Malshej Ghat)', en: 'Malshej Ghat' } },
          { id: 'D', text: { mr: 'वरंधा घाट (Varandha Ghat)', en: 'Varandha Ghat' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'मुंबई-नाशिक दरम्यान थळ घाट (कसारा घाट) आहे. मुंबई-पुणे दरम्यान बोर घाट (खंडाळा घाट) आहे, तर कल्याण-अहमदनगर दरम्यान माळशेज घाट आहे.',
          en: 'Thal Ghat (Kasara Ghat) connects Mumbai and Nashik. Bor Ghat connects Mumbai and Pune, while Malshej Ghat links Kalyan with Ahmednagar.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-3',
        category: 'Geography',
        subject: 'Coastline',
        exam: 'Police Bharti',
        question: {
          mr: 'महाराष्ट्राला पश्चिमेस एकूण किती किलोमीटर लांबीचा अरबी समुद्रकिनारा लाभला आहे?',
          en: 'What is the total length of the Arabian Sea coastline adjoining Maharashtra state?',
        },
        options: [
          { id: 'A', text: { mr: '६५० किमी', en: '650 km' } },
          { id: 'B', text: { mr: '७२० किमी', en: '720 km' } },
          { id: 'C', text: { mr: '८०० किमी', en: '800 km' } },
          { id: 'D', text: { mr: '५६० किमी', en: '560 km' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'महाराष्ट्राला सुमारे ७२० किलोमीटर लांबीची सलग कोकण किनारपट्टी लाभलेली आहे. यात सर्वाधिक समुद्रकिनारा रत्नागिरी जिल्ह्याला (२३७ किमी) लाभला आहे.',
          en: 'Maharashtra boasts approximately 720 km of Konkan coastline along the Arabian Sea. Ratnagiri district has the longest coastal stretch (237 km).',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-4',
        category: 'Geography',
        subject: 'Lakes',
        exam: 'MPSC',
        question: {
          mr: 'उल्कापातामुळे (Meteorite impact) निर्माण झालेले आशियातील प्रसिद्ध खाऱ्या पाण्याचे "लोणार सरोवर" कोणत्या जिल्ह्यात आहे?',
          en: 'The world-famous "Lonar Crater Lake" formed by meteorite impact is situated in which district of Maharashtra?',
        },
        options: [
          { id: 'A', text: { mr: 'अकोला (Akola)', en: 'Akola' } },
          { id: 'B', text: { mr: 'बुलढाणा (Buldhana)', en: 'Buldhana' } },
          { id: 'C', text: { mr: 'वाशीम (Washim)', en: 'Washim' } },
          { id: 'D', text: { mr: 'जळगाव (Jalgaon)', en: 'Jalgaon' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'लोणार सरोवर बुलढाणा जिल्ह्यात असून हे बेसाल्ट खडकातील उल्कापाताने तयार झालेले जगातील एकमेव खाऱ्या पाण्याचे विवर सरोवर आहे. यास रामसर पाणथळ स्थळाचा दर्जा मिळाला आहे.',
          en: 'Lonar Lake is in Buldhana district. It is the only known hyper-velocity impact crater in basaltic rock globally and is designated as a Ramsar site.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-5',
        category: 'Geography',
        subject: 'Drainage Systems',
        exam: 'MPSC',
        question: {
          mr: 'गोदावरी, भीमा व कृष्णा या पूर्ववाहिनी नद्यांचे खोरे पश्चिमेकडून पूर्वेकडे अनुक्रमे कोणत्या रांगांनी विभागलेले आहेत?',
          en: 'Which mountain ranges divide the basins of Godavari, Bhima, and Krishna rivers in Maharashtra?',
        },
        options: [
          { id: 'A', text: { mr: 'सातमाळा-अजिंठा व हरिश्चंद्र-बालाघाट रांगा', en: 'Satmala-Ajanta & Harishchandra-Balaghat' } },
          { id: 'B', text: { mr: 'हरिश्चंद्र-बालाघाट व शंभू-महादेव रांगा', en: 'Harishchandra-Balaghat & Shambhu-Mahadev' } },
          { id: 'C', text: { mr: 'सातपुडा व सातमाळा रांगा', en: 'Satpura & Satmala ranges' } },
          { id: 'D', text: { mr: 'महादेव व सातपुडा रांगा', en: 'Mahadev & Satpura ranges' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'गोदावरी व भीमा नदी खोरे हरिश्चंद्र-बालाघाट रांगेमुळे विभागले आहे; तर भीमा व कृष्णा नदी खोरे शंभू-महादेव डोंगररांगेमुळे वेगळे झाले आहे.',
          en: 'The Harishchandra-Balaghat range separates Godavari and Bhima basins, while the Shambhu-Mahadev range separates Bhima and Krishna basins.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Hard',
      },
      {
        id: 'q-geo-6',
        category: 'Geography',
        subject: 'Rainfall',
        exam: 'Police / Talathi',
        question: {
          mr: 'महाराष्ट्रात सर्वाधिक पाऊस पडणारे ठिकाण "आंबोली" (दक्षिण कोकण) हे कोणत्या जिल्ह्यात येते?',
          en: 'Which district is home to "Amboli", the place receiving the highest average rainfall in Maharashtra?',
        },
        options: [
          { id: 'A', text: { mr: 'रत्नागिरी', en: 'Ratnagiri' } },
          { id: 'B', text: { mr: 'सिंधुदुर्ग', en: 'Sindhudurg' } },
          { id: 'C', text: { mr: 'रायगड', en: 'Raigad' } },
          { id: 'D', text: { mr: 'कोल्हापूर', en: 'Kolhapur' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'सिंधुदुर्ग जिल्ह्यातील सावंतवाडी तालुक्यात असलेले आंबोली हे महाराष्ट्राचे "चेरापुंजी" मानले जाते. येथे वार्षिक सरासरी सुमारे ७५० सेंमी पाऊस पडतो.',
          en: 'Amboli in Sawantwadi taluka of Sindhudurg district records the highest average rainfall (~750 cm) in Maharashtra and is known as the Cherrapunji of Maharashtra.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-7',
        category: 'Geography',
        subject: 'Soils',
        exam: 'Combine',
        question: {
          mr: 'महाराष्ट्र पठारावरील बेसाल्ट खडकाच्या अपक्षयाने (Weathering) तयार झालेल्या काळ्या सुपीक मातीस काय म्हणतात?',
          en: 'What is the fertile black soil formed by the weathering of basalt rock on the Maharashtra plateau called?',
        },
        options: [
          { id: 'A', text: { mr: 'जांभी मृदा (Laterite Soil)', en: 'Laterite Soil' } },
          { id: 'B', text: { mr: 'रेगूर मृदा / काळी कापसाची मृदा (Regur Soil)', en: 'Regur / Black Cotton Soil' } },
          { id: 'C', text: { mr: 'गाळाची मृदा (Alluvial Soil)', en: 'Alluvial Soil' } },
          { id: 'D', text: { mr: 'तांबडी मृदा (Red Soil)', en: 'Red Soil' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'महाराष्ट्र पठाराचा बहुतांश भाग रेगूर मृदेने व्यापलेला आहे. ओलावा धरून ठेवण्याची क्षमता जास्त असल्याने ही मृदा कापूस, सोयाबीन व ज्वारीच्या पिकासाठी अत्यंत सुपीक असते.',
          en: 'Regur soil (Black cotton soil) covers over 80% of Maharashtra. Its high moisture-retention capability makes it optimal for cotton, jowar, and oilseeds.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-8',
        category: 'Geography',
        subject: 'Hydroelectric Projects',
        exam: 'MPSC',
        question: {
          mr: 'महाराष्ट्राची "भाग्यलक्ष्मी" म्हणून खालीलपैकी कोणत्या जलविद्युत प्रकल्पाला ओळखले जाते?',
          en: 'Which hydroelectric power project is popularly celebrated as the "Bhagyalaxmi of Maharashtra"?',
        },
        options: [
          { id: 'A', text: { mr: 'जायकवाडी प्रकल्प (गोदावरी)', en: 'Jayakwadi Project (Godavari)' } },
          { id: 'B', text: { mr: 'कोयना जलविद्युत प्रकल्प (सातारा)', en: 'Koyna Hydroelectric Project (Satara)' } },
          { id: 'C', text: { mr: 'उजनी प्रकल्प (भीमा)', en: 'Ujani Project (Bhima)' } },
          { id: 'D', text: { mr: 'तोतलाडोह प्रकल्प (पेंच)', en: 'Totladoh Project (Pench)' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'सातारा जिल्ह्यातील पाटण तालुक्यातील कोयना धरणाच्या जलाशयाला "शिवसागर" म्हणतात. या प्रकल्पातून राज्याला सर्वाधिक जलविद्युत मिळते म्हणून यास महाराष्ट्राची भाग्यलक्ष्मी म्हणतात.',
          en: 'The Koyna Hydroelectric Project in Satara district, with its reservoir Shivsagar, produces the largest share of hydroelectricity in the state, earning the moniker Bhagyalaxmi.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-9',
        category: 'Geography',
        subject: 'National Parks',
        exam: 'MPSC / Forest',
        question: {
          mr: 'महाराष्ट्रातील पहिले राष्ट्रीय उद्यान "ताडोबा राष्ट्रीय उद्यान" (स्थापना १९५५) कोणत्या जिल्ह्यात आहे?',
          en: 'In which district is Maharashtra’s first National Park, "Tadoba National Park" (est. 1955), located?',
        },
        options: [
          { id: 'A', text: { mr: 'अमरावती', en: 'Amravati' } },
          { id: 'B', text: { mr: 'चंद्रपूर', en: 'Chandrapur' } },
          { id: 'C', text: { mr: 'गडचिरोली', en: 'Gadchiroli' } },
          { id: 'D', text: { mr: 'गोंदिया', en: 'Gondia' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'ताडोबा हे चंद्रपूर जिल्ह्यात असून १९५५ मध्ये स्थापित महाराष्ट्रातील पहिले राष्ट्रीय उद्यान आहे. १९९३ मध्ये ताडोबा-अंधारी व्याघ्र प्रकल्प घोषित झाला.',
          en: 'Tadoba National Park is situated in Chandrapur district. Established in 1955, it combined with Andhari Wildlife Sanctuary in 1993 to create the Tadoba-Andhari Tiger Reserve.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-geo-10',
        category: 'Geography',
        subject: 'Rivers',
        exam: 'MPSC / Combine',
        question: {
          mr: 'महाराष्ट्रात तापी नदी कोणत्या जिल्ह्यातून वाहत जाऊन गुजरात राज्यात प्रवेश करते?',
          en: 'Through which district does the Tapi river flow before crossing into Gujarat?',
        },
        options: [
          { id: 'A', text: { mr: 'धुळे व नंदुरबार', en: 'Dhule and Nandurbar' } },
          { id: 'B', text: { mr: 'जळगाव, धुळे व नंदुरबार', en: 'Jalgaon, Dhule, and Nandurbar' } },
          { id: 'C', text: { mr: 'नाशिक व जळगाव', en: 'Nashik and Jalgaon' } },
          { id: 'D', text: { mr: 'बुलढाणा व अकोला', en: 'Buldhana and Akola' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'तापी नदी ही महाराष्ट्रातील प्रमुख पश्चिमवाहिनी नदी आहे. ती खानदेशातील जळगाव, धुळे व नंदुरबार या तीन जिल्ह्यांतून वाहत जाऊन पुढे सुरतजवळ खंबायतच्या आखातात अरबी समुद्रास मिळते.',
          en: 'The Tapi river is the major west-flowing river of northern Maharashtra traversing Jalgaon, Dhule, and Nandurbar before emptying into the Arabian Sea near Surat.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'quiz-history-maharashtra-1',
    title: {
      mr: 'आधुनिक महाराष्ट्राचा इतिहास व समाजसुधारक',
      en: 'Modern History of Maharashtra & Social Reformers',
    },
    description: {
      mr: 'महात्मा फुले, डॉ. बाबासाहेब आंबेडकर, शाहू महाराज व संयुक्त महाराष्ट्र चळवळीवरील महत्त्वाचे प्रश्न.',
      en: 'Essential questions on Maharashtra reformers, Satyashodhak Samaj, and Samyukta Maharashtra.',
    },
    exam: 'MPSC Rajyaseva / Combine',
    subject: 'Maharashtra History',
    durationMinutes: 8,
    totalQuestions: 10,
    totalMarks: 20,
    negativeMarking: true,
    negativeRatio: '1/4 (-0.50 Mark)',
    badge: 'Toppers Choice',
    questions: [
      {
        id: 'q-hist-1',
        category: 'History',
        subject: 'Social Reformers',
        exam: 'MPSC',
        question: {
          mr: 'महात्मा ज्योतिराव फुले यांनी सत्यशोधक समाजाची स्थापना कोणत्या दिवशी आणि कोठे केली?',
          en: 'On which date and where did Mahatma Jyotirao Phule establish the Satyashodhak Samaj?',
        },
        options: [
          { id: 'A', text: { mr: '२४ सप्टेंबर १८७३, पुणे', en: '24 September 1873, Pune' } },
          { id: 'B', text: { mr: '१ मे १८६०, मुंबई', en: '1 May 1860, Mumbai' } },
          { id: 'C', text: { mr: '१४ एप्रिल १८९१, नागपूर', en: '14 April 1891, Nagpur' } },
          { id: 'D', text: { mr: '२६ जुलै १९०२, कोल्हापूर', en: '26 July 1902, Kolhapur' } },
        ],
        correctOption: 'A',
        explanation: {
          mr: 'महात्मा ज्योतिराव फुले यांनी २४ सप्टेंबर १८७३ रोजी पुणे येथे सत्यशोधक समाजाची स्थापना केली. "सर्वसाक्षी जगत्पती, त्याला नकोच मध्यस्थी" हे सत्यशोधक समाजाचे ब्रीदवाक्य होते.',
          en: 'Mahatma Jyotirao Phule established Satyashodhak Samaj in Pune on 24 September 1873 to liberate oppressed classes from socio-religious exploitation.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-2',
        category: 'History',
        subject: 'Social Reformers',
        exam: 'MPSC',
        question: {
          mr: 'छत्रपती राजर्षी शाहू महाराजांनी कोल्हापूर संस्थानात मागासवर्गीय समाजासाठी ५०% आरक्षणाची ऐतिहासिक घोषणा कोणत्या वर्षी केली?',
          en: 'In which year did Rajarshi Chhatrapati Shahu Maharaj announce the historic 50% reservation for backward classes in Kolhapur state?',
        },
        options: [
          { id: 'A', text: { mr: '१९००', en: '1900' } },
          { id: 'B', text: { mr: '२६ जुलै १९०२', en: '26 July 1902' } },
          { id: 'C', text: { mr: '१९१६', en: '1916' } },
          { id: 'D', text: { mr: '१९२०', en: '1920' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: '२६ जुलै १९०२ रोजी शाहू महाराजांनी कोल्हापूर संस्थानात प्रशासकीय नोकऱ्यांमध्ये ५०% आरक्षण जाहीर केले. म्हणून २६ जुलै हा दिवस महाराष्ट्रात "सामाजिक न्याय दिन" म्हणून साजरा केला जातो.',
          en: 'On 26 July 1902, Shahu Maharaj issued a gazette notification reserving 50% state employment for non-Brahmin and backward classes, commemorated as Social Justice Day.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-3',
        category: 'History',
        subject: 'Movements',
        exam: 'MPSC',
        question: {
          mr: 'डॉ. बाबासाहेब आंबेडकरांनी महाडचा प्रसिद्ध "चवदार तळे सत्याग्रह" कोणत्या दिवशी केला?',
          en: 'On which date did Dr. B. R. Ambedkar lead the historic Mahad Satyagraha at Chavdar Lake?',
        },
        options: [
          { id: 'A', text: { mr: '२० मार्च १९२७', en: '20 March 1927' } },
          { id: 'B', text: { mr: '२५ डिसेंबर १९२७', en: '25 December 1927' } },
          { id: 'C', text: { mr: '२ मार्च १९३०', en: '2 March 1930' } },
          { id: 'D', text: { mr: '१४ ऑक्टोबर १९५६', en: '14 October 1956' } },
        ],
        correctOption: 'A',
        explanation: {
          mr: '२० मार्च १९२७ रोजी महाड येथील चवदार तळ्याचे पाणी अस्पृश्यांना पिण्यासाठी खुले व्हावे म्हणून बाबासाहेबांनी सत्याग्रह केला. हा दिवस भारतात "सामाजिक सक्षमीकरण दिन" म्हणून पाळला जातो.',
          en: 'The Mahad Satyagraha was launched on 20 March 1927 to assert the right of untouchables to draw water from the public Chavdar Lake, celebrated as Social Empowerment Day.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-4',
        category: 'History',
        subject: 'Literature & Reform',
        exam: 'Combine',
        question: {
          mr: '"शेतकऱ्यांचा आसूड", "गुलामगिरी" आणि "ब्राह्मणांचे कसब" हे सुप्रसिद्ध ग्रंथ कोणाचे आहेत?',
          en: 'Who is the author of renowned revolutionary works "Shetkaryacha Asud", "Gulamgiri", and "Brahmananche Kasab"?',
        },
        options: [
          { id: 'A', text: { mr: 'गोपाळ गणेश आगरकर', en: 'Gopal Ganesh Agarkar' } },
          { id: 'B', text: { mr: 'महात्मा ज्योतिराव फुले', en: 'Mahatma Jyotirao Phule' } },
          { id: 'C', text: { mr: 'लोकहितवादी (गोपाळ हरी देशमुख)', en: 'Lokhitwadi (Gopal Hari Deshmukh)' } },
          { id: 'D', text: { mr: 'विष्णूशास्त्री चिपळूणकर', en: 'Vishnushastri Chiplunkar' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'महात्मा ज्योतिराव फुले यांनी शेतकऱ्यांचे आर्थिक शोषण, दारिद्र्य आणि शिक्षणाचा अभाव यावर आसूड ओढणारा "शेतकऱ्यांचा आसूड" (१८८३) आणि "गुलामगिरी" (१८७३) हे ग्रंथ लिहिले.',
          en: 'Mahatma Jyotirao Phule authored Shetkaryacha Asud and Gulamgiri addressing systemic agrarian exploitation and caste supremacy.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-5',
        category: 'History',
        subject: 'Journalism',
        exam: 'Combine / Police',
        question: {
          mr: 'मराठी वृत्तपत्रसृष्टीचे जनक बाळशास्त्री जांभेकर यांनी मराठीतील पहिले वृत्तपत्र "दर्पण" कोणत्या तारखेला सुरू केले?',
          en: 'On which date was Maharashtra’s first Marathi newspaper "Darpan" founded by Balshastri Jambhekar?',
        },
        options: [
          { id: 'A', text: { mr: '६ जानेवारी १८३२', en: '6 January 1832' } },
          { id: 'B', text: { mr: '१ ऑगस्ट १९२०', en: '1 August 1920' } },
          { id: 'C', text: { mr: '२ ऑक्टोबर १८६९', en: '2 October 1869' } },
          { id: 'D', text: { mr: '१ मे १९६०', en: '1 May 1960' } },
        ],
        correctOption: 'A',
        explanation: {
          mr: '६ जानेवारी १८३२ रोजी मुंबईत "दर्पण" हे द्विभाषिक (मराठी व इंग्रजी) वृत्तपत्र सुरू झाले. यामुळे ६ जानेवारी हा दिवस महाराष्ट्रात "पत्रकार दिन" म्हणून साजरा केला जातो.',
          en: 'On 6 January 1832, Darpan was launched in Mumbai. Balshastri Jambhekar is honored as the Father of Marathi Journalism, and January 6 is celebrated as Journalists Day.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-6',
        category: 'History',
        subject: 'Samyukta Maharashtra',
        exam: 'MPSC',
        question: {
          mr: 'संयुक्त महाराष्ट्र चळवळीत बलिदान दिलेल्या १०६ हुतात्म्यांचे स्मरण म्हणून उभारलेले "हुतात्मा चौक स्मारक" कोठे आहे?',
          en: 'Where is the "Hutatma Chowk Memorial" built in honor of the 106 martyrs of the Samyukta Maharashtra Movement located?',
        },
        options: [
          { id: 'A', text: { mr: 'पुणे (शनिवार वाडा)', en: 'Pune (Shaniwar Wada)' } },
          { id: 'B', text: { mr: 'मुंबई (फ्लोरा फाउंटन, फोर्ट)', en: 'Mumbai (Flora Fountain, Fort)' } },
          { id: 'C', text: { mr: 'नागपूर (दीक्षाभूमी)', en: 'Nagpur (Deekshabhoomi)' } },
          { id: 'D', text: { mr: 'कोल्हापूर (दसरा चौक)', en: 'Kolhapur (Dasara Chowk)' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'मुंबईसह संयुक्त महाराष्ट्राच्या निर्मितीसाठी लढताना १०६ आंदोलक पोलिसांच्या गोळीबारात हुतात्मा झाले. त्यांच्या स्मृतीप्रित्यर्थ मुंबईतील फ्लोरा फाउंटन चौकाचे नाव बदलून "हुतात्मा चौक" करण्यात आले.',
          en: 'Hutatma Chowk (Flora Fountain) in South Mumbai honors the 106 peaceful protesters martyred during police firing while demanding Mumbai as the capital of Maharashtra.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-7',
        category: 'History',
        subject: 'Women Education',
        exam: 'MPSC',
        question: {
          mr: 'पुण्यातील भिडे वाड्यात मुलींची पहिली शाळा कोणत्या वर्षी सुरू करण्यात आली?',
          en: 'In which year was the first indigenous girls school started at Bhide Wada in Pune?',
        },
        options: [
          { id: 'A', text: { mr: '१ जानेवारी १८४८', en: '1 January 1848' } },
          { id: 'B', text: { mr: '१५ ऑगस्ट १८५७', en: '15 August 1857' } },
          { id: 'C', text: { mr: '२४ सप्टेंबर १८७३', en: '24 September 1873' } },
          { id: 'D', text: { mr: '१८९१', en: '1891' } },
        ],
        correctOption: 'A',
        explanation: {
          mr: '१ जानेवारी १८४८ रोजी महात्मा फुले व क्रांतिज्योती सावित्रीबाई फुले यांनी पुण्याच्या बुधवार पेठेतील भिडे वाड्यात मुलींची पहिली शाळा स्थापन केली. सावित्रीबाई फुले देशातील पहिल्या महिला शिक्षिका ठरल्या.',
          en: 'On 1 January 1848, Jyotirao and Savitribai Phule established India’s first school for girls at Bhide Wada, Pune.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-8',
        category: 'History',
        subject: 'Social Reformers',
        exam: 'MPSC',
        question: {
          mr: '"इष्ट असेल ते बोलणार आणि साध्य असेल ते करणार" हे कोणाचे प्रसिद्ध ब्रीदवाक्य होते?',
          en: '"I will speak what is right, and I will do what is achievable" was the famous motto of which social reformer?',
        },
        options: [
          { id: 'A', text: { mr: 'लोकमान्य बाळ गंगाधर टिळक', en: 'Lokmanya Bal Gangadhar Tilak' } },
          { id: 'B', text: { mr: 'गोपाळ गणेश आगरकर (सुधारक)', en: 'Gopal Ganesh Agarkar (Sudharak)' } },
          { id: 'C', text: { mr: 'न्यायमूर्ती रानडे', en: 'Justice M. G. Ranade' } },
          { id: 'D', text: { mr: 'महर्षी धोंडो केशव कर्वे', en: 'Maharshi Dhondo Keshav Karve' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'गोपाळ गणेश आगरकर यांनी सामाजिक सुधारणांना प्राधान्य दिले. त्यांनी १८८८ मध्ये "सुधारक" हे वृत्तपत्र सुरू केले व हे बाणेदार ब्रीदवाक्य शीर्षस्थानी ठेवले.',
          en: 'Gopal Ganesh Agarkar launched the journal Sudharak in 1888 with this motto, championing rationalism, widow remarriage, and education.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-9',
        category: 'History',
        subject: 'Modern Maharashtra',
        exam: 'MPSC',
        question: {
          mr: '१ मे १९६० रोजी स्वतंत्र महाराष्ट्र राज्याची स्थापना झाली, त्यावेळी महाराष्ट्राचे पहिले मुख्यमंत्री कोण होते?',
          en: 'When the separate state of Maharashtra was formed on May 1, 1960, who became its first Chief Minister?',
        },
        options: [
          { id: 'A', text: { mr: 'वसंतराव नाईक', en: 'Vasantrao Naik' } },
          { id: 'B', text: { mr: 'यशवंतराव चव्हाण', en: 'Yashwantrao Chavan' } },
          { id: 'C', text: { mr: 'मारोतराव कन्नमवार', en: 'Marotrao Kannamwar' } },
          { id: 'D', text: { mr: 'शंकरराव चव्हाण', en: 'Shankarrao Chavan' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: '१ मे १९६० रोजी पंडित नेहरूंनी शिवाजी पार्क, मुंबई येथे स्वतंत्र महाराष्ट्र राज्याची घोषणा केली आणि यशवंतराव बळवंतराव चव्हाण यांनी महाराष्ट्राचे पहिले मुख्यमंत्री म्हणून शपथ घेतली.',
          en: 'On May 1, 1960, Yashwantrao Chavan was sworn in as the first Chief Minister of the unified state of Maharashtra.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
      {
        id: 'q-hist-10',
        category: 'History',
        subject: 'Honors & Reform',
        exam: 'MPSC',
        question: {
          mr: 'महिला शिक्षणातील अतुलनीय योगदानासाठी वयाच्या १०० व्या वर्षी "भारतरत्न" मिळवणारे महाराष्ट्रातील थोर समाजसुधारक कोण?',
          en: 'Which great reformer of Maharashtra was honored with the Bharat Ratna on his 100th birthday for his monumental contribution to women’s education?',
        },
        options: [
          { id: 'A', text: { mr: 'महर्षी विठ्ठल रामजी शिंदे', en: 'Maharshi Vitthal Ramji Shinde' } },
          { id: 'B', text: { mr: 'महर्षी धोंडो केशव कर्वे', en: 'Maharshi Dhondo Keshav Karve' } },
          { id: 'C', text: { mr: 'कर्मवीर भाऊराव पाटील', en: 'Karmaveer Bhaurao Patil' } },
          { id: 'D', text: { mr: 'बाबा आमटे', en: 'Baba Amte' } },
        ],
        correctOption: 'B',
        explanation: {
          mr: 'महर्षी धोंडो केशव कर्वे (अण्णा) यांनी १९१६ मध्ये भारतातील पहिले महिला विद्यापीठ (SNDT) स्थापन केले. त्यांना १९५८ मध्ये त्यांच्या १०० व्या वाढदिवशी भारतरत्नने सन्मानित करण्यात आले.',
          en: 'Maharshi Dhondo Keshav Karve established India’s first women’s university (SNDT) in 1916 and was awarded the Bharat Ratna in 1958 at the age of 100.',
        },
        marks: 2,
        negativeMarks: 0.5,
        difficulty: 'Easy',
      },
    ],
  },
];

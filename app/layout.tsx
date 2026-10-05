import type { Metadata } from 'next';
import './globals.css';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

export const metadata: Metadata = {
  title: 'Chai Revision — स्पर्धा परीक्षेचा Smart Study Companion | MPSC, पोलीस भरती, तलाठी, ZP भरती',
  description:
    'स्पर्धा परीक्षेच्या तयारीसाठी तुमचा Smart Study Companion. MPSC, PSI, STI, ASO, तलाठी, पोलीस भरती, जिल्हा परिषद आणि महाराष्ट्र स्पर्धा परीक्षांसाठी दर्जेदार Notes, PDFs, PYQs, Current Affairs आणि Exam Updates एकाच ठिकाणी.',
  icons: {
    icon: [{ url: '/images/favicon.png', type: 'image/png' }],
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'Chai Revision — स्पर्धा परीक्षेचा Smart Study Companion',
    description:
      'MPSC, PSI, STI, ASO, तलाठी, पोलीस भरती, जिल्हा परिषद आणि महाराष्ट्र स्पर्धा परीक्षांसाठी दर्जेदार Notes, PDFs, PYQs, Current Affairs आणि Exam Updates.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chai Revision — स्पर्धा परीक्षेचा Smart Study Companion',
    description:
      'MPSC, PSI, STI, ASO, तलाठी, पोलीस भरती, जिल्हा परिषद आणि महाराष्ट्र स्पर्धा परीक्षांसाठी दर्जेदार Notes, PDFs, PYQs, Current Affairs आणि Exam Updates.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden font-normal" suppressHydrationWarning>
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}


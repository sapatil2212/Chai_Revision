import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 font-bold text-xl mb-4">
        ४०४
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-2">
        पृष्ठ सापडले नाही (Page Not Found)
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 font-normal">
        तुम्ही शोधत असलेले पृष्ठ उपलब्ध नाही किंवा त्याचा पत्ता बदलला असावा.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-all shadow-sm"
      >
        मुख्यपृष्ठावर परत जा (Return Home)
      </Link>
    </div>
  );
}

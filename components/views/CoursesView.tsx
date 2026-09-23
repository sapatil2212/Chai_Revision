'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { COURSES_DATA } from '@/lib/data';
import { GraduationCap, Clock, Video, Star, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export function CoursesView() {
  const { lang, t, viewParams, navigateTo } = useApp();
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);
  const selectedSlug = viewParams.slug;

  const selectedCourse = selectedSlug
    ? COURSES_DATA.find((c) => c.slug === selectedSlug)
    : null;

  if (selectedCourse) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <button
            onClick={() => navigateTo('courses')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>सर्व कोर्सेसकडे परत जा</span>
          </button>

          {enrolledNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{enrolledNotice}</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="relative aspect-[21/9] bg-slate-100">
              <img
                src={selectedCourse.coverImage}
                alt={selectedCourse.title[lang]}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md uppercase shadow-xs">
                  {selectedCourse.exam}
                </span>
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-md uppercase shadow-xs">
                  {selectedCourse.type}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6 text-left">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  मार्गदर्शक: {selectedCourse.instructor.name} ({selectedCourse.instructor.role})
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {selectedCourse.title[lang]}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  कालावधी: {selectedCourse.duration} • भाषा: {selectedCourse.language} • {selectedCourse.validity} वैधता
                </p>
              </div>

              {/* Price & Join CTA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{selectedCourse.discountedPrice}</span>
                    <span className="text-sm text-slate-400 line-through">₹{selectedCourse.originalPrice}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">कालावधी: {selectedCourse.duration} • संपूर्ण अभ्यासक्रम</p>
                </div>

                <button
                  onClick={() => setEnrolledNotice(`🎉 अभिनंदन! तुम्ही "${selectedCourse.title.mr}" बॅचसाठी नोंदणी सुरू केली आहे. संपर्क टीम २४ तासांत मार्गदर्शन करेल.`)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
                >
                  बॅचमध्ये प्रवेश मिळवा
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  बॅचची वैशिष्ट्ये (What You Will Learn)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCourse.whatYouWillLearn.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Syllabus Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  सविस्तर अभ्यासक्रम (Modules Breakdown)
                </h3>
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 divide-y divide-slate-200 text-xs">
                  {selectedCourse.modules.map((mod, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{mod.title}</span>
                      <span className="text-slate-500">{mod.lessons} लेक्चर्स ({mod.hours})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            ऑनलाइन व रेकॉर्डेड मार्गदर्शन
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.nav.courses} — टॉपर्स व तज्ज्ञ मार्गदर्शकांचे कोर्सेस
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            वेळेचे नियोजन, घटकनिहाय सराव आणि रिव्हिजन टेस्ट सिरीजसह परिपूर्ण तयारी.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COURSES_DATA.map((course) => (
            <div
              key={course.id}
              onClick={() => navigateTo('courses', { slug: course.slug })}
              className="bg-white hover:bg-blue-50/30 border border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between group text-left"
            >
              <div>
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={course.coverImage}
                    alt={course.title[lang]}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shadow-xs">
                      {course.exam}
                    </span>
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shadow-xs">
                      {course.type}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-blue-600">{course.instructor.name}</span>
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-700 leading-snug">
                    {course.title[lang]}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span>{course.modules.length} मॉड्यूल्स</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    {course.whatYouWillLearn.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">₹{course.discountedPrice}</span>
                    <span className="text-xs text-slate-400 line-through">₹{course.originalPrice}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('courses', { slug: course.slug });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
                  >
                    तपशील पाहा
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { COURSES_DATA } from '@/lib/data';
import { GraduationCap, Clock, Video, Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export function FeaturedCoursesSection() {
  const { lang, t, navigateTo } = useApp();

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-flex mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              मार्गदर्शन बॅचेस
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.featuredCourses}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.featuredCoursesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('courses')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>सर्व कोर्सेस पाहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {COURSES_DATA.map((course) => (
            <div
              key={course.id}
              onClick={() => navigateTo('courses', { slug: course.slug })}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group h-full text-left"
            >
              <div>
                {/* Course Banner Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img
                    src={course.coverImage}
                    alt={course.title[lang]}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      {course.exam}
                    </span>
                    <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      {course.type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-700 border border-slate-200/80 shadow-2xs text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium z-10">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full">
                      {course.instructor.name}
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg text-slate-800 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2 min-h-[50px]">
                    {course.title[lang]}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70">
                      {course.modules.length} मॉड्यूल्स
                    </span>
                    <span>•</span>
                    <span>वैधता: {course.validity}</span>
                  </div>

                  {/* Highlights Checklist */}
                  <div className="space-y-1.5 pt-1 min-h-[46px]">
                    {course.whatYouWillLearn.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-5 pt-0">
                <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-blue-700">₹{course.discountedPrice}</span>
                    <span className="text-xs text-slate-400 line-through">₹{course.originalPrice}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('courses', { slug: course.slug });
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-all shadow-2xs active:scale-98 cursor-pointer"
                  >
                    प्रवेश घ्या
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

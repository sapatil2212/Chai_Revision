'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { BLOG_POSTS_DATA } from '@/lib/data';
import { Newspaper, Calendar, Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';

export function BlogsView() {
  const { lang, t, viewParams, navigateTo } = useApp();
  const selectedSlug = viewParams.slug;

  const selectedPost = selectedSlug
    ? BLOG_POSTS_DATA.find((b) => b.slug === selectedSlug)
    : null;

  if (selectedPost) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <button
            onClick={() => navigateTo('blogs')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>सर्व ब्लॉग्सकडे परत जा</span>
          </button>

          <article className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="aspect-[21/9] bg-slate-100 overflow-hidden">
              <img
                src={selectedPost.coverImage}
                alt={selectedPost.title[lang]}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-10 space-y-6 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded uppercase text-[10px] shadow-xs">
                    {selectedPost.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedPost.publishedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {selectedPost.readingTime}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {selectedPost.title[lang]}
                </h1>

                <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>लेखक: <strong className="text-slate-900">{selectedPost.author.name}</strong> ({selectedPost.author.role})</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-base text-slate-900">
                  {selectedPost.excerpt[lang]}
                </p>
                <p>
                  स्पर्धा परीक्षेमध्ये केवळ दिवस-रात्र अभ्यास करणे पुरेसे नसते; तर योग्य दिशा आणि रणनीती ही सर्वात महत्त्वाची असते. बऱ्याचदा विद्यार्थी खूप पुस्तके वाचतात परंतु शेवटच्या काळात रिव्हिजन न केल्यामुळे सोपे प्रश्न देखील चुकतात.
                </p>
                <div className="bg-blue-50/60 border-l-4 border-blue-600 p-4 rounded-r-xl">
                  <p className="font-bold text-blue-900">
                    &ldquo;जास्त वाचण्यापेक्षा, जे वाचले आहे त्याची १० वेळा उजळणी करणे हेच MPSC चे खरे यशाचे गमक आहे.&rdquo;
                  </p>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 pt-2">
                  १. मायक्रो नोट्स तयार करा किंवा रिव्हिजन नोट्स वापरा
                </h3>
                <p>
                  प्रत्येक पुस्तकाचे किमान १०-१५ पानी सारांश तयार असावे. Chai Revision च्या नोट्स याच संकल्पनेवर आधारित आहेत ज्याद्वारे तुम्ही चहाच्या एका ब्रेक मध्ये १०० गुण मिळवून देणारे महत्त्वाचे मुद्दे रिव्हाईज करू शकता.
                </p>
              </div>

              {/* Related notes action */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">परीक्षेसाठी सर्वोत्तम रिव्हिजन नोट्स शोधा</h4>
                  <p className="text-xs text-slate-500">MPSC व इतर परीक्षांचे संपूर्ण डिजिटल स्टडी मटेरियल</p>
                </div>
                <button
                  onClick={() => navigateTo('materials')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs shadow-blue-500/20 shrink-0"
                >
                  स्टडी मटेरियल पाहा
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            अभ्यास मार्गदर्शन व रणनीती
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.nav.blogs} — टॉपर्सचे अनुभव व रणनीती ब्लॉग्स
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            स्पर्धा परीक्षेची स्मार्ट तयारी, वेळेचे व्यवस्थापन आणि अभ्यासाच्या प्रभावी पद्धती.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS_DATA.map((post) => (
            <div
              key={post.id}
              onClick={() => navigateTo('blogs', { slug: post.slug })}
              className="bg-white hover:bg-blue-50/30 border border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between group text-left"
            >
              <div>
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title[lang]}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase shadow-xs">
                      {post.category}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-700 leading-snug">
                    {post.title[lang]}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {post.excerpt[lang]}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{post.author.name}</span>
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <span>वाचा</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

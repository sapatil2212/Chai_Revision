'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Bot, Send, X, Sparkles, User, RefreshCw, BookOpen, Coffee, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function AIAssistantDrawer() {
  const { isAIAssistantOpen, setIsAIAssistantOpen, lang, t, navigateTo } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `नमस्कार विद्यार्थी मित्र! ☕ मी **चाय गुरु (Chai Guru)** आहे — तुमचा AI स्टडी कंपॅनियन.

MPSC, तलाठी, पोलीस भरती किंवा जिल्हा परिषद भरतीच्या कोणत्याही विषयाबद्दल मला थेट विचारा. उदा.
• राज्यघटना कलमे व घटनादुरुस्ती
• महाराष्ट्राचा इतिहास व समाजसुधारक
• भूगोल नद्या व सह्याद्री रांगा
• शेवटच्या दिवसांतील रिव्हिजन रणनीती`,
      timestamp: 'आताच',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAIAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAIAssistantOpen]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'आताच',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          language: lang,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'क्षमस्व, उत्तर मिळण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.',
        timestamp: 'आताच',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'नेटवर्क त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
          timestamp: 'आताच',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Radiant Floating Trigger Button (Pure Light Modern Theme) */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-5 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-full shadow-[0_4px_25px_rgba(37,99,235,0.35)] border border-blue-400/30 flex items-center gap-2.5 transition-all duration-300 group cursor-pointer hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-blue-700 animate-pulse" />
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight flex items-center gap-1">
            <span>चाय गुरु AI</span>
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
          </span>
          <span className="text-[10px] text-blue-100 leading-tight">२४/७ Study Assistant</span>
        </div>
      </button>

      {/* Slide-over Assistant Drawer */}
      {isAIAssistantOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAIAssistantOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>चाय गुरु (Chai Guru)</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full font-bold">
                      AI २४/७
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">स्पर्धा परीक्षा डिजिटल रिव्हिजन साथी</p>
                </div>
              </div>
              <button
                onClick={() => setIsAIAssistantOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompts Chips */}
            <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
              <button
                onClick={() => handleSend(t.ai.suggestedPrompt1)}
                className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
              >
                कलम ३२ (रिट्स)
              </button>
              <button
                onClick={() => handleSend(t.ai.suggestedPrompt2)}
                className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
              >
                महाराष्ट्रातील नद्या
              </button>
              <button
                onClick={() => handleSend(t.ai.suggestedPrompt3)}
                className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
              >
                ३० दिवसांची रणनीती
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white via-slate-50/30 to-white">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-bold border border-blue-200">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed text-left shadow-2xs ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-blue-500/10'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                    <span
                      className={`block text-[9px] mt-1 ${
                        m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold border border-slate-200">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200/80 p-2.5 rounded-xl w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span className="font-medium">{t.ai.typing}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200/80 bg-slate-50/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.ai.placeholder}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all shadow-xs cursor-pointer active:scale-95"
                  title={t.ai.send}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Chai Guru • AI Study Companion</span>
                <button
                  onClick={() => {
                    setIsAIAssistantOpen(false);
                    navigateTo('materials');
                  }}
                  className="hover:underline text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  स्टडी मटेरियल्स पाहा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

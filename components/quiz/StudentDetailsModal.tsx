'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Mail, MapPin, Phone, Play, RefreshCw, User, X } from 'lucide-react';
import type { Language } from '@/lib/types';
import { quizStorage, type StudentDetails } from '@/lib/quizClient';

interface Props {
  quizTitle: string;
  lang: Language;
  /** True while the attempt is being created on the server. */
  busy: boolean;
  /** Error returned by the server (e.g. attempt limit reached). */
  serverError: string;
  onCancel: () => void;
  onSubmit: (details: StudentDetails) => void;
}

type Field = keyof StudentDetails;

const T = {
  mr: {
    heading: 'तुमची माहिती भरा',
    sub: 'टेस्ट सुरू करण्यापूर्वी खालील माहिती आवश्यक आहे. ही माहिती फक्त निकाल व संपर्कासाठी वापरली जाईल.',
    name: 'पूर्ण नाव',
    namePh: 'उदा. राहुल पाटील',
    mobile: 'मोबाइल क्रमांक',
    mobilePh: '१० अंकी मोबाइल क्रमांक',
    email: 'ई-मेल',
    emailPh: 'उदा. rahul@gmail.com',
    optional: 'ऐच्छिक',
    address: 'पत्ता (गाव/शहर व जिल्हा)',
    addressPh: 'उदा. शिरूर, जि. पुणे',
    cancel: 'रद्द करा',
    start: 'टेस्ट सुरू करा',
    required: 'आवश्यक',
    errName: 'कृपया तुमचे पूर्ण नाव लिहा.',
    errMobile: 'कृपया वैध १० अंकी मोबाइल क्रमांक लिहा.',
    errEmail: 'ई-मेल चुकीचा आहे. योग्य ई-मेल लिहा किंवा रिकामा ठेवा.',
    errAddress: 'कृपया तुमचा पत्ता (गाव/शहर व जिल्हा) लिहा.',
    nameHint: 'हेच नाव गुणवत्ता यादीत दिसेल.',
  },
  en: {
    heading: 'Enter your details',
    sub: 'These details are required before the test starts. They are used only for your result and for contacting you.',
    name: 'Full name',
    namePh: 'e.g. Rahul Patil',
    mobile: 'Mobile number',
    mobilePh: '10-digit mobile number',
    email: 'Email',
    emailPh: 'e.g. rahul@gmail.com',
    optional: 'optional',
    address: 'Address (village/city and district)',
    addressPh: 'e.g. Shirur, Dist. Pune',
    cancel: 'Cancel',
    start: 'Start test',
    required: 'required',
    errName: 'Please enter your full name.',
    errMobile: 'Please enter a valid 10-digit mobile number.',
    errEmail: 'That email looks wrong. Fix it or leave it empty.',
    errAddress: 'Please enter your address (village/city and district).',
    nameHint: 'This name appears on the leaderboard.',
  },
};

/** Keeps only digits and drops a +91 / 0 prefix, mirroring the server. */
export const normalizeMobile = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};

/** Same rules as parseStudentDetails() on the server, so students see errors instantly. */
export function validateDetails(d: StudentDetails, t: (typeof T)['mr']): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (d.name.trim().length < 2) errors.name = t.errName;
  if (!/^[6-9]\d{9}$/.test(normalizeMobile(d.mobile))) errors.mobile = t.errMobile;
  const email = d.email.trim();
  if (email && !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) errors.email = t.errEmail;
  if (d.address.trim().length < 4) errors.address = t.errAddress;
  return errors;
}

export function StudentDetailsModal({ quizTitle, lang, busy, serverError, onCancel, onSubmit }: Props) {
  const t = T[lang === 'en' ? 'en' : 'mr'];
  // Prefilled from this browser's previous test. The modal only ever mounts after a
  // click, so reading localStorage in the initializer cannot cause a hydration mismatch.
  const [details, setDetails] = useState<StudentDetails>(() => quizStorage.getDetails());
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...details, [field]: e.target.value };
    setDetails(next);
    if (touched) setErrors(validateDetails(next, t));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateDetails(details, t);
    setTouched(true);
    setErrors(found);
    if (Object.keys(found).length) return;
    const clean: StudentDetails = {
      name: details.name.trim(),
      mobile: normalizeMobile(details.mobile),
      email: details.email.trim(),
      address: details.address.trim(),
    };
    quizStorage.setDetails(clean);
    onSubmit(clean);
  };

  const field = (
    id: Field,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    extra: { optional?: boolean; type?: string; maxLength: number; autoComplete: string; hint?: string; textarea?: boolean }
  ) => {
    const err = errors[id];
    return (
      <div>
        <label htmlFor={`sd-${id}`} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}{' '}
          <span className={`text-[10px] font-normal ${extra.optional ? 'text-slate-400' : 'text-rose-600'}`}>
            ({extra.optional ? t.optional : t.required})
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-slate-400 pointer-events-none" aria-hidden="true">
            {icon}
          </span>
          {extra.textarea ? (
            <textarea
              id={`sd-${id}`}
              value={details[id]}
              onChange={set(id)}
              rows={2}
              maxLength={extra.maxLength}
              autoComplete={extra.autoComplete}
              placeholder={placeholder}
              aria-invalid={!!err}
              aria-describedby={err ? `sd-${id}-err` : extra.hint ? `sd-${id}-hint` : undefined}
              className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-sm resize-none focus:outline-hidden focus:bg-white focus:ring-2 ${
                err ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
              }`}
            />
          ) : (
            <input
              id={`sd-${id}`}
              ref={id === 'name' ? firstFieldRef : undefined}
              value={details[id]}
              onChange={set(id)}
              type={extra.type || 'text'}
              inputMode={id === 'mobile' ? 'numeric' : undefined}
              maxLength={extra.maxLength}
              autoComplete={extra.autoComplete}
              placeholder={placeholder}
              aria-invalid={!!err}
              aria-describedby={err ? `sd-${id}-err` : extra.hint ? `sd-${id}-hint` : undefined}
              className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:ring-2 ${
                err ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
              }`}
            />
          )}
        </div>
        {err ? (
          <p id={`sd-${id}-err`} className="mt-1 text-[11px] font-semibold text-rose-700">
            {err}
          </p>
        ) : (
          extra.hint && (
            <p id={`sd-${id}-hint`} className="mt-1 text-[11px] text-slate-400">
              {extra.hint}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sd-title"
    >
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl w-full max-w-lg my-auto shadow-2xl animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 id="sd-title" className="text-base font-bold text-[#1E2653]">
              {t.heading}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{quizTitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2.5">
            {t.sub}
          </p>

          {field('name', t.name, t.namePh, <User className="w-4 h-4" />, {
            maxLength: 40,
            autoComplete: 'name',
            hint: t.nameHint,
          })}
          {field('mobile', t.mobile, t.mobilePh, <Phone className="w-4 h-4" />, {
            maxLength: 15,
            autoComplete: 'tel',
            type: 'tel',
          })}
          {field('email', t.email, t.emailPh, <Mail className="w-4 h-4" />, {
            maxLength: 191,
            autoComplete: 'email',
            type: 'email',
            optional: true,
          })}
          {field('address', t.address, t.addressPh, <MapPin className="w-4 h-4" />, {
            maxLength: 300,
            autoComplete: 'street-address',
            textarea: true,
          })}

          {serverError && (
            <p
              className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {serverError}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-[#1C2C5B] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            {t.start}
          </button>
        </div>
      </form>
    </div>
  );
}

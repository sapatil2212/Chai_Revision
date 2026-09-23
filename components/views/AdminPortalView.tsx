'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA, EXAM_UPDATES_DATA } from '@/lib/data';
import {
  ShieldCheck,
  BarChart3,
  BookOpen,
  Bell,
  Key,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  TrendingUp,
  DownloadCloud,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function AdminPortalView() {
  const { lang, t, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'updates' | 'tokens'>('overview');

  // Local state for materials list to allow adding/editing
  const [materials, setMaterials] = useState(STUDY_MATERIALS_DATA);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Material form state
  const [newTitle, setNewTitle] = useState('');
  const [newExam, setNewExam] = useState('MPSC');
  const [newSubject, setNewSubject] = useState('राज्यघटना');
  const [newPrice, setNewPrice] = useState('149');
  const [newPages, setNewPages] = useState('120');

  const chartData = [
    { day: 'सोमवार', downloads: 340, revenue: 42000 },
    { day: 'मंगळवार', downloads: 480, revenue: 58000 },
    { day: 'बुधवार', downloads: 590, revenue: 71000 },
    { day: 'गुरुवार', downloads: 610, revenue: 76000 },
    { day: 'शुक्रवार', downloads: 780, revenue: 95000 },
    { day: 'शनिवार', downloads: 920, revenue: 114000 },
    { day: 'रविवार', downloads: 1150, revenue: 148000 },
  ];

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newItem: (typeof STUDY_MATERIALS_DATA)[0] = {
      ...STUDY_MATERIALS_DATA[0],
      id: `mat-${Date.now()}`,
      slug: `custom-${Date.now()}`,
      title: { mr: newTitle, en: newTitle, hi: newTitle },
      exam: newExam as any,
      subject: newSubject as any,
      discountedPrice: Number(newPrice),
      pages: Number(newPages),
      lastUpdated: 'आताच जोडले',
    };

    setMaterials([newItem, ...materials]);
    setShowAddModal(false);
    setNewTitle('');
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 text-left">
        {/* Admin Header */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                प्रशासन पोर्टल (Admin Console)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Chai Revision व्यवस्थापन केंद्र
            </h1>
            <p className="text-xs text-slate-500">
              स्टडी मटेरियल्स, परीक्षा परिपत्रके, डिजिटल राइट्स आणि विद्यार्थी विश्लेषण.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-xs shadow-blue-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन मटेरियल जोडा</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-blue-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>विश्लेषण (Analytics)</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'materials' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-blue-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>स्टडी मटेरियल्स व्यवस्थापन ({materials.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tokens' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-blue-600'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>सुरक्षा व डाऊनलोड टोकन्स</span>
          </button>
        </div>

        {/* Tab 1: Overview Analytics */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">एकूण विद्यार्थी</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">१,५०,४२०</p>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +१४% या महिन्यात
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">डिजिटल डाऊनलोड्स</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">८४,९१०</p>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                  <DownloadCloud className="w-3.5 h-3.5" />
                  +२१% या आठवड्यात
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">सक्रिय टोकन्स</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">३२,४००</p>
                <span className="text-[11px] text-slate-500 font-semibold mt-1">सुरक्षित एनक्रिप्टेड</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">एकूण ई-बुक्स</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{materials.length}</p>
                <span className="text-[11px] text-blue-600 font-bold mt-1">१० प्रमुख परीक्षा</span>
              </div>
            </div>

            {/* Weekly Downloads Chart with Recharts */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  साप्ताहिक विद्यार्थी डाऊनलोड्स ट्रेंड (Weekly Download Volume)
                </h3>
                <p className="text-xs text-slate-500">
                  मागील ७ दिवसांमधील दररोज डाऊनलोड केलेल्या अभ्यास साहित्य फायलींची संख्या.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="downloads"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDownloads)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Materials Management Table */}
        {activeTab === 'materials' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="font-extrabold text-sm text-slate-900">उपलब्ध डिजिटल स्टडी मटेरियल्स</span>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs shadow-blue-500/20"
              >
                + नवीन जोडा
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">साहित्याचे नाव</th>
                    <th className="p-3.5">परीक्षा</th>
                    <th className="p-3.5">विषय</th>
                    <th className="p-3.5">पृष्ठे</th>
                    <th className="p-3.5">किंमत</th>
                    <th className="p-3.5 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">
                        {mat.title.mr}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] shadow-2xs">
                          {mat.exam}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{mat.subject}</td>
                      <td className="p-3.5 text-slate-600">{mat.pages}</td>
                      <td className="p-3.5 font-bold text-blue-600">
                        {mat.isFree ? 'मोफत' : `₹${mat.discountedPrice}`}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => alert(`किंमत बदल संपादित करा: ${mat.title.mr}`)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors inline-block"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors inline-block"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Token Logs */}
        {activeTab === 'tokens' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                डिजिटल डाऊनलोड टोकन ऑडिट लॉग (Token Audit System)
              </h3>
              <p className="text-xs text-slate-500">
                प्रत्येक विद्यार्थ्याला जारी केलेले सुरक्षित वन-टाइम / डिव्हाइस-बाउन्ड डाऊनलोड टोकन्स.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {[
                { token: 'tok_mpsc_polity_sec_994812', user: 'sameer.mpsc2026@gmail.com', material: 'भारतीय राज्यघटना रिव्हिजन', status: 'ACTIVE', ip: '103.21.144.12' },
                { token: 'tok_geo_maps_sec_109284', user: 'aspirant.pune@gmail.com', material: 'महाराष्ट्र भूगोल नकाशे', status: 'ACTIVE', ip: '49.36.12.98' },
                { token: 'tok_talathi_mr_992104', user: 'rahul.talathi@gmail.com', material: 'तलाठी मराठी व्याकरण', status: 'ACTIVE', ip: '157.34.89.21' },
              ].map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-blue-700 block">{log.token}</span>
                    <span className="text-[11px] text-slate-600 font-sans">{log.user} • {log.material}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono">{log.ip}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-sans">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Material Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">
                नवीन स्टडी मटेरियल प्रकाशित करा
              </h3>
              <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">साहित्याचे नाव (Title)</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="उदा. आधुनिक भारताचा इतिहास शॉर्ट नोट्स"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">परीक्षा</label>
                    <select
                      value={newExam}
                      onChange={(e) => setNewExam(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="MPSC">MPSC</option>
                      <option value="PSI">PSI</option>
                      <option value="Talathi">तलाठी</option>
                      <option value="Police Bharti">पोलीस भरती</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">विषय</label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">किंमत (₹)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">पृष्ठ संख्या</label>
                    <input
                      type="number"
                      value={newPages}
                      onChange={(e) => setNewPages(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-xs shadow-blue-500/20"
                  >
                    प्रसिद्ध करा
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

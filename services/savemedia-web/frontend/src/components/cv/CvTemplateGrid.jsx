import { useState } from 'react'

export const CV_CATEGORIES = [
  { id: 'all', label: 'CV/ID Mode' },
  { id: 'profile', label: 'Profile Photo Mode' },
  { id: 'restore', label: 'Restore Mode' },
  { id: 'doctor', label: 'គ្រូពេទ្យ' },
  { id: 'teacher', label: 'គ្រូបង្រៀន' },
  { id: 'traditional', label: 'អាវប៉ាក់ប្រពៃណី' },
  { id: 'couple', label: 'Couple Mode' },
]

export const CV_TEMPLATES = [
  {
    id: 'men-suit-blue',
    category: 'all',
    title: 'ពីរបភាពធម្មតាទៅ CV 4x6 ផ្ទៃខៀវ',
    enTitle: 'Standard Men Suit (Cambodian Blue BG)',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 101,
    dislikes: 7,
    used: 533,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'men_black_suit',
  },
  {
    id: 'men-suit-white',
    category: 'all',
    title: 'ពីរបភាពធម្មតាទៅ CV 4x6 ផ្ទៃស',
    enTitle: 'Standard Men Suit (Studio White BG)',
    gender: 'male',
    bg: '#FFFFFF',
    bgName: 'White',
    likes: 47,
    dislikes: 2,
    used: 118,
    badge: 'POPULAR',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    suitType: 'men_black_suit',
  },
  {
    id: 'women-blazer-collar',
    category: 'all',
    title: 'fully closed collar neck + black blazer corporate style',
    enTitle: 'Women Corporate Collar & Blazer',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 68,
    dislikes: 1,
    used: 240,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'women_collar_blazer',
  },
  {
    id: 'men-tie-red',
    category: 'all',
    title: 'A professional 4×6 cm (Navy Suit & Tie)',
    enTitle: 'Navy Blue Suit & Tie',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 36,
    dislikes: 0,
    used: 94,
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    suitType: 'men_navy_suit',
  },
  {
    id: 'women-suit-tie',
    category: 'all',
    title: 'A girl (female) into a professional CV photo',
    enTitle: 'Female Professional Suit & Tie',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 48,
    dislikes: 1,
    used: 160,
    badge: 'POPULAR',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    suitType: 'women_suit_tie',
  },
  {
    id: 'doctor-coat',
    category: 'doctor',
    title: 'គ្រូពេទ្យ — Medical Doctor Lab Coat',
    enTitle: 'Doctor / Nurse Uniform',
    gender: 'unisex',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 82,
    dislikes: 3,
    used: 215,
    badge: 'OFFICIAL',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    suitType: 'doctor_coat',
  },
  {
    id: 'teacher-uniform',
    category: 'teacher',
    title: 'គ្រូបង្រៀន — Formal Academic Teacher Outfit',
    enTitle: 'Teacher / Academic Uniform',
    gender: 'unisex',
    bg: '#FFFFFF',
    bgName: 'White',
    likes: 54,
    dislikes: 0,
    used: 130,
    badge: 'POPULAR',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    suitType: 'teacher_outfit',
  },
  {
    id: 'khmer-traditional-lace',
    category: 'traditional',
    title: 'អាវប៉ាក់ប្រពៃណី — Traditional Studio Portrait',
    enTitle: 'Cambodian Traditional Lace Blouse',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    likes: 93,
    dislikes: 0,
    used: 320,
    badge: 'HOT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    suitType: 'khmer_lace',
  },
]

export default function CvTemplateGrid({ onSelectTemplate }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredTemplates = activeCategory === 'all'
    ? CV_TEMPLATES
    : CV_TEMPLATES.filter((t) => t.category === activeCategory || t.category === 'all')

  return (
    <div className="w-full max-w-[920px] animate-fade-in mb-10">
      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {CV_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => onSelectTemplate(tpl)}
            className="group relative bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
          >
            {/* Top Card Visual Area */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-slate-950 flex items-center justify-center border border-white/5">
              {/* Simulated Background */}
              <div
                className="absolute inset-0 transition-opacity duration-300 opacity-90 group-hover:opacity-100"
                style={{ backgroundColor: tpl.bg }}
              />

              {/* Portrait Silhouette / Preview Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-900/80 border-2 border-white/20 flex items-center justify-center text-2xl shadow-xl">
                  {tpl.gender === 'female' ? '👩‍💼' : tpl.suitType === 'doctor_coat' ? '🩺' : tpl.suitType === 'khmer_lace' ? '✨' : '🤵'}
                </div>
                <div className="mt-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                  {tpl.suitType.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Badges */}
              {tpl.badge && (
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tpl.badgeColor}`}>
                    {tpl.badge}
                  </span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 z-20">
                <span className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Bottom Info Area */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors mb-1">
                {tpl.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mb-3">
                {tpl.enTitle}
              </p>

              {/* Stats Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {tpl.likes}
                  </span>
                  <span>Used {tpl.used}</span>
                </div>

                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                  4×6 cm
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

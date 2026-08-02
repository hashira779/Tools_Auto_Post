import { useState } from 'react'

import imgMenSuitBlue from '../../assets/templates/men_suit_blue.png'
import imgMenSuitNavy from '../../assets/templates/men_suit_navy_red.png'
import imgWomenBlazer from '../../assets/templates/women_blazer.png'
import imgDoctorCoat from '../../assets/templates/doctor_coat.png'
import imgDoctorFemale from '../../assets/templates/doctor_female.png'
import imgDoctorScrubs from '../../assets/templates/doctor_scrubs.png'
import imgTeacherUniform from '../../assets/templates/teacher_uniform.png'
import imgKhmerLace from '../../assets/templates/khmer_lace.png'
import imgKhmerSilkGold from '../../assets/templates/khmer_silk_gold.png'

export const CV_CATEGORIES = [
  { id: 'all', label: 'CV/ID Mode' },
  { id: 'doctor', label: 'គ្រូពេទ្យ (Doctor)' },
  { id: 'teacher', label: 'គ្រូបង្រៀន (Teacher)' },
  { id: 'traditional', label: 'អាវប៉ាក់ប្រពៃណី (Traditional)' },
  { id: 'profile', label: 'Profile Photo Mode' },
  { id: 'restore', label: 'Restore Mode' },
  { id: 'couple', label: 'Couple Mode' },
]

export const CV_TEMPLATES = [
  // ── CV / ID Suits ──────────────────────────────────────────
  {
    id: 'men-suit-blue',
    category: 'all',
    title: 'ពីរបភាពធម្មតាទៅ CV 4x6 ផ្ទៃខៀវ',
    enTitle: 'Classic Black Suit + Tie (Cambodian Blue BG)',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgMenSuitBlue,
    likes: 101,
    dislikes: 7,
    used: 533,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'men_black_suit',
  },
  {
    id: 'men-suit-navy',
    category: 'all',
    title: 'A professional 4×6 cm (Navy Suit & Tie)',
    enTitle: 'Navy Blue Tailored Suit + Red Tie',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgMenSuitNavy,
    likes: 58,
    dislikes: 0,
    used: 194,
    badge: 'POPULAR',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    suitType: 'men_navy_suit',
  },
  {
    id: 'women-blazer-collar',
    category: 'all',
    title: 'fully closed collar neck + black blazer corporate style',
    enTitle: 'Women Corporate Closed Collar Blazer',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgWomenBlazer,
    likes: 68,
    dislikes: 1,
    used: 240,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'women_collar_blazer',
  },
  {
    id: 'men-suit-white',
    category: 'all',
    title: 'ពីរបភាពធម្មតាទៅ CV 4x6 ផ្ទៃស',
    enTitle: 'Standard Men Suit (Studio White BG)',
    gender: 'male',
    bg: '#FFFFFF',
    bgName: 'White',
    image: imgMenSuitBlue,
    likes: 47,
    dislikes: 2,
    used: 118,
    badge: 'POPULAR',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    suitType: 'men_black_suit',
  },
  {
    id: 'women-suit-tie',
    category: 'all',
    title: 'A girl (female) into a professional CV photo',
    enTitle: 'Female Professional Suit & Blouse',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgWomenBlazer,
    likes: 48,
    dislikes: 1,
    used: 160,
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    suitType: 'women_suit_tie',
  },

  // ── Doctor គ្រូពេទ្យ (No Logos) ───────────────────────────
  {
    id: 'doctor-s1',
    category: 'doctor',
    title: 'គ្រូពេទ្យ S1 Style — Male Doctor Lab Coat',
    enTitle: 'Male Doctor White Lab Coat (No Logo)',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgDoctorCoat,
    likes: 82,
    dislikes: 3,
    used: 215,
    badge: 'OFFICIAL',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    suitType: 'doctor_coat',
  },
  {
    id: 'doctor-s2',
    category: 'doctor',
    title: 'គ្រូពេទ្យ S2 Style — Female Doctor Lab Coat',
    enTitle: 'Female Doctor White Lab Coat (No Logo)',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgDoctorFemale,
    likes: 74,
    dislikes: 1,
    used: 188,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'doctor_coat',
  },
  {
    id: 'doctor-scrubs',
    category: 'doctor',
    title: 'គ្រូពេទ្យ S3 Style — Blue Medical Scrubs',
    enTitle: 'Hospital Medical Scrubs (Clean Solid Blue)',
    gender: 'unisex',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgDoctorScrubs,
    likes: 41,
    dislikes: 0,
    used: 95,
    badge: 'HOT',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    suitType: 'doctor_scrubs',
  },

  // ── Teacher គ្រូបង្រៀន (No Logos) ─────────────────────────
  {
    id: 'teacher-uniform',
    category: 'teacher',
    title: 'គ្រូបង្រៀន — Formal Academic Teacher Outfit',
    enTitle: 'Formal Teacher Uniform Shirt (No Logo)',
    gender: 'unisex',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgTeacherUniform,
    likes: 64,
    dislikes: 0,
    used: 152,
    badge: 'POPULAR',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    suitType: 'teacher_outfit',
  },

  // ── Traditional អាវប៉ាក់ប្រពៃណី (No Logos) ────────────────
  {
    id: 'khmer-traditional-lace',
    category: 'traditional',
    title: 'អាវប៉ាក់ប្រពៃណី — Traditional White Lace Blouse',
    enTitle: 'Cambodian Traditional Lace Blouse Portrait',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgKhmerLace,
    likes: 93,
    dislikes: 0,
    used: 320,
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    suitType: 'khmer_lace',
  },
  {
    id: 'khmer-silk-gold',
    category: 'traditional',
    title: 'អាវប៉ាក់ហូលផាមួង — Golden Silk Ceremony Outfit',
    enTitle: 'Traditional Silk Blouse (Gold & Purple)',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgKhmerSilkGold,
    likes: 88,
    dislikes: 0,
    used: 275,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'khmer_lace',
  },

  // ── Profile Photo Mode ──────────────────────────────────
  {
    id: 'profile-pro-male',
    category: 'profile',
    title: 'រូប Profile បែបអាជីព — Professional Executive Suit',
    enTitle: 'Modern Executive Portrait',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgMenSuitNavy,
    likes: 112,
    dislikes: 2,
    used: 410,
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    suitType: 'men_navy_suit',
  },
  {
    id: 'profile-pro-female',
    category: 'profile',
    title: 'រូប Profile ស្ត្រី — Business Leader Blazer',
    enTitle: 'Modern Business Leader Portrait',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgWomenBlazer,
    likes: 105,
    dislikes: 1,
    used: 380,
    badge: 'RECOMMENDED',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    suitType: 'women_collar_blazer',
  },

  // ── Restore Mode ────────────────────────────────────────
  {
    id: 'restore-id-vintage',
    category: 'restore',
    title: 'ស្តាររូបថតចាស់ទៅ 4x6 ថ្មី — Vintage to HD Restoration',
    enTitle: 'Restore Old Photo to HD 4x6 ID',
    gender: 'male',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgMenSuitBlue,
    likes: 95,
    dislikes: 0,
    used: 260,
    badge: 'POPULAR',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    suitType: 'men_black_suit',
  },

  // ── Couple Mode ─────────────────────────────────────────
  {
    id: 'couple-traditional',
    category: 'couple',
    title: 'រូបថតគូស្នេហ៍អាវប៉ាក់ — Couple Traditional Silk',
    enTitle: 'Khmer Traditional Ceremony Couple',
    gender: 'female',
    bg: '#0072C6',
    bgName: 'Blue',
    image: imgKhmerSilkGold,
    likes: 140,
    dislikes: 3,
    used: 520,
    badge: 'HOT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    suitType: 'khmer_lace',
  },
]

export default function CvTemplateGrid({ onSelectTemplate }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredTemplates = activeCategory === 'all'
    ? CV_TEMPLATES
    : CV_TEMPLATES.filter((t) => t.category === activeCategory)

  return (
    <div className="w-full max-w-[960px] animate-fade-in mb-10">
      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {CV_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => onSelectTemplate(tpl)}
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/15 flex flex-col justify-between"
          >
            {/* Top Card Visual Area */}
            <div className="relative w-full h-56 rounded-xl overflow-hidden mb-3 bg-slate-950 flex items-center justify-center border border-white/5">
              {/* Real Template Image */}
              <img
                src={tpl.image}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Badges */}
              {tpl.badge && (
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${tpl.badgeColor}`}>
                    {tpl.badge}
                  </span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 z-20">
                <span className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </span>
              </div>

              {/* Bottom overlay badge */}
              <div className="absolute bottom-2 left-2 z-20">
                <span className="px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                  CV 4×6
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

                <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                  ⚡ 1-Tap Use
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

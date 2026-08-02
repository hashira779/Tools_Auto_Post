import Icon from '../constants/icons'
import { FORMAT_VIDEO, FORMAT_AUDIO } from '../constants/platforms'

export default function FormatTabs({ activeTab, onSwitch }) {
  const tabs = [
    { key: FORMAT_VIDEO, label: 'MP4 Video', icon: Icon.video },
    { key: FORMAT_AUDIO, label: 'MP3 Audio', icon: Icon.music },
  ]

  return (
    <div id="format-tabs" className="flex gap-2 bg-slate-950/80 rounded-2xl p-1.5 mb-6 border border-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5
                      rounded-xl text-xs sm:text-sm font-semibold cursor-pointer border
                      transition-all duration-200 select-none
                      ${activeTab === tab.key
                        ? 'bg-slate-800 text-white border-white/10 shadow-md font-bold'
                        : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                      }`}
          onClick={() => onSwitch(tab.key)}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

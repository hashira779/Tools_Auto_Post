import Icon from '../constants/icons'
import { FORMAT_VIDEO, FORMAT_AUDIO } from '../constants/platforms'

export default function FormatTabs({ activeTab, onSwitch }) {
  const tabs = [
    { key: FORMAT_VIDEO, label: 'MP4 Video', icon: Icon.video },
    { key: FORMAT_AUDIO, label: 'MP3 Audio', icon: Icon.music },
  ]

  return (
    <div id="format-tabs" className="flex gap-2 bg-gray-100 rounded-3xl p-2 mb-6 shadow-inner">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-3
                      rounded-2xl text-base font-bold cursor-pointer border-none
                      transition-all duration-300
                      ${activeTab === tab.key
                        ? 'bg-white text-[var(--color-accent-blue)] shadow-[0_4px_10px_rgba(0,0,0,0.08)] scale-100'
                        : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95 hover:scale-100'
                      }`}
          onClick={() => onSwitch(tab.key)}
        >
          <span className={`transition-transform duration-300 ${activeTab === tab.key ? 'scale-125' : ''}`}>
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

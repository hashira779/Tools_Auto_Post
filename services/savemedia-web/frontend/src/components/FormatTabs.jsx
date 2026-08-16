import Icon from '../constants/icons'
import { FORMAT_VIDEO, FORMAT_AUDIO } from '../constants/platforms'

export default function FormatTabs({ activeTab, onSwitch }) {
  const tabs = [
    { key: FORMAT_VIDEO, label: 'MP4 Video', icon: Icon.video },
    { key: FORMAT_AUDIO, label: 'MP3 Audio', icon: Icon.music },
  ]

  return (
    <div id="format-tabs" className="flex gap-1.5 bg-[var(--color-surface-1)] rounded-xl p-1.5 mb-6 border border-[var(--color-border)] shadow-inner">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 select-none ${
            activeTab === tab.key
              ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] shadow-sm border border-[var(--color-border-2)]'
              : 'bg-transparent text-[var(--color-text-3)] border border-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
          }`}
          onClick={() => onSwitch(tab.key)}
        >
          <span className={activeTab === tab.key ? 'text-[var(--color-primary-400)]' : ''}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

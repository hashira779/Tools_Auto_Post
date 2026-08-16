import Icon from '../constants/icons'
import { FORMAT_VIDEO, FORMAT_AUDIO } from '../constants/platforms'

export default function FormatTabs({ activeTab, onSwitch }) {
  const tabs = [
    { key: FORMAT_VIDEO, label: 'MP4 Video', icon: Icon.video },
    { key: FORMAT_AUDIO, label: 'MP3 Audio', icon: Icon.music },
  ]

  return (
    <div id="format-tabs" className="flex gap-1.5 p-1 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 select-none border focus-ring ${
            activeTab === tab.key
              ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border-2)] shadow-sm'
              : 'bg-transparent text-[var(--color-text-3)] border-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-1)]'
          }`}
          onClick={() => onSwitch(tab.key)}
        >
          <span className={activeTab === tab.key ? 'text-[var(--color-primary-400)]' : 'opacity-70'}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

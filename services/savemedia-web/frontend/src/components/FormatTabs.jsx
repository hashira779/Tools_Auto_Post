import Icon from '../constants/icons'
import { FORMAT_VIDEO, FORMAT_AUDIO } from '../constants/platforms'

export default function FormatTabs({ activeTab, onSwitch }) {
  const tabs = [
    { key: FORMAT_VIDEO, label: 'MP4 Video', icon: Icon.video },
    { key: FORMAT_AUDIO, label: 'MP3 Audio', icon: Icon.music },
  ]

  return (
    <div id="format-tabs" className="flex gap-1 bg-[var(--color-surface)] rounded-xl p-1 mb-5 border border-[var(--color-border)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 select-none ${
            activeTab === tab.key
              ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border-2)]'
              : 'bg-transparent text-[var(--color-text-3)] border border-transparent hover:text-[var(--color-text-2)]'
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

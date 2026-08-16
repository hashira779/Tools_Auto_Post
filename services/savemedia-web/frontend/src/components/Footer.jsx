export default function Footer() {
  return (
    <footer className="w-full mt-auto bg-[var(--color-surface-1)] border-t border-[var(--color-border)]">
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="w-7 h-7 opacity-90" width="28" height="28" />
              <span className="font-extrabold text-[var(--color-text)] text-base tracking-tight">CamTech</span>
            </div>
            <span className="text-[13px] font-medium text-[var(--color-text-4)] hidden sm:block border-l border-[var(--color-border-2)] pl-6">
              Fast, free & private media tools
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://t.me/CamTechLyricBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-[var(--color-text-3)] hover:text-[var(--color-text)] transition-colors"
            >
              Telegram Bots
            </a>
            <a
              href="https://camtech.cam"
              className="text-[13px] font-semibold text-[var(--color-text-3)] hover:text-[var(--color-text)] transition-colors"
            >
              camtech.cam
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border-2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px] font-medium text-[var(--color-text-4)]">
            &copy; {new Date().getFullYear()} CamTech. All rights reserved.
          </p>
          <p className="text-[12px] font-medium text-[var(--color-text-4)]">
            Built in Cambodia
          </p>
        </div>
      </div>
    </footer>
  )
}

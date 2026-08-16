export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[var(--color-border)]">
      <div className="max-w-[1024px] mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="" className="w-5 h-5 opacity-60" width="20" height="20" />
              <span className="font-semibold text-[var(--color-text-2)] text-sm tracking-tight">CamTech</span>
            </div>
            <span className="text-[12px] text-[var(--color-text-4)] hidden sm:block border-l border-[var(--color-border-2)] pl-5">
              Free & private media tools
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://t.me/CamTechLyricBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--color-text-4)] hover:text-[var(--color-text-2)] transition-colors"
            >
              Telegram Bots
            </a>
            <a
              href="https://camtech.cam"
              className="text-[12px] text-[var(--color-text-4)] hover:text-[var(--color-text-2)] transition-colors"
            >
              camtech.cam
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--color-text-4)]">
            &copy; {new Date().getFullYear()} CamTech. All rights reserved.
          </p>
          <p className="text-[11px] text-[var(--color-text-4)]">
            Built in Cambodia 🇰🇭
          </p>
        </div>
      </div>
    </footer>
  )
}

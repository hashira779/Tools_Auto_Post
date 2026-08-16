export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="w-6 h-6" width="24" height="24" />
              <span className="font-bold text-[var(--color-text)] text-sm">CamTech</span>
            </div>
            <span className="text-[12px] text-[var(--color-text-4)]">
              Fast, free & private media tools
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://t.me/CamTechLyricBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--color-text-3)] hover:text-[var(--color-text-2)] transition-colors"
            >
              Telegram Bots
            </a>
            <span className="text-[var(--color-text-4)]">&middot;</span>
            <a
              href="https://camtech.cam"
              className="text-[12px] text-[var(--color-text-3)] hover:text-[var(--color-text-2)] transition-colors"
            >
              camtech.cam
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--color-text-4)]">
            &copy; {new Date().getFullYear()} CamTech. All rights reserved.
          </p>
          <p className="text-[11px] text-[var(--color-text-4)]">
            Built in Cambodia
          </p>
        </div>
      </div>
    </footer>
  )
}

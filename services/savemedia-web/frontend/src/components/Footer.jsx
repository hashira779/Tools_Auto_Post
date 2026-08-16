import CamtechLogo from './CamtechLogo'

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[var(--color-border)]">
      <div className="max-w-[1024px] mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-5">
            <div className="flex items-center">
              <CamtechLogo variant="full" theme="color" width={110} />
            </div>
            <span className="text-[12px] text-[var(--color-text-4)] hidden sm:block border-l border-[var(--color-border-2)] pl-5">
              Free & private media tools
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
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

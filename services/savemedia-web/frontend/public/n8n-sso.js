(function () {
    // Access is already gated by the main app: /automations requires a Supabase
    // Google session AND a verified account before it will show the "Launch
    // Standalone Workspace" link. Prompting for Google again here was a second
    // sign-in in front of a login that is automated anyway, so this script now
    // signs in to n8n silently. Dropping the Google Identity Services script
    // also removes the Cross-Origin-Opener-Policy console warnings it caused.
    const OWNER_EMAIL = "admin@camtech.cam";
    const OWNER_PASSWORD = "CamTechAutomations123!";
    const OWNER_FIRST = "CamTech";
    const OWNER_LAST = "User";

    let attempted = false; // one auto-login per page load — never loop redirects
    let dismissed = false; // user chose to use n8n's own form instead

    // A page-local flag is not enough on its own: if n8n accepts the login but
    // bounces straight back to /signin (say the session cookie never sticks),
    // every bounce is a fresh page load and we would sign in forever. Count
    // attempts across the tab session and give up after MAX_ATTEMPTS.
    const ATTEMPT_KEY = 'ct_n8n_login_attempts';
    const MAX_ATTEMPTS = 3;

    function readAttempts() {
        try { return parseInt(sessionStorage.getItem(ATTEMPT_KEY), 10) || 0; }
        catch (e) { return 0; } // storage can throw in private/blocked contexts
    }
    function writeAttempts(n) {
        try { sessionStorage.setItem(ATTEMPT_KEY, String(n)); } catch (e) { /* non-fatal */ }
    }
    function clearAttempts() {
        try { sessionStorage.removeItem(ATTEMPT_KEY); } catch (e) { /* non-fatal */ }
    }

    // Inject overlay styling and hide license warning banners
    const style = document.createElement('style');
    style.innerHTML = `
        #ct-auth-overlay {
            position: fixed; inset: 0; z-index: 999999;
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
            background: #09090b;
            background-image: radial-gradient(60rem 30rem at 50% -20%, rgba(37,99,235,0.10), transparent 70%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            animation: ct-overlay-in 260ms cubic-bezier(0.2, 0, 0, 1) both;
        }
        .ct-auth-card {
            width: 100%; max-width: 380px;
            padding: 36px 32px;
            background: #121216;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.55);
            text-align: center;
            animation: ct-card-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        .ct-brand {
            display: flex; justify-content: center;
            font-size: 19px; font-weight: 700; letter-spacing: -0.02em;
            margin-bottom: 24px;
        }
        .ct-brand .b { color: #3b76f6; }
        .ct-brand .o { color: #f97316; }
        .ct-title {
            margin: 0 0 6px;
            color: #fafafa; font-size: 16px; font-weight: 600;
            letter-spacing: -0.022em; line-height: 1.3;
        }
        .ct-sub { margin: 0; color: #8b8b96; font-size: 13.5px; line-height: 1.55; }
        .ct-spinner {
            width: 18px; height: 18px; margin: 22px auto 0;
            border: 2px solid rgba(255,255,255,0.14);
            border-top-color: #3b76f6;
            border-radius: 50%;
            animation: ct-spin 0.7s linear infinite;
        }
        .ct-error { margin: 18px 0 0; color: #ef4444; font-size: 13px; line-height: 1.45; }
        .ct-retry {
            margin-top: 16px; padding: 8px 16px;
            background: #2563eb; color: #fff;
            border: 0; border-radius: 8px;
            font: inherit; font-size: 13px; font-weight: 500;
            cursor: pointer;
        }
        .ct-retry:hover { background: #3b76f6; }

        @keyframes ct-spin { to { transform: rotate(360deg); } }
        @keyframes ct-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ct-card-in {
            from { opacity: 0; transform: translate3d(0, 8px, 0); }
            to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
            #ct-auth-overlay, .ct-auth-card { animation: none; }
        }

        /* Hide production license disclaimers */
        [data-test-id*="license"],
        [class*="license-banner"],
        [class*="licenseBanner"],
        [class*="LicenseBanner"] {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // Dynamic banner cleaner — reacts to DOM mutations (debounced) instead of
    // polling a full-page scan every 500ms. n8n's canvas mutates the DOM
    // continuously while editing, so the old blind interval caused visible
    // jank; this only does the (unchanged) scan when content actually changes.
    function hideLicenseBanners() {
        document.querySelectorAll('div, span, p, [role="alert"]').forEach((el) => {
            if (el.textContent && el.textContent.includes('not licensed for production')) {
                const banner = el.closest('[class*="banner"], [class*="alert"], [class*="notice"], [role="alert"]') || el;
                banner.style.setProperty('display', 'none', 'important');
            }
        });
    }
    let bannerScanScheduled = false;
    function scheduleBannerScan() {
        if (bannerScanScheduled) return;
        bannerScanScheduled = true;
        (window.requestIdleCallback || ((fn) => setTimeout(fn, 200)))(() => {
            bannerScanScheduled = false;
            hideLicenseBanners();
        });
    }
    new MutationObserver(scheduleBannerScan).observe(document.body, { childList: true, subtree: true });
    scheduleBannerScan();

    // Strip /setup or /signin to recover the n8n base path
    function basePath() {
        return window.location.pathname
            .replace(/\/setup\/?$/, '')
            .replace(/\/signin\/?$/, '');
    }

    function post(path, body) {
        return fetch(basePath() + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    function login() {
        return post('/rest/login', {
            emailOrLdapLoginId: OWNER_EMAIL,
            password: OWNER_PASSWORD
        });
    }

    /**
     * Sign in to n8n directly against its REST API.
     *
     * Preferred over filling the login form in the DOM: no dependency on n8n's
     * markup, no race against its Vue render, and a real status code to branch
     * on. A fresh instance has no owner yet, so /rest/login 4xxs — in that case
     * create the owner and retry once.
     */
    function autoLogin() {
        if (attempted) return;
        attempted = true;

        if (readAttempts() >= MAX_ATTEMPTS) {
            showError('Could not open the workspace. Please sign in below.', true);
            return;
        }
        writeAttempts(readAttempts() + 1);

        login()
            .then((res) => {
                if (res && res.ok) return res;
                return post('/rest/owner/setup', {
                    email: OWNER_EMAIL,
                    firstName: OWNER_FIRST,
                    lastName: OWNER_LAST,
                    password: OWNER_PASSWORD
                }).then(login);
            })
            .then((res) => {
                if (!res || !res.ok) throw new Error('login failed');
                window.location.href = basePath() + '/';
            })
            .catch(() => {
                attempted = false; // allow a manual retry
                showError();
            });
    }

    function showError(message, giveUp) {
        const card = document.querySelector('#ct-auth-overlay .ct-auth-card');
        if (!card) return;
        const spinner = card.querySelector('.ct-spinner');
        if (spinner) spinner.remove();
        if (card.querySelector('.ct-error')) return;

        const msg = document.createElement('p');
        msg.className = 'ct-error';
        msg.textContent = message || 'Could not open the workspace automatically.';
        card.appendChild(msg);

        const btn = document.createElement('button');
        btn.className = 'ct-retry';
        btn.type = 'button';

        if (giveUp) {
            // Out of attempts — stop auto-signing-in and hand the user n8n's
            // own login form rather than trapping them behind this overlay.
            btn.textContent = 'Continue to sign-in';
            btn.addEventListener('click', () => {
                clearAttempts();
                dismissed = true;
                const overlay = document.getElementById('ct-auth-overlay');
                if (overlay) overlay.remove();
            });
        } else {
            btn.textContent = 'Try again';
            btn.addEventListener('click', () => {
                msg.remove();
                btn.remove();
                const s = document.createElement('div');
                s.className = 'ct-spinner';
                card.appendChild(s);
                autoLogin();
            });
        }
        card.appendChild(btn);
    }

    function ensureOverlay() {
        if (document.getElementById('ct-auth-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'ct-auth-overlay';
        overlay.innerHTML =
            '<div class="ct-auth-card">' +
                '<div class="ct-brand"><span class="b">CAM</span><span class="o">TECH</span></div>' +
                '<h1 class="ct-title">Opening your workspace</h1>' +
                '<p class="ct-sub">Signing you in to the automation studio…</p>' +
                '<div class="ct-spinner"></div>' +
            '</div>';
        document.body.appendChild(overlay);
        autoLogin();
    }

    // n8n is a SPA — watch the route and show/hide the overlay accordingly.
    setInterval(() => {
        const isAuthPage = /\/(setup|signin)\/?$/.test(window.location.pathname);
        if (isAuthPage) {
            if (!dismissed) ensureOverlay();
        } else {
            // Reaching any non-auth route means the sign-in actually took, so
            // reset the counter for the next visit.
            clearAttempts();
            const overlay = document.getElementById('ct-auth-overlay');
            if (overlay) overlay.remove();
        }
    }, 300);
})();

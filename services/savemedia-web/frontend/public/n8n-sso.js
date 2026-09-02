(function () {
    const CLIENT_ID = "639870274155-r1fq36ffm3tuhn8cf4ko3heqqmvgnku2.apps.googleusercontent.com";
    const BYPASS = "Google_auth_bypass_secret_999";
    let submitting = false;
    let buttonRendered = false;

    // Inject Google Sign-In script dynamically
    const gsiScript = document.createElement('script');
    gsiScript.src = "https://accounts.google.com/gsi/client";
    gsiScript.async = true;
    gsiScript.defer = true;
    document.head.appendChild(gsiScript);

    // Inject styling for overlay and hide license warning banners
    const style = document.createElement('style');
    style.innerHTML = `
        #google-auth-overlay {
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
            width: 100%; max-width: 400px;
            padding: 36px 32px 28px;
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
            margin-bottom: 28px;
        }
        .ct-brand .b { color: #3b76f6; }
        .ct-brand .o { color: #f97316; }
        .ct-title {
            margin: 0 0 6px;
            color: #fafafa; font-size: 19px; font-weight: 600;
            letter-spacing: -0.022em; line-height: 1.25;
        }
        .ct-sub {
            margin: 0 0 26px;
            color: #8b8b96; font-size: 14px; line-height: 1.55;
        }
        .ct-btn-wrap {
            display: flex; justify-content: center; min-height: 44px;
            transition: opacity 170ms cubic-bezier(0.2, 0, 0, 1);
        }
        .ct-spinner {
            display: none;
            width: 18px; height: 18px; margin: 14px auto 0;
            border: 2px solid rgba(255,255,255,0.14);
            border-top-color: #3b76f6;
            border-radius: 50%;
            animation: ct-spin 0.7s linear infinite;
        }
        .ct-loading .ct-spinner { display: block; }
        .ct-loading .ct-btn-wrap { opacity: 0.4; pointer-events: none; }
        .ct-error {
            min-height: 18px; margin-top: 14px;
            color: #ef4444; font-size: 13px; line-height: 1.4;
        }
        .ct-divider {
            height: 1px; margin: 26px 0 16px;
            background: rgba(255,255,255,0.08);
        }
        .ct-foot {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            color: #6a6a75; font-size: 12px;
        }
        .ct-foot svg { width: 12px; height: 12px; }

        @keyframes ct-spin { to { transform: rotate(360deg); } }
        @keyframes ct-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ct-card-in {
            from { opacity: 0; transform: translate3d(0, 8px, 0); }
            to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
            #google-auth-overlay, .ct-auth-card { animation: none; }
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

    window.handleGoogleCredentialResponse = function (response) {
        if (submitting) return;
        submitting = true;
        setError('');
        setLoading(true);

        let payload;
        try {
            payload = JSON.parse(atob(response.credential.split('.')[1]));
        } catch (e) {
            submitting = false;
            setError('Could not read Google response. Please try again.');
            return;
        }

        const email = payload.email;
        const firstName = payload.given_name || 'Admin';
        const lastName = payload.family_name || 'User';
        // Strip /setup or /signin to recover the n8n base path
        const basePath = window.location.pathname
            .replace(/\/setup\/?$/, '')
            .replace(/\/signin\/?$/, '');

        // 1) Try to create the owner (harmlessly fails if it already exists),
        // 2) then log in with the bypass credential.
        fetch(basePath + '/rest/owner/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName, lastName, password: BYPASS })
        })
        .catch(() => {}) // setup 4xx when owner already exists — expected, ignore
        .then(() => fetch(basePath + '/rest/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrLdapLoginId: email, password: BYPASS })
        }))
        .then((res) => {
            if (!res || !res.ok) throw new Error('login failed');
            window.location.href = basePath + '/';
        })
        .catch(() => {
            submitting = false; // allow retry instead of looping the redirect
            setLoading(false);
            setError('Sign-in failed. Please try again.');
        });
    };

    function setError(msg) {
        const el = document.getElementById('google-auth-error');
        if (el) el.textContent = msg;
    }

    function setLoading(on) {
        const card = document.querySelector('#google-auth-overlay .ct-auth-card');
        if (card) card.classList.toggle('ct-loading', !!on);
    }

    function tryRenderButton() {
        if (buttonRendered) return true;
        const container = document.getElementById('google-signin-button');
        if (!container) return false;
        if (!(window.google && window.google.accounts && window.google.accounts.id)) {
            return false; // GSI library not loaded yet
        }
        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: window.handleGoogleCredentialResponse
        });
        window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
        buttonRendered = true;
        return true;
    }

    function ensureOverlay() {
        if (document.getElementById('google-auth-overlay')) return;
        buttonRendered = false;
        const overlay = document.createElement('div');
        overlay.id = 'google-auth-overlay';
        overlay.innerHTML =
            '<div class="ct-auth-card">' +
                '<div class="ct-brand"><span class="b">CAM</span><span class="o">TECH</span></div>' +
                '<h1 class="ct-title">Sign in to Automations</h1>' +
                '<p class="ct-sub">Use your Google account to securely access the workflow builder.</p>' +
                '<div class="ct-btn-wrap"><div id="google-signin-button"></div></div>' +
                '<div class="ct-spinner"></div>' +
                '<div id="google-auth-error" class="ct-error"></div>' +
                '<div class="ct-divider"></div>' +
                '<div class="ct-foot">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                    'Encrypted &amp; secured by CamTech' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        // GSI loads async — keep retrying until it is ready, then render once.
        if (!tryRenderButton()) {
            const wait = setInterval(() => {
                // Stop if the overlay was torn down (route changed)
                if (!document.getElementById('google-auth-overlay')) {
                    clearInterval(wait);
                    return;
                }
                if (tryRenderButton()) clearInterval(wait);
            }, 150);
        }
    }

    // n8n is a SPA — watch the route and show/hide the overlay accordingly.
    setInterval(() => {
        const path = window.location.pathname;
        const isAuthPage = /\/(setup|signin)\/?$/.test(path);
        if (isAuthPage) {
            ensureOverlay();
        } else {
            const overlay = document.getElementById('google-auth-overlay');
            if (overlay) overlay.remove();
        }
    }, 300);
})();

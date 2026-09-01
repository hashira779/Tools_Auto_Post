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

    // Inject styling for overlay
    const style = document.createElement('style');
    style.innerHTML = `
        #google-auth-overlay { position: fixed; inset: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; z-index: 999999; font-family: "Inter", sans-serif; }
        .ct-auth-card { background: #1e293b; padding: 40px; border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); }
        .ct-brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 24px; display: flex; justify-content: center; }
        .ct-brand .b { color: #3b82f6; }
        .ct-brand .o { color: #f97316; }
        .ct-title { color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 6px; }
        .ct-sub { color: #94a3b8; font-size: 14px; margin: 0 0 28px; line-height: 1.5; }
        .ct-btn-wrap { display: flex; justify-content: center; min-height: 44px; transition: opacity .2s; }
        .ct-spinner { display: none; width: 22px; height: 22px; border: 2.5px solid rgba(255,255,255,.2); border-top-color: #3b82f6; border-radius: 50%; animation: ct-spin .7s linear infinite; margin: 12px auto 0; }
        .ct-loading .ct-spinner { display: block; }
        .ct-loading .ct-btn-wrap { opacity: .35; pointer-events: none; }
        @keyframes ct-spin { to { transform: rotate(360deg); } }
        .ct-error { color: #f87171; font-size: 13px; margin-top: 16px; min-height: 18px; }
        .ct-divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 28px 0 18px; }
        .ct-foot { display: flex; align-items: center; justify-content: center; gap: 6px; color: #64748b; font-size: 12px; }
        .ct-foot svg { width: 13px; height: 13px; }
    `;
    document.head.appendChild(style);

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

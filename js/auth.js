(() => {
  // Public values -- the anon/publishable key is designed to be embedded in
  // client-side code (it only works alongside Row Level Security on the
  // Supabase project, never grants privileged access on its own).
  var SUPABASE_URL = 'https://ydfwwritdksxplvxpbez.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_OEiSmw7ZjpnWG8ShtCuXbA__XGQf6pA';
  // TODO: switch to https://mcp.altship.io once its DNS record is added.
  var MCP_APP_URL = 'https://altship-mcp-web.vercel.app';

  // Session storage is a cookie (not localStorage) scoped to the parent
  // domain, so signing in here is visible to every altship-*.altship.io
  // product without a separate sign-in. On localhost this resolves to the
  // bare "localhost" domain, which cookies (unlike origins) share across
  // ports, making cross-port local dev testing work the same way.
  function cookieDomain() {
    var host = location.hostname;
    if (host === 'localhost') return 'localhost';
    return '.' + host.replace(/^www\./, '');
  }

  var cookieStorage = {
    getItem: function (key) {
      var match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    },
    setItem: function (key, value) {
      var secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie =
        encodeURIComponent(key) + '=' + encodeURIComponent(value) +
        '; Domain=' + cookieDomain() + '; Path=/; Max-Age=8640000; SameSite=Lax' + secure;
    },
    removeItem: function (key) {
      document.cookie = encodeURIComponent(key) + '=; Domain=' + cookieDomain() + '; Path=/; Max-Age=0';
    },
  };

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: cookieStorage },
  });

  var modal = document.getElementById('altship-auth-modal');
  var emailInput = document.getElementById('altship-auth-email');
  var passwordInput = document.getElementById('altship-auth-password');
  var messageEl = document.getElementById('altship-auth-message');
  var toggleBtn = document.getElementById('altship-auth-toggle');
  var submitBtn = document.getElementById('altship-auth-submit');
  var closeBtn = document.getElementById('altship-auth-close');
  var tryBtns = [document.getElementById('altship-try'), document.getElementById('altship-try-nav')].filter(Boolean);
  var accountEl = document.getElementById('altship-account');
  var accountEmailEl = document.getElementById('altship-account-email');
  var signOutBtn = document.getElementById('altship-sign-out');
  var mcpLink = document.getElementById('altship-mcp-link');

  if (mcpLink) mcpLink.href = MCP_APP_URL;

  var mode = 'sign-in';

  function currentParams() {
    return new URLSearchParams(location.search);
  }

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.hidden = !text;
    messageEl.className = 'auth-message' + (isError ? ' error' : '');
  }

  function openModal() {
    modal.hidden = false;
    emailInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    showMessage('', false);
  }

  function setMode(next) {
    mode = next;
    submitBtn.textContent = mode === 'sign-in' ? 'Sign in' : 'Sign up';
    toggleBtn.textContent = mode === 'sign-in' ? 'Need an account? Sign up' : 'Have an account? Sign in';
  }

  function onSignedIn(session) {
    var redirect = currentParams().get('redirect');
    if (redirect) {
      location.href = redirect;
      return;
    }
    closeModal();
    updateAccountUI(session);
  }

  function updateAccountUI(session) {
    tryBtns.forEach((btn) => (btn.hidden = !!session));
    if (session) {
      if (accountEl) accountEl.hidden = false;
      if (accountEmailEl) accountEmailEl.textContent = session.user.email;
    } else {
      if (accountEl) accountEl.hidden = true;
    }
  }

  async function submit() {
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    if (!email || !password) return;

    submitBtn.disabled = true;
    showMessage('', false);
    try {
      if (mode === 'sign-in') {
        var result = await client.auth.signInWithPassword({ email: email, password: password });
        if (result.error) throw result.error;
        onSignedIn(result.data.session);
      } else {
        var signUpResult = await client.auth.signUp({ email: email, password: password });
        if (signUpResult.error) throw signUpResult.error;
        showMessage('Check your email to confirm your account, then sign in.', false);
      }
    } catch (err) {
      showMessage(err && err.message ? err.message : 'Something went wrong.', true);
    } finally {
      submitBtn.disabled = false;
    }
  }

  tryBtns.forEach((btn) => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (toggleBtn) toggleBtn.addEventListener('click', () => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'));
  if (submitBtn) submitBtn.addEventListener('click', submit);
  if (passwordInput) passwordInput.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await client.auth.signOut();
      updateAccountUI(null);
    });
  }

  client.auth.onAuthStateChange((_event, session) => updateAccountUI(session));

  client.auth.getSession().then((result) => {
    var session = result.data.session;
    var redirect = currentParams().get('redirect');
    if (session && redirect) {
      location.href = redirect;
      return;
    }
    updateAccountUI(session);
    if (!session && redirect) openModal();
  });
})();

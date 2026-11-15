/* Nest website: language, the moving headline, the right button for this device, release details. */
'use strict';

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let text = window.nestApplyLanguage(window.nestLanguage());
  let release = null;
  let releaseLoaded = false;

  // ── Which device is this? Its button goes first and is the dark one. ──────
  function platform() {
    const ua = navigator.userAgent || '';
    const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS says "Macintosh"
    if (/iPhone|iPad|iPod/.test(ua) || touchMac) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
    return null;
  }

  const here = platform();
  const actions = document.getElementById('actions');
  if (actions) {
    const buttons = Array.from(actions.querySelectorAll('[data-platform]'));
    const mine = buttons.find((b) => b.dataset.platform === here) || buttons[0];
    mine.classList.add('primary');
    actions.prepend(mine);
  }
  // The install steps for this device come first too.
  const steps = here && document.getElementById('install-' + here);
  if (steps && steps.parentElement) steps.parentElement.prepend(steps);

  // ── The headline lines, written twice so the loop can jump back without a seam ──
  const lyrics = document.querySelector('.lyrics');
  const list = lyrics ? lyrics.querySelector('ol') : null;
  const originals = list ? Array.from(list.children) : [];
  for (const li of originals) {
    const copy = li.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    list.appendChild(copy);
  }
  const lines = list ? Array.from(list.children) : [];
  let current = 0;
  let timer = null;

  function place(index, animate) {
    if (!list || !lines.length) return;
    lyrics.classList.toggle('still', !animate);
    lines.forEach((li, k) => { li.dataset.d = String(Math.min(3, Math.abs(k - index))); });
    const line = lines[index];
    const offset = line.offsetTop + line.offsetHeight / 2 - lyrics.clientHeight * 0.42;
    list.style.transform = 'translateY(' + (-offset) + 'px)';
  }

  function step() {
    current += 1;
    place(current, true);
    if (current === originals.length) {
      // The copy of the first line is showing: move to the real first line without animation.
      window.setTimeout(() => {
        current = 0;
        place(current, false);
        void list.offsetHeight;
        lyrics.classList.remove('still');
      }, 900);
    }
  }

  function startLyrics() {
    window.clearInterval(timer);
    timer = null;
    if (!list) return;
    if (reduceMotion.matches) {
      lines.forEach((li) => { delete li.dataset.d; });
      list.style.transform = '';
      return;
    }
    place(current, false);
    timer = window.setInterval(step, 2600);
  }

  // ── Release details: version, date, checksum ──────────────────────────────
  function formatDate(iso) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!parts) return '';
    return text.dateFormat
      .replace('{d}', String(Number(parts[3])))
      .replace('{m}', text.months[Number(parts[2]) - 1])
      .replace('{y}', parts[1]);
  }

  function showRelease() {
    // No Mac download published (yet): the Mac button installs the web app instead.
    const mac = document.getElementById('get-mac');
    if (mac && releaseLoaded) {
      const zip = !!(release && release.mac);
      mac.dataset.i18n = zip ? 'getMac' : 'getMacWeb';
      mac.textContent = zip ? text.getMac : text.getMacWeb;
      mac.setAttribute('href', zip ? 'download/Nest-mac.zip' : 'app/?install=mac');
    }
    const version = document.getElementById('version');
    if (!release || !version) return;
    version.textContent = text.version.replace('{v}', release.version).replace('{date}', formatDate(release.date));
    const sum = document.getElementById('sum-mac');
    if (sum && release.mac && /^[0-9a-f]{64}$/.test(release.mac.sha256)) {
      sum.textContent = release.mac.sha256;
      const verify = document.getElementById('verify');
      if (verify) verify.hidden = false;
    }
  }

  // The install buttons open the web app, which explains the last step in the same language.
  function installLinks() {
    const lang = document.documentElement.lang || 'uz';
    for (const a of document.querySelectorAll('a[href^="app/?install="]')) {
      a.href = 'app/?install=' + a.dataset.platform + '&lang=' + encodeURIComponent(lang);
    }
  }

  function redraw(lang) {
    text = window.nestApplyLanguage(lang);
    showRelease();
    installLinks();
    startLyrics();
  }

  window.nestLanguageButtons(redraw);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', startLyrics);
  window.addEventListener('resize', () => place(current, false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { window.clearInterval(timer); timer = null; } else { startLyrics(); }
  });

  fetch('assets/release.json', { cache: 'no-cache', credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data) => {
      release = data && data.version ? data : null;
      releaseLoaded = true;
      showRelease();
      installLinks();
    });

  installLinks();
  startLyrics();
})();

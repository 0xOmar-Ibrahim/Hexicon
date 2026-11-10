/* Hexicon front-end: i18n, theme, domains, explorer, CVEs and animations. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem('hexicon.' + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('hexicon.' + k, v); } catch { /* storage unavailable */ } },
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let UI = {};
  let DATA = { domains: [], resources: [], cves: [], languages: ['en'], rtl: ['ar'] };
  const state = { lang: 'en', domain: 'all', type: 'all', level: 'all', cost: 'all', q: '' };

  const t = (key) => UI[state.lang]?.[key] ?? UI.en?.[key] ?? key;
  const loc = (obj) => (obj && (obj[state.lang] || obj.en)) || '';

  /* ---------------- THEME ---------------- */
  function initTheme() {
    const saved = store.get('theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    $('#theme-btn').addEventListener('click', () => {
      const current = document.documentElement.dataset.theme
        || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      store.set('theme', next);
    });
  }

  /* ---------------- I18N ---------------- */
  function pickInitialLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl && UI[fromUrl]) return fromUrl;
    const saved = store.get('lang');
    if (saved && UI[saved]) return saved;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return UI[nav] ? nav : 'en';
  }

  function applyLang(lang) {
    state.lang = lang;
    store.set('lang', lang);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = DATA.rtl.includes(lang) ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    splitTitle();
    renderDomains();
    renderChips();
    renderSelects();
    renderCards();
    renderPaths();
    renderCves();
    renderKevControls();
    renderKev();
  }

  function initLangSelect() {
    const sel = $('#lang-select');
    sel.innerHTML = Object.keys(UI).map((l) => `<option value="${l}">${esc(UI[l].langName)}</option>`).join('');
    sel.value = state.lang;
    sel.addEventListener('change', () => applyLang(sel.value));
  }

  // Animated word-by-word hero title
  function splitTitle() {
    const h1 = $('.hero h1');
    const words = t('hero.title').split(/\s+/);
    h1.innerHTML = words.map((w, i) => `<span class="w" style="animation-delay:${120 + i * 90}ms">${esc(w)}</span>`).join(' ');
  }

  /* ---------------- DOMAINS ---------------- */
  function renderDomains() {
    const grid = $('#domain-grid');
    grid.innerHTML = DATA.domains.map((d) => `
      <button class="domain" type="button" data-id="${esc(d.id)}">
        <div class="domain-top">
          <span class="domain-num">N°${String(d.order).padStart(2, '0')}</span>
          <span class="domain-icon"><svg class="ic"><use href="#i-${esc(d.icon)}"/></svg></span>
        </div>
        <h3>${esc(loc(d.name))}</h3>
        <div class="domain-meta">
          <span><b>${d.count}</b> ${esc(t('domains.count'))}</span>
          <span><b>${d.subdomains.length}</b> ${esc(t('domains.sub'))}</span>
        </div>
        <div class="domain-subs">${d.subdomains.map((s) => `<span class="sub">${esc(loc(s.name))}</span>`).join('')}</div>
      </button>`).join('');

    $$('.domain', grid).forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      el.addEventListener('click', () => {
        state.domain = el.dataset.id;
        renderChips();
        renderCards();
        $('#explore').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    observeReveal($$('.domain', grid));
  }

  /* ---------------- EXPLORER ---------------- */
  function renderChips() {
    const wrap = $('#domain-chips');
    const items = [{ id: 'all', label: t('explore.all'), n: DATA.resources.length },
      ...DATA.domains.map((d) => ({ id: d.id, label: loc(d.name), n: d.count }))];
    wrap.innerHTML = items.map((c) =>
      `<button class="chip" type="button" data-id="${esc(c.id)}" aria-pressed="${state.domain === c.id}">${esc(c.label)} <span class="chip-n">${c.n}</span></button>`).join('');
    $$('.chip', wrap).forEach((b) => b.addEventListener('click', () => {
      state.domain = b.dataset.id;
      $$('.chip', wrap).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderCards();
    }));
  }

  function renderSelects() {
    const types = [...new Set(DATA.resources.map((r) => r.type))].sort();
    const fill = (id, values, labeler, key) => {
      const sel = $(id);
      sel.innerHTML = `<option value="all">${esc(t('explore.all'))}</option>` +
        values.map((v) => `<option value="${esc(v)}">${esc(labeler(v))}</option>`).join('');
      sel.value = state[key];
      sel.onchange = () => { state[key] = sel.value; renderCards(); };
    };
    fill('#f-type', types, (v) => v.replace(/-/g, ' '), 'type');
    fill('#f-level', ['beginner', 'intermediate', 'advanced'], (v) => t('level.' + v), 'level');
    fill('#f-cost', ['free', 'freemium', 'paid'], (v) => t('cost.' + v), 'cost');
  }

  function matches(r) {
    if (state.domain !== 'all' && r.domain !== state.domain) return false;
    if (state.type !== 'all' && r.type !== state.type) return false;
    if (state.level !== 'all' && !r.level.includes(state.level)) return false;
    if (state.cost !== 'all' && r.cost !== state.cost) return false;
    if (state.q) {
      const hay = [r.title, loc(r.description), r.description.en, r.tags.join(' '), r.type, r.domain, r.subdomains.join(' ')]
        .join(' ').toLowerCase();
      return state.q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }

  function host(url) { try { return new URL(url).host.replace(/^www\./, ''); } catch { return ''; } }

  const PAGE = 24;
  let shown = PAGE;

  // Keep filters in the URL so any view can be shared.
  function syncUrl() {
    const p = new URLSearchParams();
    if (state.lang !== 'en') p.set('lang', state.lang);
    for (const k of ['domain', 'type', 'level', 'cost']) if (state[k] !== 'all') p.set(k, state[k]);
    if (state.q) p.set('q', state.q);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    for (const k of ['domain', 'type', 'level', 'cost']) if (p.get(k)) state[k] = p.get(k);
    if (p.get('q')) { state.q = p.get('q').toLowerCase(); $('#q').value = p.get('q'); }
  }

  function renderCards(more = false) {
    const list = DATA.resources.filter(matches);
    const start = more ? shown : 0;
    shown = more ? shown + PAGE : PAGE;
    $('#count').textContent = list.length;
    $('#empty').hidden = list.length > 0;
    $('#more').hidden = shown >= list.length;
    if (!more) syncUrl();
    const html = list.slice(start, shown).map((r, i) => `
      <a class="card${r.featured ? ' featured' : ''}" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="animation-delay:${Math.min(i, 12) * 35}ms">
        <span class="card-type">${esc(r.type.replace(/-/g, ' '))}</span>
        <h3>${esc(r.title)}</h3>
        <p>${esc(loc(r.description))}</p>
        <div class="card-foot">
          <span class="badge ${esc(r.cost)}">${esc(t('cost.' + r.cost))}</span>
          ${r.level.map((l) => `<span class="badge">${esc(t('level.' + l))}</span>`).join('')}
          ${r.languages.map((l) => `<span class="badge lang">${esc(l)}</span>`).join('')}
          <span class="card-host">${esc(host(r.url))}</span>
        </div>
      </a>`).join('');
    if (more) $('#cards').insertAdjacentHTML('beforeend', html);
    else $('#cards').innerHTML = html;
  }

  function initSearch() {
    let timer;
    $('#q').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); renderCards(); }, 120);
    });
    $('#more').addEventListener('click', () => renderCards(true));
  }

  /* ---------------- LEARNING PATHS ---------------- */
  let activePath = 0;
  const TRACKS = ['all', 'core', 'defend', 'attack', 'build', 'govern'];
  let activeTrack = 'all';

  // Per-viewer progress: which steps are ticked, kept only in this browser.
  const progress = {
    key: (pathId) => 'progress.' + pathId,
    get(pathId) { try { return new Set(JSON.parse(store.get(this.key(pathId)) || '[]')); } catch { return new Set(); } },
    toggle(pathId, stepId, on) {
      const s = this.get(pathId);
      on ? s.add(stepId) : s.delete(stepId);
      store.set(this.key(pathId), JSON.stringify([...s]));
    },
  };

  function renderPaths() {
    const all = DATA.paths ?? [];
    if (!all.length) { $('#paths').hidden = true; return; }

    const usedTracks = TRACKS.filter((tr) => tr === 'all' || all.some((p) => p.track === tr));
    $('#track-chips').innerHTML = usedTracks.map((tr) =>
      `<button class="chip" type="button" data-track="${tr}" aria-pressed="${tr === activeTrack}">${esc(t('track.' + tr))}</button>`).join('');
    $$('#track-chips .chip').forEach((b) => b.addEventListener('click', () => {
      activeTrack = b.dataset.track;
      const first = all.findIndex((p) => activeTrack === 'all' || p.track === activeTrack);
      if (first >= 0) activePath = first;
      renderPaths();
    }));

    $('#path-tabs').innerHTML = all.map((p, i) => (activeTrack !== 'all' && p.track !== activeTrack) ? '' : `
      <button class="path-tab" type="button" role="tab" aria-selected="${i === activePath}" data-i="${i}">
        <svg class="ic"><use href="#i-${esc(p.icon)}"/></svg><span>${esc(loc(p.title))}</span>
      </button>`).join('');
    $$('.path-tab').forEach((b) => b.addEventListener('click', () => { activePath = Number(b.dataset.i); renderPaths(); }));

    const p = all[activePath];
    const done = progress.get(p.id);
    const linkList = (ids) => ids.map((id) => {
      const i = all.findIndex((x) => x.id === id);
      return i < 0 ? '' : `<button class="path-link" type="button" data-i="${i}">${esc(loc(all[i].title))}</button>`;
    }).join('');
    let n = 0;

    $('#path-panel').innerHTML = `
      <div class="path-head">
        <div>
          <h3>${esc(loc(p.title))}</h3>
          <p>${esc(loc(p.description))}</p>
          ${p.nice_roles.length ? `<p class="nice"><span>${esc(t('paths.roles'))}:</span> ${p.nice_roles.map(esc).join(' · ')}</p>` : ''}
        </div>
        <div class="path-meta">
          <span class="badge">${esc(t('level.' + p.level))}</span>
          <span class="badge">${p.stages.length} ${esc(t('paths.stages'))}</span>
          <span class="badge">≈ ${p.weeks} ${esc(t('paths.weeks'))}</span>
        </div>
      </div>
      ${p.prerequisites.length ? `<p class="path-rel">${esc(t('paths.prereq'))}: ${linkList(p.prerequisites)}</p>` : ''}
      <ol class="stages">
        ${p.stages.map((s, si) => `
          <li class="stage" style="animation-delay:${si * 90}ms">
            <div class="stage-marker"><span>${si + 1}</span></div>
            <div class="stage-body">
              <header class="stage-head">
                <h4>${esc(loc(s.title))}</h4>
                <span class="stage-weeks">≈ ${s.weeks} ${esc(t('paths.weeks'))}</span>
              </header>
              ${s.goal && loc(s.goal) ? `<p class="stage-goal">${esc(loc(s.goal))}</p>` : ''}
              ${s.skills.length ? `<div class="skills">${s.skills.map((k) => `<span class="sub">${esc(k)}</span>`).join('')}</div>` : ''}
              <ul class="route-steps">
                ${s.steps.map((st) => { n++; const on = done.has(st.id); return `
                  <li>
                    <label class="tick" title="${esc(t('paths.mark'))}">
                      <input type="checkbox" data-step="${esc(st.id)}" ${on ? 'checked' : ''}>
                      <span class="waypoint">${n}</span>
                    </label>
                    <a class="step${on ? ' done' : ''}" href="${esc(st.url)}" target="_blank" rel="noopener noreferrer">
                      <span class="card-type">${esc(st.type.replace(/-/g, ' '))} · ${esc(t('cost.' + st.cost))}</span>
                      <strong>${esc(st.title)}</strong>
                      ${st.note && loc(st.note) ? `<span class="step-note">${esc(loc(st.note))}</span>` : ''}
                    </a>
                  </li>`; }).join('')}
              </ul>
              ${s.project && loc(s.project) ? `
                <div class="project"><span class="project-label">${esc(t('paths.project'))}</span><p>${esc(loc(s.project))}</p></div>` : ''}
              ${s.checkpoint ? `<p class="checkpoint">${esc(t('paths.checkpoint'))}: <a href="${esc(s.checkpoint.url)}" target="_blank" rel="noopener noreferrer">${esc(s.checkpoint.title)}</a></p>` : ''}
            </div>
          </li>`).join('')}
      </ol>
      ${p.next.length ? `<p class="path-rel next">${esc(t('paths.next'))}: ${linkList(p.next)}</p>` : ''}`;

    $$('#path-panel input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
      progress.toggle(p.id, cb.dataset.step, cb.checked);
      renderPaths();
    }));
    $$('#path-panel .path-link').forEach((b) => b.addEventListener('click', () => {
      activePath = Number(b.dataset.i); activeTrack = 'all'; renderPaths();
      $('#paths').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }

  /* ---------------- CVEs ---------------- */
  const sevColor = (s) => ({ critical: 'var(--coral)', high: 'var(--amber)', medium: 'var(--brass)', low: 'var(--teal)' }[s] || 'var(--muted)');

  function renderCves() {
    $('#cve-grid').innerHTML = DATA.cves.map((c) => `
      <article class="cve reveal" style="--sev:${sevColor(c.severity)}">
        <div class="cve-head">
          <span class="cve-id">${esc(c.id)}</span>
          ${c.kev ? '<span class="kev">CISA KEV</span>' : ''}
          ${c.epss != null ? `<span class="epss" title="EPSS: probability of exploitation in the next 30 days">EPSS ${esc((c.epss * 100).toFixed(1))}%</span>` : ''}
          ${c.score != null ? `<span class="score">CVSS ${esc(c.score.toFixed(1))}</span>` : ''}
        </div>
        <h3>${esc(c.nickname || c.id)}</h3>
        <p>${esc(loc(c.summary))}</p>
        <div class="refs">${c.references.map((r) =>
          `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.title)}">${esc(r.kind)}</a>`).join('')}</div>
      </article>`).join('');
    observeReveal($$('#cve-grid .reveal'));
  }

  /* ---------------- TOP EXPLOITED CVEs (lazy) ---------------- */
  let KEV = null;
  const kstate = { q: '', vendor: 'all', sev: 'all', sort: 'rank', rw: false, shown: 25 };
  const SEV = ['critical', 'high', 'medium', 'low'];

  async function loadKev() {
    if (KEV) return;
    try { KEV = await fetch('cves.json').then((r) => r.json()); } catch { KEV = []; }
    if (!KEV.length) { $('#kev').hidden = true; return; }
    renderKevControls();
    renderKev();
    $('#kq').addEventListener('input', (e) => { kstate.q = e.target.value.trim().toLowerCase(); kstate.shown = 25; renderKev(); });
    $('#k-rw').addEventListener('change', (e) => { kstate.rw = e.target.checked; kstate.shown = 25; renderKev(); });
    $('#kmore').addEventListener('click', () => { kstate.shown += 50; renderKev(); });
    $('#kev-rows').addEventListener('click', (e) => {
      const row = e.target.closest('tr.krow');
      if (!row || e.target.closest('a')) return;
      row.classList.toggle('open');
      row.nextElementSibling.hidden = !row.classList.contains('open');
    });
  }

  function renderKevControls() {
    if (!KEV) return;
    const counts = new Map();
    for (const c of KEV) if (c.v) counts.set(c.v, (counts.get(c.v) ?? 0) + 1);
    const vendors = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 40);
    const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
    const sel = (id, html, key) => { const s = $(id); s.innerHTML = html; s.value = kstate[key]; s.onchange = () => { kstate[key] = s.value; kstate.shown = 25; renderKev(); }; };
    sel('#k-vendor', opt('all', t('explore.all')) + vendors.map(([v, n]) => opt(v, `${v} (${n})`)).join(''), 'vendor');
    sel('#k-sev', opt('all', t('explore.all')) + SEV.map((s) => opt(s, t('sev.' + s))).join(''), 'sev');
    sel('#k-sort', ['rank', 'cvss', 'newest'].map((s) => opt(s, t('cve.sort.' + s))).join(''), 'sort');
  }

  function renderKev() {
    if (!KEV || !KEV.length) return;
    let list = KEV.filter((c) =>
      (kstate.vendor === 'all' || c.v === kstate.vendor) &&
      (kstate.sev === 'all' || c.sv === kstate.sev) &&
      (!kstate.rw || c.rw) &&
      (!kstate.q || `${c.id} ${c.n} ${c.v} ${c.p}`.toLowerCase().includes(kstate.q)));
    if (kstate.sort === 'cvss') list = [...list].sort((a, b) => (b.s ?? -1) - (a.s ?? -1) || a.r - b.r);
    if (kstate.sort === 'newest') list = [...list].sort((a, b) => (b.kev ?? '').localeCompare(a.kev ?? '') || a.r - b.r);
    $('#kcount').textContent = list.length;
    $('#kmore').hidden = kstate.shown >= list.length;
    $('#kev-rows').innerHTML = list.slice(0, kstate.shown).map((c) => `
      <tr class="krow" tabindex="0">
        <td class="krank">${c.r}</td>
        <td class="kid"><a href="https://nvd.nist.gov/vuln/detail/${esc(c.id)}" target="_blank" rel="noopener noreferrer">${esc(c.id)}</a>${c.c ? ' <span class="kcur" title="Curated field notes">★</span>' : ''}</td>
        <td class="kname"><strong>${esc(c.n)}</strong><span>${esc([c.v, c.p].filter(Boolean).join(' · '))}</span>${c.rw ? `<span class="krw">${esc(t('cve.rw'))}</span>` : ''}</td>
        <td><span class="kscore" style="--sev:${sevColor(c.sv)}">${c.s != null ? esc(Number(c.s).toFixed(1)) : '—'}</span></td>
        <td class="kepss"><span class="kbar"><i style="width:${Math.round((c.e ?? 0) * 100)}%"></i></span>${c.e != null ? (c.e * 100).toFixed(1) + '%' : '—'}</td>
        <td class="kdate">${esc(c.kev ?? '')}</td>
      </tr>
      <tr class="kdetail" hidden><td></td><td colspan="5">${esc(c.d ?? '')}${c.pub ? ` <em>· ${esc(t('cve.published'))} ${esc(c.pub)}</em>` : ''}</td></tr>`).join('');
  }

  /* ---------------- STATS COUNT-UP ---------------- */
  function initStats() {
    const values = {
      resources: DATA.resources.length,
      domains: DATA.domains.length,
      languages: DATA.languages.length,
      cves: DATA.cveTotal ?? DATA.cves.length,
    };
    $$('[data-count]').forEach((el) => {
      const target = values[el.dataset.count] ?? 0;
      if (reduceMotion) { el.textContent = target; return; }
      const start = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 500);
    });
  }

  /* ---------------- REVEAL ON SCROLL ---------------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  function observeReveal(els) { els.forEach((el) => (io ? io.observe(el) : el.classList.add('in'))); }

  /* ---------------- COMPASS TICKS ---------------- */
  function initCompass() {
    const g = $('.c-ticks');
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 72; i++) {
      const a = (i * 5 * Math.PI) / 180, major = i % 18 === 0, mid = i % 6 === 0;
      const r1 = 188, r2 = major ? 168 : mid ? 175 : 181;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 200 + r1 * Math.sin(a)); line.setAttribute('y1', 200 - r1 * Math.cos(a));
      line.setAttribute('x2', 200 + r2 * Math.sin(a)); line.setAttribute('y2', 200 - r2 * Math.cos(a));
      if (major) line.setAttribute('class', 'major');
      g.appendChild(line);
    }
  }

  /* ---------------- TOPOGRAPHIC CONTOURS ---------------- */
  function initContours() {
    const canvas = $('#contours');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, mouseX = 0.5, mouseY = 0.5;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const color = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const draw = (time) => {
      const tt = time * 0.00006;
      const c1 = color('--contour'), c2 = color('--contour-2');
      ctx.clearRect(0, 0, w, h);
      const lines = Math.max(18, Math.round(h / 34));
      const step = Math.max(6, w / 160);
      for (let k = 0; k <= lines; k++) {
        const base = (k / lines) * h * 1.15 - h * 0.08;
        const index = k % 5 === 0;
        ctx.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          const nx = x / w;
          const pull = Math.exp(-(((nx - mouseX) ** 2) * 6 + (((base / h) - mouseY) ** 2) * 8)) * 26;
          const y = base
            + Math.sin(nx * 5.2 + tt * 9 + k * 0.55) * 22
            + Math.sin(nx * 11.3 - tt * 6 + k * 1.31) * 9
            + Math.sin(nx * 2.1 + tt * 4 - k * 0.27) * 30
            - pull;
          x === -step ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const alpha = index ? 0.26 : 0.1;
        ctx.strokeStyle = `rgba(${k % 7 === 3 ? c2 : c1}, ${alpha})`;
        ctx.lineWidth = index ? 1.3 : 0.8;
        ctx.stroke();
      }
      if (!reduceMotion && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(0); });
    window.addEventListener('pointermove', (e) => { mouseX = e.clientX / innerWidth; mouseY = e.clientY / innerHeight; }, { passive: true });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    }).observe(canvas);
    new MutationObserver(() => { if (reduceMotion) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    draw(0);
  }

  /* ---------------- MISC ---------------- */
  function initNav() {
    const nav = $('.nav');
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const route = $('.route');
    if (route && io) {
      new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { route.classList.add('draw'); obs.disconnect(); } }, { threshold: 0.3 }).observe(route);
    }
  }

  async function boot() {
    initTheme();
    initNav();
    initCompass();
    initContours();
    observeReveal($$('.reveal'));
    try {
      const [ui, data] = await Promise.all([fetch('ui.json').then((r) => r.json()), fetch('data.json').then((r) => r.json())]);
      UI = ui; DATA = data;
    } catch (err) {
      console.error('Hexicon: failed to load data', err);
    }
    state.lang = pickInitialLang();
    readUrl();
    initLangSelect();
    initSearch();
    applyLang(state.lang);
    initStats();
    // Load the 1000-CVE index only when the reader gets close to it.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); loadKev(); } }, { rootMargin: '800px' }).observe($('#cves'));
    } else loadKev();
  }

  boot();
})();

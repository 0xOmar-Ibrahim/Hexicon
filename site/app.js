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
  const state = { lang: 'en', domain: 'all', type: 'all', level: 'all', cost: 'all', q: '', beginner: false, free: false, hideOld: false, sort: 'recommended' };

  const t = (key) => UI[state.lang]?.[key] ?? UI.en?.[key] ?? key;
  const loc = (obj) => (obj && (obj[state.lang] || obj.en)) || '';
  const typeLabel = (ty) => t('type.' + ty) === 'type.' + ty ? ty.replace(/-/g, ' ') : t('type.' + ty);

  // Description in the current language. If no translation exists yet, build a short,
  // fully localized line from facts we already know (type, cost, topic, sub-areas, level).
  function describe(r) {
    const own = r.description[state.lang];
    if (own || state.lang === 'en') return { text: own || r.description.en, auto: false };
    const dom = DATA.domains.find((d) => d.id === r.domain);
    const subs = (r.subdomains ?? []).map((id) => dom?.subdomains.find((s) => s.id === id)).filter(Boolean).map((s) => loc(s.name));
    const levels = ['beginner', 'intermediate', 'advanced'].filter((l) => r.level.includes(l)).map((l) => t('level.' + l));
    const parts = [
      `${typeLabel(r.type)} · ${t('cost.' + r.cost)}`,
      dom ? `${loc(dom.name)}${subs.length ? ' › ' + subs.join(', ') : ''}` : '',
      levels.length ? `${t('explore.level')}: ${levels.length > 1 ? levels[0] + ' – ' + levels[levels.length - 1] : levels[0]}` : '',
    ].filter(Boolean);
    return { text: parts.join(' · '), auto: true };
  }

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
    renderSteps();
    renderDomains();
    renderChips();
    renderSelects();
    renderCards();
    renderCves();
    if (KEV) loadKev(); // reload the CVE index in the new language
    const openId = new URLSearchParams(location.search).get('cve');
    if (openId && cveCache.has(openId) && !$('#cve-view').hidden) renderCve(cveCache.get(openId));
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

  /* ---------------- START HERE ---------------- */
  // Three beginner steps; resources are referenced as domain/id and must exist in the library.
  const STEPS = [
    { key: 'step1', icon: 'compass', items: ['fundamentals/professor-messer', 'fundamentals/tryhackme-pre-security-path', 'fundamentals/linux-journey'] },
    { key: 'step2', icon: 'flag', items: ['career/picoctf', 'fundamentals/overthewire-bandit', 'career/tryhackme'] },
    { key: 'step3', icon: 'radar', topics: ['offensive', 'defensive', 'cloud', 'dfir', 'appsec', 'grc'] },
  ];

  function renderSteps() {
    const byKey = new Map(DATA.resources.map((r) => [r.domain + '/' + r.id, r]));
    $('#steps').innerHTML = STEPS.map((st, i) => `
      <li class="step-col reveal">
        <div class="step-num">${i + 1}</div>
        <h3>${esc(t('start.' + st.key + '.title'))}</h3>
        <p>${esc(t('start.' + st.key + '.text'))}</p>
        ${st.items ? `<ul class="mini">${st.items.map((k) => byKey.get(k)).filter(Boolean).map((r) => `
          <li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
            <strong>${esc(r.title)}</strong><span>${esc(typeLabel(r.type))} · ${esc(t('cost.' + r.cost))}</span>
          </a></li>`).join('')}</ul>` : ''}
        ${st.topics ? `<div class="topic-btns">${st.topics.map((id) => DATA.domains.find((d) => d.id === id)).filter(Boolean).map((d) => `
          <button type="button" class="topic-btn" data-id="${esc(d.id)}"><svg class="ic"><use href="#i-${esc(d.icon)}"/></svg>${esc(loc(d.name))}</button>`).join('')}</div>` : ''}
      </li>`).join('');
    $$('#steps .topic-btn').forEach((b) => b.addEventListener('click', () => openTopic(b.dataset.id)));
    observeReveal($$('#steps .reveal'));
  }

  // Jump to the library filtered to one topic.
  function openTopic(id) {
    state.domain = id;
    renderChips();
    renderCards();
    $('#explore').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------------- TOPICS ---------------- */
  function renderDomains() {
    const grid = $('#domain-grid');
    grid.innerHTML = DATA.domains.map((d) => `
      <button class="domain" type="button" data-id="${esc(d.id)}">
        <span class="domain-icon"><svg class="ic"><use href="#i-${esc(d.icon)}"/></svg></span>
        <span class="domain-text">
          <h3>${esc(loc(d.name))}</h3>
          <span class="domain-desc">${esc(t('dom.' + d.id))}</span>
          <span class="domain-count">${d.count} ${esc(t('domains.count'))}</span>
        </span>
      </button>`).join('');

    $$('.domain', grid).forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      el.addEventListener('click', () => openTopic(el.dataset.id));
    });
    observeReveal($$('.domain', grid));
  }

  /* ---------------- EXPLORER ---------------- */
  // Topic navigation: a sidebar list on wide screens, a dropdown on phones.
  function renderChips() {
    const items = [{ id: 'all', icon: 'compass', label: t('explore.all'), n: DATA.resources.length },
      ...DATA.domains.map((d) => ({ id: d.id, icon: d.icon, label: loc(d.name), n: d.count }))];
    $('#topic-list').innerHTML = items.map((c) => `
      <button class="topic-item" type="button" role="listitem" data-id="${esc(c.id)}" aria-pressed="${state.domain === c.id}">
        <svg class="ic"><use href="#i-${esc(c.icon)}"/></svg><span>${esc(c.label)}</span><em>${c.n}</em>
      </button>`).join('');
    $$('#topic-list .topic-item').forEach((b) => b.addEventListener('click', () => selectTopic(b.dataset.id)));
    const sel = $('#f-topic');
    sel.innerHTML = items.map((c) => `<option value="${esc(c.id)}">${esc(c.label)} (${c.n})</option>`).join('');
    sel.value = state.domain;
    sel.onchange = () => selectTopic(sel.value);
  }

  function selectTopic(id) {
    state.domain = id;
    $$('#topic-list .topic-item').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.id === id)));
    $('#f-topic').value = id;
    renderCards();
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
    fill('#f-type', types, typeLabel, 'type');
    fill('#f-level', ['beginner', 'intermediate', 'advanced'], (v) => t('level.' + v), 'level');
    fill('#f-cost', ['free', 'freemium', 'paid'], (v) => t('cost.' + v), 'cost');
    const sortSel = $('#f-sort');
    sortSel.innerHTML = ['recommended', 'popular', 'updated'].map((v) => `<option value="${v}">${esc(t('q.sort.' + v))}</option>`).join('');
    sortSel.value = state.sort;
  }

  function matches(r) {
    if (state.domain !== 'all' && r.domain !== state.domain) return false;
    if (state.type !== 'all' && r.type !== state.type) return false;
    if (state.level !== 'all' && !r.level.includes(state.level)) return false;
    if (state.cost !== 'all' && r.cost !== state.cost) return false;
    if (state.beginner && !r.level.includes('beginner')) return false;
    if (state.free && r.cost !== 'free') return false;
    if (state.hideOld && ['archived', 'stale', 'broken'].includes(r.health)) return false;
    if (state.q) {
      const hay = [r.title, loc(r.description), r.description.en, r.tags.join(' '), r.type, typeLabel(r.type), r.domain, r.subdomains.join(' ')]
        .join(' ').toLowerCase();
      return state.q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }

  // Three-segment level meter, e.g. ■■□ for beginner–intermediate.
  function levelMeter(levels) {
    const all = ['beginner', 'intermediate', 'advanced'];
    const on = all.filter((l) => levels.includes(l));
    const label = on.length > 1 ? `${t('level.' + on[0])} – ${t('level.' + on[on.length - 1])}` : t('level.' + on[0]);
    return `<span class="lvl" title="${esc(t('explore.level'))}: ${esc(label)}">
      <span class="lvl-bars">${all.map((l) => `<i class="${levels.includes(l) ? 'on' : ''}"></i>`).join('')}</span>${esc(label)}</span>`;
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
    const openCveId = new URLSearchParams(location.search).get('cve');
    if (openCveId) p.set('cve', openCveId);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    for (const k of ['domain', 'type', 'level', 'cost']) if (p.get(k)) state[k] = p.get(k);
    if (p.get('q')) { state.q = p.get('q').toLowerCase(); $('#q').value = p.get('q'); }
  }

  // Localized "updated 3 months ago" and compact star counts.
  function ago(date) {
    const days = (Date.now() - new Date(date).getTime()) / 864e5;
    const rtf = new Intl.RelativeTimeFormat(state.lang, { numeric: 'auto' });
    if (days < 1) return rtf.format(0, 'day');
    if (days < 30) return rtf.format(-Math.round(days), 'day');
    if (days < 365) return rtf.format(-Math.round(days / 30.44), 'month');
    return rtf.format(-Math.round(days / 365.25), 'year');
  }
  const compact = (n) => new Intl.NumberFormat(state.lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  function signals(r) {
    const out = [];
    if (r.stars != null) out.push(`<span class="sig" title="GitHub">★ ${esc(compact(r.stars))}</span>`);
    if (r.pushed) out.push(`<span class="sig">${esc(t('q.updated'))} ${esc(ago(r.pushed))}</span>`);
    if (['archived', 'stale', 'broken'].includes(r.health)) out.push(`<span class="sig warn ${esc(r.health)}">${esc(t('q.' + r.health))}</span>`);
    return out.length ? `<div class="card-signals">${out.join('')}</div>` : '';
  }

  function sorted(list) {
    if (state.sort === 'popular') return [...list].sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
    if (state.sort === 'updated') return [...list].sort((a, b) => (b.pushed ?? '').localeCompare(a.pushed ?? ''));
    return list;
  }

  function renderCards(more = false) {
    const list = sorted(DATA.resources.filter(matches));
    const start = more ? shown : 0;
    shown = more ? shown + PAGE : PAGE;
    $('#count').textContent = list.length;
    $('#empty').hidden = list.length > 0;
    $('#more').hidden = shown >= list.length;
    if (!more) syncUrl();
    const html = list.slice(start, shown).map((r, i) => `
      <a class="card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="animation-delay:${Math.min(i, 12) * 35}ms">
        <div class="card-top">
          <span class="card-type">${esc(typeLabel(r.type))}</span>
          <span class="cost-tag ${esc(r.cost)}">${esc(t('cost.' + r.cost))}</span>
        </div>
        <h3>${esc(r.title)}${r.featured ? ` <span class="pick" title="${esc(t('explore.pick'))}">★</span>` : ''}</h3>
        ${(() => { const d = describe(r); return `<p${d.auto ? ` class="auto" title="${esc(r.description.en)}"` : ''}>${esc(d.text)}</p>`; })()}
        ${signals(r)}
        <div class="card-foot">
          ${levelMeter(r.level)}
          ${r.languages.some((l) => l !== 'en') ? `<span class="langs-tag">${r.languages.map((l) => esc(l.toUpperCase())).join(' · ')}</span>` : ''}
          <span class="card-host">${esc(host(r.url))} <svg class="ic"><use href="#i-arrow"/></svg></span>
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
    $('#f-beginner').addEventListener('change', (e) => { state.beginner = e.target.checked; renderCards(); });
    $('#f-free').addEventListener('change', (e) => { state.free = e.target.checked; renderCards(); });
    $('#f-hideold').addEventListener('change', (e) => { state.hideOld = e.target.checked; renderCards(); });
    $('#f-sort').addEventListener('change', (e) => { state.sort = e.target.value; renderCards(); });
    $('#cve-all').addEventListener('click', () => { cveAll = true; renderCves(); });
  }

  /* ---------------- CVEs ---------------- */
  const sevColor = (s) => ({ critical: 'var(--coral)', high: 'var(--amber)', medium: 'var(--brass)', low: 'var(--teal)' }[s] || 'var(--muted)');

  let cveAll = false;
  function renderCves() {
    const list = cveAll ? DATA.cves : DATA.cves.slice(0, 6);
    $('#cve-all').hidden = cveAll || DATA.cves.length <= 6;
    $('#cve-grid').innerHTML = list.map((c) => `
      <article class="cve reveal" style="--sev:${sevColor(c.severity)}">
        <div class="cve-head">
          <span class="cve-id">${esc(c.id)}</span>
          ${c.kev ? `<span class="kev">${esc(t('cve.kevbadge'))}</span>` : ''}
          ${c.epss != null ? `<span class="epss" title="${esc(t('cve.ex.epss'))}">${esc(t('cve.col.epss'))} ${esc((c.epss * 100).toFixed(1))}%</span>` : ''}
          ${c.score != null ? `<span class="score">CVSS ${esc(c.score.toFixed(1))}</span>` : ''}
        </div>
        <h3><button type="button" class="cv-link" data-id="${esc(c.id)}">${esc(c.nickname || c.id)}</button></h3>
        <p>${esc(loc(c.summary))}</p>
        <div class="refs">${c.references.map((r) =>
          `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.title)}">${esc(t('ref.' + r.kind))}</a>`).join('')}</div>
      </article>`).join('');
    $$('#cve-grid .cv-link').forEach((b) => b.addEventListener('click', () => openCve(b.dataset.id)));
    observeReveal($$('#cve-grid .reveal'));
  }

  /* ---------------- TOP EXPLOITED CVEs (lazy) ---------------- */
  let KEV = null, kevLang = null, kevWired = false;
  const kstate = { q: '', vendor: 'all', sev: 'all', sort: 'rank', rw: false, p1: false, nw: false, shown: 25 };
  const SEV = ['critical', 'high', 'medium', 'low'];

  // Loads the ranked CVE index for the current language (cves.<lang>.json).
  async function loadKev() {
    if (KEV && kevLang === state.lang) return;
    const lang = state.lang;
    try { KEV = await fetch(`cves.${lang}.json`).then((r) => r.json()); } catch { KEV = []; }
    kevLang = lang;
    if (!KEV.length) { $('#kev').hidden = true; return; }
    renderKevControls();
    renderKev();
    if (kevWired) return;
    kevWired = true;
    $('#kq').addEventListener('input', (e) => { kstate.q = e.target.value.trim().toLowerCase(); kstate.shown = 25; renderKev(); });
    $('#k-rw').addEventListener('change', (e) => { kstate.rw = e.target.checked; kstate.shown = 25; renderKev(); });
    $('#kmore').addEventListener('click', () => { kstate.shown += 50; renderKev(); });
    const openRow = (e) => {
      const row = e.target.closest('tr.krow');
      if (!row || e.target.closest('a')) return;
      openCve(row.dataset.id);
    };
    $('#kev-rows').addEventListener('click', openRow);
    $('#kev-rows').addEventListener('keydown', (e) => { if (e.key === 'Enter') openRow(e); });
    $('#k-p1').addEventListener('change', (e) => { kstate.p1 = e.target.checked; kstate.shown = 25; renderKev(); });
    $('#k-new').addEventListener('change', (e) => { kstate.nw = e.target.checked; kstate.shown = 25; renderKev(); });
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
      (!kstate.p1 || c.pr === 'P1') &&
      (!kstate.nw || c.nw) &&
      (!kstate.q || `${c.id} ${c.n} ${c.o ?? ''} ${c.v} ${c.p}`.toLowerCase().includes(kstate.q)));
    if (kstate.sort === 'cvss') list = [...list].sort((a, b) => (b.s ?? -1) - (a.s ?? -1) || a.r - b.r);
    if (kstate.sort === 'newest') list = [...list].sort((a, b) => (b.kev ?? '').localeCompare(a.kev ?? '') || a.r - b.r);
    $('#kcount').textContent = list.length;
    $('#kmore').hidden = kstate.shown >= list.length;
    $('#kev-rows').innerHTML = list.slice(0, kstate.shown).map((c) => `
      <tr class="krow" tabindex="0" data-id="${esc(c.id)}">
        <td class="krank">${c.r ?? '·'}</td>
        <td class="kid"><a href="https://nvd.nist.gov/vuln/detail/${esc(c.id)}" target="_blank" rel="noopener noreferrer">${esc(c.id)}</a>${c.c ? ` <span class="kcur" title="${esc(t('cve.deep.title'))}">★</span>` : ''}</td>
        <td class="kname"><strong${c.o ? ` title="${esc(c.o)}"` : ''}>${esc(c.n)}</strong>${c.nw ? `<span class="new-tag">${esc(t('cv.newbadge'))}</span>` : ''}<span>${esc([c.v, c.p].filter(Boolean).join(' · '))}</span>${c.rw ? `<span class="krw">${esc(t('cve.rw'))}</span>` : ''}${c.pr ? `<span class="prio ${esc(c.pr)}">${esc(t('cv.prio.' + c.pr))}</span>` : ''}</td>
        <td><span class="kscore" style="--sev:${sevColor(c.sv)}">${c.s != null ? esc(Number(c.s).toFixed(1)) : '—'}</span></td>
        <td class="kepss"><span class="kbar"><i style="width:${Math.round((c.e ?? 0) * 100)}%"></i></span>${c.e != null ? (c.e * 100).toFixed(1) + '%' : '—'}</td>
        <td class="kdate">${esc(c.kev ?? '')}</td>
      </tr>
`).join('');
  }

  /* ---------------- CVE DETAIL PAGE ---------------- */
  const cveCache = new Map();
  let lastFocus = null;

  const nvdUrl = (id) => `https://nvd.nist.gov/vuln/detail/${id}`;
  const attackUrl = (tid) => `https://attack.mitre.org/techniques/${tid.replace('.', '/')}/`;
  const cweUrl = (cwe) => (/^CWE-(\d+)$/.test(cwe) ? `https://cwe.mitre.org/data/definitions/${cwe.slice(4)}.html` : null);
  const ext = (url, label, extra = '') => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"${extra}>${label}</a>`;

  async function openCve(id, push = true) {
    if (!/^CVE-\d{4}-\d+$/.test(id)) return;
    lastFocus = document.activeElement;
    const view = $('#cve-view');
    view.hidden = false;
    document.body.classList.add('cv-open');
    $('#cv-body').innerHTML = `<p class="cv-loading">${esc(t('cv.loading'))}</p>`;
    if (push) history.pushState({ cve: id }, '', withParam('cve', id));
    try {
      if (!cveCache.has(id)) cveCache.set(id, await fetch(`cve/${id}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));
      renderCve(cveCache.get(id));
    } catch {
      $('#cv-body').innerHTML = `<p class="cv-loading">${esc(t('cv.notfound'))}</p>`;
    }
    $('.cv-panel').scrollTop = 0;
    $('.cv-panel').focus({ preventScroll: true });
  }

  function closeCve(push = true) {
    if ($('#cve-view').hidden) return;
    $('#cve-view').hidden = true;
    document.body.classList.remove('cv-open');
    if (push) history.pushState({}, '', withParam('cve', null));
    lastFocus?.focus?.({ preventScroll: true });
  }

  function withParam(key, value) {
    const p = new URLSearchParams(location.search);
    value ? p.set(key, value) : p.delete(key);
    const qs = p.toString();
    return location.pathname + (qs ? '?' + qs : '') + location.hash;
  }

  function cvSection(icon, title, body, cls = '') {
    return `<section class="cv-sec ${cls}"><h3><svg class="ic"><use href="#i-${icon}"/></svg>${esc(title)}</h3>${body}</section>`;
  }

  function renderCve(c) {
    const o = c.official ?? {}, I = c.intel ?? {};
    const row = KEV?.find((x) => x.id === c.id);
    const title = c.nickname || row?.n || c.name || c.id;
    const subtitle = (c.nickname || (row && row.n !== c.name)) ? (c.name ?? '') : '';
    const vendor = c.affected_product?.[0];
    const summary = c.summary?.[state.lang] || c.summary?.en || '';
    const showOriginal = state.lang !== 'en' && c.summary?.en && c.summary.en !== summary;
    const sev = o.cvss?.severity;
    const prio = I.priority;
    const pct = (v) => `${(v * 100).toFixed(v >= 0.995 ? 1 : 1)}%`;
    const fname = (p) => p.split('/').pop();

    // Header
    let h = `
      <header class="cv-head" style="--sev:${sevColor(sev)}">
        <p class="cv-id">${esc(c.id)}${c.rank ? ` · <span>#${c.rank} ${esc(t('cv.ranked'))}</span>` : c.recent ? ` · <span class="new-tag">${esc(t('cv.new'))}</span>` : ''}</p>
        <h2 id="cv-title">${esc(title)}</h2>
        ${subtitle ? `<p class="cv-sub">${esc(subtitle)}</p>` : ''}
        ${vendor ? `<p class="cv-vendor">${esc([vendor.vendor, vendor.product].filter(Boolean).join(' · '))}</p>` : ''}
        <div class="cv-metrics">
          ${prio ? `<div class="cv-m prio-box ${esc(prio)}"><b>${esc(t('cv.prio.' + prio))}</b><span>${esc(t('cv.priority'))}</span></div>` : ''}
          ${o.cvss ? `<div class="cv-m"><b style="color:var(--sev)">${esc(Number(o.cvss.score).toFixed(1))}</b><span>CVSS ${esc(o.cvss.version ?? '')} · ${esc(t('sev.' + sev) || sev || '')}</span></div>` : ''}
          ${o.epss ? `<div class="cv-m"><b>${esc(pct(o.epss.score))}</b><span>${esc(t('cve.col.epss'))}</span></div>` : ''}
          ${o.kev?.listed ? `<div class="cv-m"><b>${esc(o.kev.date_added ?? '')}</b><span>${esc(t('cve.col.added'))}</span></div>` : ''}
        </div>
        ${I.reasons?.length ? `<ul class="cv-reasons">${I.reasons.map((r) => `<li class="r-${esc(r)}">${esc(t('cv.r.' + r))}</li>`).join('')}</ul>` : ''}
      </header>`;

    // What is it?
    h += cvSection('magnifier', t('cv.what'), `
      <p class="cv-summary">${esc(summary)}</p>
      ${showOriginal ? `<details class="cv-orig"><summary>${esc(t('cv.original'))}</summary><p>${esc(c.summary.en)}</p></details>` : ''}
      <dl class="cv-facts">
        ${o.published ? `<div><dt>${esc(t('cve.published'))}</dt><dd>${esc(o.published)}</dd></div>` : ''}
        ${o.cwe?.length ? `<div><dt>${esc(t('cv.weakness'))}</dt><dd>${o.cwe.map((w) => cweUrl(w) ? ext(cweUrl(w), esc(w)) : esc(w)).join(', ')}</dd></div>` : ''}
        ${o.cvss?.vector ? `<div><dt>${esc(t('cv.vector'))}</dt><dd class="mono">${esc(o.cvss.vector)}</dd></div>` : ''}
      </dl>`);

    // Am I affected?
    if (I.affected?.count) {
      h += cvSection('shield', t('cv.affected'), `
        <ul class="cv-list mono">${I.affected.items.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        ${I.affected.count > I.affected.items.length ? `<p class="cv-more">${esc(t('cv.more').replace('{n}', I.affected.count - I.affected.items.length))} ${ext(nvdUrl(c.id), 'NVD')}</p>` : ''}`);
    }

    // Is it being exploited?
    const edb = I.exploits?.exploitdb, msf = I.exploits?.metasploit;
    const exploitCount = (edb?.count ?? 0) + (msf?.count ?? 0);
    let ex = `<div class="cv-status">
        <div class="${o.kev?.listed ? 'yes' : 'no'}"><b>${esc(t(o.kev?.listed ? 'cv.yes' : 'cv.no'))}</b><span>${esc(t('cv.inwild'))}</span></div>
        <div class="${o.kev?.ransomware_use === 'Known' ? 'yes' : 'no'}"><b>${esc(t(o.kev?.ransomware_use === 'Known' ? 'cv.yes' : 'cv.unknown'))}</b><span>${esc(t('cve.ex.rw.t'))}</span></div>
        <div class="${exploitCount ? 'yes' : 'no'}"><b>${exploitCount ? esc(String(exploitCount)) : esc(t('cv.no'))}</b><span>${esc(t('cv.publicex'))}</span></div>
      </div>`;
    if (o.epss) ex += `<p class="cv-note">${esc(t('cv.epsspct').replace('{p}', Math.min(99, Math.round((o.epss.percentile ?? 0) * 100))))}</p>`;
    if (exploitCount) {
      ex += `<div class="cv-cols">`;
      if (edb?.count) ex += `<div><h4>Exploit-DB <em>${edb.count}</em></h4><ul class="cv-links">${edb.items.map((e) =>
        `<li>${ext(`https://www.exploit-db.com/exploits/${e.id}`, esc(e.title))}<span>${esc(e.date ?? '')} · ${esc(e.type ?? '')}${e.verified ? ' · ✓' : ''}</span></li>`).join('')}</ul></div>`;
      if (msf?.count) ex += `<div><h4>Metasploit <em>${msf.count}</em></h4><ul class="cv-links">${msf.items.map((m) =>
        `<li>${ext(`https://github.com/rapid7/metasploit-framework/blob/master/modules/${m.name}.rb`, `<span class="mono">${esc(m.name)}</span>`)}<span>${esc(m.type)}${m.rank ? ' · ' + esc(m.rank) : ''}</span></li>`).join('')}</ul></div>`;
      ex += `</div><p class="cv-warn">${esc(t('cv.authorized'))}</p>`;
    } else {
      ex += `<p class="cv-note">${esc(t('cv.noexploit'))}</p>`;
    }
    h += cvSection('alert', t('cv.exploited'), ex, 'cv-exploited');

    // Check / practise / detect
    const tools = [];
    if (I.scanners?.nuclei?.length) tools.push(`<div class="cv-tool"><h4>${esc(t('cv.check'))}</h4><p>${esc(t('cv.check.d'))}</p><ul class="cv-links">${I.scanners.nuclei.map((p) =>
      `<li>${ext(`https://github.com/projectdiscovery/nuclei-templates/blob/main/${p}`, `<span class="mono">${esc(fname(p))}</span>`)}<span>Nuclei</span></li>`).join('')}</ul></div>`);
    const L = I.labs ?? {};
    if (L.vulhub?.length || L.metarget?.length) tools.push(`<div class="cv-tool"><h4>${esc(t('cv.lab'))}</h4><p>${esc(t('cv.lab.d'))}</p><ul class="cv-links">${[
      ...(L.vulhub ?? []).map((p) => `<li>${ext(`https://github.com/vulhub/vulhub/tree/master/${p}`, `<span class="mono">${esc(p)}</span>`)}<span>Vulhub · Docker</span></li>`),
      ...(L.metarget ?? []).map((p) => `<li>${ext(`https://github.com/Metarget/metarget/tree/master/${p}`, `<span class="mono">${esc(p)}</span>`)}<span>Metarget · Kubernetes</span></li>`),
    ].join('')}</ul></div>`);
    const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (L.htb?.length || L.ippsec?.length) tools.push(`<div class="cv-tool"><h4>${esc(t('cv.htb'))}</h4><p>${esc(t('cv.htb.d'))}</p><ul class="cv-links">${[
      ...(L.htb ?? []).map((w) => `<li>${ext(w.url, esc(w.title))}<span>0xdf · ${esc(t('cv.writeup'))} · ${esc(w.date ?? '')}</span></li>`),
      ...(L.ippsec ?? []).map((v) => `<li>${ext(`https://www.youtube.com/watch?v=${encodeURIComponent(v.video)}&t=${Number(v.t) || 0}`, esc(v.title))}<span>IppSec · ${esc(t('cv.video'))} · ${mmss(Number(v.t) || 0)}</span></li>`),
    ].join('')}</ul></div>`);
    if (I.analysis?.project_zero?.length) tools.push(`<div class="cv-tool"><h4>${esc(t('cv.rca'))}</h4><p>${esc(t('cv.rca.d'))}</p><ul class="cv-links">${I.analysis.project_zero.map((p) =>
      `<li>${ext(`https://github.com/googleprojectzero/0days-in-the-wild/blob/main/${p}`, `<span class="mono">${esc(fname(p))}</span>`)}<span>Google Project Zero</span></li>`).join('')}</ul></div>`);
    const sg = I.detections?.sigma, el = I.detections?.elastic;
    const detCount = (sg?.count ?? 0) + (el?.count ?? 0);
    if (detCount) tools.push(`<div class="cv-tool"><h4>${esc(t('cv.detect'))} <em>${detCount}</em></h4><p>${esc(t('cv.detect.d'))}</p><ul class="cv-links">${[
      ...(sg?.items ?? []).map((p) => `<li>${ext(`https://github.com/SigmaHQ/sigma/blob/master/${p}`, `<span class="mono">${esc(fname(p))}</span>`)}<span>Sigma</span></li>`),
      ...(el?.items ?? []).map((p) => `<li>${ext(`https://github.com/elastic/detection-rules/blob/main/${p}`, `<span class="mono">${esc(fname(p))}</span>`)}<span>Elastic</span></li>`),
    ].join('')}</ul></div>`);
    if (tools.length) h += cvSection('radar', t('cv.tools'), `<div class="cv-tools">${tools.join('')}</div>`);

    // ATT&CK
    const techs = I.attack?.length ? I.attack : (c.mitre_attack ?? []).map((tid) => ({ id: tid, name: '', role: '' }));
    if (techs.length) {
      h += cvSection('crosshair', t('cv.attack'), `<ul class="cv-attack">${techs.map((a) =>
        `<li class="${a.inferred ? 'inferred' : ''}">${ext(attackUrl(a.id), `<b class="mono">${esc(a.id)}</b> ${esc(a.name ?? '')}`)}${a.role ? `<span>${esc(t('cv.role.' + a.role) || a.role)}</span>` : ''}</li>`).join('')}</ul>
        ${techs.some((a) => a.inferred) ? `<p class="cv-note">${esc(t('cv.inferred'))}</p>` : ''}`);
    }

    // Fix it
    const fix = I.fix ?? {};
    h += cvSection('key', t('cv.fix'), `
      <p class="cv-summary">${esc(t('cv.fix.generic'))}</p>
      ${fix.due_date ? `<p class="cv-due">${esc(t('cv.due'))}: <b>${esc(fix.due_date)}</b></p>` : ''}
      ${fix.references?.length ? `<ul class="cv-links">${fix.references.map((r) =>
        `<li>${ext(r.url, esc((r.original ?? r.url).replace(/^https:\/\/(www\.)?/, '').slice(0, 90)))}<span>${esc([...(r.tags ?? []).map((x) => t('cv.tag.' + x.toLowerCase().replace(/\s+/g, '-'))), ...(r.archived ? [t('cv.archived')] : [])].join(' · '))}</span></li>`).join('')}</ul>` : ''}
      ${fix.required_action ? (() => {
        const local = state.lang !== 'en' ? fix.required_action_i18n?.[state.lang] : null;
        const shown = local || fix.required_action;
        return `<div class="cv-cisa"><b>${esc(t('cv.cisa'))}</b><p>${esc(shown)}</p>
          ${local ? `<details class="cv-orig"><summary>${esc(t('cv.original'))}</summary><p>${esc(fix.required_action)}</p></details>`
            : state.lang !== 'en' ? `<p class="cv-note">${esc(t('cv.cisa.en'))}</p>` : ''}</div>`;
      })() : ''}`);

    // References (curated pages have hand-picked ones)
    const refs = [{ kind: 'advisory', url: nvdUrl(c.id), title: 'NVD' }, ...(c.references ?? []).filter((r) => !r.url.includes('nvd.nist.gov'))];
    h += cvSection('flag', t('cv.refs'), `<ul class="cv-links">${refs.map((r) =>
      `<li>${ext(r.url, esc(r.title || r.original || r.url))}<span>${esc(t('ref.' + r.kind))}${r.archived ? ` · ${esc(t('cv.archived'))}` : ''}</span></li>`).join('')}</ul>`);

    h += `<p class="cv-sources">${esc(t('cv.sources'))}${I.enriched_on ? ` · ${esc(t('cv.updated'))} ${esc(I.enriched_on)}` : ''}</p>`;
    $('#cv-body').innerHTML = h;
    document.title = `${c.id} · Hexicon`;
  }

  function initCveView() {
    $$('#cve-view [data-close]').forEach((b) => b.addEventListener('click', () => closeCve()));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCve(); });
    addEventListener('popstate', () => {
      const id = new URLSearchParams(location.search).get('cve');
      if (id) openCve(id, false); else { closeCve(false); document.title = 'Hexicon'; }
    });
    $('#cv-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); $('#cv-copy').textContent = t('cv.copied'); } catch { /* clipboard blocked */ }
      setTimeout(() => { $('#cv-copy').textContent = t('cv.copy'); }, 1600);
    });
    const initial = new URLSearchParams(location.search).get('cve');
    if (initial) openCve(initial.toUpperCase(), false);
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
      }), { threshold: 0, rootMargin: '0px 0px -8% 0px' })
    : null;
  function observeReveal(els) {
    els.forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
    requestAnimationFrame(checkReveal);
  }

  // Safety net: some mobile/in-app browsers fire IntersectionObserver late or not at all,
  // which would leave content invisible. Reveal anything that has entered the viewport.
  function checkReveal() {
    const limit = innerHeight * 0.96;
    $$('.reveal:not(.in), .domain:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) el.classList.add('in');
    });
  }
  let revealTick = false;
  addEventListener('scroll', () => {
    if (revealTick) return;
    revealTick = true;
    requestAnimationFrame(() => { revealTick = false; checkReveal(); });
  }, { passive: true });
  addEventListener('resize', checkReveal, { passive: true });
  // Last resort: never keep content hidden for more than a few seconds.
  setTimeout(() => $$('.reveal:not(.in), .domain:not(.in)').forEach((el) => el.classList.add('in')), 4000);

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

    // Highlight the tab of the section currently in view.
    const links = $$('.nav-links a');
    const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      const visible = new Map();
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
        let best = null, bestRatio = 0;
        visible.forEach((r, id) => { if (r > bestRatio) { best = id; bestRatio = r; } });
        links.forEach((a) => a.classList.toggle('active', best !== null && a.getAttribute('href') === '#' + best));
      }, { rootMargin: '-80px 0px -40% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
      sections.forEach((s) => spy.observe(s));
    }
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
    initCveView();
    // Load the 1000-CVE index only when the reader gets close to it.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); loadKev(); } }, { rootMargin: '800px' }).observe($('#cves'));
    } else loadKev();
  }

  boot();
})();

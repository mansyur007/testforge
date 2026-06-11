/* Renders the TestForge icon specimen sheet. */
(function () {
  const STYLES = ['a', 'b', 'c'];

  function iconSVG(inner) {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  // ---- per-icon card with A/B/C comparison ----
  function card(icon) {
    const sw = STYLES.map(s =>
      `<div class="sw sty-${s}"><span class="stylet">${s.toUpperCase()}</span>${iconSVG(icon.svg)}</div>`
    ).join('');
    return `<div class="card">
      <div class="swatches">${sw}</div>
      <div class="foot">
        <div>
          <div class="name">${icon.name}</div>
          <div class="sub">${icon.sub}</div>
        </div>
        <div class="was" title="replaces ${icon.was}">${icon.was}</div>
      </div>
    </div>`;
  }

  // ---- category sections ----
  const cats = document.getElementById('cats');
  let html = '';
  let n = 0;
  for (const [title, icons] of Object.entries(window.TF_ICONS)) {
    n++;
    const label = title.replace(/^\d+\.\s*/, '');
    html += `<div class="cat-head">
      <h2><span class="cnum">${String(n).padStart(2, '0')}</span>${label}</h2>
      <span class="cdesc">${icons.length} icon${icons.length > 1 ? 's' : ''} · A / B / C</span>
    </div><div class="grid">${icons.map(card).join('')}</div>`;
  }
  cats.innerHTML = html;

  // ---- brand marks ----
  const brands = document.getElementById('brands');
  brands.innerHTML = window.TF_BRANDS.map(b =>
    `<div class="bcard">
      <div class="glyph">${b.svg}</div>
      <div>
        <div class="bname">${b.name}</div>
        <div class="brole">${b.role}</div>
      </div>
      <div class="mono-note">${b.note}</div>
    </div>`
  ).join('');

  // ---- header logo mark (white version of brand glyph) ----
  const logoInner = window.TF_ICONS['1. Branding & Identity'][0].svg;
  document.getElementById('logo-mark').innerHTML =
    `<svg viewBox="0 0 24 24" style="stroke:#fff;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round" xmlns="http://www.w3.org/2000/svg">${logoInner.replace(/class="acf"/g, 'fill="#fff" stroke="none"').replace(/class="ac"/g, 'stroke="#c7d2fe"')}</svg>`;

  // ---- legend demos (one icon per direction, accented one) ----
  const legendIcon = window.TF_ICONS['5. UI Actions'].find(i => i.id === 'valid').svg;
  STYLES.forEach(s => {
    document.getElementById('leg-' + s).innerHTML = iconSVG(legendIcon) + iconSVG(window.TF_ICONS['2. Core Features'].find(i => i.id === 'cicd').svg) + iconSVG(window.TF_ICONS['9. Analytics & Reports'].find(i => i.id === 'trend').svg);
  });

  // ---- sizing demo ----
  const sizing = document.getElementById('sizing');
  const sizeIcon = window.TF_ICONS['6. Navigation & Sidebar'].find(i => i.id === 'nav-tree').svg;
  const sizes = [24, 20, 16];
  sizes.forEach(px => {
    const col = document.createElement('div');
    col.className = 'sizecol';
    col.innerHTML = `<svg viewBox="0 0 24 24" width="${px}" height="${px}" style="stroke-width:${(1.8 * 24 / px).toFixed(2)}" xmlns="http://www.w3.org/2000/svg">${sizeIcon}</svg><span class="px">${px}px</span>`;
    sizing.appendChild(col);
  });

  // ---- in-context preview ----
  const get = (cat, id) => window.TF_ICONS[cat].find(i => i.id === id).svg;
  const nav = [
    ['6. Navigation & Sidebar', 'nav-projects', 'Projects', true],
    ['2. Core Features', 'dashboard', 'Dashboard', false],
    ['2. Core Features', 'automation', 'Automation', false],
    ['6. Navigation & Sidebar', 'nav-keys', 'API Keys', false],
    ['9. Analytics & Reports', 'trend', 'Reports', false],
    ['6. Navigation & Sidebar', 'nav-audit', 'Audit Log', false],
  ];
  const feats = [
    ['2. Core Features', 'manual', 'Manual Testing', 'Structured suites & cases'],
    ['2. Core Features', 'automation', 'Automation', 'Hook in your runner'],
    ['2. Core Features', 'cicd', 'CI/CD Native', 'Gate every pipeline'],
    ['2. Core Features', 'dashboard', 'Analytics', 'Trends & flaky detection'],
  ];
  document.getElementById('ctx').innerHTML = `
    <div class="ctx-side">
      <div class="cbrand">
        <div class="cmark">${document.getElementById('logo-mark').innerHTML}</div>
        <div class="cw">TestForge</div>
      </div>
      ${nav.map(([c, id, label, active]) =>
        `<div class="navitem${active ? ' active' : ''}">${iconSVG(get(c, id))}<span>${label}</span></div>`
      ).join('')}
    </div>
    <div class="ctx-main">
      <div class="feat">
        ${feats.map(([c, id, h, p]) =>
          `<div class="featcard"><div class="fi">${iconSVG(get(c, id))}</div><h5>${h}</h5><p>${p}</p></div>`
        ).join('')}
      </div>
    </div>`;
})();

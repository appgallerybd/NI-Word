(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ed = $('#editor'), sheet = $('#sheet'), titleEl = $('#title'), savedEl = $('#saved');
  const bn = n => n.toLocaleString('bn-BD');
  let cur = { id: null }, timer, range = null;

  $$('[data-icon]').forEach(el => el.innerHTML = ICONS[el.dataset.icon]);
  document.execCommand('defaultParagraphSeparator', false, 'p');

  /* ---- selection handling (keeps caret when using toolbar) ---- */
  document.addEventListener('selectionchange', () => {
    const s = getSelection();
    if (s.rangeCount && ed.contains(s.anchorNode)) range = s.getRangeAt(0).cloneRange();
    syncButtons();
  });
  const restore = () => {
    ed.focus();
    if (range) { const s = getSelection(); s.removeAllRanges(); s.addRange(range); }
  };
  const exec = (c, v = null) => { restore(); document.execCommand(c, false, v); changed(); };
  $$('.top button, .ribbon button, .findbar button, .tabs button').forEach(b =>
    b.addEventListener('mousedown', e => e.preventDefault()));

  const syncButtons = () => $$('[data-cmd]').forEach(b => {
    let on = false;
    try { on = document.queryCommandState(b.dataset.cmd); } catch (e) {}
    b.classList.toggle('on', on);
  });

  /* ---- tabs ---- */
  $$('[data-tab]').forEach(t => t.onclick = () => {
    $$('[data-tab]').forEach(x => x.classList.toggle('on', x === t));
    $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t.dataset.tab));
  });

  /* ---- font / size / style / spacing ---- */
  $('#font').onchange = e => exec('fontName', e.target.value);
  $('#style').onchange = e => exec('formatBlock', '<' + e.target.value + '>');
  $('#size').onchange = e => {
    restore();
    document.execCommand('fontSize', false, '7');
    $$('font[size="7"]', ed).forEach(f => {
      const s = document.createElement('span');
      s.style.fontSize = (+e.target.value * 4 / 3) + 'px';
      s.innerHTML = f.innerHTML;
      f.replaceWith(s);
    });
    changed();
  };
  $('#lh').onchange = e => {
    restore();
    const r = getSelection().getRangeAt(0);
    [...ed.children].filter(n => r.intersectsNode(n)).forEach(n => n.style.lineHeight = e.target.value);
    changed();
  };
  $('#fore').onchange = e => exec('foreColor', e.target.value);
  $('#back').onchange = e => exec('hiliteColor', e.target.value);

  /* ---- layout ---- */
  $('#margin').onchange = e => sheet.style.setProperty('--m', e.target.value + 'px');
  const fit = () => {
    const z = $('#zoom').value;
    sheet.style.zoom = z === 'auto' ? Math.min(1, (innerWidth - 16) / 794) : z;
    stats();
  };
  $('#zoom').onchange = fit;
  addEventListener('resize', fit);

  /* ---- table helpers ---- */
  const cell = () => {
    const n = getSelection().anchorNode, e = n && (n.nodeType === 1 ? n : n.parentElement);
    return e && ed.contains(e) ? e.closest('td,th') : null;
  };
  const rows = td => [...td.closest('table').rows];

  /* ---- find & replace ---- */
  const inEd = () => { const s = getSelection(); return s.rangeCount && ed.contains(s.anchorNode); };
  const findNext = wrap => {
    const q = $('#fq').value;
    if (!q) return false;
    for (let i = 0; i < 100; i++) {
      if (!window.find(q, false, false, wrap, false, false, false)) return false;
      if (inEd()) return true;
    }
    return false;
  };
  const replaceOne = () => {
    const q = $('#fq').value.toLowerCase();
    if (inEd() && getSelection().toString().toLowerCase() === q) {
      document.execCommand('insertText', false, $('#fr').value);
      changed();
    }
    findNext(true);
  };

  /* ---- actions ---- */
  const A = {
    docs: openDocs,
    undo: () => exec('undo'),
    redo: () => exec('redo'),
    docx: () => dl(DOCX.blob(ed, sheet.style.getPropertyValue('--m')), nm() + '.docx'),
    doc: exportDoc,
    html: () => dl(new Blob(['<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><title>' + nm().replace(/</g, '&lt;') + '</title></head><body>' + ed.innerHTML + '</body></html>'], { type: 'text/html' }), nm() + '.html'),
    txt: () => dl(new Blob([ed.innerText], { type: 'text/plain' }), nm() + '.txt'),
    open: () => $('#opener').click(),
    rtl: () => { restore(); const r = getSelection().getRangeAt(0); [...ed.children].filter(n => r.intersectsNode(n)).forEach(n => { n.dir = n.dir === 'rtl' ? 'ltr' : 'rtl'; }); changed(); },
    print: () => print(),
    hr: () => exec('insertHorizontalRule'),
    pagebreak: () => exec('insertHTML', '<div class="pb"></div><p><br></p>'),
    link: () => { const u = prompt('লিংকের URL', 'https://'); if (u) exec('createLink', u); },
    image: () => $('#file').click(),
    table: () => {
      const r = +prompt('কয়টি সারি?', '3'), c = +prompt('কয়টি কলাম?', '3');
      if (!r || !c) return;
      exec('insertHTML', '<table><tbody>' + ('<tr>' + '<td><br></td>'.repeat(c) + '</tr>').repeat(r) + '</tbody></table><p><br></p>');
    },
    rowAdd: () => { restore(); const td = cell(); if (!td) return; const tr = td.parentElement, n = tr.cloneNode(true); $$('td,th', n).forEach(c => c.innerHTML = '<br>'); tr.after(n); changed(); },
    rowDel: () => { restore(); const td = cell(); if (td) { td.parentElement.remove(); changed(); } },
    colAdd: () => { restore(); const td = cell(); if (!td) return; const i = td.cellIndex; rows(td).forEach(r => { const c = r.cells[i].cloneNode(false); c.innerHTML = '<br>'; r.cells[i].after(c); }); changed(); },
    colDel: () => { restore(); const td = cell(); if (!td) return; const i = td.cellIndex; rows(td).forEach(r => r.cells[i] && r.cells[i].remove()); changed(); },
    tblDel: () => { restore(); const td = cell(); if (td) { td.closest('table').remove(); changed(); } },
    find: () => { const f = $('#findbar'); f.hidden = !f.hidden; if (!f.hidden) $('#fq').focus(); },
    findNext: () => findNext(true),
    replace: replaceOne,
    replaceAll: () => {
      const q = $('#fq').value;
      if (!q) return;
      getSelection().collapse(ed, 0);
      let n = 0;
      while (n < 2000 && findNext(false)) { document.execCommand('insertText', false, $('#fr').value); n++; }
      changed();
      alert(bn(n) + ' টি বদলানো হয়েছে');
    }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cmd) exec(b.dataset.cmd);
    else if (A[b.dataset.act]) A[b.dataset.act]();
  });

  $('#file').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => exec('insertImage', r.result);
    r.readAsDataURL(f);
    e.target.value = '';
  };
  ed.addEventListener('dblclick', e => {
    if (e.target.tagName !== 'IMG') return;
    const w = prompt('ছবির প্রস্থ (px)', e.target.width);
    if (w) { e.target.style.width = w + 'px'; changed(); }
  });

  /* ---- export / import ---- */
  const nm = () => titleEl.value || 'document';
  const dl = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#opener').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const ext = f.name.split('.').pop().toLowerCase();
      let html;
      if (ext === 'docx') html = await DOCX.toHtml(await f.arrayBuffer());
      else if (ext === 'txt') html = (await f.text()).split(/\r?\n/).map(l => '<p>' + (l.replace(/&/g, '&amp;').replace(/</g, '&lt;') || '<br>') + '</p>').join('');
      else html = DOCX.clean(await f.text());
      await save(); fresh();
      ed.innerHTML = html || '<p><br></p>';
      titleEl.value = f.name.replace(/\.[^.]+$/, '');
      changed();
    } catch (err) { alert('ফাইলটি খোলা যায়নি: ' + err.message); }
  };

  function exportDoc() {
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>table{border-collapse:collapse}td{border:1px solid #000;padding:4px}body{font-family:Arial;font-size:12pt}</style></head><body>' + ed.innerHTML + '</body></html>';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword' }));
    a.download = (titleEl.value || 'document') + '.doc';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---- stats ---- */
  function stats() {
    const t = ed.innerText.trim();
    const words = t ? t.split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil((ed.offsetHeight + 192) / 1123));
    $('#stats').textContent = `শব্দ: ${bn(words)}  ·  অক্ষর: ${bn(t.length)}  ·  পেজ (আনুমানিক): ${bn(pages)}`;
  }

  /* ---- save / load ---- */
  function changed() {
    savedEl.textContent = 'সেভ হচ্ছে…';
    stats();
    clearTimeout(timer);
    timer = setTimeout(save, 700);
  }
  async function save() {
    if (!cur.id) cur.id = 'd' + Date.now();
    try {
      await DB.put({ id: cur.id, title: titleEl.value || 'নামহীন ডকুমেন্ট', html: ed.innerHTML, margin: sheet.style.getPropertyValue('--m'), updated: Date.now() });
      try { localStorage.setItem('word-editor.last', cur.id); } catch (e) {}
      savedEl.textContent = 'সেভ হয়েছে';
    } catch (e) { savedEl.textContent = 'সেভ ব্যর্থ'; }
  }
  const load = d => {
    cur = { id: d.id };
    titleEl.value = d.title;
    ed.innerHTML = d.html || '<p><br></p>';
    sheet.style.setProperty('--m', d.margin || '96px');
    savedEl.textContent = 'সেভ হয়েছে';
    stats();
  };
  const fresh = () => load({ id: null, title: 'নামহীন ডকুমেন্ট', html: '<p><br></p>' });
  ed.addEventListener('input', changed);
  titleEl.addEventListener('input', changed);
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });

  /* ---- documents dialog ---- */
  async function openDocs() {
    await save();
    const list = (await DB.all()).sort((a, b) => b.updated - a.updated);
    $('#doclist').innerHTML = '';
    list.forEach(d => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><small></small><button class="t" title="মুছুন">মুছুন</button>';
      $('span', li).textContent = d.title;
      $('small', li).textContent = new Date(d.updated).toLocaleDateString('bn-BD');
      $('span', li).onclick = () => { load(d); $('#docs').close(); };
      $('button', li).onclick = async () => {
        if (!confirm('"' + d.title + '" মুছে ফেলবেন?')) return;
        await DB.del(d.id);
        if (d.id === cur.id) fresh();
        openDocs();
      };
      $('#doclist').append(li);
    });
    if (!$('#docs').open) $('#docs').showModal();
  }
  $('#newdoc').onclick = async () => { await save(); fresh(); $('#docs').close(); };
  $('#closedocs').onclick = () => $('#docs').close();

  /* ---- boot ---- */
  (async () => {
    fit();
    let id = null;
    try { id = localStorage.getItem('word-editor.last'); } catch (e) {}
    const d = id && await DB.get(id).catch(() => null);
    d ? load(d) : fresh();
  })();
})();

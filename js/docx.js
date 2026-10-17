/* আসল .docx এক্সপোর্ট ও ইম্পোর্ট (OOXML) */
const DOCX = (() => {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hex = c => { if (!c || /transparent|rgba\([^)]*,\s*0(\.0+)?\)/.test(c)) return null; const m = c.match(/\d+/g); return m && m.length >= 3 ? m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join('').toUpperCase() : null; };
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const HEAD = { H1: [36, '2F5496'], H2: [27, '2F5496'], H3: [22, '1F3763'] };

  /* ---------- এক্সপোর্ট ---------- */
  function run(t, s) {
    const p = (s.f ? `<w:rFonts w:ascii="${s.f}" w:hAnsi="${s.f}" w:cs="${s.f}"/>` : '') + (s.b ? '<w:b/>' : '') + (s.i ? '<w:i/>' : '') +
      (s.s ? '<w:strike/>' : '') + (s.c ? `<w:color w:val="${s.c}"/>` : '') + (s.z ? `<w:sz w:val="${s.z}"/>` : '') +
      (s.u ? '<w:u w:val="single"/>' : '') + (s.h ? `<w:shd w:val="clear" w:color="auto" w:fill="${s.h}"/>` : '') + (s.v ? `<w:vertAlign w:val="${s.v}"/>` : '');
    return `<w:r>${p ? '<w:rPr>' + p + '</w:rPr>' : ''}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  }
  function img(n, out, ctx) {
    const m = /^data:image\/(png|jpe?g|gif);base64,(.+)$/.exec(n.getAttribute('src') || '');
    if (!m) return;
    const id = ctx.media.length + 1, ext = m[1] === 'png' ? 'png' : m[1] === 'gif' ? 'gif' : 'jpg';
    ctx.media.push({ ext, data: Uint8Array.from(atob(m[2]), ch => ch.charCodeAt(0)) });
    const w0 = n.width || 300, h0 = n.height || 200, w = Math.min(w0, 600), h = Math.round(w * h0 / w0), cx = w * 9525, cy = h * 9525;
    out.push(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="ছবি ${id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="i${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`);
  }
  function runs(node, st, out, ctx) {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { if (n.nodeValue) out.push(run(n.nodeValue.replace(/\u00a0/g, ' '), st)); return; }
      if (n.nodeType !== 1 || /^(UL|OL|TABLE)$/.test(n.tagName)) return;
      const t = n.tagName, c = n.style, s = { ...st }, td = c.textDecoration + c.textDecorationLine;
      if (t === 'B' || t === 'STRONG' || c.fontWeight === 'bold' || +c.fontWeight >= 600) s.b = 1;
      if (t === 'I' || t === 'EM' || c.fontStyle === 'italic') s.i = 1;
      if (t === 'U' || /underline/.test(td)) s.u = 1;
      if (t === 'S' || t === 'STRIKE' || /line-through/.test(td)) s.s = 1;
      if (t === 'SUP') s.v = 'superscript';
      if (t === 'SUB') s.v = 'subscript';
      if (t === 'A') { s.c = '0563C1'; s.u = 1; }
      if (t === 'FONT' && n.getAttribute('color')) s.c = (hex(n.getAttribute('color')) || n.getAttribute('color').replace('#', '')).toUpperCase();
      if (hex(c.color)) s.c = hex(c.color);
      if (hex(c.backgroundColor)) s.h = hex(c.backgroundColor);
      if (/px/.test(c.fontSize)) s.z = Math.round(parseFloat(c.fontSize) * 1.5);
      if (c.fontFamily) s.f = c.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (t === 'BR') out.push('<w:r><w:br/></w:r>');
      else if (t === 'IMG') img(n, out, ctx);
      else runs(n, s, out, ctx);
    });
  }
  function para(el, ctx, o = {}) {
    const t = el.tagName, c = el.style || {}, out = [];
    if (o.prefix) out.push(run(o.prefix, {}));
    runs(el, HEAD[t] ? { b: 1, z: HEAD[t][0], c: HEAD[t][1] } : {}, out, ctx);
    const al = { center: 'center', right: 'right', justify: 'both', left: 'left' }[c.textAlign || el.getAttribute('align')];
    const lh = parseFloat(c.lineHeight), useLh = lh && !/px|%/.test(c.lineHeight);
    const pp = (el.dir === 'rtl' ? '<w:bidi/>' : '') + (useLh ? `<w:spacing w:line="${Math.round(lh * 240)}" w:lineRule="auto"/>` : '') +
      (o.ind ? `<w:ind w:left="${o.ind}" w:hanging="360"/>` : '') + (al ? `<w:jc w:val="${al}"/>` : '') + (HEAD[t] ? `<w:outlineLvl w:val="${+t[1] - 1}"/>` : '');
    return `<w:p>${pp ? '<w:pPr>' + pp + '</w:pPr>' : ''}${out.join('')}</w:p>`;
  }
  function list(el, ctx, depth, out) {
    let i = 0;
    const ord = el.tagName === 'OL';
    [...el.children].forEach(li => {
      if (li.tagName !== 'LI') return;
      out.push(para(li, ctx, { prefix: ord ? ++i + '.\u00a0' : '•\u00a0', ind: 720 * (depth + 1) }));
      [...li.children].filter(x => /^(UL|OL)$/.test(x.tagName)).forEach(x => list(x, ctx, depth + 1, out));
    });
  }
  function table(el, ctx, out) {
    const rows = [...el.rows], cols = Math.max(1, ...rows.map(r => r.cells.length)), w = Math.floor(9000 / cols);
    const b = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(x => `<w:${x} w:val="single" w:sz="4" w:space="0" w:color="666666"/>`).join('');
    out.push(`<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${b}</w:tblBorders></w:tblPr><w:tblGrid>${`<w:gridCol w:w="${w}"/>`.repeat(cols)}</w:tblGrid>` +
      rows.map(r => '<w:tr>' + [...r.cells].map(c => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr>${para(c, ctx)}</w:tc>`).join('') + '</w:tr>').join('') + '</w:tbl>');
  }
  function blob(ed, margin) {
    const ctx = { media: [] }, out = [];
    ed.childNodes.forEach(n => {
      if (n.nodeType === 3) { if (n.nodeValue.trim()) out.push(`<w:p>${run(n.nodeValue, {})}</w:p>`); return; }
      if (n.nodeType !== 1 || n.classList.contains('pgap')) return;
      const t = n.tagName;
      if (t === 'UL' || t === 'OL') list(n, ctx, 0, out);
      else if (t === 'TABLE') table(n, ctx, out);
      else if (t === 'HR') out.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="444444"/></w:pBdr></w:pPr></w:p>');
      else if (n.classList.contains('pb')) out.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      else out.push(para(n, ctx));
    });
    if (!out.length || out[out.length - 1].startsWith('<w:tbl>')) out.push('<w:p/>');
    const m = Math.round((parseInt(margin) || 96) * 15);
    const doc = `${XML}<w:document ${NS} xmlns:r="${REL}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${out.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `${XML}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;
    const rels = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="${REL}/styles" Target="styles.xml"/>` +
      ctx.media.map((x, i) => `<Relationship Id="rIdImg${i + 1}" Type="${REL}/image" Target="media/image${i + 1}.${x.ext}"/>`).join('') + '</Relationships>';
    const ct = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
    const root = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/></Relationships>`;
    return ZIP.create([
      { name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: root },
      { name: 'word/document.xml', data: doc }, { name: 'word/styles.xml', data: styles },
      { name: 'word/_rels/document.xml.rels', data: rels },
      ...ctx.media.map((x, i) => ({ name: `word/media/image${i + 1}.${x.ext}`, data: x.data }))
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  /* ---------- ইম্পোর্ট ---------- */
  async function toHtml(buf) {
    const xml = await ZIP.read(buf, 'word/document.xml');
    if (!xml) throw Error('এটি বৈধ .docx ফাইল নয়');
    const d = new DOMParser().parseFromString(xml, 'application/xml');
    const kids = (e, n) => [...e.children].filter(x => !n || x.localName === n);
    const val = (e, n) => { const x = e && kids(e, n)[0]; return x ? (x.getAttribute('w:val') || 'true') : null; };
    const on = (e, n) => { const v = val(e, n); return v !== null && v !== 'false' && v !== '0'; };
    const HL = { yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff', magenta: '#ff00ff', blue: '#0000ff', red: '#ff0000', lightGray: '#d3d3d3' };
    const runHtml = r => {
      const rp = kids(r, 'rPr')[0];
      let h = '';
      kids(r).forEach(c => {
        const k = c.localName;
        if (k === 't') h += esc(c.textContent);
        else if (k === 'tab') h += '&emsp;';
        else if (k === 'br' && c.getAttribute('w:type') !== 'page') h += '<br>';
      });
      if (!h) return '';
      let st = '';
      const sz = val(rp, 'sz'), col = val(rp, 'color'), hl = val(rp, 'highlight');
      const shd = rp && kids(rp, 'shd')[0], fn = rp && kids(rp, 'rFonts')[0];
      if (sz) st += `font-size:${(sz / 1.5).toFixed(1)}px;`;
      if (col && col !== 'auto') st += `color:#${col};`;
      if (hl && HL[hl]) st += `background-color:${HL[hl]};`;
      else if (shd && /^[0-9A-Fa-f]{6}$/.test(shd.getAttribute('w:fill') || '')) st += `background-color:#${shd.getAttribute('w:fill')};`;
      if (fn && fn.getAttribute('w:ascii')) st += `font-family:'${fn.getAttribute('w:ascii').replace(/['"<>]/g, '')}';`;
      if (st) h = `<span style="${st}">${h}</span>`;
      if (on(rp, 'b')) h = `<b>${h}</b>`;
      if (on(rp, 'i')) h = `<i>${h}</i>`;
      if (rp && val(rp, 'u') && val(rp, 'u') !== 'none') h = `<u>${h}</u>`;
      if (on(rp, 'strike')) h = `<s>${h}</s>`;
      const va = val(rp, 'vertAlign');
      if (va === 'superscript') h = `<sup>${h}</sup>`;
      if (va === 'subscript') h = `<sub>${h}</sub>`;
      return h;
    };
    const inner = p => [...p.getElementsByTagName('w:r')].map(runHtml).join('');
    const para = p => {
      const pp = kids(p, 'pPr')[0], style = val(pp, 'pStyle') || '', hm = /heading\s*([1-3])/i.exec(style) || /^title$/i.exec(style) && [0, 1];
      const tag = hm ? 'h' + hm[1] : 'p', jc = val(pp, 'jc');
      const a = { center: 'center', right: 'right', both: 'justify', left: 'left' }[jc];
      const brk = [...p.getElementsByTagName('w:br')].some(b => b.getAttribute('w:type') === 'page') ? '<div class="pb"></div>' : '';
      const pre = pp && kids(pp, 'numPr')[0] ? '•&nbsp;' : '';
      return `${brk}<${tag}${a ? ` style="text-align:${a}"` : ''}${on(pp, 'bidi') ? ' dir="rtl"' : ''}>${pre}${inner(p) || '<br>'}</${tag}>`;
    };
    const body = d.getElementsByTagName('w:body')[0];
    if (!body) throw Error('ডকুমেন্টের বডি পাওয়া যায়নি');
    return kids(body).map(n => {
      if (n.localName === 'p') return para(n);
      if (n.localName === 'tbl') return '<table><tbody>' + kids(n, 'tr').map(tr => '<tr>' + kids(tr, 'tc').map(tc => '<td>' + (kids(tc, 'p').map(inner).join('<br>') || '<br>') + '</td>').join('') + '</tr>').join('') + '</tbody></table><p><br></p>';
      return '';
    }).join('');
  }
  function clean(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach(e => e.remove());
    doc.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
      if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name);
    }));
    return doc.body.innerHTML;
  }
  return { blob, toHtml, clean };
})();

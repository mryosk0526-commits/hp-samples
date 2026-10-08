// ご案内ボット（試作）— 本体。お店の情報は shop-data.js の BOT_DATA から読む。APIもサーバーも使わない。
(function () {
  const D = window.BOT_DATA;
  if (!D) return;

  const css = `
  .gb-launch{position:fixed;right:20px;bottom:88px;z-index:9998;border:none;border-radius:999px;padding:14px 20px;font:700 15px/1 system-ui,"Yu Gothic UI",sans-serif;
    background:var(--gb-a);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22);cursor:pointer}
  .gb-panel{position:fixed;right:20px;bottom:20px;z-index:9999;width:380px;max-width:calc(100vw - 24px);height:min(640px,calc(100vh - 40px));display:none;flex-direction:column;
    background:#f6f9fb;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;font:15px/1.6 system-ui,"Yu Gothic UI","Hiragino Sans",sans-serif;color:#22323d}
  .gb-panel.open{display:flex}
  .gb-head{background:var(--gb-a);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}
  .gb-head b{font-size:16px;flex:1}
  .gb-head small{display:block;font-weight:400;opacity:.9;font-size:12px}
  .gb-x{background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer}
  .gb-urgent{display:block;width:100%;border:none;background:#fff3f0;color:#b3402f;font:700 13px/1.4 inherit;padding:9px 14px;text-align:left;cursor:pointer;border-bottom:1px solid #f3d9d3}
  .gb-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .gb-msg{max-width:92%;padding:10px 13px;border-radius:14px;background:#fff;border:1px solid #dbe6ee;align-self:flex-start}
  .gb-msg.me{align-self:flex-end;background:var(--gb-a);color:#fff;border-color:var(--gb-a)}
  .gb-msg .gb-sub{font-size:12.5px;color:#6b7a85;margin-top:4px}
  .gb-chips{display:flex;flex-wrap:wrap;gap:8px}
  .gb-chip{border:1px solid #bfd6e0;background:#fff;color:var(--gb-ad);border-radius:999px;padding:8px 13px;font:600 14px/1.3 inherit;cursor:pointer;text-align:left}
  .gb-chip:hover{background:var(--gb-as)}
  .gb-chip.more{border-style:dashed}
  .gb-chip.act{background:var(--gb-act);border-color:var(--gb-act);color:#fff}
  .gb-chip.back{color:#6b7a85;border-color:#dbe6ee}
  .gb-label{font-size:12px;color:#6b7a85;font-weight:700;margin:2px 2px -2px}
  .gb-table{border-collapse:collapse;width:100%;margin-top:8px;font-size:13px}
  .gb-table th,.gb-table td{border:1px solid #dbe6ee;padding:5px 4px;text-align:center}
  .gb-table th{background:#eef5f8;font-weight:700}
  .gb-table td.o{color:#1f9d6b;font-weight:700}.gb-table td.t{color:#c98a12;font-weight:700}.gb-table td.x{color:#c0503c;font-weight:700}
  .gb-find{border-top:1px solid #dbe6ee;background:#fff}
  .gb-find-toggle{width:100%;border:none;background:none;padding:10px 14px;text-align:left;font:600 13.5px/1.3 inherit;color:var(--gb-ad);cursor:pointer}
  .gb-find-body{display:none;padding:0 12px 10px}
  .gb-find.open .gb-find-body{display:block}
  .gb-input{width:100%;box-sizing:border-box;border:1px solid #bfd6e0;border-radius:10px;padding:10px 12px;font:15px/1.3 inherit}
  .gb-hits{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:168px;overflow-y:auto}
  .gb-hit{border:1px solid #dbe6ee;background:#f6f9fb;border-radius:10px;padding:8px 10px;text-align:left;font:14px/1.35 inherit;cursor:pointer;color:#22323d}
  .gb-hit small{color:#6b7a85;display:block;font-size:11.5px}
  .gb-none{margin-top:8px;background:#fff8e8;border:1px solid #f0dca8;border-radius:10px;padding:9px 10px;font-size:13.5px}
  .gb-foot{background:#eef5f8;border-top:1px solid #dbe6ee;padding:9px 12px;display:flex;align-items:center;gap:8px;font-size:12.5px;color:#4d5d68}
  .gb-foot span{flex:1}
  .gb-foot a{background:#fff;border:1px solid #bfd6e0;border-radius:999px;padding:6px 11px;color:var(--gb-ad);font-weight:700;text-decoration:none;white-space:nowrap}
  `;
  const TH = Object.assign({ accent: "#2b8caa", accentDark: "#22728b", accentSoft: "#dceef4", action: "#37b39a" }, D.theme || {});
  const st = document.createElement("style");
  st.textContent = ":root{--gb-a:" + TH.accent + ";--gb-ad:" + TH.accentDark + ";--gb-as:" + TH.accentSoft + ";--gb-act:" + TH.action + "}" + css;
  document.head.appendChild(st);

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const telHref = "tel:" + D.contact.tel.replace(/[^0-9]/g, "");

  // ---- 画面の骨組み ----
  const launch = el("button", "gb-launch", "💬 ご案内");
  const panel = el("div", "gb-panel");
  const head = el("div", "gb-head");
  const title = el("b", null, D.shop);
  title.appendChild(el("small", null, "ご案内ボット（基本的なご質問に、その場でお答えします）"));
  const close = el("button", "gb-x", "×");
  head.append(title, close);
  const urgent = el("button", "gb-urgent", D.urgent ? "☎ " + D.urgent.label + "（" + D.urgent.tel + "）" : "");
  if (!D.urgent) urgent.style.display = "none";
  const log = el("div", "gb-log");

  const find = el("div", "gb-find");
  const findToggle = el("button", "gb-find-toggle", "▼ キーワードで探す");
  const findBody = el("div", "gb-find-body");
  const input = el("input", "gb-input");
  input.type = "text";
  input.placeholder = "例：駐車場、予約、支払い（単語でOK）";
  const hits = el("div", "gb-hits");
  findBody.append(input, hits);
  find.append(findToggle, findBody);

  const foot = el("div", "gb-foot");
  foot.appendChild(el("span", null, "ここにないご質問は"));
  const aTel = el("a", null, "☎ 電話");
  aTel.href = telHref;
  const aRes = el("a", null, D.contact.reserveLabel);
  aRes.href = D.contact.reserveUrl;
  foot.append(aTel, aRes);

  panel.append(head, urgent, log, find, foot);
  document.body.append(launch, panel);

  // ---- 会話 ----
  const say = (text, who) => {
    const m = el("div", "gb-msg" + (who === "me" ? " me" : ""), text);
    log.appendChild(m);
    if (who === "me") anchor = m;
    return m;
  };
  // 答えの"頭"が見える位置で止める（いちばん下まで送ると、答えの出だしが隠れるため）
  let anchor = null;
  const scroll = () => { if (anchor) log.scrollTop = Math.max(0, anchor.offsetTop - log.offsetTop - 8); else log.scrollTop = log.scrollHeight; };

  function actionChips(list) {
    const wrap = el("div", "gb-chips");
    (list || []).forEach((a) => {
      let c;
      if (a === "reserve") { c = el("a", "gb-chip act", D.contact.reserveLabel); c.href = D.contact.reserveUrl; c.addEventListener("click", closePanel); }
      if (a === "tel") { c = el("a", "gb-chip act", "☎ 電話する"); c.href = telHref; }
      if (a === "menu") { c = el("a", "gb-chip act", "メニューを見る"); c.href = "#menu"; c.addEventListener("click", closePanel); }
      if (a === "map") { c = el("a", "gb-chip act", "地図を見る"); c.href = "#access"; c.addEventListener("click", closePanel); }
      if (c) { c.style.textDecoration = "none"; wrap.appendChild(c); }
    });
    return wrap;
  }

  function menu(intro) {
    const im = intro ? say(intro) : null;
    if (im) anchor = im;
    const wrap = el("div", "gb-chips");
    D.topics.forEach((t) => {
      const c = el("button", "gb-chip", t.icon + " " + t.label);
      c.addEventListener("click", () => openTopic(t));
      wrap.appendChild(c);
    });
    log.appendChild(wrap);
    scroll();
  }

  function followUps(t, skipQ) {
    const rest = (t.more || []).filter((m) => m.q !== skipQ);
    if (rest.length) {
      log.appendChild(el("div", "gb-label", "もう少し詳しく"));
      const wrap = el("div", "gb-chips");
      rest.forEach((m) => {
        const c = el("button", "gb-chip more", m.q);
        c.addEventListener("click", () => openMore(t, m));
        wrap.appendChild(c);
      });
      log.appendChild(wrap);
    }
    const acts = actionChips(t.actions);
    const back = el("button", "gb-chip back", "ほかのことを聞く");
    back.addEventListener("click", () => menu("ほかに、次のことをご案内できます。"));
    acts.appendChild(back);
    log.appendChild(acts);
    scroll();
  }

  function openTopic(t) {
    say(t.label, "me");
    const tbl = t.table === "busy" ? D.busy : t.table;
    const m = say(t.answer || (tbl && tbl.summary) || "");
    if (t.live === "status" && window.SHOP_STATUS) m.appendChild(el("div", "gb-sub", "いま：" + window.SHOP_STATUS().text));
    if (tbl) { t = Object.assign({}, t, { table: tbl });
      const tb = el("table", "gb-table");
      const hr = el("tr");
      hr.appendChild(el("th", null, ""));
      t.table.cols.forEach((c) => hr.appendChild(el("th", null, c)));
      tb.appendChild(hr);
      t.table.rows.forEach((r) => {
        const tr = el("tr");
        tr.appendChild(el("th", null, r.name));
        r.cells.forEach((c) => tr.appendChild(el("td", c === "○" ? "o" : c === "△" ? "t" : c === "×" ? "x" : "", c)));
        tb.appendChild(tr);
      });
      m.appendChild(tb);
      m.appendChild(el("div", "gb-sub", t.table.legend));
      m.appendChild(el("div", "gb-sub", "※ " + t.table.note));
    }
    t = D.topics.find((x) => x.id === t.id) || t;
    followUps(t);
  }

  function openMore(t, mo) {
    say(mo.q, "me");
    say(mo.a);
    followUps(t, mo.q);
  }

  // ---- キーワードで探す（打つそばから、答えられる項目を出す。送信はない） ----
  const index = [];
  D.topics.forEach((t) => {
    index.push({ text: t.label, sub: "", words: [t.label].concat(t.words), run: () => openTopic(t) });
    (t.more || []).forEach((m) => index.push({ text: m.q, sub: t.label, words: [m.q].concat(m.words), run: () => openMore(t, m) }));
  });
  const norm = (s) => s.toLowerCase().replace(/\s+/g, "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  function search() {
    const q = norm(input.value);
    hits.replaceChildren();
    if (!q) return;
    if (q.length === 1 && /[ぁ-んa-z0-9]/.test(q)) return; // ひらがな1文字では探さない（何でも当たってしまうため）
    // ボットが答えてはいけない話題（症状の相談など）は、候補を出さずに、すぐ案内する
    const stop = (D.outOfScope || []).find((o) => o.words.some((w) => q.includes(norm(w))));
    if (stop) {
      const n = el("div", "gb-none");
      n.appendChild(el("div", null, stop.message));
      const w = actionChips(stop.actions || ["tel"]);
      w.style.marginTop = "8px";
      n.appendChild(w);
      hits.appendChild(n);
      return;
    }
    const found = index
      .map((it) => {
        let score = 0;
        it.words.forEach((w) => { const n = norm(w); if (n.includes(q) || (n.length >= 2 && q.includes(n))) score += n === q ? 3 : 1; });
        return { it, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (found.length) {
      found.forEach(({ it }) => {
        const b = el("button", "gb-hit", it.text);
        if (it.sub) b.appendChild(el("small", null, it.sub));
        b.addEventListener("click", () => { input.value = ""; hits.replaceChildren(); find.classList.remove("open"); findToggle.textContent = "▼ キーワードで探す"; it.run(); });
        hits.appendChild(b);
      });
    } else if (q.length >= 2) {
      const n = el("div", "gb-none");
      n.appendChild(el("div", null, "「" + input.value + "」は、このボットではご案内できません。"));
      n.appendChild(el("div", "gb-sub", D.scopeNote));
      const w = actionChips(["tel", "reserve"]);
      w.style.marginTop = "8px";
      n.appendChild(w);
      hits.appendChild(n);
    }
  }
  input.addEventListener("input", search);
  findToggle.addEventListener("click", () => {
    const open = find.classList.toggle("open");
    findToggle.textContent = (open ? "▲" : "▼") + " キーワードで探す";
    if (open) input.focus();
  });

  // ---- 開く・閉じる ----
  let started = false;
  function openPanel() {
    panel.classList.add("open");
    launch.style.display = "none";
    if (!started) { started = true; menu(D.hello); }
  }
  function closePanel() { panel.classList.remove("open"); launch.style.display = ""; }
  launch.addEventListener("click", openPanel);
  close.addEventListener("click", closePanel);
  urgent.addEventListener("click", () => { if (D.urgent) location.href = "tel:" + D.urgent.tel.replace(/[^0-9]/g, ""); });
})();

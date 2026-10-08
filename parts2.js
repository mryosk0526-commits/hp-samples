// 「今日のお店」の箱（試作2）。営業中かどうか・今日の混み具合・お知らせ・今週の営業を、大小のタイルで1か所に詰める。
// お店の情報は shop-data.js の BOT_DATA から読む。APIもサーバーも使わない。
// 置き方：ページの出したい場所に <div id="today-box"></div> を書く。
// ためし方：URLの後ろに ?now=2026-10-13T21:00 を付けると、その日時として動く
(function () {
  const D = window.BOT_DATA;
  if (!D || !D.hours) return;
  const T = Object.assign({ accent: "#2b8caa", accentDark: "#22728b", accentSoft: "#dceef4", action: "#37b39a" }, D.theme || {});
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  // 店によって変わる言葉。歯医者なら term: { open: "診療", closed: "休診日", off: "休診" } と書く
  const TERM = Object.assign({ open: "営業", closed: "定休日", off: "休み" }, D.term || {});
  const q = new URLSearchParams(location.search).get("now");
  const now = () => (q ? new Date(q) : new Date());
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // その日の時間帯。昼休みがある店は hours.slots に2つ書く。曜日で違う日は hours.byDay に書く
  function slotsFor(d) {
    const H = D.hours;
    if (H.byDay && H.byDay[d.getDay()]) return H.byDay[d.getDay()];
    return H.slots || [{ open: H.open, close: H.close, last: H.last }];
  }
  const span = (ss) => ss.map((x) => x.open + "〜" + x.close).join("／");

  // その日が休みかどうか（毎週の休み／第◯◯曜日／日付で決めた休み）
  function closedReason(d) {
    const c = D.closed || {};
    const key = ymd(d);
    const sp = (c.dates || []).find((x) => key >= x.from && key <= x.to);
    if (sp) return TERM.closed + (sp.name ? "（" + sp.name + "）" : "");
    if ((c.weekly || []).includes(d.getDay())) return TERM.closed;
    const nth = Math.floor((d.getDate() - 1) / 7) + 1;
    if ((c.nth || []).some((x) => x.week === nth && x.day === d.getDay())) return TERM.closed;
    return null;
  }
  function nextOpen(from) {
    const d = new Date(from);
    for (let i = 0; i < 30; i++) {
      d.setDate(d.getDate() + 1);
      if (!closedReason(d)) return d;
    }
    return null;
  }
  function dayLabel(d, base) {
    const diff = Math.round((new Date(ymd(d)) - new Date(ymd(base))) / 86400000);
    const w = WD[d.getDay()] + "曜";
    return diff === 1 ? "明日（" + w + "）" : (d.getMonth() + 1) + "/" + d.getDate() + "（" + w + "）";
  }

  // いまの状態を、1つの形で返す（ボットからも使う）
  function status() {
    const n = now();
    const m = n.getHours() * 60 + n.getMinutes();
    const reason = closedReason(n);
    const next = nextOpen(n);
    const nextTxt = next ? "次は " + dayLabel(next, n) + " " + slotsFor(next)[0].open + " から" : "";
    if (reason) return { open: false, head: "本日は" + reason + "です", text: "本日は" + reason + "です。" + nextTxt + "。", sub: nextTxt };
    const ss = slotsFor(n);
    const cur = ss.find((x) => m >= toMin(x.open) && m < toMin(x.close));
    const later = ss.find((x) => m < toMin(x.open));
    const laterTxt = later ? "このあとは " + later.open + " から（" + later.close + " まで）" : nextTxt;
    if (cur) {
      const last = cur.last || cur.close;
      if (m >= toMin(last)) return { open: true, late: true, head: later ? "ただいまの受付は終了" : "本日の受付は終了", text: "ただいま" + TERM.open + "中ですが、受付（" + last + "）は終了しました。" + laterTxt + "。", sub: cur.close + " まで" + TERM.open + "中　／　" + laterTxt };
      return { open: true, head: "ただいま" + TERM.open + "中", text: "ただいま" + TERM.open + "中です（" + cur.close + " まで・最終受付 " + last + "）。", sub: cur.close + " まで（最終受付 " + last + "）" + (later ? "　／　このあとは " + later.open + " から" : "") };
    }
    if (later && later === ss[0]) return { open: false, head: "本日は " + later.open + " から", text: "本日は " + later.open + " から" + TERM.open + "します。", sub: "本日 " + span(ss) };
    if (later) return { open: false, head: "ただいま休憩時間です", text: "ただいま休憩時間です。" + later.open + " から再開します。", sub: later.open + " から再開（" + later.close + " まで）" };
    return { open: false, head: "本日の" + TERM.open + "は終了しました", text: "本日の" + TERM.open + "は終了しました。" + nextTxt + "。", sub: nextTxt };
  }
  window.SHOP_STATUS = status;

  const host = document.getElementById("today-box");
  if (!host) return;

  // 見た目。色はページの変数（--card など）があればそれを使い、なければ後ろの色になる
  const css = `
  .tb{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;font-family:inherit}
  .tb-t{background:var(--card,#fff);color:var(--ink,#2c2723);border:1px solid var(--line,#e3dacb);border-radius:22px;padding:22px;min-width:0;
    display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow,0 8px 30px rgba(0,0,0,.08));transition:transform .3s,box-shadow .3s}
  .tb-t:hover{transform:translateY(-3px)}
  .tb-k{font-size:11.5px;letter-spacing:.2em;font-weight:700;color:${T.accent}}
  .tb-status{grid-column:span 2;grid-row:span 2;background:var(--ink,#2c2723);color:var(--bg,#f6f2eb);border-color:transparent;padding:32px;justify-content:space-between;min-height:300px}
  .tb-status .tb-k{color:${T.action}}
  .tb-head{display:flex;align-items:center;gap:14px;font-family:var(--serif,serif);font-size:clamp(24px,3.2vw,34px);font-weight:600;line-height:1.4;letter-spacing:.04em}
  .tb-dot{width:14px;height:14px;border-radius:50%;flex:0 0 auto;background:#b9b2a6}
  .tb-dot.on{background:#3cc47c;animation:tbPulse 2s infinite}
  .tb-dot.late{background:#e0a52a}
  @keyframes tbPulse{0%{box-shadow:0 0 0 0 rgba(60,196,124,.6)}70%{box-shadow:0 0 0 14px rgba(60,196,124,0)}100%{box-shadow:0 0 0 0 rgba(60,196,124,0)}}
  .tb-sub{opacity:.78;font-size:15px;margin-top:6px}
  .tb-btns{display:flex;gap:10px;flex-wrap:wrap}
  .tb-btn{border-radius:999px;padding:12px 22px;font-weight:700;font-size:14px;border:1px solid color-mix(in srgb,currentColor 35%,transparent);color:inherit}
  .tb-btn.main{background:${T.action};border-color:${T.action};color:#fff}
  .tb-urgent{font-size:13px;font-weight:700;opacity:.9;text-decoration:underline;text-underline-offset:4px;color:inherit}
  .tb-slots{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
  .tb-slots li{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;font-size:13.5px;font-weight:700}
  .tb-slots li.cur{background:${T.accentSoft};color:#2c2723}
  .tb-slots small{font-weight:700;font-size:10.5px;color:${T.accentDark};margin-left:6px}
  .tb-mark{font-size:19px;line-height:1}
  .tb-note{font-size:11.5px;color:var(--ink-2,#7c7266);line-height:1.6}
  .tb-photo{grid-row:span 2;padding:0;overflow:hidden;position:relative;min-height:200px}
  .tb-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s}
  .tb-photo:hover img{transform:scale(1.05)}
  .tb-photo .cap{position:absolute;left:0;right:0;bottom:0;padding:44px 18px 16px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.72));font-size:13px;font-weight:700;line-height:1.6}
  .tb-photo .cap b{display:block;font-size:11px;letter-spacing:.2em;opacity:.85}
  .tb-notice{background:${T.accentSoft};color:#2c2723;border-color:transparent}
  .tb-notice p{margin:0;font-size:14px;font-weight:700;line-height:1.75}
  .tb-tall{grid-row:span 2}
  .tb-week{grid-column:1/-1}
  .tb-days{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
  .tb-day{border:1px solid var(--line,#e3dacb);border-radius:14px;padding:10px 2px;text-align:center;line-height:1.35}
  .tb-day b{display:block;font-family:var(--serif,serif);font-size:19px;font-weight:600}
  .tb-day span{font-size:11.5px;font-weight:700;color:var(--ink-2,#7c7266)}
  .tb-day i{display:block;font-style:normal;font-size:11px;font-weight:700;margin-top:3px;color:#1f9d6b}
  .tb-day.off{background:var(--card-2,#ece4d7);border-color:transparent}
  .tb-day.off b,.tb-day.off i{color:var(--ink-2,#7c7266)}
  .tb-day.today{border:2px solid ${T.accent}}
  @media(max-width:820px){
    .tb{grid-template-columns:repeat(2,1fr);gap:10px}
    .tb-t{padding:16px;border-radius:18px}
    .tb-status{grid-column:span 2;grid-row:auto;min-height:0;padding:24px;gap:22px}
    .tb-photo{grid-row:auto;min-height:190px}
    .tb-tall{grid-row:auto}
    .tb-notice{grid-column:span 2}
    .tb-days{gap:4px}
    .tb-day{border-radius:10px;padding:8px 0}
    .tb-day b{font-size:16px}
  }
  @media (prefers-reduced-motion:no-preference){
    .tb.tb-anim .tb-t{opacity:0;transform:translateY(18px) scale(.97)}
    .tb.tb-anim.tb-in .tb-t{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1),box-shadow .3s}
  }`;
  document.head.appendChild(el("style", null, css));

  const n = now();
  const s = status();
  const box = el("div", "tb");

  // ---- タイル1：いま営業中？（主役）。時間に合わせて、すすめるボタンが変わる ----
  const t1 = el("div", "tb-t tb-status");
  const top = el("div");
  top.appendChild(el("div", "tb-k", "TODAY　" + (n.getMonth() + 1) + "/" + n.getDate() + "（" + WD[n.getDay()] + "）"));
  const head = el("div", "tb-head");
  head.style.marginTop = "18px";
  head.appendChild(el("span", "tb-dot" + (s.open && !s.late ? " on" : s.late ? " late" : "")));
  head.appendChild(el("span", null, s.head));
  top.appendChild(head);
  if (s.sub) top.appendChild(el("div", "tb-sub", s.sub));
  t1.appendChild(top);
  const btns = el("div", "tb-btns");
  const mk = (label, href, main) => { const a = el("a", "tb-btn" + (main ? " main" : ""), label); a.href = href; return a; };
  if (s.open && !s.late) {
    btns.appendChild(mk("☎ 電話する", "tel:" + D.contact.tel.replace(/[^0-9]/g, ""), true));
    btns.appendChild(mk(D.contact.reserveLabel, D.contact.reserveUrl, false));
  } else {
    btns.appendChild(mk(D.contact.reserveLabel + "（24時間）", D.contact.reserveUrl, true));
  }
  t1.appendChild(btns);
  if (D.urgent && s.open) {
    const u = el("a", "tb-urgent", D.urgent.label + " ›");
    u.href = "tel:" + D.urgent.tel.replace(/[^0-9]/g, "");
    t1.appendChild(u);
  }
  box.appendChild(t1);

  // ---- タイル2：混み具合。今日が休みなら、次の営業日のぶんを出す ----
  const today = ymd(n);
  const notice = (D.notices || []).find((x) => today >= x.from && today <= x.to);
  const B = D.busy;
  if (B) {
    const t2 = el("div", "tb-t" + (notice ? "" : " tb-tall"));
    const isToday = !closedReason(n);
    const day = isToday ? n : nextOpen(n);
    const col = day ? B.cols.indexOf(WD[day.getDay()]) : -1;
    t2.appendChild(el("div", "tb-k", "CROWD"));
    t2.appendChild(el("div", null, (isToday ? "今日" : day ? dayLabel(day, n) : "") + "の混み具合")).style.cssText = "font-weight:700;font-size:15px";
    if (col >= 0) {
      const m = n.getHours() * 60 + n.getMinutes();
      const starts = B.rows.map((r) => { const h = r.name.match(/(\d{1,2}):(\d{2})/); return h ? +h[1] * 60 + +h[2] : -1; });
      let cur = -1;
      if (isToday && s.open) starts.forEach((st, i) => { if (st >= 0 && m >= st) cur = i; });
      const ul = el("ul", "tb-slots");
      B.rows.forEach((r, i) => {
        const c = r.cells[col];
        const li = el("li", i === cur ? "cur" : "");
        const name = el("span", null, r.name);
        if (i === cur) name.appendChild(el("small", null, "いま"));
        li.appendChild(name);
        const mark = el("span", "tb-mark", c);
        mark.style.color = c === "○" ? "#1f9d6b" : c === "△" ? "#c98a12" : c === "×" ? "#c0503c" : "#999";
        li.appendChild(mark);
        ul.appendChild(li);
      });
      t2.appendChild(ul);
    }
    t2.appendChild(el("div", "tb-note", B.legend + "\n※ " + B.note)).style.whiteSpace = "pre-line";
    box.appendChild(t2);
  }

  // ---- タイル3：写真と場所 ----
  if (D.photo) {
    const t3 = el("a", "tb-t tb-photo");
    t3.href = "#access";
    const img = el("img");
    img.src = D.photo;
    img.alt = D.shop + " の外観";
    t3.appendChild(img);
    const cap = el("div", "cap");
    cap.appendChild(el("b", null, "ACCESS"));
    cap.appendChild(document.createTextNode((D.place || "") + "　地図を見る ›"));
    t3.appendChild(cap);
    box.appendChild(t3);
  }

  // ---- タイル4：お知らせ（期間を過ぎたら、タイルごと出なくなる） ----
  if (notice) {
    const t4 = el("div", "tb-t tb-notice");
    t4.appendChild(el("div", "tb-k", "NEWS")).style.color = T.accentDark;
    t4.appendChild(el("p", null, notice.text));
    box.appendChild(t4);
  }

  // ---- タイル5：今日から1週間の営業 ----
  const t5 = el("div", "tb-t tb-week");
  t5.appendChild(el("div", "tb-k", "THIS WEEK"));
  const days = el("div", "tb-days");
  for (let i = 0; i < 7; i++) {
    const d = new Date(n);
    d.setDate(d.getDate() + i);
    const off = closedReason(d);
    const cell = el("div", "tb-day" + (off ? " off" : "") + (i === 0 ? " today" : ""));
    cell.appendChild(el("span", null, i === 0 ? "今日" : WD[d.getDay()]));
    cell.appendChild(el("b", null, String(d.getDate())));
    const by = D.hours.byDay && D.hours.byDay[d.getDay()];
    cell.appendChild(el("i", null, off ? TERM.off : by ? "〜" + by[by.length - 1].close : TERM.open));
    days.appendChild(cell);
  }
  t5.appendChild(days);
  const base = D.hours.slots || [{ open: D.hours.open, close: D.hours.close, last: D.hours.last }];
  const byNote = Object.keys(D.hours.byDay || {}).map((k) => { const x = D.hours.byDay[k]; return WD[k] + "曜は " + x[x.length - 1].close + " まで"; }).join("・");
  t5.appendChild(el("div", "tb-note", TERM.open + "日は " + span(base) + (base.length === 1 && base[0].last ? "（最終受付 " + base[0].last + "）" : "") + (byNote ? "（" + byNote + "）" : "")));
  box.appendChild(t5);

  host.appendChild(box);

  // 画面に入ったら、タイルが順番に出てくる
  if ("IntersectionObserver" in window) {
    box.classList.add("tb-anim");
    Array.from(box.children).forEach((t, i) => { t.style.transitionDelay = i * 90 + "ms"; });
    const io = new IntersectionObserver((ents) => {
      if (!ents.some((e) => e.isIntersecting)) return;
      box.classList.add("tb-in");
      io.disconnect();
      setTimeout(() => Array.from(box.children).forEach((t) => { t.style.transitionDelay = ""; }), 1400);
    }, { threshold: 0.05 });
    io.observe(box);
  }
})();

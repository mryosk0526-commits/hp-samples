// 運用版の共通部品。shop-data-*2.js の SHOP を読んで、ページの中身を組み立てる。
// お店ごとの HTML には「箱」だけを置き、中身はここで入れる。だから、更新は shop-data を直すだけで済む。
// ?now=2026-11-01T12:00 を付けると、その日時として表示を試せる（期間つきのキャンペーンやお知らせの確認用）。
window.U = (function () {
  const D = window.SHOP || {};
  const q = new URLSearchParams(location.search);
  const NOW = q.get("now") ? new Date(q.get("now")) : new Date();
  const WD = ["日", "月", "火", "水", "木", "金", "土"];

  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const TODAY = ymd(NOW);
  // from / to を書いたものは、その期間だけ出す。書いていなければ、いつでも出す
  const inPeriod = (x) => (!x.from || TODAY >= x.from) && (!x.to || TODAY <= x.to);

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  // 「\n」で改行する（文章は shop-data に \n で書く）
  function lines(e, text) {
    e.textContent = "";
    String(text || "").split("\n").forEach((t, i) => {
      if (i) e.appendChild(document.createElement("br"));
      e.appendChild(document.createTextNode(t));
    });
    return e;
  }
  const yen = (n) => Number(n).toLocaleString("ja-JP");
  const price = (it) => yen(it.price) + "円" + (it.from ? "〜" : "");
  const telHref = (t) => "tel:" + String(t).replace(/[^0-9]/g, "");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // 定休日の書き方（closed のルールから文章を作る。ルールと表示がずれない）
  function closedText(c) {
    c = c || {};
    const p = [];
    if (c.weekly && c.weekly.length) p.push("毎週" + c.weekly.map((d) => WD[d] + "曜").join("・"));
    (c.nth || []).forEach((x) => p.push("第" + x.week + WD[x.day] + "曜"));
    return p.length ? p.join("・") : "年中無休";
  }
  function hoursText(h) {
    if (!h) return "";
    return h.open + "〜" + h.close + (h.last ? "（最終受付 " + h.last + "）" : "");
  }

  // [data-s="tel"] のように書いた場所に、SHOP の値を入れる（ヘッダー・帯・フッターの電話や時間）
  const VALUES = {
    shop: () => D.shop,
    tel: () => D.contact.tel,
    hours: () => hoursText(D.hours),
    hoursShort: () => D.hours.open + "〜" + D.hours.close,
    closed: () => closedText(D.closed),
    address: () => D.access.address,
  };
  function bind() {
    $$("[data-s]").forEach((e) => { const f = VALUES[e.dataset.s]; if (f) e.textContent = f(); });
    $$("[data-tel]").forEach((e) => (e.href = telHref(D.contact.tel)));
    $$("[data-reserve]").forEach((e) => {
      e.href = D.contact.reserveUrl;
      if (/^https?:/.test(D.contact.reserveUrl)) { e.target = "_blank"; e.rel = "noopener"; }
    });
  }

  // お知らせ（新しい順に並べ、上から n 件）
  function news(box, n) {
    if (!box) return;
    const list = (D.news || []).filter(inPeriod).slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, n || 3);
    if (!list.length) { const sec = box.closest("section"); if (sec) sec.hidden = true; return; }
    list.forEach((x) => {
      const li = el("li");
      const d = new Date(x.date + "T00:00");
      li.appendChild(el("time", null, d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate()));
      li.lastChild.setAttribute("datetime", x.date);
      const tx = el("span", null, x.text);
      if (x.isNew !== false && (NOW - d) / 864e5 < 7) tx.prepend(el("em", "new", "NEW"));
      li.appendChild(tx);
      box.appendChild(li);
    });
  }

  // キャンペーン：期間内のものだけ。ひとつも無ければ、区切りごと隠す
  function campaigns() {
    return (D.campaigns || []).filter(inPeriod);
  }

  // よくある質問
  function faq(box, opts) {
    if (!box) return;
    (D.faq || []).forEach((x, i) => {
      const d = el("details");
      if (i === 0 && opts && opts.openFirst) d.open = true;
      const s = el("summary");
      if (opts && opts.qMark) s.appendChild(el("span", "q", "Q"));
      s.appendChild(document.createTextNode(x.q));
      if (opts && opts.plus) s.appendChild(el("span", "mk", "＋"));
      d.appendChild(s);
      d.appendChild(el(opts && opts.aTag || "div", "a", x.a));
      box.appendChild(d);
    });
  }

  // ギャラリー（押すと大きく表示）
  function gallery(box) {
    if (!box) return;
    (D.gallery || []).forEach((g) => {
      const b = el("button");
      b.type = "button";
      b.dataset.src = g.src;
      const im = el("img");
      im.src = g.src; im.alt = g.alt; im.loading = "lazy";
      b.appendChild(im);
      box.appendChild(b);
    });
  }

  // 店舗情報の表（店名・住所・電話・営業時間・定休日＋お店ごとの行）
  function info(box, extra) {
    if (!box) return;
    const A = D.access || {};
    const rows = [
      ["店名", D.shopFull || D.shop],
      ["住所", (A.zip ? A.zip + "\n" : "") + A.address],
      ["電話", D.contact.tel],
      ["営業時間", hoursText(D.hours) + (A.hoursNote ? "\n" + A.hoursNote : "")],
      ["定休日", closedText(D.closed)],
    ].concat(A.rows || []).concat(extra || []);
    rows.forEach((r) => {
      const row = el("div", "r");
      row.appendChild(el("div", "k", r[0]));
      const v = el("div", "v");
      if (r[1] instanceof Node) v.appendChild(r[1]); else lines(v, r[1]);
      row.appendChild(v);
      box.appendChild(row);
    });
  }
  function map(iframe) {
    if (!iframe || !D.access) return;
    iframe.src = "https://maps.google.com/maps?q=" + encodeURIComponent(D.access.mapQuery) + "&z=15&hl=ja&output=embed";
  }

  // 構造化データ（検索エンジン向けの店舗情報）。SHOP から作るので、表示とずれない
  function jsonLd(type) {
    const A = D.access || {};
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      .filter((_, i) => !((D.closed && D.closed.weekly) || []).includes(i));
    const close = String(D.hours.close).replace("翌", "");
    const data = {
      "@context": "https://schema.org",
      "@type": type,
      name: D.shopFull || D.shop,
      description: (document.querySelector('meta[name="description"]') || {}).content || "",
      url: location.href.split(/[?#]/)[0],
      telephone: D.contact.tel,
      address: { "@type": "PostalAddress", postalCode: (A.zip || "").replace("〒", ""), streetAddress: A.address, addressCountry: "JP" },
      openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: D.hours.open, closes: close }],
    };
    if (A.photo) data.image = [new URL(A.photo, location.href).href];
    const s = el("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // ボットの答えのうち、値段・時間・定休日は shop-data の本体から作る（直す場所を1か所にする）
  function autoAnswers() {
    (D.topics || []).forEach((t) => {
      if (t.auto === "hours") t.answer = hoursText(D.hours).replace("（", "です（").replace(/）$/, "）。");
      if (t.auto === "closed") t.answer = closedText(D.closed) + "がお休みです。";
      if (t.auto === "menu") {
        const picks = [];
        (D.menu || []).forEach((c) => c.items.forEach((it) => { if (it.pickup) picks.push(it.name + " " + price(it)); }));
        t.answer = picks.join("／") + "（すべて税込）です。";
      }
    });
  }

  // ヒーローの切り替え：shop-data の hero.style か、URL の ?hero= で決める。使わない方は消す
  function heroStyle() {
    const want = q.get("hero") || (D.hero && D.hero.style);
    const all = $$("[data-hero]");
    const pick = all.find((h) => h.dataset.hero === want) || all[0];
    all.forEach((h) => { if (h !== pick) h.remove(); });
    return pick ? pick.dataset.hero : null;
  }

  // ライトボックス（ギャラリーの写真を大きく）
  function lightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;
    const img = lb.querySelector("img");
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".gal button[data-src]");
      if (!b) return;
      img.src = b.dataset.src;
      img.alt = (b.querySelector("img") || {}).alt || "";
      lb.classList.add("on");
    });
    lb.addEventListener("click", () => { lb.classList.remove("on"); img.src = ""; });
  }

  // いま営業中か（ヒーローの小さな札に使う。くわしい表示は「今日の箱」が担当）
  function openNow() {
    const H = D.hours, n = NOW;
    const toMin = (s) => { const nx = String(s).indexOf("翌") === 0; const a = String(s).replace("翌", "").split(":"); return +a[0] * 60 + +a[1] + (nx ? 1440 : 0); };
    const off = (d) => ((D.closed && D.closed.weekly) || []).includes(d.getDay());
    const m = n.getHours() * 60 + n.getMinutes();
    const y = new Date(n); y.setDate(y.getDate() - 1);
    if (!off(y) && m + 1440 < toMin(H.close)) return true;   // 前の日の深夜営業の続き
    if (off(n)) return false;
    return m >= toMin(H.open) && m < toMin(H.close);
  }

  return { D, NOW, TODAY, WD, ymd, inPeriod, el, lines, yen, price, telHref, $, $$, closedText, hoursText,
    bind, news, campaigns, faq, gallery, info, map, jsonLd, autoAnswers, heroStyle, lightbox, openNow };
})();

// お店の情報（すし まる）。ページの「本日」「営業日カレンダー」「お知らせ」「お品書き」「店舗情報」は、全部ここを読む。
// 更新するときは、このファイルだけを直す。
// ※架空の店。住所・電話・料金・予定は、試作用の仮の値。
window.SHOP = {
  name: "すし まる",
  kana: "東京・千代田区／江戸前寿司",
  since: "創業 昭和二十七年",
  tel: "03-1234-5678",

  // つなぐ先。行き先は、いったん見本のページ。自分のお店のURLに替える
  links: {
    reserve: { label: "ネット予約（ホットペッパーグルメ）", href: "mihon.html?to=reserve" },
    takeout: { label: "お持ち帰りの予約", href: "mihon.html?to=takeout" },
    instagram: { label: "Instagram", href: "mihon.html?to=instagram" },
    map: { label: "地図アプリで開く", href: "https://www.google.com/maps/search/?api=1&query=%E7%9A%87%E5%B1%85" },
  },

  // 営業時間は2つ持つ（店内と、お持ち帰り）
  hours: {
    eatin: { label: "お召し上がり", slots: [["11:30", "14:00"], ["17:00", "21:30"]], note: "最終入店 21:00" },
    takeout: { label: "お持ち帰り", slots: [["11:00", "20:00"]], note: "14〜16時は品切れの場合あり" },
  },
  closedWeekdays: [0],                      // 0=日曜
  holidays: ["2026-10-12", "2026-11-03", "2026-11-23"],   // 祝日はお休み

  // 予定。休み・貸切は、ここに1行足すだけ。カレンダーと「本日」の両方に出る
  days: [
    { date: "2026-10-20", type: "closed", text: "臨時休業（研修のため）" },
    { date: "2026-10-24", type: "private", text: "夜は貸切（昼は通常どおり）" },
    { date: "2026-10-31", type: "short", text: "夜は20時まで" },
    { date: "2026-11-07", type: "private", text: "夜は貸切（昼は通常どおり）" },
  ],

  // お知らせ。新しいものを上に足す。古いものは消さなくてよい（3件まで表示）
  news: [
    { date: "2026-10-13", text: "10月20日(火)は、研修のため臨時休業いたします。" },
    { date: "2026-10-05", text: "「今月の一貫」を更新しました。今月は、鯵です。" },
    { date: "2026-09-28", text: "おせち2027のご予約を、店頭とお電話で承っています。" },
    { date: "2026-09-10", text: "お持ち帰りのちらしを始めました。" },
  ],

  // 本日のおすすめ。毎日ここだけ書き換える
  today: {
    date: "2026-10-13",
    items: [
      { name: "戻り鰹", from: "宮城・気仙沼", price: 500 },
      { name: "新いか", from: "千葉・富津", price: 450 },
      { name: "〆さば", from: "青森・八戸", price: 400 },
      { name: "秋刀魚の炙り", from: "北海道・根室", price: 450 },
    ],
    note: "仕入れにより、売り切れる場合がございます。",
  },

  // 今月の一貫。月に1回、書き換える
  monthly: {
    month: "十月",
    name: "鯵",
    photo: "img/sushi-aji.jpg",
    text: "光りものの中でも、鯵は別格です。脂ののった身を、塩と酢で軽く〆て、旨みを引き出します。おろし生姜と刻んだ葱をほんの少し。舌にのせると、なめらかにほどけます。",
  },

  // お持ち帰り
  takeoutInfo: {
    photo: "img/sushi-oke.jpg",
    lead: "握りたてに近い味を、ご家庭で。",
    text: "にぎりの折と、桶盛りをご用意しています。お集まりやお祝いの席に。前日までにご予約いただくと、お待たせせずにお渡しできます。",
    items: [
      { name: "にぎり折（一人前）", price: 2200, from: true },
      { name: "桶盛り（三〜四人前）", price: 8800, from: true },
      { name: "ちらし折", price: 1980 },
    ],
  },
  shopPhoto: "img/sushi-noren.jpg",

  // お品書きの抜粋（価格を変えるときは、ここをまとめて直す）
  menu: [
    { when: "昼", name: "ランチにぎり（数量限定）", price: 1650, from: true },
    { when: "昼", name: "ちらし", price: 1980, from: true },
    { when: "夜", name: "おまかせ「梅」 握り八貫・お椀付き", price: 4400 },
    { when: "夜", name: "おまかせ「竹」 握り十貫・お椀付き", price: 6600 },
    { when: "夜", name: "おまかせ「松」 旬の握り十二貫・お椀付き", price: 8800 },
    { when: "持ち帰り", name: "にぎり折（一人前）", price: 2200, from: true },
  ],
  menuNote: "表示は税込です。仕入れ・季節により内容が変わります。",

  pay: [
    { name: "現金", ok: true }, { name: "クレジットカード", ok: true },
    { name: "QR決済", ok: true }, { name: "交通系IC", ok: false },
  ],

  access: {
    zip: "〒100-0001",
    address: "東京都千代田区千代田1-1（デモ用の仮の住所）",
    stations: [
      "地下鉄千代田線 二重橋前駅 6番出口 徒歩3分",
      "JR 東京駅 丸の内中央口 徒歩8分",
    ],
    seats: "カウンター8席・お座敷2卓／全席禁煙",
    mapEmbed: "https://maps.google.com/maps?q=%E7%9A%87%E5%B1%85&z=15&hl=ja&output=embed",
  },
};

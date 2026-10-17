// 投稿カード用の実画面を撮る(Chrome headless / CDP)。実行: node source/shoot.js <出力フォルダ> [YYYY-MM-DD]
// 入力はすべて架空・一般的な文言。ページを実際にスクロールして撮る(右の下書きは画面に追従するため、見えたとおりの状態になる)
const fs = require('fs'), path = require('path');
const { launch } = require('./cdp');
const OUT = path.resolve(process.argv[2]); const DATE = process.argv[3] || '2026-10-17';
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await launch(9393);
  const setF = (id, t) => b.ev(`(()=>{const e=document.getElementById('f_${id}');e.value=${JSON.stringify(t)};e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  const click = id => b.ev(`document.getElementById('${id}').click()`);
  // Card1: デスクトップ1000px・DPR2・2カラム。骨組み「数字で始める→本文3行→問いで締める→タグ2個」(空行あり)に自分の言葉を入れた状態
  await b.open(PAGE, 1000, 900, 2, false);
  await click('skSample1'); await b.sleep(400);
  await setF('open', '見積書づくりで気づいた3つのこと'); await setF('b0', '最初は毎回ゼロから作っていた'); await setF('b1', '2回目に項目の並びを決めたら早くなった'); await setF('b2', '3回目は迷う時間が消えた');
  await setF('close', 'あなたはどこで手間取っていますか？'); await setF('tag', '#個人事業主 #見積'); await b.sleep(300);
  const top1 = await b.ev(`(()=>{const p=document.getElementById('fields').closest('.panel');return p.getBoundingClientRect().top+scrollY})()`);
  await b.ev(`window.scrollTo(0, ${top1 - 14})`); await b.sleep(400);
  const m1 = await b.ev(`(()=>({y:scrollY,h:innerHeight,out:document.querySelector('.a-out').getBoundingClientRect().top,fieldsTop:document.getElementById('fields').getBoundingClientRect().top}))()`);
  console.log('card1', JSON.stringify(m1));
  await b.shot(path.join(OUT, '01-desktop-fill-' + DATE + '.png'), { x: 0, y: m1.y, width: 1000, height: m1.h });
  // Card2: 375px・DPR2。骨組み「共感で始める→本文2行→ひとことで締める→タグ1個」。書き出し欄に型に合わない文を入れた状態
  await b.open(PAGE, 375, 900, 2, true);
  await click('skSample2'); await b.sleep(400);
  await setF('open', '副業を3ヶ月続けた話'); await setF('b0', '確定申告の時期はいつも憂鬱'); await setF('b1', '月末に10分だけ整理することにした'); await setF('close', 'ありがとう'); await setF('tag', '#フリーランス'); await b.sleep(300);
  const top2 = await b.ev(`(()=>{const p=document.getElementById('fields').closest('.panel');return p.getBoundingClientRect().top+scrollY})()`);
  await b.ev(`window.scrollTo(0, ${top2 - 8})`); await b.sleep(300);
  const m2 = await b.ev(`(()=>({y:scrollY,openBottom:document.getElementById('f_open').closest('.fld').getBoundingClientRect().bottom,b0Bottom:document.getElementById('f_b0').closest('.fld').getBoundingClientRect().bottom}))()`);
  console.log('card2', JSON.stringify(m2));
  await b.shot(path.join(OUT, '02-mobile375-mismatch-' + DATE + '.png'), { x: 0, y: m2.y, width: 375, height: 328 });
  b.close(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(2); });

// 実ブラウザ(Chrome headless / CDP)での検算。実行: node source/e2e.js
const path = require('path');
const { launch } = require('./cdp');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
let n = 0, f = 0;
const ok = (c, m) => { n++; if (!c) { f++; console.log('NG', m); } };
(async () => {
  const b = await launch(9391);
  const wait = () => b.sleep(320);
  const setF = (id, t) => b.ev(`(()=>{const e=document.getElementById('f_${id}');e.value=${JSON.stringify(t)};e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  const setSel = (id, v) => b.ev(`(()=>{const e=document.getElementById('${id}');if(e.type==='checkbox')e.checked=${JSON.stringify(v)};else e.value=${JSON.stringify(String(v))};e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  const info = () => b.ev(`(()=>({fields:Array.from(document.querySelectorAll('#fields textarea')).map(e=>e.id), vals:Array.from(document.querySelectorAll('#fields textarea')).map(e=>e.value), badges:Array.from(document.querySelectorAll('#fields .st')).map(e=>e.textContent), draft:document.getElementById('draft').value, resHidden:document.getElementById('result').hidden, emptyHidden:document.getElementById('emptyMsg').hidden, met:document.getElementById('met').textContent, skline:document.getElementById('skLine').textContent, skStatus:document.getElementById('skStatus').textContent, note:document.getElementById('skNote').hidden, sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, errs:window.__errs||0}))()`);
  await b.open(PAGE, 375, 800, 2, true);
  await b.ev(`window.__errs=0;window.addEventListener('error',()=>window.__errs++);true`);
  let i = await info();
  ok(i.fields.join() === 'f_open,f_b0,f_b1,f_b2,f_close,f_tag', 'E1 初期の欄 ' + i.fields.join());
  ok(i.resHidden && !i.emptyHidden, 'E1 空のときは下書きを出さない'); ok(i.skline === '数字で始める → 空行 → 本文3行 → 空行 → 問いで締める → タグ2個', 'E1 骨組みの表示 ' + i.skline);
  ok(i.badges.every(t => t === '未入力' || t === '型の指定なし'), 'E1 ラベル ' + i.badges.join());
  await setF('open', '見積書づくりで気づいた3つのこと'); await setF('b0', '本文A'); await setF('b1', '本文B'); await setF('b2', '本文C'); await setF('close', 'どこで手間取っていますか？'); await setF('tag', '#個人事業主 #見積'); await wait();
  i = await info();
  ok(i.draft === '見積書づくりで気づいた3つのこと\n\n本文A\n本文B\n本文C\n\nどこで手間取っていますか？\n#個人事業主 #見積', 'E2 下書き ' + JSON.stringify(i.draft));
  ok(i.badges[0] === '合っていそう' && i.badges[4] === '合っていそう' && i.badges[5] === '合っていそう' && i.badges[1] === '型の指定なし', 'E2 ラベル ' + i.badges.join());
  ok(/文字数/.test(i.met) && /ユニット数/.test(i.met) && /行数/.test(i.met), 'E2 数字が出る ' + i.met);
  // 選択を変えても入力済みの文が消えない
  await setSel('cBody', 2); await wait(); i = await info();
  ok(i.fields.join() === 'f_open,f_b0,f_b1,f_close,f_tag' && i.vals[0] === '見積書づくりで気づいた3つのこと' && i.vals[1] === '本文A' && i.vals[3] === 'どこで手間取っていますか？', 'E3 本文2行にしても入力が残る ' + i.vals.join('|'));
  await setSel('cBody', 4); await wait(); i = await info(); ok(i.vals[3] === '本文C' || i.vals[3] === '', 'E3 本文4行 ' + i.vals.join('|'));
  await setSel('cBody', 3); await setSel('cOpen', '共感'); await wait(); i = await info(); ok(i.badges[0] === '外れていそう' && i.vals[0].startsWith('見積書'), 'E3 型を変えるとラベルだけ変わる ' + i.badges[0]);
  // 骨組みを貼る
  await b.ev(`(()=>{const e=document.getElementById('skin');e.value='共感で始める → 本文2行 → ひとことで締める → タグ1個';e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`); await wait(); i = await info();
  ok(i.fields.join() === 'f_open,f_b0,f_b1,f_close,f_tag' && /読み取れました/.test(i.skStatus), 'E4 貼った骨組みで欄が出る ' + i.skStatus);
  ok(await b.ev(`document.getElementById('cOpen').value==='共感' && document.getElementById('cBlank').checked===false && document.getElementById('cTag').value==='1'`), 'E4 選択に反映');
  await b.ev(`(()=>{const e=document.getElementById('skin');e.value='ほげ';e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`); await wait(); i = await info();
  ok(/読み取れませんでした/.test(i.skStatus) && i.fields.length === 5, 'E4 読めない形は案内を出して欄は変えない ' + i.skStatus);
  await b.ev(`(()=>{const e=document.getElementById('skin');e.value='数字で始める → 1行だけ';e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`); await wait(); i = await info();
  ok(i.fields.join() === 'f_open' && !i.note, 'E4 選ぶ形で表せない骨組みは貼ったまま+説明 ' + i.fields.join() + i.note);
  await setSel('cTag', 1); await wait(); i = await info(); ok(i.note === true, 'E4 選択を変えると説明が消える');
  // ボタン
  await b.ev(`document.getElementById('skSample1').click()`); await wait(); i = await info(); ok(i.fields.length === 6 && i.note === false && /数字＋予告/.test(i.skline), 'E5 例1は2型のまま・貼ったとおりの欄 ' + i.skline); ok(await b.ev(`document.getElementById('cOpen').value==='数字' && document.getElementById('cBody').value==='3' && document.getElementById('cTag').value==='2'`), 'E5 選択は近い値');
  await b.ev(`document.getElementById('skSample2').click()`); await wait(); i = await info(); ok(i.fields.length === 5, 'E5 例2');
  // 異常系(XSS)
  await setF('open', '<img src=x onerror="window.__x=1"><script>window.__x=2<\/script> 3つ'); await wait();
  ok(await b.ev(`window.__x===undefined && document.querySelectorAll('#fields img, #fields script, #result img').length===0`), 'E6 HTMLとして解釈されない');
  ok((await b.ev(`document.getElementById('draft').value`)).includes('<img src=x'), 'E6 そのまま文字として出る');
  // 改行は欄の中で空白になる
  await setF('open', 'あ\nい'); await wait(); i = await info(); ok(i.vals[0] === 'あ\nい' && i.draft.startsWith('あ い'), 'E7 欄の中の改行は残り、下書きでは空白になる ' + JSON.stringify(i.vals[0]));
  // 句読点
  await setF('open', '一、二。三'); await wait(); await b.ev(`document.getElementById('punctBtn').click()`); await wait(); i = await info();
  ok(i.draft.startsWith('一二三') && await b.ev(`document.getElementById('punctBtn').getAttribute('aria-pressed')`) === 'true', 'E8 句読点を外す ' + i.draft);
  ok(i.vals[0] === '一、二。三', 'E8 欄の中身は変えない'); await b.ev(`document.getElementById('punctBtn').click()`); await wait(); i = await info(); ok(i.draft.startsWith('一、二。三'), 'E8 戻す');
  // 全部消すと下書きが消える
  for (const id of ['open','b0','b1','b2','close','tag']) { try { await setF(id, ''); } catch (e) { } } await wait(); i = await info(); ok(i.resHidden && !i.emptyHidden, 'E9 全部空で案内に戻る');
  // コピー
  await setF('open', '3つの話'); await wait();
  await b.ev(`(()=>{window.__copied=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__copied=t;return Promise.resolve()}},configurable:true});document.getElementById('copyBtn').click();return true})()`); await wait();
  ok(await b.ev(`window.__copied`) === '3つの話', 'E10 コピーは下書き全体'); ok(/コピーしました/.test(await b.ev(`document.getElementById('copyStatus').textContent`)), 'E10 状態表示');
  await b.ev(`(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('x'))},configurable:true});document.getElementById('copyBtn').click();return true})()`); await wait();
  ok(/長押し/.test(await b.ev(`document.getElementById('copyStatus').textContent`)), 'E10 権限が無いときの案内');
  // 横スクロール: 最大の欄数+長い1行
  await setSel('cBody', 6); await setSel('cTag', 3); await setSel('cBlank', true);
  const long = 'https://example.com/' + 'a'.repeat(120) + '😀'.repeat(30) + 'あ'.repeat(60);
  for (const id of ['open', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'close']) await setF(id, long);
  await setF('tag', '#' + 'あ'.repeat(40) + ' #b #c'); await wait(); i = await info();
  ok(i.sw <= i.cw, 'E11 375px 最大の欄数+長い行で横スクロールなし ' + i.sw + '/' + i.cw);
  ok(await b.ev(`Array.from(document.querySelectorAll('button,select,.chk')).every(e=>e.getBoundingClientRect().height>=43.5)`), 'E11 ボタン・選択の高さ44px以上');
  ok(i.errs === 0, 'E12 JSエラーなし');
  // 幅880以上は2カラム
  await b.open(PAGE, 1000, 1000, 1, false); const two = await b.ev(`(()=>{const a=document.querySelector('.a-in').getBoundingClientRect(),o=document.querySelector('.a-out').getBoundingClientRect();return o.left>a.left+100 && Math.abs(o.top-a.top)<40 && getComputedStyle(document.querySelector('.a-out')).position==='sticky'})()`); ok(two, 'E13 1000pxは2カラム・右はsticky');
  // ダーク
  await b.open(PAGE, 375, 800, 2, true, 'dark'); ok(await b.ev(`getComputedStyle(document.body).backgroundColor`) === 'rgb(23, 19, 31)', 'E14 ダークの背景');
  console.log(f === 0 ? '実ブラウザ検算: ' + n + '件すべて通過' : '実ブラウザ検算: ' + f + '/' + n + ' 件が不一致');
  b.close(); setTimeout(() => process.exit(f ? 1 : 0), 300);
})().catch(e => { console.error(e); process.exit(2); });

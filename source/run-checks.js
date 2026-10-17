// 骨組みの読み取り・欄の判定・下書き(index.html の <script id="core">)の検算。実行: node source/run-checks.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const load = (file) => { const html = fs.readFileSync(file, 'utf8'); const src = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1]; const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ';this.X=' + (/var PF\b/.test(src) ? 'PF' : 'PP') + ';', ctx); return { X: ctx.X, html }; };
const { X, html } = load(path.join(__dirname, '..', 'index.html'));
let n = 0, f = 0; const J = v => JSON.stringify(v);
const eq = (a, b, m) => { n++; if (J(a) !== J(b)) { f++; console.log('NG', m, J(a), '!=', J(b)); } };
const tr = (c, m) => eq(!!c, true, m);
const st = (slot, t) => X.judge(slot, t).state;
const OPEN = ty => ({ k: 'open', type: ty, id: 'open' }), CLOSE = ty => ({ k: 'close', type: ty, id: 'close' });

// S3 Day071 と同じ判定か(移植の差分なし)
const P = path.join('C:/Users/nanac/dev/post-pattern-x/index.html');
if (fs.existsSync(P)) {
  const old = load(P).X;
  const frag = ['3つのコツ', '4選', '50%オフの話', '３ヶ月続けた', '1,000円の話', '三つの理由', '10月15日に開催', '2026年の話', '2026/10/15の話', '10/15の話', '見て https://example.com/3つ',
    '本当ですか', '本当？', 'どう思う?', 'どう思いますか？😀', '今日は休みです', '正直しんどい', '実は悩んでいました', 'ぶっちゃけ難しい', '昨日、私は走った', '今日は休みました', '先月の話です', '昨日は晴れ',
    '方法をまとめました', '理由は2つ', '選んだ', 'こんにちは', 'ありがとう', '最後に試してみてください', 'どうですか？', 'あ'.repeat(21), 'あ'.repeat(20), '詳細はこちら👇', '詳しくは https://x.example/a', 'ご確認ください',
    '3つの話 #a #b', 'お疲れ様でした', 'コツコツ続ける', 'ポイント還元', '5分で終わる', '3ヶ月で気づいた4つのこと', '毎月25日に締める', '2年前の話', '今朝、僕は起きた'];
  let cnt = 0;
  frag.forEach(a => { eq(X.hooksOf(a), old.analyze(a).hooks, 'S3 書き出し判定が071と一致 ' + a.slice(0, 14)); eq(X.closeTypeOf(a), old.analyze('導入\n' + a).closeType === '決められない' ? '決められない' : old.analyze('導入\n' + a).closeType, 'S3 締め判定が071と一致 ' + a.slice(0, 14)); cnt += 2; });
  frag.forEach(a => frag.slice(0, 12).forEach(b => { const t = a + b; eq(X.hooksOf(t), old.analyze(t).hooks, 'S3 組み合わせ ' + t.slice(0, 16)); cnt++; }));
  console.log('Day071との照合', cnt);
} else console.log('Day071のリポジトリが無いため照合を省略');
const h = X.hooksOf;
tr(h('3つのコツ').includes('数字'), 'S3 3つ'); tr(h('4選').includes('数字'), 'S3 4選'); tr(h('50%オフ').includes('数字'), 'S3 50%');
tr(!h('10月15日に開催').includes('数字'), 'S3 日付は数字でない'); tr(!h('2026年の話').includes('数字'), 'S3 4桁の年は数字でない');

// S1 骨組みの読み取り
const sk1 = '数字＋予告で始める → 空行 → 本文3行 → 空行 → 問いで締める → タグ2個';
const p1 = X.parseSkeleton(sk1); tr(p1.ok, 'S1 例1が読める');
eq(p1.slots[0].type2, '予告', 'S1 2つ目の型を捨てない'); eq(X.toControls(p1.slots), null, 'S1 2型は選ぶ形で表せない(貼ったまま)');
eq(X.approxControls(p1.slots), { open: '数字', body: 3, blank: true, close: '問いかけ', tag: 2 }, 'S1 近い選択値');
eq(X.skeletonText(p1.slots), sk1, 'S1 骨組みの再表示(2型つき)');
eq(st(p1.slots[0], '手順をまとめました'), 'ok', '判定 2型のうち2つ目に合えばok'); eq(st(p1.slots[0], '3つの話'), 'ok', '判定 2型のうち1つ目に合えばok'); eq(st(p1.slots[0], 'こんにちは'), 'unk', '判定 2型どちらでもない');
eq(X.parseSkeleton('「数字で始める → 本文2行 → 問いで締める」。').ok, true, 'S1 前後の「」と。を許す');
eq(X.toControls(X.parseSkeleton('数字で始める → 本文３行 → 問いで締める → タグ２個').slots), { open: '数字', body: 3, blank: false, close: '問いかけ', tag: 2 }, 'S1 全角数字を読む');
eq(X.parseSkeleton('数字で始める → 本文30行 → 問いで締める').ok, true, 'S1 本文30行も読める'); eq(X.parseSkeleton('数字で始める → 本文0行 → 問いで締める').reason, '本文の行数は1行以上です', 'S1 本文0行の案内');
eq(X.parseSkeleton('数字で始める → 空行 → 本文3行 → 空行 → 問いで締める → タグ2つ').ok, true, 'S1 タグ2つも読める');
eq(X.parseSkeleton('共感で始める → 本文2行 → ひとことで締める → タグ1個').ok, true, 'S1 例2');
// 全パターン: 選択値→欄→骨組みの1行→読み取り→選択値が元に戻る
let rt = 0;
X.OPENS.forEach(o => { for (let b = 0; b <= 6; b++) [false, true].forEach(bl => X.CLOSES.forEach(c => { for (let t = 0; t <= 3; t++) {
  const c0 = { open: o, body: b, blank: bl, close: c, tag: t }, slots = X.fromControls(c0), line = X.skeletonText(slots);
  const r = X.parseSkeleton(line); rt++;
  if (!r.ok) { n++; f++; console.log('NG S1 全パターンが読めない', line); return; }
  eq(X.toControls(r.slots), c0, 'S1 全パターン往復 ' + line);
} })); });
console.log('往復', rt);
// Day071が実際に出す形(1行だけ・同じ行で締め・リンク・決められない・先頭8000字)
tr(X.parseSkeleton('数字で始める → 1行だけ').ok, 'S1 1行だけ'); eq(X.toControls(X.parseSkeleton('数字で始める → 1行だけ').slots), null, 'S1 1行だけは選ぶ形で表せない→貼ったまま');
const same = X.parseSkeleton('問いかけで始める（同じ行で問いで締める） → タグ1個'); tr(same.ok, 'S1 同じ行で締める'); eq(same.slots[0].sameClose, '問いかけ', 'S1 同じ行の締め型');
tr(X.parseSkeleton('書き出しの型は決められない → 本文2行 → 締めの型は決められない').ok, 'S1 決められない系');
tr(X.parseSkeleton('数字で始める → 本文2行 → リンク1件 → 問いで締める').ok, 'S1 リンク');
tr(X.parseSkeleton('数字で始める → 本文2行 → 問いで締める → 先頭8000字まで').ok, 'S1 先頭8000字まで');
['', '   ', 'こんにちは', '本文3行', '数字で始める → ほげ', '数字で始める → 問いで締める → 問いで締める', '数字で始める → 本文41行', '数字で始める → タグ21個', 'x'.repeat(401), '<script>alert(1)</script>'].forEach(t => eq(X.parseSkeleton(t).ok, false, 'S1 読めない形: ' + t.slice(0, 20)));
eq(X.parseSkeleton(null).ok, false, 'S1 null'); eq(X.parseSkeleton(undefined).ok, false, 'S1 undefined');

// S2 欄の生成
const cnt = (c) => X.fromControls(c).filter(s => s.k !== 'blank').length;
eq(cnt({ open: '数字', body: 0, blank: false, close: '問いかけ', tag: 0 }), 2, 'S2 本文0・タグ0');
eq(cnt({ open: '数字', body: 6, blank: true, close: '問いかけ', tag: 3 }), 9, 'S2 本文6・タグ3');
eq(X.fromControls({ open: '数字', body: 0, blank: true, close: '問いかけ', tag: 0 }).map(s => s.k), ['open', 'blank', 'close'], 'S2 本文0で空行は1つ');
eq(X.fromControls({ open: '数字', body: 2, blank: true, close: '問いかけ', tag: 1 }).map(s => s.k), ['open', 'blank', 'body', 'body', 'blank', 'close', 'tag'], 'S2 順序');
eq(X.fromControls({ open: '数字', body: 2, blank: false, close: '問いかけ', tag: 1 }).map(s => s.k), ['open', 'body', 'body', 'close', 'tag'], 'S2 空行なし');
tr(new Set(X.fromControls({ open: '数字', body: 6, blank: true, close: '問いかけ', tag: 3 }).map(s => s.id)).size === 11, 'S2 idが重ならない');

// S3 欄の判定
eq(st(OPEN('数字'), '見積書づくりで気づいた3つのこと'), 'ok', '判定 数字ok'); eq(st(OPEN('数字'), '今日は休みました'), 'ng', '判定 数字→体験はng'); eq(st(OPEN('数字'), 'こんにちは'), 'unk', '判定 どれでもない');
eq(st(OPEN('数字'), ''), 'empty', '判定 空'); eq(st(OPEN('数字'), '   '), 'empty', '判定 空白'); eq(st(OPEN('指定なし'), 'なんでも'), 'free', '判定 指定なし');
eq(st(OPEN('共感'), '副業を3ヶ月続けた話'), 'ng', '判定 共感に数字はng'); eq(st(OPEN('共感'), '正直しんどい'), 'ok', '判定 共感ok');
eq(st(CLOSE('問いかけ'), 'どこで止まっていますか？'), 'ok', '判定 締め問いok'); eq(st(CLOSE('ひとこと'), 'ありがとう'), 'ok', '判定 ひとことok');
eq(st(CLOSE('ひとこと'), 'どうですか？'), 'ng', '判定 ひとこと→問いはng'); eq(st(CLOSE('問いかけ'), 'あ'.repeat(25)), 'unk', '判定 締め決められない');
eq(st(CLOSE('呼びかけ'), '試してみてください'), 'ok', '判定 呼びかけ'); eq(st(CLOSE('リンク誘導'), '詳細はこちら👇'), 'ok', '判定 リンク誘導');
eq(st({ k: 'tag', n: 2, id: 'tag' }, '#a #b'), 'ok', '判定 タグok'); eq(st({ k: 'tag', n: 2, id: 'tag' }, 'a b'), 'ng', '判定 #なし');
eq(st({ k: 'tag', n: 2, id: 'tag' }, '#a'), 'unk', '判定 個数違いは決められない'); eq(st({ k: 'tag', n: 1, id: 'tag' }, '#a #b'), 'unk', '判定 個数違い2'); eq(st({ k: 'tag', n: 2, id: 'tag' }, '＃a  #b'), 'ok', '判定 全角＃・連続空白');
eq(st({ k: 'link', id: 'l0' }, 'https://x.example/a'), 'ok', '判定 リンクok'); eq(st({ k: 'link', id: 'l0' }, 'あいう'), 'ng', '判定 リンクなし');
eq(st({ k: 'body', n: 1, id: 'b0' }, 'なにか'), 'free', '判定 本文は指定なし');
eq(X.judge(OPEN('数字'), 'こんにちは').label, '決められない', '判定 ラベル文字'); eq(X.judge(OPEN('数字'), '3つ').label, '合っていそう', '判定 ラベル文字ok'); eq(X.judge(OPEN('数字'), '今日は休みました').label, '外れていそう', '判定 ラベル文字ng');
const sc = { k: 'open', type: '問いかけ', sameClose: '問いかけ', id: 'open' };
eq(st(sc, 'どうですか？'), 'ok', '判定 同じ行で締め ok');
eq(X.judge({ k: 'open', type: '指定なし', sameClose: '問いかけ', id: 'open' }, 'どうすればいいですか？').msg, '', '判定 型の指定なし+同じ行で締めok のとき余計な文言を出さない');
eq(X.fieldHint({ k: 'open', type: '数字', type2: '予告' }).split('判定は').length - 1, 1, 'ヒント 2型で「判定は」が1回'); eq(st({ k: 'open', type: '数字', sameClose: '問いかけ', id: 'open' }, '3つの話'), 'ng', '判定 同じ行で締め ng');

// S4 下書きの組み立て
const sl = X.fromControls({ open: '数字', body: 2, blank: true, close: '問いかけ', tag: 2 });
const V = { open: '書き出し', b0: '本文A', b1: '本文B', close: '締め', tag: '#x  #y' };
eq(X.buildDraft(sl, V, false), '書き出し\n\n本文A\n本文B\n\n締め\n#x #y', 'S4 空行の位置');
eq(X.buildDraft(sl, { open: 'A', close: 'C' }, false), 'A\n\nC', 'S4 本文が空なら空行は1つに詰まる');
eq(X.buildDraft(sl, { b0: 'x' }, false), 'x', 'S4 前後の空行は出さない');
eq(X.buildDraft(sl, {}, false), '', 'S4 全部空'); eq(X.buildDraft(sl, { open: '  ', b0: '\n' }, false), '', 'S4 空白だけは空扱い');
eq(X.buildDraft(sl, { open: '改行\nあり', close: 'C' }, false), '改行 あり\n\nC', 'S4 欄の中の改行は空白にする');
eq(X.buildDraft(X.fromControls({ open: '数字', body: 1, blank: false, close: '問いかけ', tag: 0 }), { open: 'A', b0: 'B', close: 'C' }, false), 'A\nB\nC', 'S4 空行なし');
eq(X.buildDraft(sl, { open: 'A', close: 'C' }, false), X.buildDraft(sl, { open: 'A', close: 'C' }, false), 'S4 決定的');
['undefined', 'null', 'NaN', '{', '}'].forEach(w => tr(!X.buildDraft(sl, V, false).includes(w), 'S4 出力に ' + w + ' が出ない'));

// S5 ユニット数・文字数(Pythonの east_asian_width と一致)
const corpusPath = path.join(__dirname, 'corpus.json');
if (fs.existsSync(corpusPath)) { const corp = JSON.parse(fs.readFileSync(corpusPath, 'utf8')); corp.forEach((c, i) => eq(X.units(c.s), c.u, 'S5 Python一致 #' + i + ' ' + c.s.slice(0, 12))); console.log('corpus', corp.length); }
eq(X.metrics('あ\nb'), { chars: 3, units: 4, lines: 2 }, 'S5 metrics'); eq(X.metrics(''), { chars: 0, units: 0, lines: 0 }, 'S5 metrics 空');
eq(X.metrics('😀'), { chars: 1, units: 2, lines: 1 }, 'S5 絵文字');
const big = Array.from({ length: 20 }, () => 'あ'.repeat(30)).join('\n'); eq(X.metrics(big).units, 1200 + 19, 'S5 280超でも数字だけ(警告なし)');

// S6 句読点切替
eq(X.buildDraft(sl, { open: '一、二。三', close: 'C。' }, true), '一二三\n\nC', 'S6 句読点を外す');
eq(X.buildDraft(sl, { open: '一、二。三', close: 'C。' }, false), '一、二。三\n\nC。', 'S6 戻す');
eq(X.buildDraft(sl, { open: '一、二。三\u0021', close: 'C' }, true).split('\n').length, X.buildDraft(sl, { open: '一、二。三\u0021', close: 'C' }, false).split('\n').length, 'S6 行数が変わらない');
eq(X.buildDraft(sl, { open: '，．？' }, true), '，．？', 'S6 読点・句点以外は触らない');

// S7 異常系
['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '😀'.repeat(3000), 'あ'.repeat(5000), '\n\n\n', '#'.repeat(5000)].forEach(t => {
  const r = X.buildDraft(sl, { open: t, b0: t, close: t, tag: t }, false); tr(typeof r === 'string', 'S7 壊れない ' + t.slice(0, 10));
  ['open', 'close'].forEach(k => X.judge(sl.find(s => s.id === k), t)); X.judge({ k: 'tag', n: 2, id: 'tag' }, t); X.judge({ k: 'link', id: 'l0' }, t);
});

// S9 保存系・外部送信が無い(index.html全体をgrep)
['localStorage', 'sessionStorage', 'indexedDB', 'download', 'navigator.share', 'fetch(', 'XMLHttpRequest', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'href="#"'].forEach(w => tr(!html.includes(w), 'S9 ' + w + ' を使っていない'));
['forms.gle', 'lin.ee', 'bit.ly'].forEach(w => tr(!html.includes(w), 'S9 短縮URLなし ' + w));
tr(html.includes('mw-footer') && html.includes('みちAIワークス'), 'S9 素性表記フッタ'); tr(html.includes('navigator.clipboard.writeText'), 'S9 コピーはclipboardのみ');
// ヒントは命令形でなく「判定の手がかり」の説明(言い回しの提案に見えない)
['共感', '体験', '予告'].forEach(k => tr(!/入れます|終えます/.test(X.fieldHint({ k: 'open', type: k })), 'ヒントが命令形でない(書き出し ' + k + ')'));
['呼びかけ', 'リンク誘導', 'ひとこと'].forEach(k => tr(!/入れます|終えます/.test(X.fieldHint({ k: 'close', type: k })), 'ヒントが命令形でない(締め ' + k + ')'));
['共感', '体験', '予告', '数字'].forEach(k => tr(!/「/.test(X.fieldHint({ k: 'open', type: k })), '書き出しのヒントに判定語の一覧が無い ' + k)); ['呼びかけ', 'リンク誘導', 'ひとこと'].forEach(k => tr(!/「/.test(X.fieldHint({ k: 'close', type: k })), '締めのヒントに判定語の一覧が無い ' + k));
eq(X.fieldTitle(p1.slots[0]), '書き出し（数字＋予告）', '欄の見出し(2型)');
// 禁止語(画面)
['バズ', '刺さ', '伸びる', '神', '正解', '診断', '分析', '完璧', '安心', '勝てる'].forEach(w => tr(!html.replace(/<script id="core">[\s\S]*?<\/script>/, '').includes(w) && !html.match(/<script id="core">([\s\S]*?)<\/script>/)[1].includes(w), '禁止語 ' + w + ' が無い'));
tr(html.includes('型と反応の関係は分かっていません'), '常設表示 型と反応の関係は分かっていません');
// 例文が無い(ヒントのカギ括弧は判定語の説明だけ)
tr(!/例:|例）|例文/.test(html.replace('骨組みの例', '')), '例文の表示が無い');

// コントラスト(配色の実測)
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const pairs = [['#ffffff', '#6F4BB0'], ['#f6f4fa', '#6F4BB0'], ['#6F4BB0', '#ffffff'], ['#e1f2e5', '#1d5a2c'], ['#fff0c2', '#4d3200'], ['#fbe3e6', '#8c1d2f'], ['#efedf3', '#1f1a2b'], ['#f6f4fa', '#5a5070'], ['#ffffff', '#3f3752'],
  ['#221c2e', '#BBA6EE'], ['#17131f', '#BBA6EE'], ['#BBA6EE', '#1c1233'], ['#1d3a27', '#9be0ad'], ['#4a3a0c', '#ffe9b0'], ['#4d1f27', '#ffb4bf'], ['#2d2640', '#f1ecfa'], ['#17131f', '#b0a4c8'], ['#3a2f55', '#f1ecfa']];
let minCr = 99; pairs.forEach(p => { const c = cr(p[0], p[1]); minCr = Math.min(minCr, c); tr(c >= 4.5, 'コントラスト ' + p.join(' / ') + ' = ' + c.toFixed(2)); });
console.log('最小コントラスト', minCr.toFixed(2));
console.log(f === 0 ? '検算: ' + n + '件すべて通過' : '検算: ' + f + '/' + n + ' 件が不一致');
process.exit(f ? 1 : 0);

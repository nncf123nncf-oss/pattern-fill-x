// 画面の目視確認用(scratchpadへ撮る)。node source/peek.js <出力フォルダ>
const path = require('path'), fs = require('fs'); const { launch } = require('./cdp');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'); const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await launch(9392);
  const set = (id, t) => b.ev(`(()=>{const e=document.getElementById('f_${id}');e.value=${JSON.stringify(t)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await b.open(PAGE, 1000, 1300, 1, false);
  await set('open', '見積書づくりで気づいた3つのこと'); await set('b0', '最初は毎回ゼロから作っていた'); await set('b1', '2回目から型を決めたら早くなった'); await set('b2', '3回目は迷う時間が消えた'); await set('close', 'あなたはどこで手間取っていますか？'); await set('tag', '#個人事業主 #見積'); await b.sleep(300);
  await b.shot(path.join(OUT, 'd.png'), { x: 0, y: 0, width: 1000, height: await b.ev('document.documentElement.scrollHeight') });
  await b.open(PAGE, 375, 900, 2, true, 'dark'); await b.ev(`document.getElementById('skSample2').click()`); await set('open', '副業を3ヶ月続けた話'); await set('close', 'ありがとう'); await b.sleep(300);
  await b.shot(path.join(OUT, 'm.png'), { x: 0, y: 0, width: 375, height: await b.ev('document.documentElement.scrollHeight') });
  b.close(); setTimeout(() => process.exit(0), 300); })();

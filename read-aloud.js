// 朗讀功能：在文字比較多的區塊標題旁加上「🔊 聽」按鈕，按一下就念出來，再按一下停止。
(function () {
  if (!('speechSynthesis' in window)) return; // 瀏覽器不支援就不顯示按鈕

  // 哪些區塊要加朗讀按鈕：[區塊, 放按鈕的標題]
  var TARGETS = [
    ['.hero', 'h1'],
    ['.info-box', 'h2'],
    ['.entry', 'h3'],
    ['.steps li', 'h3'],
    ['.food-card', 'h3'],
    ['.ff-demo', 'h2'],
    ['.conclusion', 'h2']
  ];

  var synth = window.speechSynthesis;
  var current = null; // 正在朗讀的區塊

  function pickVoice() {
    var voices = synth.getVoices();
    var order = ['zh-TW', 'zh-HK', 'zh-CN', 'zh'];
    for (var i = 0; i < order.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].lang.replace('_', '-').indexOf(order[i]) === 0) return voices[j];
      }
    }
    return null;
  }

  // 去掉表情符號，避免念出奇怪的英文名稱
  function cleanText(text) {
    return text
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{2190}-\u{21FF}\u{23E9}-\u{23FF}]/gu, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  // 切成短句一句一句念（太長的句子有些瀏覽器會念到一半停掉）
  function splitSentences(text) {
    return text
      .split(/(?<=[。！？!?；])|\n+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.replace(/[\s，。、！？：「」（）｜|]/g, '').length > 0; });
  }

  function stop() {
    synth.cancel();
    if (current) {
      current.block.classList.remove('tts-reading');
      current.btn.classList.remove('playing');
      current.btn.textContent = '🔊 聽';
      current = null;
    }
  }

  function read(block, btn) {
    var wasThis = current && current.block === block;
    stop();
    if (wasThis) return; // 再按一次 = 停止

    var text = cleanText(block.innerText.replace(/🔊 聽|⏹ 停/g, ''));
    var parts = splitSentences(text);
    if (!parts.length) return;

    current = { block: block, btn: btn };
    block.classList.add('tts-reading');
    btn.classList.add('playing');
    btn.textContent = '⏹ 停';

    var voice = pickVoice();
    var me = current;
    parts.forEach(function (part, i) {
      var u = new SpeechSynthesisUtterance(part);
      u.lang = voice ? voice.lang : 'zh-TW';
      if (voice) u.voice = voice;
      u.rate = 0.9; // 念慢一點
      if (i === parts.length - 1) {
        u.onend = function () { if (current === me) stop(); };
      }
      synth.speak(u);
    });
  }

  function addButtons() {
    TARGETS.forEach(function (t) {
      document.querySelectorAll(t[0]).forEach(function (block) {
        if (block.querySelector('.tts-btn')) return;
        var heading = block.querySelector(t[1]);
        if (!heading) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tts-btn';
        btn.textContent = '🔊 聽';
        btn.setAttribute('aria-label', '朗讀這一段');
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          read(block, btn);
        });
        heading.appendChild(btn);
      });
    });
  }

  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () {};
  window.addEventListener('pagehide', stop);
  addButtons();
})();

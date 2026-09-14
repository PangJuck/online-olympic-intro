/*!
 * torch-intro.js — 2D 도트 성화 봉송 인트로 (초등학생 온라인 운동회용)
 * 의존성 없음. 파일 하나만 넣고 TorchIntro.play() 를 부르면 된다.
 *
 *   <script src="torch-intro.js"></script>
 *   TorchIntro.play({ onDone: () => startApp() });
 *
 * 옵션은 아래 DEFAULTS 참고. 자세한 설명은 이식-안내.md
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    title: '온라인 미니 올림픽',
    sub: '어디에 있든 우리는 같은 운동장',
    tag: '',            // 셋째 줄. 비워 두면 안 뜬다
    endLabel: '우리들의 올림픽! 시작',   // 마지막 화면 버튼. '' 로 두면 저절로 닫힌다
    speed: 100,         // 주자 속도(px/s). 낮추면 인트로가 길어진다
    sound: true,        // 8비트 효과음 (클릭 핸들러 안에서 play 해야 소리가 난다)
    skipButton: true,   // 건너뛰기 버튼
    clickToSkip: true,  // 아무 데나 눌러도 건너뛰기
    once: false,        // true 면 이 브라우저에서 한 번만 재생
    storageKey: 'torchIntroSeen',
    loadFonts: true,    // Black Han Sans / Noto Sans KR 를 알아서 불러온다
    mount: null,        // null 이면 화면 전체. 엘리먼트를 주면 그 안에 채운다
    zIndex: 99999,
    onDone: null        // 끝났을 때(건너뛰기 포함) 호출
  };

  /* ── 도트 스프라이트 : 초등학생 16x16 ───────────────────────── */
  var UPPER_GIRL = [
    '....hhhhhh......',
    '...hhhhhhhh.....',
    '..hhhsssssh.....',
    '..hhhsesseh.....',
    '....hsssssh.....',
    '.....sssss...s..',
    '.......ss...ss..',
    '....jjjjjj.s....',
    '....jjjjjjs.....',
    '....jwwwwj......',
    '....jjjjjj......',
    '....pppppp......'
  ];
  var UPPER_BOY = [
    '....hhhhhh......',
    '...hhhhhhhh.....',
    '...hssssssh.....',
    '...hsessesh.....',
    '....ssssss......',
    '....ssssss...s..',
    '.......ss...ss..',
    '....jjjjjj.s....',
    '....jjjjjjs.....',
    '....jwwwwj......',
    '....jjjjjj......',
    '....pppppp......'
  ];
  var LEGS = [
    ['....pp..pp......', '...pp....pp.....', '...pp.....pp....', '..ooo.....ooo...'],
    ['.....pppp.......', '.....pp.pp......', '.....pp..pp.....', '....ooo..ooo....'],
    ['...pp..pp.......', '..pp....pp......', '..pp.....pp.....', '.ooo.....ooo....'],
    ['....pppp........', '...pp.pp........', '..pp...pp.......', '..ooo..ooo......']
  ];
  var LEGS_STAND = ['....pppp........', '....pppp........', '....pp.pp.......', '...ooo..ooo.....'];
  var HAND = { x: 13, y: 5 };

  var PAL_GIRL = { h: '#6b4226', s: '#f6cba4', e: '#221c18', j: '#f7f3ea', w: '#ffc145', p: '#2f4bd4', o: '#ffffff' };
  var PAL_BOY  = { h: '#2b1d14', s: '#f2c49b', e: '#221c18', j: '#5ec9f0', w: '#f7f3ea', p: '#274a9e', o: '#ffffff' };

  var FIRE = ['#fff8d8', '#ffd76a', '#ffa42a', '#f4581e', '#c9230c'];
  var CROWD = ['#3a4a68', '#44567a', '#34445f', '#4b5d84'];
  var LITC = ['#ffc145', '#ffe6a8', '#ffd76a', '#fff3cf'];

  var W = 192, H = 108;
  var GY = 98;         // 땅(주자 발끝)
  var CX = 520;        // 성화대 월드 좌표
  var RIM_LOW = 76;    // 불붙일 때 사발 높이 (아이 손이 닿는 자리)
  var RIM_HIGH = 34;   // 다 솟았을 때 사발 높이
  var RISE_SEC = 1.8;  // 성화대가 올라가는 시간

  function injectFonts() {
    if (document.getElementById('ti-fonts')) return;
    if (document.querySelector('link[href*="Black+Han+Sans"]')) return;
    var l = document.createElement('link');
    l.id = 'ti-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@500;700&display=swap';
    document.head.appendChild(l);
  }

  function injectCss(zIndex) {
    if (document.getElementById('ti-css')) return;
    var s = document.createElement('style');
    s.id = 'ti-css';
    s.textContent =
      '.ti-ov{position:fixed;inset:0;z-index:' + zIndex + ';background:#0f1b2d;display:flex;' +
      'align-items:center;justify-content:center;opacity:1;transition:opacity .55s ease}' +
      '.ti-ov.ti-in-box{position:absolute}' +
      '.ti-ov.ti-out{opacity:0;pointer-events:none}' +
      '.ti-stage{position:relative;width:min(100%,calc(100vh * 16 / 9));max-height:100%;' +
      'aspect-ratio:16/9;display:block}' +
      '.ti-stage canvas{width:100%;height:100%;display:block;image-rendering:pixelated}' +
      '.ti-go{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);' +
      'font-family:"Black Han Sans","Noto Sans KR",sans-serif;font-size:clamp(15px,2.6vw,26px);' +
      'color:#20160a;background:#ffc145;border:0;border-radius:8px;padding:.55em 1.5em;' +
      'cursor:pointer;letter-spacing:.02em;white-space:nowrap;' +
      'box-shadow:0 6px 26px rgba(255,193,69,.42);opacity:0;transition:opacity .5s ease;' +
      'animation:ti-pulse 1.8s ease-in-out infinite}' +
      '.ti-go.ti-show{opacity:1}' +
      '.ti-go:hover{background:#ffd177}' +
      '.ti-go:focus-visible{outline:3px solid #e9eef7;outline-offset:3px}' +
      '@keyframes ti-pulse{0%,100%{transform:translateX(-50%) scale(1)}' +
      '50%{transform:translateX(-50%) scale(1.045)}}' +
      '@media (prefers-reduced-motion: reduce){.ti-go{animation:none}}' +
      '.ti-skip{position:absolute;right:16px;top:16px;font-family:"Noto Sans KR",sans-serif;' +
      'font-size:13px;font-weight:700;color:#0f1b2d;background:rgba(255,193,69,.92);border:0;' +
      'border-radius:999px;padding:8px 16px;cursor:pointer}' +
      '.ti-skip:hover{background:#ffc145}';
    document.head.appendChild(s);
  }

  function play(userOpts) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in (userOpts || {})) o[k] = userOpts[k];

    var finish;
    var done = new Promise(function (res) { finish = res; });

    if (o.once) {
      try {
        if (localStorage.getItem(o.storageKey)) {
          if (o.onDone) o.onDone();
          finish(false);
          return done;
        }
        localStorage.setItem(o.storageKey, '1');
      } catch (e) { /* 저장소 막혀 있으면 그냥 재생 */ }
    }

    if (o.loadFonts) injectFonts();
    injectCss(o.zIndex);

    var ov = document.createElement('div');
    ov.className = 'ti-ov' + (o.mount ? ' ti-in-box' : '');
    var stage = document.createElement('div');
    stage.className = 'ti-stage';
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    stage.appendChild(cv);

    var endBtn = null;
    if (o.endLabel) {
      endBtn = document.createElement('button');
      endBtn.className = 'ti-go';
      endBtn.type = 'button';
      endBtn.hidden = true;
      endBtn.textContent = o.endLabel;
      stage.appendChild(endBtn);
    }
    ov.appendChild(stage);

    var skipBtn = null;
    if (o.skipButton) {
      skipBtn = document.createElement('button');
      skipBtn.className = 'ti-skip';
      skipBtn.type = 'button';
      skipBtn.textContent = '건너뛰기';
      ov.appendChild(skipBtn);
    }
    (o.mount || document.body).appendChild(ov);

    var g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    var px = function (x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), w, h);
    };

    /* ── 소리 ── */
    var actx = null;
    if (o.sound) {
      try { actx = new (global.AudioContext || global.webkitAudioContext)(); actx.resume(); } catch (e) { actx = null; }
    }
    function tone(f, at, dur, vol, type) {
      if (!actx) return;
      var osc = actx.createOscillator(), gn = actx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = f;
      osc.connect(gn); gn.connect(actx.destination);
      var t = actx.currentTime + at;
      gn.gain.setValueAtTime(vol, t);
      gn.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
    function sweep(f0, f1, dur, vol) {
      if (!actx) return;
      var osc = actx.createOscillator(), gn = actx.createGain();
      osc.type = 'triangle';
      osc.connect(gn); gn.connect(actx.destination);
      var t = actx.currentTime;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(vol, t);
      gn.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
    function fanfare() {
      var n = [[523, 0, .16], [659, .16, .16], [784, .32, .16], [1047, .48, .22], [784, .74, .14], [1047, .88, .9]];
      for (var i = 0; i < n.length; i++) tone(n[i][0], n[i][1], n[i][2], .06);
    }

    /* ── 그리기 조각 ── */
    function sprite(x, y, rows, pal) {
      for (var r = 0; r < rows.length; r++) {
        var line = rows[r];
        for (var i = 0; i < line.length; i++) {
          if (line[i] !== '.') px(x + i, y + r, 1, 1, pal[line[i]]);
        }
      }
    }

    function flame(cx, base, w, h, t) {
      if (h < 1) return;
      for (var r = 0; r < h; r++) {
        var p = r / h;
        var jit = Math.sin(t * 11 + r * 0.8) * 0.9 + Math.sin(t * 17 + r * 1.9) * 0.6;
        var ww = Math.round(w * (1 - p * p * 0.92) + jit * (0.3 + p));
        if (ww < 1) { if (p > 0.55) continue; ww = 1; }
        var col = p < 0.14 ? FIRE[0] : p < 0.38 ? FIRE[1] : p < 0.62 ? FIRE[2] : p < 0.86 ? FIRE[3] : FIRE[4];
        var dx = Math.round(Math.sin(t * 9 + p * 4) * p * 2.2);
        px(cx - (ww >> 1) + dx, base - r, ww, 1, col);
      }
      for (var i = 0; i < 5; i++) {
        var ph = (t * 0.55 + i * 0.22) % 1;
        if (ph > 0.92) continue;
        px(cx + Math.round(Math.sin(t * 3 + i * 2) * (2 + ph * 7)), base - h - ph * 16, 1, 1,
           ph < 0.5 ? FIRE[1] : FIRE[2]);
      }
    }

    function torch(hx, hy, t, scale) {
      px(hx - 1, hy, 3, 1, '#7a5a34');
      px(hx, hy - 5, 2, 6, '#c9a468');
      px(hx - 2, hy - 7, 5, 2, '#ffc145');
      flame(hx, hy - 8, 3.4 * scale, 10 * scale, t);
    }

    function cauldron(sx, rim, lit, t) {
      px(sx - 18, GY - 5, 37, 7, '#252d42');
      px(sx - 14, GY - 9, 29, 4, '#2e3750');
      px(sx - 10, GY - 13, 21, 4, '#38425c');
      for (var y = rim + 7; y < GY - 13; y++) px(sx - 4, y, 9, 1, (y % 6 < 3) ? '#47516c' : '#3d4761');
      for (var y2 = rim + 14; y2 < GY - 16; y2 += 7) px(sx - 6, y2, 13, 1, '#5a6584');
      px(sx - 7, rim + 6, 15, 2, '#7b6336');
      px(sx - 10, rim + 4, 21, 2, '#8d7140');
      px(sx - 13, rim + 2, 27, 2, '#9a7b45');
      px(sx - 15, rim - 1, 31, 3, '#c9a468');
      px(sx - 13, rim - 2, 27, 1, '#e6c288');
      if (lit > 0.01) flame(sx, rim - 2, 17 * lit, 28 * lit, t);
    }

    var stars = [];
    for (var si = 0; si < 60; si++) stars.push({ x: Math.random() * W, y: Math.random() * 46, s: Math.random() });

    var parts = [];
    function burst(x, y, n, spread) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = Math.random() * spread + 0.4;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.5,
                     life: 1, col: LITC[(Math.random() * LITC.length) | 0] });
      }
    }

    /* ── 상태 ── */
    var phase = 'in', t0 = 0, runX = 26, rimY = RIM_LOW, lit = 0,
        arcP = 0, titleA = 0, flash = 0, camX = 0, last = performance.now(),
        raf = 0, ended = false, endShown = false;

    var reduced = false;
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduced) {
      phase = 'burn'; t0 = 1.0; runX = CX - 44; rimY = RIM_HIGH; lit = 1; arcP = 1;
      camX = CX - 128;
    }

    function step(dt) {
      if (phase === 'in') {
        t0 += dt;
        if (t0 > 0.9) { phase = 'run'; t0 = 0; }
      } else if (phase === 'run') {
        var dist = (CX - 44) - runX;
        runX += o.speed * Math.max(0.25, Math.min(1, dist / 40)) * dt;
        if (dist < 0.6) { phase = 'lift'; t0 = 0; }
      } else if (phase === 'lift') {
        t0 += dt;
        if (t0 > 0.45) arcP = Math.min(1, (t0 - 0.45) / 0.5);
        if (arcP >= 1) {
          phase = 'rise'; t0 = 0; lit = 0.35; flash = 0.55;
          burst(CX - camX, RIM_LOW - 2, 40, 1.6);
          sweep(180, 760, RISE_SEC, 0.05);
        }
      } else if (phase === 'rise') {
        t0 += dt;
        var k = Math.min(1, t0 / RISE_SEC);
        var e = 1 - Math.pow(1 - k, 3);
        rimY = RIM_LOW + (RIM_HIGH - RIM_LOW) * e;
        lit = 0.35 + 0.65 * e;
        if (k >= 1) { phase = 'burn'; t0 = 0; flash = 1; burst(CX - camX, RIM_HIGH - 4, 110, 2.6); fanfare(); }
      } else if (phase === 'burn') {
        var prev = t0; t0 += dt;
        titleA = Math.max(0, Math.min(1, (t0 - 0.5) / 1.0));
        if (prev <= 1.1 && t0 > 1.1) burst(44, 28, 40, 2.0);
        if (prev <= 1.7 && t0 > 1.7) burst(150, 20, 40, 2.0);
        if (t0 > 2.8) { phase = 'done'; t0 = 0; }
      } else if (phase === 'done') {
        titleA = 1;
        t0 += dt;
        if (!endBtn) {
          if (t0 > 0.9) end();
        } else if (!endShown && t0 > 0.35) {
          endShown = true;
          endBtn.hidden = false;
          if (skipBtn) skipBtn.hidden = true;
          requestAnimationFrame(function () { endBtn.classList.add('ti-show'); });
          endBtn.focus({ preventScroll: true });
        }
      }

      flash = Math.max(0, flash - dt * 1.8);
      camX = Math.max(0, Math.min(runX - 48, CX - 128));

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.life -= dt * 0.55;
      }
      parts = parts.filter(function (p) { return p.life > 0 && p.y < H; });
    }

    function draw(t) {
      var cheer = (phase === 'rise' || phase === 'burn' || phase === 'done');

      px(0, 0, W, 46, '#0f1b2d');
      px(0, 32, W, 14, '#142440');
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        px(s.x, s.y, 1, 1, (0.55 + 0.45 * Math.sin(t * 2 + s.s * 30)) > 0.8 ? '#e9eef7' : '#5d6d8d');
      }
      px(158, 10, 6, 6, '#e9eef7'); px(156, 12, 10, 2, '#e9eef7');
      px(160, 9, 4, 8, '#e9eef7'); px(159, 9, 3, 3, '#0f1b2d');

      var m1 = camX * 0.15, m2 = camX * 0.3, x;
      for (x = 0; x < W; x++) {
        var h1 = 16 + Math.sin((x + m1) * 0.04) * 6 + Math.sin((x + m1) * 0.013) * 7;
        px(x, 46 - h1, 1, h1, '#16263d');
      }
      for (x = 0; x < W; x++) {
        var h2 = 10 + Math.sin((x + m2) * 0.06 + 2) * 5 + Math.sin((x + m2) * 0.02) * 4;
        px(x, 46 - h2, 1, h2, '#1b2f4c');
      }

      px(0, 46, W, 32, '#152540');
      var sc = camX * 0.6;
      for (var row = 0; row < 5; row++) {
        var y = 48 + row * 6;
        px(0, y + 4, W, 1, '#11203a');
        var start = Math.floor(sc / 6) * 6;
        for (var cx2 = start; cx2 < start + W + 12; cx2 += 6) {
          var sx2 = cx2 - sc, id = Math.abs(((cx2 / 6) | 0) + row * 31);
          var bob = Math.sin(t * 5 + id * 0.9) > (cheer ? 0.05 : 0.65) ? (cheer ? 2 : 1) : 0;
          px(sx2, y - bob, 3, 3, CROWD[id % CROWD.length]);
          if ((id * 7919) % (cheer ? 4 : 11) === 0) px(sx2 + 1, y - bob - 2, 1, 1, LITC[id % LITC.length]);
        }
      }
      px(0, 77, W, 3, '#0d1a30');

      px(0, 80, W, 6, '#16342c');
      px(0, 86, W, H - 86, '#2a3b57');
      px(0, 86, W, 1, '#3b527a');
      var tl = camX % 22;
      for (x = -22; x < W + 22; x += 22) {
        px(x - tl, 93, 10, 1, '#48628f');
        px(x - tl + 11, 101, 10, 1, '#3d5480');
      }

      var csx = CX - camX;
      cauldron(csx, rimY, lit, t);

      /* 주자 둘 : 앞(여) 성화, 뒤(남) 손 들고 함께 */
      var running = (phase === 'run');
      var fi = running ? (Math.floor(t * 11) % 4) : -1;
      var legsA = fi < 0 ? LEGS_STAND : LEGS[fi];
      var legsB = fi < 0 ? LEGS_STAND : LEGS[(fi + 2) % 4];
      var bobA = (fi === 1 || fi === 3) ? -1 : 0;
      var bobB = (fi === 0 || fi === 2) ? -1 : 0;

      var bx = Math.round(runX - camX - 12), by = GY - 16 + bobB;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(bx + 3, GY - 1, 10, 1);
      sprite(bx, by, UPPER_BOY.concat(legsB), PAL_BOY);

      var ax = Math.round(runX - camX), ay = GY - 16 + bobA;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(ax + 3, GY - 1, 10, 1);
      sprite(ax, ay, UPPER_GIRL.concat(legsA), PAL_GIRL);

      var hx = ax + HAND.x, hy = ay + HAND.y;
      var tscale = (phase === 'lift') ? Math.max(0.22, 1 - arcP) : (arcP >= 1 ? 0.22 : 1);
      torch(hx, hy, t, tscale);

      if (arcP > 0 && arcP < 1) {
        var x0 = hx, y0 = hy - 10, x1 = csx, y1 = RIM_LOW - 2;
        for (var q = 0; q < 8; q++) {
          var p2 = arcP - q * 0.045;
          if (p2 <= 0) continue;
          var px2 = x0 + (x1 - x0) * p2;
          var py2 = y0 + (y1 - y0) * p2 - Math.sin(p2 * Math.PI) * 12;
          var sz = q < 2 ? 2 : 1;
          px(px2, py2, sz, sz, FIRE[Math.min(4, q >> 1)]);
        }
      }

      for (var pi = 0; pi < parts.length; pi++) {
        var pp = parts[pi], psz = pp.life > 0.5 ? 2 : 1;
        px(pp.x, pp.y, psz, psz, pp.col);
      }

      if (lit > 0) {
        g.globalAlpha = 0.2 * lit * (0.85 + 0.15 * Math.sin(t * 7));
        var gr = g.createRadialGradient(csx, rimY, 4, csx, rimY, 120);
        gr.addColorStop(0, '#ffc145');
        gr.addColorStop(1, 'rgba(255,193,69,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.globalAlpha = 1;
      }
      if (flash > 0) { g.fillStyle = 'rgba(255,240,200,' + (flash * 0.75) + ')'; g.fillRect(0, 0, W, H); }

      if (titleA > 0) {
        var og = g.createLinearGradient(0, 26, 0, H);
        og.addColorStop(0, 'rgba(15,27,45,0)');
        og.addColorStop(0.45, 'rgba(15,27,45,0.72)');
        og.addColorStop(1, 'rgba(15,27,45,0.94)');
        g.globalAlpha = titleA;
        g.fillStyle = og; g.fillRect(0, 0, W, H);
        g.textAlign = 'center';
        g.fillStyle = '#ffc145';
        g.font = '400 18px "Black Han Sans", sans-serif';
        g.fillText(o.title, W / 2, 62);
        g.fillStyle = '#e9eef7';
        g.font = '700 9px "Noto Sans KR", sans-serif';
        g.fillText(o.sub, W / 2, 76);
        if (o.tag) {
          g.globalAlpha = titleA * 0.7;
          g.font = '500 7px "Noto Sans KR", sans-serif';
          g.fillText(o.tag, W / 2, 87);
        }
        g.globalAlpha = 1;
      }

      if (phase === 'in') {
        g.fillStyle = 'rgba(15,27,45,' + (1 - t0 / 0.9) + ')';
        g.fillRect(0, 0, W, H);
      }
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw(now / 1000);
      raf = requestAnimationFrame(frame);
    }

    function end() {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      ov.classList.add('ti-out');
      setTimeout(function () {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        if (actx) { try { actx.close(); } catch (e) {} }
        if (o.onDone) o.onDone();
        finish(true);
      }, 560);
    }

    function onKey(ev) { if (ev.key === 'Escape' || ev.key === ' ' || ev.key === 'Enter') end(); }
    document.addEventListener('keydown', onKey);
    if (skipBtn) skipBtn.addEventListener('click', function (ev) { ev.stopPropagation(); end(); });
    if (endBtn) endBtn.addEventListener('click', function (ev) { ev.stopPropagation(); end(); });
    if (o.clickToSkip) ov.addEventListener('click', end);

    (document.fonts ? Promise.all([
      document.fonts.load('400 18px "Black Han Sans"'),
      document.fonts.load('700 9px "Noto Sans KR"')
    ]).catch(function () {}) : Promise.resolve()).then(function () {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return done;
  }

  global.TorchIntro = { play: play, defaults: DEFAULTS };
})(window);

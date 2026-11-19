(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
  const colors = ['#FF9BB3', '#FF6F95', '#FFE79A', '#BDE8D5', '#FFD3B6'];
  let W, H, parts = [];
  const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  addEventListener('resize', resize); resize();

  const heart = (x, y, s, r, c, a) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-8, -3, -4, -9, 0, -4); ctx.bezierCurveTo(4, -9, 8, -3, 0, 3); ctx.fill(); ctx.restore();
  };
  const spawn = (burst) => ({
    x: burst ? W / 2 : Math.random() * W, y: burst ? H * 0.55 : -20,
    vx: burst ? (Math.random() - .5) * 12 : (Math.random() - .5) * .6,
    vy: burst ? -Math.random() * 12 - 3 : Math.random() * 1 + .6,
    s: Math.random() * 1.4 + .8, r: Math.random() * 6, vr: (Math.random() - .5) * .06,
    c: colors[Math.random() * colors.length | 0], burst, life: 1
  });
  if (!reduce) for (let i = 0; i < 14; i++) { const p = spawn(false); p.y = Math.random() * H; parts.push(p); }

  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.burst) { p.vy += .3; p.vx *= .985; p.life -= .008; }
      heart(p.x, p.y, p.s, p.r, p.c, Math.max(p.life, 0) * .85);
    });
    parts = parts.filter(p => p.y < H + 30 && p.life > 0);
    while (!reduce && parts.filter(p => !p.burst).length < 14) parts.push(spawn(false));
    requestAnimationFrame(tick);
  };
  tick();

  const gift = document.getElementById('gift');
  gift.addEventListener('click', () => {
    if (gift.classList.contains('open')) return;
    gift.classList.add('open');
    document.getElementById('hint').hidden = true;
    document.getElementById('reveal').hidden = false;
    for (let i = 0; i < 70; i++) parts.push(spawn(true));
  });

  // Nhạc: tự phát khi load, lặp mãi. Dùng assets/music.mp3, không có file thì phát giai điệu WebAudio
  const btn = document.getElementById('music'), audio = document.getElementById('audio');
  audio.loop = true;
  let on = false, userPaused = false, timer, ac;
  const notes = [523, 587, 659, 784, 659, 587, 523, 392, 440, 523, 440, 392];
  const synth = () => {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    ac.resume();
    let i = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = notes[i++ % notes.length];
      g.gain.setValueAtTime(.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .6);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + .6);
    }, 450);
  };
  const set = (v) => { on = v; btn.setAttribute('aria-pressed', v); btn.textContent = v ? '♪ Tắt nhạc' : '♪ Phát nhạc'; };
  const start = () => audio.play().then(() => set(true)).catch((e) => {
    if (e && e.name === 'NotAllowedError') arm();   // bị chặn autoplay: chờ lần bấm thật
    else { synth(); set(true); }                    // không tải được file mp3: phát giai điệu dự phòng
  });
  // Trình duyệt chặn tự phát tiếng: chờ lần chạm/bấm phím đầu tiên rồi phát
  const evs = ['click', 'keydown', 'touchend'];
  function arm() {
    const h = (e) => {
      if (btn.contains(e.target)) return;
      evs.forEach(n => removeEventListener(n, h));
      if (!on && !userPaused) start();
    };
    evs.forEach(n => addEventListener(n, h));
  }
  btn.addEventListener('click', () => {
    if (on) { audio.pause(); clearInterval(timer); userPaused = true; return set(false); }
    userPaused = false; start();
  });
  start();
  document.getElementById('open').addEventListener('click', () => {
    document.body.classList.add('opened');
    if (!on && !userPaused) start();
  });
})();

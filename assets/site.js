(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var IO = 'IntersectionObserver' in window;

  /* 다크 모드 / 라이트 모드: 화면 전체가 부드럽게 겹치며 바뀜 */
  var modeBtns = $$('.theme button'), themeMeta = $('meta[name="theme-color"]');
  function apply(t, save) {
    root.dataset.theme = t;
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === t ? 'true' : 'false'); });
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#f3efe9' : '#121110');
    if (save) { try { localStorage.setItem('msh-theme', t); } catch (e) {} }
  }
  apply(root.dataset.theme === 'light' ? 'light' : 'dark', false);
  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.dataset.mode;
      if (next === root.dataset.theme) return;
      if (document.startViewTransition && !reduce) document.startViewTransition(function () { apply(next, true); });
      else apply(next, true);
    });
  });

  /* 첫 화면 사진: 첫 사진에서 시작해 천천히 다음 사진으로 (항상 두 장만 겹침) */
  var heroImgs = $$('.hero-photo img');
  if (heroImgs.length > 1 && !reduce) {
    var hi = 0, heroTimer = null;
    var loadRest = function () { heroImgs.forEach(function (im) { if (im.dataset.src) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); } }); };
    if (document.readyState === 'complete') loadRest(); else window.addEventListener('load', loadRest);
    var step = function () {
      var next = (hi + 1) % heroImgs.length, cur = heroImgs[hi], im = heroImgs[next];
      if (!im.complete || !im.naturalWidth) return;
      heroImgs.forEach(function (x) { if (x !== cur && x !== im) x.classList.remove('show', 'front'); });
      cur.classList.remove('front');
      im.classList.add('show', 'front');          // 새 사진이 위에서 천천히 나타남
      setTimeout(function () { cur.classList.remove('show'); }, 2700);   // 다 나타난 뒤 아래 사진을 치움
      hi = next;
    };
    var startHero = function () { if (!heroTimer) heroTimer = setInterval(step, 6500); };
    var stopHero = function () { clearInterval(heroTimer); heroTimer = null; };
    setTimeout(startHero, 1500);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopHero(); else startHero(); });
  }

  /* 위쪽 줄 */
  var topbar = $('#topbar');
  var onScroll = function () { if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* 지금 보고 있는 구역 표시 */
  var spyLinks = $$('.menu a[data-spy]');
  if (IO && spyLinks.length && $('#videos')) {
    var map = { reel: 'videos', videos: 'videos', photos: 'photos', field: 'field', profile: 'profile', career: 'profile', contact: 'contact' };
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var k = map[en.target.id];
        spyLinks.forEach(function (a) { a.classList.toggle('on', a.dataset.spy === k); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    var hero = $('#top');
    if (hero) new IntersectionObserver(function (es) { if (es[0].isIntersecting) spyLinks.forEach(function (a) { a.classList.remove('on'); }); }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
  }

  /* 천천히 나타나기 */
  var reveals = $$('.reveal');
  if (IO && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
    $$('.vgrid').forEach(function (g) { $$('.vcard', g).forEach(function (c, i) { c.classList.add('reveal'); c.style.setProperty('--d', (i % 3) * 0.08 + 's'); ro.observe(c); }); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* 미리보기 영상: 화면에 보일 때만 소리 없이 재생 */
  var previews = $$('video[data-src]');
  if (!reduce && IO) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: .35 });
    previews.forEach(function (v) { v.muted = true; vo.observe(v); });
  }
  var reel = $('.reel-video');
  if (reel) {
    reel.muted = true;
    if (reduce) { reel.removeAttribute('autoplay'); reel.pause(); }
    else if (IO) new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { var p = reel.play(); if (p && p.catch) p.catch(function () {}); } else reel.pause(); }); }, { threshold: .2 }).observe(reel);
  }

  /* 현장 띠: 화면 밖에선 멈춤 */
  var mq = $('#marquee .marquee-track');
  if (mq && IO) new IntersectionObserver(function (es) { mq.style.animationPlayState = es[0].isIntersecting ? '' : 'paused'; }).observe($('#marquee'));

  /* 휴대폰 아래 연락 줄 */
  var dock = $('#dock');
  if (dock && IO) {
    var heroActions = $('#hero-actions'), contact = $('#contact');
    if (heroActions) {
      var heroOut = false, contactIn = false;
      var sync = function () { dock.classList.toggle('show', heroOut && !contactIn); };
      new IntersectionObserver(function (es) { es.forEach(function (en) { heroOut = !en.isIntersecting && en.boundingClientRect.top < 0; }); sync(); }).observe(heroActions);
      if (contact) new IntersectionObserver(function (es) { es.forEach(function (en) { contactIn = en.isIntersecting; }); sync(); }, { threshold: .2 }).observe(contact);
    } else { dock.classList.add('show'); }
  }

  /* 사진 크게 보기 */
  var lb = $('#lb'), photos = window.LB_PHOTOS;
  if (lb && photos) {
    var img = $('#lb-img'), count = $('#lb-count'), dl = $('#lb-dl'), cap = $('#lb-cap'), cur = 0;
    var show = function (i) {
      cur = (i + photos.length) % photos.length; var p = photos[cur];
      img.src = p.src; img.alt = p.alt; count.textContent = (cur + 1) + ' / ' + photos.length; cap.textContent = p.cap || '';
      dl.href = p.dl; dl.setAttribute('download', p.name);
    };
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.ph'); if (!b) return;
      show(+b.dataset.i); if (lb.showModal) lb.showModal(); else window.open(img.src, '_blank');
    });
    $('#lb-close').onclick = function () { lb.close(); };
    $('#lb-prev').onclick = function () { show(cur - 1); };
    $('#lb-next').onclick = function () { show(cur + 1); };
    lb.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowLeft') show(cur - 1); if (ev.key === 'ArrowRight') show(cur + 1); });
    lb.addEventListener('click', function (ev) { if (ev.target === lb || ev.target.classList.contains('lb-stage')) lb.close(); });
    var sx = null;
    lb.addEventListener('touchstart', function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (ev) { if (sx === null) return; var dx = ev.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
  }
})();

// Gin-DB common script
(function () {
  // 1. Scroll-trigger reveal animation (IntersectionObserver)
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('reveal-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      });
    // 2026-09-24: threshold 0.12 だと「要素の12%が画面に入ったら表示」になり、
    //   画面の何倍も縦に長いブロック（関東23蒸溜所の一覧＝高さ約8,900px）は12%に届かず、ずっと透明のままだった（社長「押しても表示されない」）。
    //   少しでも画面に入ったら表示する（threshold 0）。rootMargin で画面下端の少し手前から出す演出は残す。
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // 念のための保険: 読み込みから1.5秒たっても画面内にあるのに出ていないブロックは表示する
    setTimeout(function () {
      els.forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) e.classList.add('reveal-in');
      });
    }, 1500);
  }

  // 2. Header scroll shadow
  function initHeaderShadow() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    function update() {
      if (window.scrollY > 8) h.classList.add('scrolled');
      else h.classList.remove('scrolled');
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // 3. Mobile nav toggle
  function initNavToggle() {
    var btn = document.querySelector('.nav-toggle');
    var header = document.querySelector('.site-header');
    if (!btn || !header) return;

    // aria-expanded を開閉状態に同期（属性が無くても安全に動作）
    function sync() {
      btn.setAttribute('aria-expanded', header.classList.contains('nav-open') ? 'true' : 'false');
    }
    function open() { header.classList.add('nav-open'); sync(); }
    function close() { header.classList.remove('nav-open'); sync(); }

    sync();

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      header.classList.toggle('nav-open');
      sync();
    });

    // Escape でメニューを閉じてトグルへフォーカスを戻す
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        close();
        btn.focus();
      }
    });

    // 外側クリックで閉じる
    document.addEventListener('click', function (e) {
      if (!header.classList.contains('nav-open')) return;
      if (!header.contains(e.target)) close();
    });
  }

  // 4. Hero stats count-up
  function initCountUp() {
    var nums = document.querySelectorAll('.hero__stat .num[data-count]');
    nums.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (!target) return;
      var dur = 1500;
      var start = null;
      el.textContent = '0';
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(target * eased).toString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // 5. Furusato page filter
  function initFurusatoFilter() {
    var bar = document.querySelector('.filter-bar');
    if (!bar) return;
    var chips = bar.querySelectorAll('.filter-chip');
    var cards = document.querySelectorAll('.furusato-card');
    if (!cards.length) return;

    function applyFilter(f) {
      cards.forEach(function (c) {
        var show = false;
        if (f === 'all') {
          show = true;
        } else if (f === 'amount-10000') {
          show = parseInt(c.getAttribute('data-amount') || '0', 10) <= 10000;
        } else if (f === 'amount-30000') {
          show = parseInt(c.getAttribute('data-amount') || '0', 10) <= 30000;
        } else if (f === 'award') {
          show = c.getAttribute('data-award') === 'true';
        } else if (f === 'set') {
          show = c.getAttribute('data-set') === 'true';
        } else if (f.indexOf('region-') === 0) {
          var region = f.replace('region-', '');
          show = c.getAttribute('data-region') === region;
        }
        c.style.display = show ? '' : 'none';
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        applyFilter(chip.getAttribute('data-filter') || 'all');
      });
    });
  }

  // トップへ戻る。twscは100画面分・findは41画面分の長さがあるのに
  // 底から戻る手段がスクロールしかなかった（2026-09-02 UX監査）。
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'ページの先頭へ戻る');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    var shown = false;
    function toggle() {
      var want = window.scrollY > 600;
      if (want !== shown) {
        shown = want;
        btn.classList.toggle('is-visible', want);
      }
    }
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggle();
  }

  function init() {
    initReveal();
    initHeaderShadow();
    initNavToggle();
    initCountUp();
    initFurusatoFilter();
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

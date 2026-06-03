/* ============================================================
   myung.ai landing — interactions
   ============================================================

   ★ 설정 (이 파일 상단만 수정하면 됩니다)
   ─────────────────────────────────────────────────────────── */

var CONFIG = {
  // GA4 측정 ID — Google Analytics 콘솔 → 관리 → 데이터 스트림
  // 예: 'G-ABCDEF1234'   비워두면 GA4 비활성화
  GA4_ID: 'G-SGKR1W7DQ2',

  // Google Apps Script 웹 앱 URL — apps-script.gs 배포 후 붙여넣기
  // 예: 'https://script.google.com/macros/s/AKfy.../exec'
  // 비워두면 localStorage에만 저장 (데모 모드)
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbzxUAlZ_Kb_989gG_w5Y1Wnq20RD2SR4Xd74jY16im8mZi0eENNV9rge78Gjtrsa5Wx/exec'
};

/* ============================================================
   이 아래는 수정하지 않아도 됩니다
   ============================================================ */
(function (cfg) {
  "use strict";

  var isEnglish = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('en') === 0;

  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (_) {}
  }

  /* ────────────────────────────────────────────────
     1 · Starfield
     ──────────────────────────────────────────────── */
  function buildSky() {
    var sky = document.getElementById('sky');
    if (!sky) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var n = reduce ? 20 : 46;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var star = document.createElement('span');
      star.className = 'star';
      var size = Math.random() < 0.85
        ? (Math.random() * 1.4 + 0.6)
        : (Math.random() * 1.8 + 1.8);
      var top  = Math.pow(Math.random(), 1.5) * 100; // denser near top
      star.style.width  = size.toFixed(2) + 'px';
      star.style.height = size.toFixed(2) + 'px';
      star.style.left   = (Math.random() * 100).toFixed(2) + '%';
      star.style.top    = top.toFixed(2) + '%';
      star.style.setProperty('--dur',  (Math.random() * 4 + 2.6).toFixed(2) + 's');
      star.style.setProperty('--del',  (Math.random() * 4).toFixed(2) + 's');
      star.style.setProperty('--lo',   (Math.random() * 0.12 + 0.04).toFixed(2));
      star.style.setProperty('--hi-o', (Math.random() * 0.45 + 0.35).toFixed(2));
      if (top < 30 && Math.random() < 0.4) star.style.background = '#FFD7AE';
      frag.appendChild(star);
    }
    sky.appendChild(frag);
  }

  /* ────────────────────────────────────────────────
     2 · Rotating bracket word
     ──────────────────────────────────────────────── */
  function rotateWord() {
    var el = document.getElementById('rot-word');
    if (!el) return;
    var w = el.querySelector('.word');
    if (!w) return;
    var words = isEnglish
      ? ['dating', 'job hunting', 'a crush', 'a breakup', 'relationships', 'quitting']
      : ['연애를', '취업을', '썸을', '이별을', '인간관계를', '퇴사를'];

    w.style.opacity   = '1';
    w.style.transform = 'none';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var idx = 0, busy = false;
    setInterval(function () {
      if (busy) return;
      busy = true;
      w.style.transition = 'opacity .2s ease, transform .2s ease';
      w.style.opacity    = '0';
      w.style.transform  = 'translateY(-0.4em)';
      setTimeout(function () {
        idx = (idx + 1) % words.length;
        w.textContent      = words[idx];
        w.style.transition = 'none';
        w.style.transform  = 'translateY(0.4em)';
        /* force reflow so the browser commits the hidden state */
        void w.offsetWidth;
        w.style.transition = 'opacity .2s ease, transform .2s ease';
        w.style.opacity    = '1';
        w.style.transform  = 'none';
        setTimeout(function () { busy = false; }, 220);
      }, 220);
    }, 1350);
  }

  /* ────────────────────────────────────────────────
     3 · Date spoiler
     ──────────────────────────────────────────────── */
  function wireDateSpoiler() {
    var el = document.querySelector('.date-spoiler');
    if (!el) return;

    var done = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function fmt(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      if (isEnglish) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return y + '.' + m + '.' + day + '을';
    }

    function finalText() {
      return isEnglish ? 'your future' : '미래를';
    }

    function play() {
      if (done) return;
      done = true;
      el.classList.add('counting');
      if (reduce) {
        el.textContent = finalText();
        el.classList.remove('counting');
        return;
      }

      var parts = (el.getAttribute('data-start') || '2026.06.03').split('.');
      var start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      var steps = 34;
      var span = 520;
      var i = 0;
      var timer = setInterval(function () {
        i += 1;
        var d = new Date(start.getTime());
        d.setDate(start.getDate() + Math.round(i * span / steps));
        el.textContent = fmt(d);
        if (i >= steps) {
          clearInterval(timer);
          el.textContent = finalText();
          el.classList.remove('counting');
        }
      }, 38);
    }

    if (!('IntersectionObserver' in window)) {
      play();
      return;
    }
    new IntersectionObserver(function (entries, io) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          play();
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.66 }).observe(el);
  }

  /* ────────────────────────────────────────────────
     4 · Email capture
     ──────────────────────────────────────────────── */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function wireCapture(form) {
    if (!form) return;
    var wrap  = form.closest('.capture');
    var field = form.querySelector('.field');
    if (!wrap || !field) return;
    var loc = form.getAttribute('data-loc') || 'unknown';
    var btn = form.querySelector('button');

    if (btn) {
      btn.addEventListener('click', function () {
        track('cta_click', { location: loc, source: 'capture' });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (field.value || '').trim();
      if (!EMAIL_RE.test(email)) {
        field.classList.add('err');
        field.focus();
        return;
      }
      field.classList.remove('err');
      submitEmail(email, loc, form);
    });
    field.addEventListener('input', function () { field.classList.remove('err'); });
  }

  function submitEmail(email, loc, form) {
    saveLocally(email, loc);

    var btn = form ? form.querySelector('button') : null;
    if (btn) { btn.disabled = true; btn.textContent = isEnglish ? 'Submitting...' : '신청 중…'; }

    function done() {
      track('email_submit', { location: loc });
      showSuccess(email);
    }

    if (cfg.SHEETS_URL) {
      sendToSheets(email, loc)
        .then(function ()  { done(); })
        .catch(function () {
          /* 네트워크 실패해도 로컬 저장은 됐으니 성공 처리 */
          done();
        });
    } else {
      done();
    }
  }

  function sendToSheets(email, loc) {
    return fetch(cfg.SHEETS_URL, {
      method:  'POST',
      mode:    'no-cors',
      /* text/plain → simple CORS request, 사전 preflight 없음 → Apps Script에서 정상 수신 */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify({
        email:    email,
        location: loc,
        ua:       (navigator.userAgent || '').slice(0, 250),
        at:       new Date().toISOString()
      })
    });
  }

  function saveLocally(email, loc) {
    try {
      var key  = 'myung_waitlist';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push({ email: email, loc: loc, at: Date.now() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}
  }

  function showSuccess(email) {
    document.querySelectorAll('.capture').forEach(function (w) { w.classList.add('ok'); });
    try {
      var list = JSON.parse(localStorage.getItem('myung_waitlist') || '[]');
      var last = list[list.length - 1];
      if (last && last.email) {
        document.querySelectorAll('.survey-link').forEach(function (link) {
          link.href = 'survey.html?email=' + encodeURIComponent(last.email);
        });
      }
    } catch (_) {}
    var fb = document.getElementById('floatbar');
    if (fb) fb.classList.remove('show');
    window.location.href = 'thanks.html?email=' + encodeURIComponent(email || '');
  }

  /* ────────────────────────────────────────────────
     5 · Floating sticky bar
     ──────────────────────────────────────────────── */
  function wireFloatbar() {
    var fb   = document.getElementById('floatbar');
    var hero = document.getElementById('hero-capture');
    if (!fb || !hero) return;

    var isOk = function () { return !!document.querySelector('.capture.ok'); };

    if (!('IntersectionObserver' in window)) {
      /* 구형 브라우저 폴백: 스크롤 이벤트로 대체 */
      window.addEventListener('scroll', throttle(function () {
        if (isOk()) { fb.classList.remove('show'); return; }
        var rect = hero.getBoundingClientRect();
        if (rect.bottom < 0) fb.classList.add('show');
        else fb.classList.remove('show');
      }, 200), { passive: true });
    } else {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (isOk()) { fb.classList.remove('show'); return; }
          if (!en.isIntersecting && en.boundingClientRect.top < 0) fb.classList.add('show');
          else if (en.isIntersecting) fb.classList.remove('show');
        });
      }, { threshold: 0 }).observe(hero);
    }

    fb.querySelector('button').addEventListener('click', function () {
      track('cta_click', { location: 'floatbar', source: 'sticky' });
      var footer = document.getElementById('footer-capture');
      var target = footer || hero;
      var field  = target.querySelector('.field');
      var y = target.getBoundingClientRect().top + window.pageYOffset - 90;
      try { window.scrollTo({ top: y, behavior: 'smooth' }); }
      catch (_) { window.scrollTo(0, y); }
      setTimeout(function () { if (field) field.focus({ preventScroll: true }); }, 480);
    });
  }

  /* ────────────────────────────────────────────────
     6 · FAQ accordion
     ──────────────────────────────────────────────── */
  function wireFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if (!q || !a) return;
      q.addEventListener('click', function () {
        var open = item.classList.contains('open');
        if (open) {
          item.classList.remove('open');
          a.style.maxHeight = '0';
        } else {
          item.classList.add('open');
          var inner = a.querySelector('.inner');
          a.style.maxHeight = (inner ? inner.scrollHeight + 24 : 200) + 'px';
          track('faq_open', { q: q.textContent.trim().slice(0, 50) });
        }
      });
    });
  }

  /* ────────────────────────────────────────────────
     7 · Reveal sections on scroll
     ──────────────────────────────────────────────── */
  function wireReveal() {
    var els = document.querySelectorAll('.reveal');
    var previewSeen = {};

    function trackPreview(el) {
      if (!el || !el.classList.contains('preview')) return;
      var label = el.getAttribute('data-screen-label') || 'preview';
      if (previewSeen[label]) return;
      previewSeen[label] = true;
      track('preview_view', { preview: label });
    }

    if (!('IntersectionObserver' in window)) {
      /* 폴백: 모두 즉시 표시 */
      els.forEach(function (el) {
        el.classList.add('in');
        trackPreview(el);
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          trackPreview(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ────────────────────────────────────────────────
     8 · Scenario timeline auto-play (View A)
     ──────────────────────────────────────────────── */
  function wireStream() {
    var stream = document.getElementById('scenario-stream');
    if (!stream) return;
    stream.style.overflowY = 'auto';

    var nodes  = Array.prototype.slice.call(stream.querySelectorAll('.blk'));
    var played = false;

    function play() {
      stream.scrollTop = 0;
      var t = 90;
      nodes.forEach(function (node) {
        t += Math.round(parseInt(node.getAttribute('data-gap') || '380', 10) * 0.62);
        setTimeout(function () {
          node.classList.add('show');
        }, t);
      });
      /* progress bar */
      var bar = stream.closest('.phone') && stream.closest('.phone').querySelector('.map-prog i');
      if (bar) setTimeout(function () { bar.style.width = bar.getAttribute('data-fill') || '83%'; }, 220);
    }

    if (!('IntersectionObserver' in window)) {
      play();
      return;
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !played) { played = true; play(); }
      });
    }, { threshold: 0.35 }).observe(stream.closest('.phone') || stream);
  }

  /* ────────────────────────────────────────────────
     9 · Chat auto-play (View B)
     ──────────────────────────────────────────────── */
  function wireChat() {
    var chat = document.getElementById('clone-chat');
    if (!chat) return;
    chat.style.overflowY = 'auto';

    var bubbles = Array.prototype.slice.call(chat.querySelectorAll('.bubble, .chat-insight'));
    var played  = false;

    function play() {
      var t = 160;
      bubbles.forEach(function (b) {
        t += parseInt(b.getAttribute('data-gap') || '420', 10);
        setTimeout(function () {
          b.classList.add('show');
          chat.scrollTop = chat.scrollHeight;
        }, t);
      });
    }

    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !played) { played = true; play(); }
      });
    }, { threshold: 0.35 }).observe(chat.closest('.phone') || chat);
  }

  /* ────────────────────────────────────────────────
     10 · Scroll depth (GA4)
     ──────────────────────────────────────────────── */
  function wireScrollDepth() {
    var marks = [25, 50, 75, 100], fired = {};
    window.addEventListener('scroll', throttle(function () {
      var h   = document.documentElement;
      var pct = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100;
      marks.forEach(function (m) {
        if (!fired[m] && pct >= m) { fired[m] = true; track('scroll_depth', { percent: m }); }
      });
    }, 400), { passive: true });
  }

  /* ────────────────────────────────────────────────
     Util
     ──────────────────────────────────────────────── */
  function throttle(fn, wait) {
    var last = 0, timer = null;
    return function () {
      var now = Date.now();
      if (now - last >= wait) { last = now; fn(); }
      else {
        clearTimeout(timer);
        timer = setTimeout(function () { last = Date.now(); fn(); }, wait - (now - last));
      }
    };
  }

  /* ────────────────────────────────────────────────
     Boot
     ──────────────────────────────────────────────── */
  function init() {
    try { buildSky();       } catch (_) {}
    try { rotateWord();     } catch (_) {}
    try { wireDateSpoiler(); } catch (_) {}
    try { document.querySelectorAll('.capture form').forEach(wireCapture); } catch (_) {}
    try { wireFloatbar();   } catch (_) {}
    try { wireFaq();        } catch (_) {}
    try { wireReveal();     } catch (_) {}
    try { wireStream();     } catch (_) {}
    try { wireChat();       } catch (_) {}
    try { wireScrollDepth(); } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(CONFIG));

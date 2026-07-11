(function () {
  var KEY = 'gindb_age_verified';
  var verified = false;
  try { verified = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (verified) return;

  var html = ''
    + '<div class="age-gate" id="ageGate" role="dialog" aria-modal="true" aria-labelledby="ageGateTitle">'
    + '  <div class="age-gate__box">'
    + '    <div class="age-gate__logo">Gin-DB</div>'
    + '    <div class="age-gate__icon"><svg class="icon-svg" width="48" height="48" aria-hidden="true"><use href="/assets/icons.svg#i-glass"/></svg></div>'
    + '    <h2 id="ageGateTitle">あなたは20歳以上ですか？</h2>'
    + '    <p>本サイトは日本のクラフトジン情報を提供するデータベースです。<br>'
    + '       20歳未満の方の閲覧はご遠慮ください。</p>'
    + '    <div class="age-gate__buttons">'
    + '      <button class="age-gate__btn age-gate__btn--yes" id="ageYes">はい（20歳以上）</button>'
    + '      <button class="age-gate__btn age-gate__btn--no" id="ageNo">いいえ</button>'
    + '    </div>'
    + '    <p class="age-gate__notice"><svg class="icon-svg" width="12" height="12" aria-hidden="true"><use href="/assets/icons.svg#i-warning"/></svg> 20歳未満の飲酒は法律で禁止されています。<br>'
    + '       飲酒は適量を守り、節度を持ってお楽しみください。</p>'
    + '  </div>'
    + '</div>';

  function init() {
    var div = document.createElement('div');
    div.innerHTML = html;
    var gate = div.firstChild;

    // 背面コンテンツ（body直下の既存要素）を inert 化してフォーカス・操作を遮断
    var inerted = [];
    var bodyChildren = Array.prototype.slice.call(document.body.children);
    bodyChildren.forEach(function (el) {
      if (el.hasAttribute && !el.hasAttribute('inert')) {
        el.setAttribute('inert', '');
        inerted.push(el);
      }
    });

    document.body.appendChild(gate);

    var yesBtn = document.getElementById('ageYes');
    var noBtn = document.getElementById('ageNo');
    var box = gate.querySelector('.age-gate__box');

    function focusables() {
      return Array.prototype.slice.call(
        box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        leave();
        return;
      }
      if (e.key === 'Tab') {
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !box.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !box.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    function restoreBackground() {
      inerted.forEach(function (el) { el.removeAttribute('inert'); });
      document.removeEventListener('keydown', onKeydown, true);
    }

    function accept() {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      restoreBackground();
      gate.classList.add('hidden');
    }

    function leave() {
      // 「いいえ」/ Escape：未成年の退避先（政府広報オンライン）へ遷移
      restoreBackground();
      window.location.href = 'https://www.gov-online.go.jp/';
    }

    yesBtn.addEventListener('click', accept);
    noBtn.addEventListener('click', leave);
    document.addEventListener('keydown', onKeydown, true);

    // 表示時に「はい」ボタンへフォーカス移動
    yesBtn.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

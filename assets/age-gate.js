(function () {
  var KEY = 'gindb_age_verified';
  var verified = false;
  try { verified = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (verified) return;

  var html = ''
    + '<div class="age-gate" id="ageGate">'
    + '  <div class="age-gate__box">'
    + '    <div class="age-gate__logo">Gin-DB</div>'
    + '    <div class="age-gate__icon">🥃</div>'
    + '    <h2>あなたは20歳以上ですか？</h2>'
    + '    <p>本サイトは日本のクラフトジン情報を提供するデータベースです。<br>'
    + '       20歳未満の方の閲覧はご遠慮ください。</p>'
    + '    <div class="age-gate__buttons">'
    + '      <button class="age-gate__btn age-gate__btn--yes" id="ageYes">はい（20歳以上）</button>'
    + '      <button class="age-gate__btn age-gate__btn--no" id="ageNo">いいえ</button>'
    + '    </div>'
    + '    <p class="age-gate__notice">⚠️ 20歳未満の飲酒は法律で禁止されています。<br>'
    + '       飲酒は適量を守り、節度を持ってお楽しみください。</p>'
    + '  </div>'
    + '</div>';

  function init() {
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    document.getElementById('ageYes').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      var gate = document.getElementById('ageGate');
      if (gate) gate.classList.add('hidden');
    });

    document.getElementById('ageNo').addEventListener('click', function () {
      window.location.href = 'https://www.go.jp/';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

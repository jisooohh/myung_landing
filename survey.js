/* myung.ai feature survey */
(function () {
  "use strict";

  var SHEETS_URL = "https://script.google.com/macros/s/AKfycbzqx81YHSZFqCSx9pPrPWoRB2uaspcKcq5C0tQVX4Cx17bd3STb85hPRbB089OdJ5LJ/exec";
  var TOTAL = 7;
  var step = 0;
  var answers = {};

  var features = [
    {
      key: "main_fortune",
      name: "메인 페이지",
      short: "연/월/오늘 운세",
      desc: "오늘의 흐름부터 이번 달, 올해의 큰 기운까지 한 화면에서 확인합니다.",
      mock: '<div class="mock-card"><div class="mock-label">TODAY</div><div class="mock-big">오늘은 <span class="mock-orange">결정력</span>이 올라오는 날</div></div><div class="mock-row"></div><div class="mock-card"><div class="mock-label">MONTHLY</div><div class="mock-line"></div><div class="mock-label">YEARLY FLOW</div></div>'
    },
    {
      key: "choice_map",
      name: "Map",
      short: "선택들의 map",
      desc: "지금까지의 선택과 앞으로의 갈림길을 지도처럼 펼쳐 봅니다.",
      mock: '<div class="mock-label">CHOICE MAP</div><div class="mock-map"><div class="mock-node"><div class="mock-label">NOW</div><div class="mock-big">회사</div></div><div class="mock-node"><div class="mock-label">PATH A</div><div class="mock-big">창업</div></div><div class="mock-node"><div class="mock-label">PATH B</div><div class="mock-big">이직</div></div><div class="mock-node"><div class="mock-label">PATH C</div><div class="mock-big">유지</div></div></div>'
    },
    {
      key: "career_sim",
      name: "진로 시뮬",
      short: "선택한 옵션으로 시나리오 시뮬레이션",
      desc: "선택지를 고르면 클론이 그 길을 먼저 살아보고 시나리오로 보여줍니다.",
      mock: '<div class="mock-card"><div class="mock-label">SCENARIO 01</div><div class="mock-big">6개월 더 준비</div></div><div class="mock-line"></div><div class="mock-report"><div class="mock-label">RESULT</div><i></i><i></i><i></i></div>'
    },
    {
      key: "relationship_sim",
      name: "관계 시뮬",
      short: "궁합 본 후, 상대 클론과 채팅",
      desc: "상대와의 궁합을 본 뒤, 상대 클론과 대화하며 관계의 다음 장면을 확인합니다.",
      mock: '<div class="mock-message">요즘 먼저 연락 오는 일이 없더라.</div><div class="mock-message me">부담 줄까 봐 망설였어.</div><div class="mock-message">그럼 지금이라도 물어봐 줄래?</div><div class="mock-card"><div class="mock-label">INSIGHT</div><div class="mock-big">먼저 말해야 관계가 움직입니다</div></div>'
    },
    {
      key: "general_report",
      name: "일반 고민",
      short: "보고서",
      desc: "연애, 일, 가족, 돈처럼 정리되지 않은 고민을 구조화된 보고서로 받아봅니다.",
      mock: '<div class="mock-report"><div class="mock-label">CONCERN REPORT</div><i></i><i></i><i></i></div><div class="mock-report"><div class="mock-label">NEXT ACTION</div><div class="mock-big">이번 주에 확인할 한 가지</div></div>'
    },
    {
      key: "my_patterns",
      name: "My",
      short: "만세력 및 내 선택 패턴 확인",
      desc: "내 만세력, 반복되는 선택 패턴, 자주 흔들리는 지점을 한 곳에서 봅니다.",
      mock: '<div class="mock-card"><div class="mock-label">MY SAJU</div><div class="mock-big">나의 기본 흐름</div></div><div class="mock-map"><div class="mock-node"><div class="mock-label">PATTERN</div><div>회피</div></div><div class="mock-node"><div class="mock-label">TRIGGER</div><div>불확실성</div></div></div>'
    }
  ];

  var interestLabels = ["전혀 없음", "낮음", "보통", "높음", "매우 높음"];
  var reasonLabels = [
    { value: "yes", label: "그렇다. 이 기능 때문에 관심이 생겼다" },
    { value: "maybe", label: "어느 정도 그렇다" },
    { value: "no", label: "아니다. 다른 기능이 더 중요하다" }
  ];
  var frequencyLabels = [
    { value: "as_needed", label: "고민 있을 때마다" },
    { value: "daily", label: "하루에 한 번" },
    { value: "weekly", label: "일주일에 한 번" },
    { value: "monthly", label: "한 달에 한 번" }
  ];

  var view = document.getElementById("survey-view");
  var count = document.getElementById("survey-count");
  var bar = document.getElementById("survey-bar");
  var prev = document.getElementById("survey-prev");
  var next = document.getElementById("survey-next");

  function track(name, params) {
    try { if (window.gtag) window.gtag("event", name, params || {}); } catch (_) {}
  }

  function latestEmail() {
    try {
      var direct = new URLSearchParams(window.location.search).get("email");
      if (direct) return direct;
      var list = JSON.parse(localStorage.getItem("myung_waitlist") || "[]");
      var last = list[list.length - 1];
      return last && last.email ? last.email : "";
    } catch (_) {
      return "";
    }
  }

  function setProgress() {
    var current = Math.min(step + 1, TOTAL);
    count.textContent = current + " / " + TOTAL;
    bar.style.width = Math.round(current / TOTAL * 100) + "%";
  }

  function choiceButton(group, value, label, compact) {
    var selected = answers[activeKey()] && answers[activeKey()][group] === value;
    return '<button class="choice' + (selected ? ' is-selected' : '') + '" type="button" data-group="' + group + '" data-value="' + value + '">' + label + '</button>';
  }

  function activeKey() {
    return step < features.length ? features[step].key : "extra";
  }

  function renderFeature(feature) {
    var answer = answers[feature.key] || {};
    view.innerHTML =
      '<div class="survey-question">' +
        '<span class="survey-kicker">기능별 설문</span>' +
        '<h1>' + feature.name + '</h1>' +
        '<p class="desc"><b>' + feature.short + '</b><br>' + feature.desc + '</p>' +
        '<div class="survey-fields">' +
          '<div class="field-group">' +
            '<div class="field-title">이 기능에 대한 관심 정도</div>' +
            '<div class="choice-grid">' + interestLabels.map(function (label, i) {
              return choiceButton("interest", String(i + 1), label);
            }).join("") + '</div>' +
          '</div>' +
          '<div class="field-group">' +
            '<div class="field-title">이 앱에 관심을 가진 이유가 이 기능인가요?</div>' +
            '<div class="choice-list">' + reasonLabels.map(function (item) {
              return choiceButton("reason_driver", item.value, item.label);
            }).join("") + '</div>' +
          '</div>' +
          '<div class="field-group">' +
            '<div class="field-title">이 기능을 얼마나 자주 사용할 것 같나요?</div>' +
            '<div class="choice-list">' + frequencyLabels.map(function (item) {
              return choiceButton("frequency", item.value, item.label);
            }).join("") + '</div>' +
          '</div>' +
          '<div class="field-error" id="field-error">세 질문을 모두 선택해주세요.</div>' +
        '</div>' +
      '</div>' +
      '<div class="survey-shot">' +
        '<div class="shot-head"><div><div class="shot-title">' + feature.name + '</div><div class="mock-label">' + feature.short + '</div></div><span class="shot-pill">SCREEN CAPTURE</span></div>' +
        '<div class="mock-screen">' + feature.mock + '</div>' +
      '</div>';
    if (!answers[feature.key]) answers[feature.key] = answer;
    bindChoices();
  }

  function renderExtra() {
    var answer = answers.extra || { extra_feature: "" };
    view.innerHTML =
      '<div class="survey-question">' +
        '<span class="survey-kicker">추가 페이지</span>' +
        '<h1>추가로 있었으면 하는 기능이 있나요?</h1>' +
        '<p class="desc">아직 위에 없는 기능, 더 자세히 보고 싶은 화면, 꼭 필요한 사용 흐름을 자유롭게 적어주세요.</p>' +
        '<div class="survey-fields">' +
          '<textarea class="extra-input" id="extra-input" placeholder="예: 선택지를 비교하는 표, 친구와 공유하는 리포트, 더 자세한 궁합 해석 등">' + escapeHtml(answer.extra_feature || "") + '</textarea>' +
        '</div>' +
      '</div>' +
      '<div class="survey-shot">' +
        '<div class="shot-head"><div><div class="shot-title">Your idea</div><div class="mock-label">OPEN TEXT</div></div><span class="shot-pill">OPTIONAL</span></div>' +
        '<div class="mock-screen"><div class="mock-report"><div class="mock-label">새 기능 제안</div><i></i><i></i><i></i></div><div class="mock-card"><div class="mock-big">당신의 제안이 베타 우선순위가 됩니다</div></div></div>' +
      '</div>';
    answers.extra = answer;
    document.getElementById("extra-input").addEventListener("input", function (e) {
      answers.extra.extra_feature = e.target.value.trim();
    });
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
    });
  }

  function bindChoices() {
    view.querySelectorAll(".choice").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = activeKey();
        answers[key] = answers[key] || {};
        answers[key][button.getAttribute("data-group")] = button.getAttribute("data-value");
        view.querySelectorAll('.choice[data-group="' + button.getAttribute("data-group") + '"]').forEach(function (b) {
          b.classList.remove("is-selected");
        });
        button.classList.add("is-selected");
        var err = document.getElementById("field-error");
        if (err) err.classList.remove("show");
      });
    });
  }

  function renderDone() {
    count.textContent = TOTAL + " / " + TOTAL;
    bar.style.width = "100%";
    prev.style.display = "none";
    next.style.display = "none";
    view.innerHTML =
      '<div class="survey-done">' +
        '<h1>감사합니다.</h1>' +
        '<p>무료 베타가 릴리즈되면 남겨주신 메일로 가장 먼저 알려드릴게요. 답변은 myung.ai의 기능 우선순위를 정하는 데 사용됩니다.</p>' +
        '<a href="index.html">홈으로 돌아가기</a>' +
      '</div>';
  }

  function render() {
    setProgress();
    prev.style.visibility = step === 0 ? "hidden" : "visible";
    next.textContent = step === TOTAL - 1 ? "종료" : "다음";
    next.disabled = false;
    if (step < features.length) renderFeature(features[step]);
    else renderExtra();
    track("survey_step_view", { step: step + 1, key: activeKey() });
  }

  function validCurrent() {
    if (step >= features.length) return true;
    var answer = answers[activeKey()] || {};
    var ok = !!(answer.interest && answer.reason_driver && answer.frequency);
    var err = document.getElementById("field-error");
    if (!ok && err) err.classList.add("show");
    return ok;
  }

  function buildPayload() {
    return {
      type: "survey",
      email: latestEmail(),
      page: "feature_survey",
      answers: features.map(function (feature) {
        var answer = answers[feature.key] || {};
        return {
          feature_key: feature.key,
          feature_name: feature.name,
          feature_short: feature.short,
          interest: answer.interest || "",
          reason_driver: answer.reason_driver || "",
          frequency: answer.frequency || ""
        };
      }),
      extra_feature: (answers.extra && answers.extra.extra_feature) || "",
      ua: (navigator.userAgent || "").slice(0, 250),
      at: new Date().toISOString()
    };
  }

  function submitSurvey() {
    next.disabled = true;
    next.textContent = "제출 중...";
    track("survey_submit", {});
    return fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(buildPayload())
    }).then(function () {
      renderDone();
    }).catch(function () {
      renderDone();
    });
  }

  prev.addEventListener("click", function () {
    if (step > 0) {
      step -= 1;
      render();
      window.scrollTo(0, 0);
    }
  });

  next.addEventListener("click", function () {
    if (!validCurrent()) return;
    if (step >= TOTAL - 1) {
      submitSurvey();
      return;
    }
    step += 1;
    render();
    window.scrollTo(0, 0);
  });

  render();
})();

/* myung.ai feature survey */
(function () {
  "use strict";

  var SHEETS_URL = "https://script.google.com/macros/s/AKfycbzxUAlZ_Kb_989gG_w5Y1Wnq20RD2SR4Xd74jY16im8mZi0eENNV9rge78Gjtrsa5Wx/exec";
  var TOTAL = 7;
  var step = 0;
  var answers = {};

  var features = [
    {
      key: "main_fortune",
      name: "메인 페이지",
      short: "연/월/오늘 운세",
      desc: "오늘의 흐름부터 올해와 이번 달의 핵심 운세까지 한 화면에서 확인합니다.",
      image: "assets/survey-main.svg"
    },
    {
      key: "choice_map",
      name: "Map",
      short: "선택들의 map",
      desc: "내가 지나온 선택과 앞으로의 갈림길을 지도처럼 펼쳐 봅니다.",
      image: "assets/survey-map.svg"
    },
    {
      key: "career_sim",
      name: "진로 시뮬",
      short: "선택한 옵션으로 시나리오 시뮬레이션",
      desc: "선택지를 고르면 클론이 그 길을 먼저 살아보고 시나리오로 보여줍니다.",
      image: "assets/survey-career.svg"
    },
    {
      key: "relationship_sim",
      name: "관계 시뮬",
      short: "궁합 본 후, 상대 클론과 채팅",
      desc: "상대와의 궁합을 본 뒤, 상대 클론과 대화하며 관계의 다음 장면을 확인합니다.",
      image: "assets/survey-relationship.svg"
    },
    {
      key: "general_report",
      name: "일반 고민",
      short: "보고서",
      desc: "정리되지 않은 고민을 입력하면 판단 기준과 다음 행동을 보고서로 받아봅니다.",
      image: "assets/survey-report.svg"
    },
    {
      key: "my_patterns",
      name: "My",
      short: "만세력 및 내 선택 패턴 확인",
      desc: "내 만세력, 반복되는 선택 패턴, 관계와 선택의 성향을 한 곳에서 봅니다.",
      image: "assets/survey-my.svg"
    }
  ];

  var scale = ["1", "2", "3", "4", "5"];
  var frequencyLabels = [
    { value: "as_needed", label: "고민 있을 때마다" },
    { value: "daily", label: "1회/day" },
    { value: "weekly", label: "1~3/week" },
    { value: "monthly", label: "1~3/month" },
    { value: "yearly", label: "n/year" }
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

  function activeKey() {
    return step < features.length ? features[step].key : "extra";
  }

  function choiceButton(group, value, label, className) {
    var selected = answers[activeKey()] && answers[activeKey()][group] === value;
    return '<button class="choice ' + (className || "") + (selected ? ' is-selected' : '') + '" type="button" data-group="' + group + '" data-value="' + value + '">' + label + '</button>';
  }

  function scaleField(group, title) {
    return '<div class="field-group">' +
      '<div class="field-title">' + title + '</div>' +
      '<div class="scale-meta"><span>낮음 ←</span><span>→ 높음</span></div>' +
      '<div class="choice-grid scale-grid">' + scale.map(function (label) {
        return choiceButton(group, label, label, "scale-choice");
      }).join("") + '</div>' +
    '</div>';
  }

  function renderFeature(feature) {
    var answer = answers[feature.key] || {};
    view.innerHTML =
      '<div class="survey-question">' +
        '<span class="survey-kicker">기능별 설문</span>' +
        '<h1>' + feature.name + '</h1>' +
        '<p class="desc"><b>' + feature.short + '</b><br>' + feature.desc + '</p>' +
        '<div class="survey-fields">' +
          scaleField("interest", "이 기능에 대한 관심 정도") +
          scaleField("reason_driver", "이 앱에 관심을 가진 이유가 이 기능인가요?") +
          '<div class="field-group">' +
            '<div class="field-title">이 기능을 얼마나 자주 사용할 것 같나요?</div>' +
            '<div class="dot-choice-row">' + frequencyLabels.map(function (item) {
              return choiceButton("frequency", item.value, '<span></span><b>' + item.label + '</b>', "dot-choice");
            }).join("") + '</div>' +
          '</div>' +
          '<div class="field-error" id="field-error">세 질문을 모두 선택해주세요.</div>' +
        '</div>' +
      '</div>' +
      '<div class="survey-shot">' +
        '<div class="shot-head"><div><div class="shot-title">' + feature.name + '</div><div class="mock-label">' + feature.short + '</div></div><span class="shot-pill">SCREEN CAPTURE</span></div>' +
        '<div class="survey-image-frame"><img class="survey-capture-img" src="' + feature.image + '" alt="' + feature.name + ' 화면 캡처"></div>' +
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
      '<div class="survey-shot idea-shot">' +
        '<p>당신의 제안이 베타 우선순위가 됩니다</p>' +
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

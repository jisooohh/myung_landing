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
      mock: mainFortuneMock()
    },
    {
      key: "choice_map",
      name: "Map",
      short: "선택들의 map",
      desc: "내가 지나온 선택과 앞으로의 갈림길을 지도처럼 펼쳐 봅니다.",
      mock: choiceMapMock()
    },
    {
      key: "career_sim",
      name: "진로 시뮬",
      short: "선택한 옵션으로 시나리오 시뮬레이션",
      desc: "선택지를 고르면 클론이 그 길을 먼저 살아보고 시나리오로 보여줍니다.",
      mock: careerMock()
    },
    {
      key: "relationship_sim",
      name: "관계 시뮬",
      short: "궁합 본 후, 상대 클론과 채팅",
      desc: "상대와의 궁합을 본 뒤, 상대 클론과 대화하며 관계의 다음 장면을 확인합니다.",
      mock: relationshipMock()
    },
    {
      key: "general_report",
      name: "일반 고민",
      short: "보고서",
      desc: "정리되지 않은 고민을 입력하면 판단 기준과 다음 행동을 보고서로 받아봅니다.",
      mock: reportMock()
    },
    {
      key: "my_patterns",
      name: "My",
      short: "만세력 및 내 선택 패턴 확인",
      desc: "내 만세력, 반복되는 선택 패턴, 관계와 선택의 성향을 한 곳에서 봅니다.",
      mock: myPatternMock()
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

  function mainFortuneMock() {
    return '<div class="shot-main">' +
      '<div class="fortune-mark">참</div><div class="mini-muted">오늘의 한 줄</div>' +
      '<h3>갑추가 지금까지 쌓아온 가능성을 깨우고,<br><b>너만의 잠재력</b>을 발휘할 수 있는 날이야</h3>' +
      '<div class="goodbad"><div><span>GOOD</span><b>이미 내린 결정 점검</b></div><div><span>BAD</span><b>새 약속 · 즉흥 지출</b></div></div>' +
      '<div class="fortune-list"><p><b>2026</b><span>쌓아온 것을 정리하고 구조를 다시 짜는 해</span></p><p><b>6월</b><span>관계의 온도를 확인하는 시기</span></p></div>' +
      '<div class="radar"><i></i><span>木</span><span>火</span><span>土</span><span>金</span><span>水</span><b>4일</b></div>' +
    '</div>';
  }

  function choiceMapMock() {
    return '<div class="shot-map">' +
      '<div class="map-me">나</div><div class="path-line"></div>' +
      '<div class="map-box top">김지원와의 ...</div><div class="map-box mid">개발자로 취...</div>' +
      '<div class="map-box left">포트폴리오 경로<small>프리랜서 경로</small></div>' +
      '<div class="map-box right">첫 프로젝트 경로<small>협상 경로</small></div>' +
      '<div class="map-box bottom">나이가 들수...</div>' +
    '</div>';
  }

  function careerMock() {
    return '<div class="shot-career">' +
      '<div class="mock-progress"><span>전개 <b>4 / 6</b></span><i></i></div>' +
      '<div class="scenario-label">시나리오 전개 1</div>' +
      '<div class="scenario-card">6개월 더 준비하기로 마음먹고, 퇴근 후 토이프로젝트를 시작해요. 처음엔 의미가 있나 싶지만, 庚金의 압박 속에서 만든 결과물이 오히려 단단해요.</div>' +
      '<h4>가장 먼저 무엇을 할까요?</h4>' +
      '<div class="career-option">포트폴리오 사이트부터 만든다</div>' +
      '<div class="career-option selected">지인에게 첫 프로젝트를 부탁한다</div>' +
      '<div class="career-option">코딩테스트 스터디에 다시 들어간다</div>' +
    '</div>';
  }

  function relationshipMock() {
    return '<div class="shot-chat">' +
      '<div class="chat-head"><span>王</span><b>이서연</b><em>클론</em></div>' +
      '<div class="chat-banner">대화 시뮬레이션 · 이서연의 클론과 대화 중</div>' +
      '<p class="bubble bot">아라야, 오늘 하루 어땠어?</p>' +
      '<p class="bubble me">그냥 그랬어... 요즘 우리 사이 좀 애매한 것 같아서.</p>' +
      '<p class="bubble bot">무슨 일 있었어? 말 안 해도 돼, 근데 저녁은 먹었어?</p>' +
      '<p class="bubble me">(또 위로 대신 밥 얘기네... 내 마음은 안 궁금한가?)</p>' +
      '<p class="bubble bot">사실 너 요즘 힘들어 보여서 계속 신경 쓰였어.</p>' +
    '</div>';
  }

  function reportMock() {
    return '<div class="shot-report">' +
      '<span>CONCERN REPORT</span><h3>지금 고민의 핵심은<br>선택지가 아니라 기준입니다</h3>' +
      '<p>1. 지금 바로 결정해야 하는 것</p><p>2. 더 물어봐야 하는 것</p><p>3. 일주일 뒤에도 남을 감정</p>' +
      '<b>다음 행동: 오늘 한 사람에게만 확인하기</b>' +
    '</div>';
  }

  function myPatternMock() {
    return '<div class="shot-my">' +
      '<div class="my-profile"><span>참</span><div><b>찹츄</b><em>2001-07-19 · ENFP · 취준생</em></div></div>' +
      '<div class="my-tabs"><b>만세력</b><b class="active">패턴</b><b>친구</b></div>' +
      '<p class="mini-muted">성향맵 · TENDENCY</p><h3>대화로 클론이 파악한 성향</h3>' +
      '<div class="pattern-radar"><i></i><span>사회적 민감성</span><span>자극 추구</span><span>자기 성찰</span><span>관계 깊이</span><span>방향성</span></div>' +
      '<p><b>사회적 민감성</b>이 높고 <b>자극 추구</b>가 강한 확장형이에요.</p>' +
    '</div>';
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

/**
 * myung.ai — Waitlist / Feature Survey → Google Sheets 연동
 *
 * ──────────────────────────────────────────────────────────
 * 설정 방법 (5분)
 * ──────────────────────────────────────────────────────────
 * 1. Google Sheets 에서 새 스프레드시트를 만드세요.
 *
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script
 *    열리는 편집기에 이 파일의 내용을 전체 선택 후 붙여넣기.
 *
 * 3. 상단 메뉴 → 배포 → 새 배포
 *    - 유형 선택: 웹 앱
 *    - 다음 사용자로 실행: 나 (me)
 *    - 액세스 권한: 모든 사용자 (Anyone)          ← 반드시 이것
 *    → [배포] 클릭 → Google 계정 권한 허용
 *
 * 4. 배포 완료 후 표시되는 "웹 앱 URL"을 복사하세요.
 *    https://script.google.com/macros/s/AKfy.../exec  형태
 *
 * 5. landing.js 최상단 CONFIG.SHEETS_URL 에 그 URL을 붙여넣으세요.
 *
 * ──────────────────────────────────────────────────────────
 * 코드 수정 후 재배포 시
 * ──────────────────────────────────────────────────────────
 * 배포 → 배포 관리 → 연필(수정) 아이콘 → 버전: 새 버전 → 배포
 * (URL은 동일하게 유지됩니다)
 * ──────────────────────────────────────────────────────────
 */

/* 저장할 시트 이름. 없으면 자동 생성됩니다. */
var WAITLIST_SHEET_NAME = 'Waitlist';
var SURVEY_SHEET_NAME = 'FeatureSurvey';

/* ── POST 수신 (랜딩페이지 → 여기로 전송) ─────────────── */
function doPost(e) {
  try {
    var raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    if (data.type === 'survey') {
      appendSurveyRows(data);
      return ok({ saved: true, type: 'survey' });
    }
    appendWaitlistRow(data);
    return ok({ saved: true, type: 'waitlist' });
  } catch (err) {
    return ok({ saved: false, error: err.message });
  }
}

/* ── GET (브라우저에서 URL 직접 열어 동작 확인용) ──────── */
function doGet() {
  return ok({ live: true, waitlistSheet: WAITLIST_SHEET_NAME, surveySheet: SURVEY_SHEET_NAME });
}

/* ── 대기자 명단 시트에 행 추가 ───────────────────────── */
function appendWaitlistRow(data) {
  var sheet = ensureSheet(WAITLIST_SHEET_NAME, ['timestamp', 'email', 'location', 'user_agent'], [200, 240, 100, 320]);

  sheet.appendRow([
    data.at       || new Date().toISOString(),
    data.email    || '',
    data.location || '',
    data.ua       || ''
  ]);
}

/* ── 기능별 설문 시트에 행 추가 ───────────────────────── */
function appendSurveyRows(data) {
  var sheet = ensureSheet(SURVEY_SHEET_NAME, [
    'timestamp',
    'email',
    'feature_key',
    'feature_name',
    'feature_short',
    'interest',
    'reason_driver',
    'frequency',
    'extra_feature',
    'page',
    'user_agent'
  ], [200, 240, 180, 160, 280, 100, 180, 160, 360, 160, 320]);

  var answers = Array.isArray(data.answers) ? data.answers : [];
  if (!answers.length) {
    sheet.appendRow([
      data.at || new Date().toISOString(),
      data.email || '',
      '',
      '',
      '',
      '',
      '',
      '',
      data.extra_feature || '',
      data.page || '',
      data.ua || ''
    ]);
    return;
  }

  answers.forEach(function(answer) {
    sheet.appendRow([
      data.at || new Date().toISOString(),
      data.email || '',
      answer.feature_key || '',
      answer.feature_name || '',
      answer.feature_short || '',
      answer.interest || '',
      answer.reason_driver || '',
      answer.frequency || '',
      data.extra_feature || '',
      data.page || '',
      data.ua || ''
    ]);
  });
}

function ensureSheet(name, headers, widths) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#E85C0D')
      .setFontColor('#ffffff');
    widths.forEach(function(width, index) {
      sheet.setColumnWidth(index + 1, width);
    });
  }

  return sheet;
}

/* ── 응답 헬퍼 ──────────────────────────────────────── */
function ok(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

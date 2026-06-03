/**
 * myung.ai — Waitlist → Google Sheets 연동
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
var SHEET_NAME = 'Waitlist';

/* ── POST 수신 (랜딩페이지 → 여기로 전송) ─────────────── */
function doPost(e) {
  try {
    var raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    appendRow(data);
    return ok({ saved: true });
  } catch (err) {
    return ok({ saved: false, error: err.message });
  }
}

/* ── GET (브라우저에서 URL 직접 열어 동작 확인용) ──────── */
function doGet() {
  return ok({ live: true, sheet: SHEET_NAME });
}

/* ── 시트에 행 추가 ──────────────────────────────────── */
function appendRow(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  /* 시트가 없으면 새로 만들고 헤더 추가 */
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'email', 'location', 'user_agent']);
    sheet.setFrozenRows(1);
    /* 헤더 서식 */
    sheet.getRange(1, 1, 1, 4)
      .setFontWeight('bold')
      .setBackground('#E85C0D')
      .setFontColor('#ffffff');
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 320);
  }

  sheet.appendRow([
    data.at       || new Date().toISOString(),
    data.email    || '',
    data.location || '',
    data.ua       || ''
  ]);
}

/* ── 응답 헬퍼 ──────────────────────────────────────── */
function ok(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

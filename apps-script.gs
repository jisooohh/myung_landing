/**
 * myung.ai — Waitlist / Feature Survey → Google Sheets 연동
 *
 * 사용 방법
 * 1. Google Sheets → 확장 프로그램 → Apps Script
 * 2. 이 파일 전체를 붙여넣기
 * 3. 배포 → 새 배포 또는 배포 관리 → 웹 앱
 *    - 다음 사용자로 실행: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 웹 앱 URL을 landing.js / survey.js의 SHEETS_URL에 입력
 *
 * 현재 연결 URL:
 * https://script.google.com/macros/s/AKfycbzxUAlZ_Kb_989gG_w5Y1Wnq20RD2SR4Xd74jY16im8mZi0eENNV9rge78Gjtrsa5Wx/exec
 */

var WAITLIST_SHEET_NAME = 'Waitlist';
var SURVEY_DETAIL_SHEET_NAME = 'FeatureSurvey';
var SURVEY_RESPONSE_SHEET_NAME = 'SurveyResponses';
var SURVEY_SUMMARY_SHEET_NAME = 'SurveySummary';

var FEATURES = [
  ['main_fortune', '메인 페이지'],
  ['choice_map', 'Map'],
  ['career_sim', '진로 시뮬'],
  ['relationship_sim', '관계 시뮬'],
  ['general_report', '일반 고민'],
  ['my_patterns', 'My']
];

var FREQUENCIES = [
  ['as_needed', '고민 있을 때마다'],
  ['daily', '1회/day'],
  ['weekly', '1~3/week'],
  ['monthly', '1~3/month'],
  ['yearly', 'n/year']
];

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    if (data.type === 'survey') {
      saveSurvey(data);
      return ok({ saved: true, type: 'survey' });
    }
    saveWaitlist(data);
    return ok({ saved: true, type: 'waitlist' });
  } catch (err) {
    return ok({ saved: false, error: err.message });
  }
}

function doGet() {
  ensureAllSheets();
  rebuildSurveySummary();
  return ok({
    live: true,
    waitlistSheet: WAITLIST_SHEET_NAME,
    surveyDetailSheet: SURVEY_DETAIL_SHEET_NAME,
    surveyResponseSheet: SURVEY_RESPONSE_SHEET_NAME,
    surveySummarySheet: SURVEY_SUMMARY_SHEET_NAME
  });
}

function saveWaitlist(data) {
  var sheet = ensureSheet(WAITLIST_SHEET_NAME, [
    'timestamp',
    'email',
    'location',
    'user_agent'
  ], [200, 260, 120, 360]);

  sheet.appendRow([
    data.at || new Date().toISOString(),
    normalizeEmail(data.email),
    data.location || '',
    data.ua || ''
  ]);
}

function saveSurvey(data) {
  var email = normalizeEmail(data.email);
  var timestamp = data.at || new Date().toISOString();
  var answers = Array.isArray(data.answers) ? data.answers : [];
  var detail = ensureSurveyDetailSheet();
  var response = ensureSurveyResponseSheet();

  answers.forEach(function(answer) {
    detail.appendRow([
      timestamp,
      email,
      answer.feature_key || '',
      answer.feature_name || '',
      answer.feature_short || '',
      asNumber(answer.interest),
      asNumber(answer.reason_driver),
      answer.frequency || '',
      frequencyLabel(answer.frequency || ''),
      data.extra_feature || '',
      data.page || '',
      data.ua || ''
    ]);
  });

  var byFeature = {};
  answers.forEach(function(answer) {
    byFeature[answer.feature_key || ''] = answer;
  });

  var row = [
    timestamp,
    email,
    data.extra_feature || '',
    data.page || '',
    data.ua || ''
  ];
  FEATURES.forEach(function(feature) {
    var answer = byFeature[feature[0]] || {};
    row.push(asNumber(answer.interest));
    row.push(asNumber(answer.reason_driver));
    row.push(answer.frequency || '');
  });
  response.appendRow(row);

  rebuildSurveySummary();
}

function ensureAllSheets() {
  ensureSheet(WAITLIST_SHEET_NAME, ['timestamp', 'email', 'location', 'user_agent'], [200, 260, 120, 360]);
  ensureSurveyDetailSheet();
  ensureSurveyResponseSheet();
  ensureSheet(SURVEY_SUMMARY_SHEET_NAME, ['metric', 'feature_key', 'feature_name', 'value', 'label', 'count'], [170, 170, 150, 90, 170, 90]);
}

function ensureSurveyDetailSheet() {
  return ensureSheet(SURVEY_DETAIL_SHEET_NAME, [
    'timestamp',
    'email',
    'feature_key',
    'feature_name',
    'feature_short',
    'interest_1_5',
    'reason_driver_1_5',
    'frequency',
    'frequency_label',
    'extra_feature',
    'page',
    'user_agent'
  ], [200, 260, 170, 150, 260, 120, 150, 120, 170, 360, 150, 360]);
}

function ensureSurveyResponseSheet() {
  var headers = ['timestamp', 'email', 'extra_feature', 'page', 'user_agent'];
  FEATURES.forEach(function(feature) {
    headers.push(feature[0] + '_interest_1_5');
    headers.push(feature[0] + '_reason_1_5');
    headers.push(feature[0] + '_frequency');
  });
  return ensureSheet(SURVEY_RESPONSE_SHEET_NAME, headers, headers.map(function(_, index) {
    if (index === 0) return 200;
    if (index === 1) return 260;
    if (index === 2 || index === 4) return 360;
    return 150;
  }));
}

function rebuildSurveySummary() {
  var detail = ensureSurveyDetailSheet();
  var summary = ensureSheet(SURVEY_SUMMARY_SHEET_NAME, [
    'metric',
    'feature_key',
    'feature_name',
    'value',
    'label',
    'count'
  ], [170, 170, 150, 90, 170, 90]);

  if (summary.getLastRow() > 1) {
    summary.getRange(2, 1, summary.getLastRow() - 1, summary.getLastColumn()).clearContent();
  }

  var lastRow = detail.getLastRow();
  var rows = lastRow > 1 ? detail.getRange(2, 1, lastRow - 1, 12).getValues() : [];
  var output = [];

  FEATURES.forEach(function(feature) {
    [1, 2, 3, 4, 5].forEach(function(value) {
      output.push(['interest_1_5', feature[0], feature[1], value, String(value), countRows(rows, feature[0], 5, value)]);
      output.push(['reason_driver_1_5', feature[0], feature[1], value, String(value), countRows(rows, feature[0], 6, value)]);
    });
    FREQUENCIES.forEach(function(freq) {
      output.push(['frequency', feature[0], feature[1], freq[0], freq[1], countRows(rows, feature[0], 7, freq[0])]);
    });
  });

  if (output.length) {
    summary.getRange(2, 1, output.length, output[0].length).setValues(output);
  }
}

function countRows(rows, featureKey, colIndex, value) {
  return rows.filter(function(row) {
    return row[2] === featureKey && String(row[colIndex]) === String(value);
  }).length;
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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function asNumber(value) {
  var n = Number(value);
  return n >= 1 && n <= 5 ? n : '';
}

function frequencyLabel(value) {
  for (var i = 0; i < FREQUENCIES.length; i += 1) {
    if (FREQUENCIES[i][0] === value) return FREQUENCIES[i][1];
  }
  return '';
}

function ok(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

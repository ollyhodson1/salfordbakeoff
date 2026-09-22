const SPREADSHEET_ID = '1lrjX2txvdZQ7B20yfXy55c7FD6QpBETnws_3TE9FUIs';

const SHEETS = {
  home: 'Page - Home',
  rules: 'Page - Rules',
  contestants: 'Page - Contestants',
  bakes: 'Page - Bakes',
  voting: 'Page - Voting',
  votes: 'Data - Votes',
  leaderboard: 'Page - Leaderboard'
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'bootstrap';
    if (action === 'bootstrap') return json_({ ok: true, data: buildBootstrap_() });
    if (action === 'health') return json_({ ok: true, message: 'Great Salford Bake Off API is live.' });
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function doPost(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action !== 'vote') return json_({ ok: false, error: 'Unknown action.' });
    const payload = JSON.parse((e.parameter && e.parameter.payload) || '{}');
    return json_(recordVote_(payload));
  } catch (err) {
    return json_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function buildBootstrap_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  SpreadsheetApp.flush();

  const home = keyValueMap_(ss.getSheetByName(SHEETS.home).getRange('A6:C17').getDisplayValues(), 0, 2);
  const contestants = contestants_(ss);
  const participants = unique_(contestants.flatMap(c => [c.person1, c.person2]).filter(Boolean)).sort();
  const rules = rules_(ss);
  const bakes = bakes_(ss);
  const voting = voting_(ss);
  const leaderboard = leaderboard_(ss);

  return { participants, home, rules, contestants, bakes, voting, leaderboard };
}

function contestants_(ss) {
  const rows = ss.getSheetByName(SHEETS.contestants).getRange('A6:K17').getDisplayValues();
  return rows.filter(r => r[1]).filter(r => yes_(r[10])).map(r => ({
    id: r[0],
    name: r[1],
    person1: r[2],
    person2: r[3],
    status: r[4] || 'Active',
    eliminationWeek: r[5],
    bakeStatus1: r[6],
    bakeStatus2: r[7],
    photo: r[8],
    notes: r[9]
  }));
}

function rules_(ss) {
  const rows = ss.getSheetByName(SHEETS.rules).getRange('A6:E100').getDisplayValues();
  return rows.filter(r => r[2]).filter(r => yes_(r[4])).map(r => ({
    order: Number(r[0]) || 999,
    section: r[1] || 'Rules',
    title: r[2],
    text: r[3]
  }));
}

function bakes_(ss) {
  const rows = ss.getSheetByName(SHEETS.bakes).getRange('A6:M55').getDisplayValues();
  return rows.filter(r => r[1] && r[3]).map(r => ({
    id: r[0],
    baker: r[1],
    contestant: r[2],
    name: r[3],
    date: r[4],
    photo: r[5],
    description: r[6],
    votingOpen: yes_(r[7]),
    show: yes_(r[8]),
    votingCloses: r[9],
    shopBought: yes_(r[10]),
    allergens: r[11],
    status: r[12]
  }));
}

function voting_(ss) {
  const settings = keyValueMap_(ss.getSheetByName(SHEETS.voting).getRange('A6:C12').getDisplayValues(), 0, 2);
  const rows = ss.getSheetByName(SHEETS.voting).getRange('A16:F20').getDisplayValues();
  const categories = rows.filter(r => r[2]).filter(r => yes_(r[5])).map(r => ({
    order: Number(r[0]) || 999,
    key: r[1],
    label: r[2],
    max: Number(r[3]) || 10,
    help: r[4]
  })).sort((a,b) => a.order - b.order);
  return { settings, categories };
}

function leaderboard_(ss) {
  const rows = ss.getSheetByName(SHEETS.leaderboard).getRange('A14:L63').getDisplayValues();
  return rows.filter(r => r[1] && r[2]).map(r => ({
    rank: Number(r[0]) || null,
    bakeId: r[1],
    baker: r[2],
    bake: r[3],
    votes: Number(r[4]) || 0,
    taste: numOrBlank_(r[5]),
    appearance: numOrBlank_(r[6]),
    bakeQuality: numOrBlank_(r[7]),
    creativity: numOrBlank_(r[8]),
    overallEnjoyment: numOrBlank_(r[9]),
    total: numOrBlank_(r[10]),
    status: r[11]
  }));
}

function recordVote_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const contestants = contestants_(ss);
    const participants = unique_(contestants.flatMap(c => [c.person1, c.person2]).filter(Boolean));
    const bakes = bakes_(ss);
    const voting = voting_(ss);

    const voter = clean_(payload.voter, 120);
    const bakeId = clean_(payload.bakeId, 30);
    const comment = clean_(payload.comment, 500);
    if (!voter || participants.indexOf(voter) === -1) throw new Error('Your name is not recognised. Please sign out and choose your name again.');
    if (!yes_(voting.settings.global_voting_open)) throw new Error('Voting is currently closed.');

    const bake = bakes.find(b => b.id === bakeId);
    if (!bake) throw new Error('That bake could not be found.');
    if (!bake.votingOpen) throw new Error('Voting for this bake is closed.');
    if (bake.baker === voter) throw new Error('You cannot vote for your own bake.');

    const scoreByKey = payload.scores || {};
    const requiredKeys = ['taste','appearance','bake_quality','creativity','overall_enjoyment'];
    const scores = requiredKeys.map(key => {
      const n = Number(scoreByKey[key]);
      if (!Number.isInteger(n) || n < 1 || n > 10) throw new Error('Every scoring category must be between 1 and 10.');
      return n;
    });

    const voteSheet = ss.getSheetByName(SHEETS.votes);
    const last = Math.max(voteSheet.getLastRow(), 5);
    if (last >= 6) {
      const existing = voteSheet.getRange(6, 1, last - 5, 12).getDisplayValues();
      const duplicate = existing.some(r => r[2] === voter && r[3] === bakeId && yes_(r[11]));
      if (duplicate) throw new Error('You have already voted for this bake.');
    }

    const voteId = 'V-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random()*9000+1000);
    voteSheet.appendRow([voteId, new Date(), voter, bake.id, bake.baker, scores[0], scores[1], scores[2], scores[3], scores[4], comment, 'Yes']);
    SpreadsheetApp.flush();
    return { ok: true, message: voting.settings.success_message || 'Vote submitted — thank you!' };
  } finally {
    lock.releaseLock();
  }
}

function keyValueMap_(rows, keyIndex, valueIndex) {
  const out = {};
  rows.forEach(r => { if (r[keyIndex]) out[r[keyIndex]] = r[valueIndex]; });
  return out;
}
function unique_(arr) { return Array.from(new Set(arr)); }
function yes_(v) { return String(v || '').toLowerCase() === 'yes' || v === true; }
function numOrBlank_(v) { return v === '' || v == null ? '' : Number(v); }
function clean_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 500); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

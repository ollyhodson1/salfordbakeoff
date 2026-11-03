import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1?external=react';

const html = htm.bind(React.createElement);
const CONFIG = window.GSBO_CONFIG || { API_URL: '', DEMO_MODE: true };

const demo = {
  participants: ['Demo Baker', 'Demo Voter', 'Another Baker'],
  home: {
    site_headline: 'The Great Salford Bake Off',
    site_subheading: 'All the reward, none of the pressure.',
    welcome_text: 'Follow the competition, see who is baking next, cast your votes and track the race for Star Baker.',
    current_week: 'Demo week',
    latest_elimination: 'Sample Contestant',
    next_bakers: 'Demo Baker',
    announcement: 'Demo mode is on.',
    show_top_n: 3
  },
  rules: [
    { order:1, section:'Overview', title:'How it works', text:'Everyone is randomly assigned a Great British Bake Off contestant. When that contestant is eliminated, it is your turn to bring in a bake.' },
    { order:2, section:'Voting', title:'Scoring', text:'Every bake is scored out of 10 for Taste, Appearance, Bake Quality, Creativity and Overall Enjoyment.' }
  ],
  contestants: [
    { id:'C01', name:'Sample Contestant', person1:'Demo Baker', person2:'', status:'Eliminated', eliminationWeek:'Demo week', bakeStatus1:'Due', bakeStatus2:'', photo:'' },
    { id:'C02', name:'Sample Contestant 2', person1:'Demo Voter', person2:'', status:'Active', eliminationWeek:'', bakeStatus1:'Not due', bakeStatus2:'', photo:'' },
    { id:'C03', name:'Sample Contestant 3', person1:'Another Baker', person2:'', status:'Active', eliminationWeek:'', bakeStatus1:'Not due', bakeStatus2:'', photo:'' }
  ],
  bakes: [
    { id:'B001', baker:'Demo Baker', contestant:'Sample Contestant', name:'Lemon Drizzle Cake', date:'', photo:'', description:'A sample bake so you can preview the voting page.', votingOpen:true, show:true, shopBought:false, allergens:'', status:'Baked' }
  ],
  voting: {
    settings: { voting_page_title:"Vote for this week's bake", voting_intro:'Try the bake, then score it honestly across the five categories below.', global_voting_open:'Yes', allow_comments:'Yes', success_message:'Vote submitted — thank you!' },
    categories: [
      { key:'taste', label:'Taste', max:10, help:'How good does it taste?' },
      { key:'appearance', label:'Appearance', max:10, help:'How good does it look?' },
      { key:'bake_quality', label:'Bake Quality', max:10, help:'How well has it been made overall?' },
      { key:'creativity', label:'Creativity', max:10, help:'How interesting or imaginative is it?' },
      { key:'overall_enjoyment', label:'Overall Enjoyment', max:10, help:'Taking everything into account, how much did you enjoy it?' }
    ]
  },
  leaderboardSettings: {
    leaderboard_title: 'Star Baker Leaderboard',
    leaderboard_intro: 'The current standings based on valid votes.',
    show_category_breakdown: 'No',
    show_vote_count: 'No',
    show_only_closed_bakes: 'No',
    show_total_score: 'No',
    show_bake_name: 'No'
  },
  leaderboard: [
    { rank:1, bakeId:'B009', baker:'Sample Star Baker', bake:'Chocolate Cake', votes:8, taste:9.1, appearance:8.6, bakeQuality:9.0, creativity:8.4, overallEnjoyment:9.2, total:44.3, status:'Voting closed' }
  ]
};

async function getBootstrap() {
  if (!CONFIG.API_URL) {
    if (CONFIG.DEMO_MODE) return demo;
    throw new Error('The website connection has not been configured yet.');
  }
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('action','bootstrap');
  url.searchParams.set('_',Date.now());
  const res = await fetch(url.toString(), { redirect:'follow' });
  if (!res.ok) throw new Error('Could not load the Bake Off data.');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Could not load the Bake Off data.');
  return data.data;
}

async function submitVote(payload) {
  if (!CONFIG.API_URL) {
    await new Promise(r => setTimeout(r, 450));
    return { ok:true, demo:true, message:'Demo vote accepted locally.' };
  }
  const body = new URLSearchParams();
  body.set('action','vote');
  body.set('payload', JSON.stringify(payload));
  const res = await fetch(CONFIG.API_URL, {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body:body.toString(),
    redirect:'follow'
  });
  const result = await res.json();
  if (!result.ok) throw new Error(result.error || 'Your vote could not be submitted.');
  return result;
}

function initials(name='') {
  return name.split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase() || 'GB';
}
const yn = value => String(value || '').toLowerCase() === 'yes' || value === true;
const number = value => Number(value || 0);
const fmt = value => value === '' || value == null ? '—' : Number(value).toFixed(1);

function leaderboardRows(data) {
  const onlyClosed = yn(data.leaderboardSettings?.show_only_closed_bakes);
  return [...(data.leaderboard || [])]
    .filter(row => number(row.votes) > 0)
    .filter(row => {
      if (!onlyClosed) return true;
      const bake = (data.bakes || []).find(b => b.id === row.bakeId);
      return bake ? !bake.votingOpen : String(row.status || '').toLowerCase() === 'voting closed';
    })
    .sort((a,b) => number(b.total) - number(a.total));
}

function SignIn({ data, onSignIn }) {
  const [name,setName] = useState('');
  return html`
    <main className="signin-screen">
      <section className="signin-card">
        <div className="logo-mark">🍰</div>
        <div className="eyebrow">University of Salford</div>
        <h1>The Great Salford Bake Off</h1>
        <p>Choose your name to enter. Your sign-in is used to make sure you cannot vote for your own bake, and to prevent duplicate votes.</p>
        <div className="field">
          <label htmlFor="name">Who are you?</label>
          <select id="name" value=${name} onChange=${e=>setName(e.target.value)}>
            <option value="">Select your name…</option>
            ${data.participants.map(p=>html`<option key=${p} value=${p}>${p}</option>`)}
          </select>
        </div>
        <button className="primary-btn" disabled=${!name} onClick=${()=>onSignIn(name)}>Enter the tent</button>
        ${!CONFIG.API_URL ? html`<div className="setup-note">Preview mode is currently on.</div>` : null}
      </section>
    </main>`;
}

function Header({ user, page, setPage, signOut }) {
  const items = [
    ['home','Home'],['rules','Overview & Rules'],['contestants','Contestants & Pairings'],['bakes','The Bakes'],['voting','Voting'],['leaderboard','Leaderboard']
  ];
  return html`<header className="topbar">
    <div className="topbar-inner">
      <div className="brand"><div className="brand-mark">🍰</div><strong>Great Salford Bake Off</strong></div>
      <nav className="nav">${items.map(([id,label])=>html`<button className=${page===id?'active':''} onClick=${()=>setPage(id)}>${label}</button>`)}</nav>
      <div className="user-menu"><span className="user-pill">${user}</span><button className="signout" onClick=${signOut}>Sign out</button></div>
    </div>
    <nav className="mobile-nav">${items.map(([id,label])=>html`<button className=${page===id?'active':''} onClick=${()=>setPage(id)}>${label}</button>`)}</nav>
  </header>`;
}

function Home({ data, setPage }) {
  const h = data.home || {};
  const topN = number(h.show_top_n) || 3;
  const leaders = leaderboardRows(data).slice(0,topN);
  const leaderboardSettings = data.leaderboardSettings || {};
  const showBake = yn(leaderboardSettings.show_bake_name);
  const showTotal = yn(leaderboardSettings.show_total_score);
  const openBakes = (data.bakes||[]).filter(b=>b.votingOpen);
  return html`<main className="page">
    <section className="hero">
      <div className="hero-main">
        <div className="eyebrow">The office competition nobody trained for</div>
        <h1>${h.site_headline || 'The Great Salford Bake Off'}</h1>
        <p>${h.welcome_text || ''}</p>
        <div className="hero-meta">
          ${h.current_week ? html`<span className="meta-chip">Current: ${h.current_week}</span>`:null}
          ${h.episode_date ? html`<span className="meta-chip">Next episode: ${h.episode_date}</span>`:null}
          ${openBakes.length ? html`<span className="meta-chip">${openBakes.length} vote${openBakes.length===1?'':'s'} open</span>`:null}
        </div>
      </div>
      <div className="hero-side">
        <div className="info-card"><div className="label">Latest elimination</div><div className="value">${h.latest_elimination || 'TBC'}</div></div>
        <div className="info-card"><div className="label">Next to bake</div><div className="value">${h.next_bakers || 'Nobody yet'}</div></div>
      </div>
    </section>
    ${h.announcement ? html`<div className="notice">${h.announcement}</div>` : null}

    <div className="section-head"><div><h2>Star Baker standings</h2><p>The current leaders based on valid votes.</p></div><button className="text-link" onClick=${()=>setPage('leaderboard')}>Full leaderboard →</button></div>
    ${leaders.length ? html`<div className="grid-3">${leaders.map((x,i)=>html`<div className="card stat-card"><span>#${i+1}</span><strong>${x.baker}</strong>${showBake || showTotal ? html`<span>${[showBake ? x.bake : '', showTotal ? `${fmt(x.total)}/50` : ''].filter(Boolean).join(' · ')}</span>` : null}</div>`)}</div>` : html`<div className="empty-state"><strong>No scores yet</strong></div>`}

    <div className="section-head"><div><h2>Voting now</h2><p>These bakes currently have voting open.</p></div><button className="text-link" onClick=${()=>setPage('voting')}>Go to voting →</button></div>
    ${openBakes.length ? html`<div className="grid-3">${openBakes.slice(0,3).map(b=>html`<div className="card stat-card"><span>${b.baker}</span><strong>${b.name}</strong><span>${b.contestant || 'Great Salford Bake Off'}</span></div>`)}</div>` : html`<div className="empty-state"><strong>Nothing to judge just yet</strong></div>`}
  </main>`;
}

function Rules({ data }) {
  const groups = useMemo(()=>{
    const out={};
    [...(data.rules||[])].sort((a,b)=>number(a.order)-number(b.order)).forEach(r=>{ (out[r.section] ||= []).push(r); });
    return out;
  },[data.rules]);
  return html`<main className="page"><header className="page-heading"><div className="eyebrow">How it works</div><h1>Overview & Rules</h1><p>Everything you need to know before your contestant gets eliminated and panic sets in.</p></header>
    ${Object.entries(groups).map(([section,rules])=>html`<section className="rule-group"><h2>${section}</h2><div className="rules-grid">${rules.map(r=>html`<article className="card rule-card"><h3>${r.title}</h3><p>${r.text}</p></article>`)}</div></section>`)}
  </main>`;
}

function Contestants({ data }) {
  return html`<main className="page"><header className="page-heading"><div className="eyebrow">The draw</div><h1>Contestants & Pairings</h1><p>Your Bake Off contestant decides how long you can enjoy everybody else's work before it becomes your turn.</p></header>
    <div className="contestant-grid">${(data.contestants||[]).map(c=>html`<article className="card contestant-card">
      <div className="contestant-photo" style=${c.photo?{backgroundImage:`url(${c.photo})`}:{}}>${c.photo?'':initials(c.name)}</div>
      <div className="contestant-body"><div className="status-row"><h3>${c.name || 'Contestant TBC'}</h3><span className=${`status ${(c.status||'').toLowerCase()}`}>${c.status || 'Active'}</span></div>
      <div className="pairing"><strong>Assigned to:</strong> ${[c.person1,c.person2].filter(Boolean).join(' & ') || 'TBC'}${c.eliminationWeek ? html`<br/><strong>Eliminated:</strong> ${c.eliminationWeek}`:null}</div></div>
    </article>`)}</div>
  </main>`;
}

function Bakes({ data }) {
  const bakes=(data.bakes||[]).filter(b=>b.show!==false);
  return html`<main className="page"><header className="page-heading"><div className="eyebrow">The evidence</div><h1>The Bakes</h1><p>A running gallery of every contribution to the Great Salford Bake Off.</p></header>
  ${bakes.length ? html`<div className="bakes-grid">${bakes.map(b=>html`<article className="card bake-card"><div className="bake-img" style=${b.photo?{backgroundImage:`url(${b.photo})`}:{}}>${b.photo?'':'🧁'}</div><div className="bake-body"><div className="byline">${b.baker}</div><h3>${b.name}</h3><p>${b.description || ''}</p><div className="tags">${b.shopBought?html`<span className="tag">Shop-bought</span>`:html`<span className="tag">Homemade</span>`}${b.allergens?html`<span className="tag">Allergens: ${b.allergens}</span>`:null}${b.votingOpen?html`<span className="tag">Voting open</span>`:null}</div></div></article>`)}</div>` : html`<div className="empty-state"><strong>No bakes yet</strong></div>`}
  </main>`;
}

function Voting({ data, user, onRefresh }) {
  const settings=data.voting?.settings||{};
  const allOpen=(data.bakes||[]).filter(b=>b.votingOpen);
  const [selected,setSelected]=useState(allOpen.find(b=>b.baker!==user)?.id || allOpen[0]?.id || '');
  const selectedBake=allOpen.find(b=>b.id===selected);
  const cats=data.voting?.categories||[];
  const initialScores=Object.fromEntries(cats.map(c=>[c.key,5]));
  const [scores,setScores]=useState(initialScores);
  const [comment,setComment]=useState('');
  const [sending,setSending]=useState(false);
  const [message,setMessage]=useState(null);
  const globalOpen=yn(settings.global_voting_open ?? 'Yes');

  useEffect(()=>{ setScores(Object.fromEntries(cats.map(c=>[c.key,5]))); setComment(''); setMessage(null); },[selected]);

  async function send() {
    if (!selectedBake) return;
    setSending(true); setMessage(null);
    try {
      const result=await submitVote({ voter:user, bakeId:selectedBake.id, scores, comment });
      setMessage({type:'success', text: result.message || settings.success_message || 'Vote submitted — thank you!'});
      if (!result.demo) await onRefresh();
    } catch(err) {
      setMessage({type:'error', text:err.message});
    } finally { setSending(false); }
  }

  if(!globalOpen) return html`<main className="page"><header className="page-heading"><div className="eyebrow">Judging paused</div><h1>${settings.voting_page_title || 'Voting'}</h1></header><div className="empty-state"><strong>Voting is currently closed</strong></div></main>`;
  if(!allOpen.length) return html`<main className="page"><header className="page-heading"><div className="eyebrow">Get your scores ready</div><h1>${settings.voting_page_title || 'Voting'}</h1></header><div className="empty-state"><strong>No votes yet</strong></div></main>`;

  return html`<main className="page"><header className="page-heading"><div className="eyebrow">Time to judge</div><h1>${settings.voting_page_title || 'Voting'}</h1><p>${settings.voting_intro || ''}</p></header>
    <div className="vote-layout">
      <aside className="vote-list">${allOpen.map(b=>{
        const own=b.baker===user;
        return html`<button className=${`${selected===b.id?'active ':''}${own?'locked':''}`} disabled=${own} onClick=${()=>setSelected(b.id)}><strong>${b.name}</strong><br/><span>${b.baker}${own?' · your bake':''}</span></button>`;
      })}</aside>
      ${selectedBake ? (selectedBake.baker===user ? html`<div className="empty-state"><strong>Your own bake is locked</strong>You can see it, but the website will not let you score it.</div>` : html`<section className="card vote-form"><div className="byline">Baked by ${selectedBake.baker}</div><h2>${selectedBake.name}</h2><p>${selectedBake.contestant ? `Triggered by ${selectedBake.contestant}'s elimination.`:''}</p>
        ${cats.map(c=>html`<div className="score-row"><div className="score-label"><strong>${c.label}</strong><span>${c.help}</span></div><input type="range" min="1" max=${c.max||10} step="1" value=${scores[c.key]||5} onChange=${e=>setScores({...scores,[c.key]:Number(e.target.value)})}/><div className="score-box">${scores[c.key]||5}</div></div>`)}
        ${yn(settings.allow_comments ?? 'Yes') ? html`<div className="field"><label>Optional comment</label><textarea rows="3" maxLength="500" value=${comment} onChange=${e=>setComment(e.target.value)} placeholder="Anything you particularly liked?" /></div>`:null}
        ${message ? html`<div className=${message.type==='error'?'vote-error':'vote-success'}>${message.text}</div>`:null}
        <button className="primary-btn" disabled=${sending} onClick=${send}>${sending?'Submitting…':'Submit vote'}</button>
      </section>`):null}
    </div>
  </main>`;
}

function Leaderboard({ data }) {
  const settings = data.leaderboardSettings || {};
  const rows = leaderboardRows(data);
  const showBake = yn(settings.show_bake_name);
  const showVotes = yn(settings.show_vote_count);
  const showBreakdown = yn(settings.show_category_breakdown);
  const showTotal = yn(settings.show_total_score);
  const intro = settings.leaderboard_intro ?? 'The current standings based on valid votes.';
  return html`<main className="page"><header className="page-heading"><div className="eyebrow">The race for Star Baker</div><h1>${settings.leaderboard_title || 'Leaderboard'}</h1>${intro ? html`<p>${intro}</p>` : null}</header>
  ${rows.length ? html`<div className="table-wrap"><table className=${showBreakdown ? 'leaderboard-table with-breakdown' : 'leaderboard-table'}>
    <thead><tr>
      <th scope="col">Rank</th><th scope="col">Baker</th>
      ${showBake ? html`<th scope="col">Bake</th>` : null}
      ${showVotes ? html`<th scope="col">Votes</th>` : null}
      ${showBreakdown ? html`<th scope="col">Taste</th><th scope="col">Appearance</th><th scope="col">Bake Quality</th><th scope="col">Creativity</th><th scope="col">Overall</th>` : null}
      ${showTotal ? html`<th scope="col">Total</th>` : null}
    </tr></thead>
    <tbody>${rows.map((r,i)=>html`<tr key=${r.bakeId}>
      <td className="rank">#${i+1}</td><td><strong>${r.baker}</strong></td>
      ${showBake ? html`<td>${r.bake}</td>` : null}
      ${showVotes ? html`<td>${r.votes}</td>` : null}
      ${showBreakdown ? html`<td>${fmt(r.taste)}</td><td>${fmt(r.appearance)}</td><td>${fmt(r.bakeQuality)}</td><td>${fmt(r.creativity)}</td><td>${fmt(r.overallEnjoyment)}</td>` : null}
      ${showTotal ? html`<td className="score-total">${fmt(r.total)}/50</td>` : null}
    </tr>`)}</tbody>
  </table></div>` : html`<div className="empty-state"><strong>No leaderboard yet</strong>The first results will appear automatically once voting begins.</div>`}
  </main>`;
}

function App() {
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [user,setUser]=useState(sessionStorage.getItem('gsbo_user')||'');
  const [page,setPage]=useState(location.hash.replace('#/','') || 'home');
  async function load(){ try{ setError(''); setData(await getBootstrap()); } catch(e){ setError(e.message); } }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ location.hash=`#/${page}`; },[page]);
  useEffect(()=>{ const f=()=>setPage(location.hash.replace('#/','')||'home'); addEventListener('hashchange',f); return()=>removeEventListener('hashchange',f); },[]);
  if(!data && !error) return html`<div className="loading-screen"><div className="loader"></div></div>`;
  if(error) return html`<div className="signin-screen"><section className="signin-card"><div className="logo-mark">!</div><div className="eyebrow">Connection problem</div><h1>We couldn't load the tent.</h1><p>${error}</p><button className="primary-btn" onClick=${load}>Try again</button></section></div>`;
  if(!user) return html`<${SignIn} data=${data} onSignIn=${name=>{sessionStorage.setItem('gsbo_user',name);setUser(name);setPage('home')}} />`;
  const pageComp = {
    home: html`<${Home} data=${data} setPage=${setPage}/>`,
    rules: html`<${Rules} data=${data}/>`,
    contestants: html`<${Contestants} data=${data}/>`,
    bakes: html`<${Bakes} data=${data}/>`,
    voting: html`<${Voting} data=${data} user=${user} onRefresh=${load}/>`,
    leaderboard: html`<${Leaderboard} data=${data}/>`
  }[page] || html`<${Home} data=${data} setPage=${setPage}/>`;
  return html`<div className="app-shell"><${Header} user=${user} page=${page} setPage=${setPage} signOut=${()=>{sessionStorage.removeItem('gsbo_user');setUser('')}}/>${pageComp}</div>`;
}

createRoot(document.getElementById('root')).render(html`<${App}/>`);

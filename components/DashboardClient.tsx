'use client'

import { useEffect, useRef } from 'react'

const DASHBOARD_HTML = `
<h2 class="sr-only">MOVE Certification Results Dashboard — four views: individual scores, call score distribution, certified users by department, and completion rates.</h2>
<div class="nav">
  <button class="nav-btn active" onclick="showSection('scores',this)">Individual scores</button>
  <button class="nav-btn" onclick="showSection('callscores',this)">Call score distribution</button>
  <button class="nav-btn" onclick="showSection('certified',this)">Certified by dept</button>
  <button class="nav-btn" onclick="showSection('completion',this)">Completion rates</button>
</div>

<div id="sec-scores" class="section visible">
  <div class="metric-row" id="scores-metrics"></div>
  <div class="toolbar">
    <div class="filter-row" style="margin:0">
      <label>Dept:</label>
      <select id="dept-filter" onchange="window.renderScoresTable && window.renderScoresTable()">
        <option value="">All</option><option>CS</option><option>IE</option><option>Support</option><option>Leadership</option>
      </select>
      <label>Status:</label>
      <select id="status-filter" onchange="window.renderScoresTable && window.renderScoresTable()">
        <option value="">All</option><option>Certified</option><option>In progress</option><option>Not started</option><option>Failed / needs retry</option>
      </select>
    </div>
    <button id="save-btn" class="btn-sm btn-save" onclick="saveAll()" style="display:none">Save changes</button>
    <span class="saved-msg" id="saved-msg">Saved!</span>
  </div>
  <div class="hint" id="edit-hint" style="display:none">Click any score or status cell to edit it directly.</div>
  <div style="overflow-x:auto">
    <table><thead><tr>
      <th>Name</th><th>Type</th><th>Dept</th>
      <th>Path score</th><th><span class="info-wrap">Guide score<span class="info-icon">i</span><span class="info-tooltip">Users were tested on their overall understanding of the MOVE framework, and their ability to be able to create CSQLs in SFDC.</span></span></th><th><span class="info-wrap">Call score<span class="info-icon">i</span><span class="info-tooltip">Score out of 20 based on the MOVE Rubric. Rep was measured on their overall discovery, and their execution on each of the MOVE framework phases.</span></span></th>
      <th>Overall status</th><th>Note / reason</th>
    </tr></thead>
    <tbody id="scores-body"></tbody></table>
  </div>
</div>

<div id="sec-callscores" class="section">
  <div class="metric-row" id="cs-metrics"></div>
  <div class="callscore-dist" id="cs-dist"></div>
  <div style="position:relative;width:100%;height:260px"><canvas id="csChart" role="img" aria-label="Bar chart of call score distribution"></canvas></div>
</div>

<div id="sec-certified" class="section">
  <div class="metric-row" id="cert-metrics"></div>
  <div style="position:relative;width:100%;height:280px;margin-bottom:1.5rem"><canvas id="certChart" role="img" aria-label="Bar chart of certified users per department"></canvas></div>
  <div style="font-size:11px;font-weight:500;color:var(--color-text-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Certified individuals</div>
  <div style="overflow-x:auto"><table><thead><tr><th>Name</th><th>Title</th><th>Dept</th><th>Path</th><th>Guide</th><th>Call</th></tr></thead><tbody id="cert-body"></tbody></table></div>
</div>

<div id="sec-completion" class="section">
  <div class="metric-row" id="comp-metrics"></div>
  <div id="comp-dept-cards"></div>
  <div style="position:relative;width:100%;height:300px;margin-top:1rem"><canvas id="compChart" role="img" aria-label="Stacked bar chart of completion by department"></canvas></div>
</div>
`

const DASHBOARD_STYLES = `
.nav{display:flex;gap:6px;flex-wrap:wrap;padding:1rem 0 1.25rem;border-bottom:.5px solid var(--color-border-tertiary);margin-bottom:1.25rem}
.nav-btn{font-size:12px;padding:5px 12px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);cursor:pointer;transition:all .15s}
.nav-btn.active{background:#248567;color:#fff;border-color:#248567}
.section{display:none}.section.visible{display:block}
.metric-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:1.25rem}
.metric{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:12px 14px}
.metric-label{font-size:11px;color:var(--color-text-secondary);margin-bottom:4px}
.metric-value{font-size:22px;font-weight:500;color:var(--color-text-primary)}
.metric-sub{font-size:11px;color:var(--color-text-secondary);margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;font-weight:500;color:var(--color-text-secondary);padding:6px 10px;border-bottom:.5px solid var(--color-border-tertiary);white-space:nowrap}
td{padding:6px 8px;border-bottom:.5px solid var(--color-border-tertiary);color:var(--color-text-primary);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--color-background-secondary)}
.badge{display:inline-flex;align-items:center;font-size:11px;padding:2px 8px;border-radius:99px;font-weight:500;white-space:nowrap}
.b-cert{background:#e8f5f0;color:#0f6e56}
.b-fail{background:#fcebeb;color:#a32d2d}
.b-prog{background:#faeeda;color:#854f0b}
.b-none{background:var(--color-background-secondary);color:var(--color-text-secondary);border:.5px solid var(--color-border-secondary)}
.b-dept{background:var(--color-background-secondary);color:var(--color-text-secondary);border:.5px solid var(--color-border-secondary)}
.score-hi{color:#248567;font-weight:500}
.score-mid{color:#EF9F27;font-weight:500}
.score-lo{color:#E24B4A;font-weight:500}
.score-na{color:var(--color-text-secondary);font-style:italic;font-size:12px}
.editable-cell{cursor:pointer;border-radius:4px;padding:2px 4px;transition:background .12s;min-width:36px;display:inline-block}
.editable-cell:hover{background:var(--color-background-secondary);outline:.5px dashed var(--color-border-secondary)}
.editing input,.editing select{font-size:13px;padding:3px 6px;border:.5px solid #248567;border-radius:4px;background:var(--color-background-primary);color:var(--color-text-primary);width:90px;outline:none}
.editing input[type=number]{width:64px}
.reason-input{font-size:12px;padding:3px 7px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);background:var(--color-background-primary);color:var(--color-text-primary);width:180px}
.reason-input:focus{outline:none;border-color:#248567}
.filter-row{display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center}
.filter-row label{font-size:12px;color:var(--color-text-secondary)}
.filter-row select{font-size:12px;padding:4px 8px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);background:var(--color-background-primary);color:var(--color-text-primary)}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:1rem;flex-wrap:wrap}
.btn-sm{font-size:12px;padding:5px 12px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);cursor:pointer}
.btn-sm:hover{background:var(--color-background-secondary)}
.btn-save{border-color:#248567;color:#248567}
.saved-msg{font-size:12px;color:#248567;opacity:0;transition:opacity .3s}
.saved-msg.show{opacity:1}
.dept-card{border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:1rem 1.25rem;margin-bottom:10px}
.dept-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.dept-name{font-weight:500;font-size:14px;color:var(--color-text-primary)}
.dept-count{font-size:13px;color:var(--color-text-secondary)}
.dept-pct{font-size:20px;font-weight:500}
.bar-wrap{background:var(--color-background-secondary);border-radius:99px;height:8px;overflow:hidden}
.bar-fill{height:8px;border-radius:99px;background:#248567;transition:width .4s}
.callscore-dist{display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px;margin-bottom:1.5rem}
.cs-card{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:10px 8px;text-align:center}
.cs-score{font-size:20px;font-weight:500}
.cs-count{font-size:12px;color:var(--color-text-secondary);margin-top:2px}
.cs-bar{height:4px;border-radius:99px;margin-top:8px;background:var(--color-background-primary);overflow:hidden}
.cs-bar-fill{height:4px;border-radius:99px}
.legend-row{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:12px}
.legend-item{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--color-text-secondary)}
.legend-dot{width:10px;height:10px;border-radius:2px;flex-shrink:0}
.hint{font-size:11px;color:var(--color-text-secondary);margin-bottom:10px}
.info-wrap{position:relative;display:inline-flex;align-items:center;gap:4px}
.info-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:99px;background:var(--color-background-secondary);border:.5px solid var(--color-border-secondary);color:var(--color-text-secondary);font-size:10px;cursor:default;font-style:normal;line-height:1;flex-shrink:0}
.info-tooltip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1c1b19;color:#fff;font-size:12px;line-height:1.5;padding:8px 10px;border-radius:6px;width:260px;white-space:normal;z-index:100;font-weight:400;pointer-events:none}
.info-tooltip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#1c1b19}
.info-wrap:hover .info-tooltip{display:block}
`

export default function DashboardClient({ isAdmin }: { isAdmin: boolean }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Inject styles
    const style = document.createElement('style')
    style.textContent = DASHBOARD_STYLES
    document.head.appendChild(style)

    // Show admin-only UI
    if (isAdmin) {
      const saveBtn = document.getElementById('save-btn')
      const hint = document.getElementById('edit-hint')
      if (saveBtn) saveBtn.style.display = ''
      if (hint) hint.style.display = ''
    }

    // Load Chart.js then init dashboard logic
    const chartScript = document.createElement('script')
    chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    chartScript.onload = () => runDashboard(isAdmin)
    document.head.appendChild(chartScript)
  }, [isAdmin])

  return <div dangerouslySetInnerHTML={{ __html: DASHBOARD_HTML }} />
}

// ─── Dashboard logic ────────────────────────────────────────────────────────

function runDashboard(isAdmin: boolean) {
  const newHireNames = new Set(['Andrew Stevenson', 'Taylor Sievers'])
  const tamNames = new Set(['Iryna Pekarchyk', 'Benjamin Rasalan', 'Jonathan Monje', 'Liezl Caña'])

  type User = {
    name: string; title: string; dept: string
    pathScore: number | null; guideScore: number | null; callScore: number | null
    reason: string
  }

  const BASE: User[] = [
    {name:'Andrew Stevenson',title:'Customer Success Manager',dept:'CS',pathScore:null,guideScore:81,callScore:18,reason:''},
    {name:'April Ayers',title:'Director, Customer Success',dept:'CS',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:'Ashaiah Rainey',title:'Implementation Engineer',dept:'IE',pathScore:94,guideScore:88,callScore:16,reason:''},
    {name:'Asim Siddiqi',title:'Assoc. Manager, IE',dept:'IE',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:'Benjamin Rasalan',title:'Technical Account Manager',dept:'Support',pathScore:null,guideScore:81,callScore:null,reason:''},
    {name:'Darwin Medina',title:'Customer Success Manager',dept:'CS',pathScore:73,guideScore:73,callScore:null,reason:''},
    {name:'Dave John Deocampo',title:'Customer Success Manager',dept:'CS',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'Francisco Maristela',title:'Sr. Manager, Customer Support',dept:'Support',pathScore:null,guideScore:75,callScore:null,reason:''},
    {name:'Geoffrey Parker',title:'Senior Director, Customer Support',dept:'Support',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'George Dongallo',title:'Customer Success Manager',dept:'CS',pathScore:100,guideScore:100,callScore:19,reason:''},
    {name:'Giana Contrada',title:'Customer Success Manager',dept:'CS',pathScore:92,guideScore:92,callScore:null,reason:''},
    {name:'Igor Borges de Almeida',title:'Senior Customer Success Manager',dept:'CS',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'Iryna Pekarchyk',title:'Technical Account Manager',dept:'Support',pathScore:null,guideScore:75,callScore:null,reason:''},
    {name:'James Barry',title:'Senior Implementation Engineer',dept:'IE',pathScore:64,guideScore:64,callScore:null,reason:''},
    {name:'Jeffrey Ball',title:'Senior Manager, Customer Success',dept:'CS',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:'Jenna Duda',title:'Senior Manager, Customer Success',dept:'CS',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:'John David',title:'Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:null,reason:''},
    {name:'Johnrey Aballe',title:'Customer Success Manager',dept:'CS',pathScore:100,guideScore:100,callScore:20,reason:''},
    {name:'Jonathan Monje',title:'Technical Account Manager',dept:'Support',pathScore:null,guideScore:75,callScore:null,reason:''},
    {name:'Julie Hodgson',title:'Senior Manager, Customer Success',dept:'CS',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:"Karen O'Connor",title:'Strategic Customer Success Manager',dept:'CS',pathScore:90,guideScore:81,callScore:18,reason:''},
    {name:'Kateryna Antonenko',title:'Senior Customer Success Manager',dept:'CS',pathScore:94,guideScore:88,callScore:16,reason:''},
    {name:'Kathleen Olarte',title:'Strategic Customer Success Manager',dept:'CS',pathScore:97,guideScore:94,callScore:20,reason:''},
    {name:'Kelly Berg',title:'VP of Customer Experience',dept:'Leadership',pathScore:100,guideScore:100,callScore:null,reason:''},
    {name:'Kelly Mendoza',title:'Strategic Customer Success Manager',dept:'CS',pathScore:90,guideScore:81,callScore:16,reason:''},
    {name:'Larry Xiao',title:'Customer Success Manager',dept:'CS',pathScore:90,guideScore:81,callScore:20,reason:''},
    {name:'Lesley Machado',title:'Senior Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:18,reason:''},
    {name:'Liezl Caña',title:'Technical Account Manager',dept:'Support',pathScore:null,guideScore:88,callScore:null,reason:''},
    {name:'Lincoln Brown',title:'Customer Success Manager',dept:'CS',pathScore:80,guideScore:80,callScore:null,reason:''},
    {name:'Lori Nolen',title:'Senior Customer Success Manager',dept:'CS',pathScore:90,guideScore:81,callScore:16,reason:''},
    {name:'Luccas Comitre',title:'Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:18,reason:''},
    {name:'Marine Grandjean',title:'Customer Success Manager',dept:'CS',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'Martin Wilson',title:'Senior Customer Support Enablement Specialist',dept:'Support',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'Michael Maldonado',title:'Customer Success Manager',dept:'CS',pathScore:97,guideScore:94,callScore:18,reason:''},
    {name:'Natalie Botto',title:'Customer Success Manager',dept:'CS',pathScore:80,guideScore:80,callScore:null,reason:''},
    {name:'Pushpak Patel',title:'Implementation Engineer',dept:'IE',pathScore:93,guideScore:86,callScore:null,reason:''},
    {name:'Sarah Herbaugh',title:'Senior Customer Success Manager',dept:'CS',pathScore:90,guideScore:81,callScore:16,reason:''},
    {name:'Sergio Ramirez-Diaz',title:'Senior Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:null,reason:''},
    {name:'Silvia Rosado',title:'Implementation Engineer',dept:'IE',pathScore:94,guideScore:88,callScore:16,reason:''},
    {name:'Taylor Sievers',title:'Customer Success Manager',dept:'CS',pathScore:null,guideScore:75,callScore:18,reason:''},
    {name:'Timothy Andrews',title:'Customer Success Manager',dept:'CS',pathScore:85,guideScore:86,callScore:null,reason:''},
    {name:'Victoria Klinetska',title:'Customer Success Manager',dept:'CS',pathScore:null,guideScore:null,callScore:null,reason:''},
    {name:'Vivian Mach',title:'Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:16,reason:''},
    {name:'Yuliia Valko',title:'Senior Customer Success Manager',dept:'CS',pathScore:87,guideScore:75,callScore:null,reason:''},
    {name:'Zachary Nelson',title:'Manager, Customer Success',dept:'CS',pathScore:100,guideScore:100,callScore:null,reason:''},
  ]

  let DATA: User[] = BASE.map(u => ({ ...u }))
  const statusOverrides: Record<string, string> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let csChart: any = null, certChart: any = null, compChart: any = null

  function isCertified(u: User) {
    if (tamNames.has(u.name)) return u.guideScore != null && u.guideScore >= 80
    if (newHireNames.has(u.name)) return (u.guideScore != null && u.guideScore >= 80) && u.callScore != null
    return (u.pathScore != null && u.pathScore >= 80) && (u.guideScore != null && u.guideScore >= 80) && u.callScore != null
  }

  function getStatus(u: User) {
    if (isCertified(u)) return 'Certified'
    const hasFailed = (u.guideScore != null && u.guideScore < 80 && u.guideScore > 0) || (u.pathScore != null && u.pathScore < 80 && u.pathScore > 0)
    if (hasFailed) return 'Failed / needs retry'
    if (u.pathScore != null || u.guideScore != null || u.callScore != null) return 'In progress'
    return 'Not started'
  }

  function getEffectiveStatus(u: User) { return statusOverrides[u.name] || getStatus(u) }
  function scoreClass(s: number | null) { if (s == null) return 'score-na'; if (s >= 90) return 'score-hi'; if (s >= 80) return 'score-mid'; return 'score-lo' }
  function scoreDisp(s: number | null) { return s == null ? '—' : String(s) }

  function statusBadge(st: string) {
    if (st === 'Certified') return `<span class="badge b-cert">Certified</span>`
    if (st === 'Failed / needs retry') return `<span class="badge b-fail">Failed / needs retry</span>`
    if (st === 'In progress') return `<span class="badge b-prog">In progress</span>`
    return `<span class="badge b-none">Not started</span>`
  }

  function callDisp(cs: number | null) {
    if (cs == null) return '<span class="score-na">—</span>'
    const p = cs >= 16
    return `<span class="${p ? 'score-hi' : 'score-lo'}">${cs} ${p ? '✓' : '✗'}</span>`
  }

  function makeScoreCell(name: string, field: keyof User, value: number | null, isNA: boolean) {
    if (isNA) return '<span class="score-na">N/A</span>'
    const sc = scoreClass(value), disp = scoreDisp(value)
    if (!isAdmin) return `<span class="${sc}">${disp}</span>`
    return `<span class="editable-cell ${sc}" onclick="startEditScore(this,'${name}','${field}')">${disp}</span>`
  }

  function makeStatusCell(name: string, currentStatus: string) {
    if (!isAdmin) return statusBadge(currentStatus)
    const opts = ['Certified', 'In progress', 'Not started', 'Failed / needs retry']
    return `<select class="filter-row select" style="font-size:12px;padding:2px 6px;border:.5px solid var(--color-border-secondary);border-radius:4px;background:var(--color-background-primary);color:var(--color-text-primary)" onchange="overrideStatus('${name}',this.value)">
      ${opts.map(o => `<option ${o === currentStatus ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`
  }

  function renderScoresMetrics(users: User[]) {
    const t = users.length
    const c = users.filter(u => isCertified(u) || statusOverrides[u.name] === 'Certified').length
    const ip = users.filter(u => getEffectiveStatus(u) === 'In progress').length
    const fl = users.filter(u => getEffectiveStatus(u) === 'Failed / needs retry').length
    const ns = users.filter(u => getEffectiveStatus(u) === 'Not started').length
    document.getElementById('scores-metrics')!.innerHTML = `
      <div class="metric"><div class="metric-label">Total assigned</div><div class="metric-value">${t}</div></div>
      <div class="metric"><div class="metric-label">Certified</div><div class="metric-value" style="color:#248567">${c}</div><div class="metric-sub">${Math.round(c / t * 100)}%</div></div>
      <div class="metric"><div class="metric-label">In progress</div><div class="metric-value" style="color:#EF9F27">${ip}</div></div>
      <div class="metric"><div class="metric-label">Failed / retry</div><div class="metric-value" style="color:#E24B4A">${fl}</div></div>
      <div class="metric"><div class="metric-label">Not started</div><div class="metric-value" style="color:var(--color-text-secondary)">${ns}</div></div>`
  }

  function renderScoresTable() {
    const dept = (document.getElementById('dept-filter') as HTMLSelectElement).value
    const stat = (document.getElementById('status-filter') as HTMLSelectElement).value
    let users = [...DATA]
    if (dept) users = users.filter(u => u.dept === dept)
    if (stat) users = users.filter(u => getEffectiveStatus(u) === stat)
    renderScoresMetrics(users)
    document.getElementById('scores-body')!.innerHTML = users
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(u => {
        const isTAM = tamNames.has(u.name), isNH = newHireNames.has(u.name)
        const st = getEffectiveStatus(u)
        const reasonCell = isAdmin
          ? `<input class="reason-input" placeholder="Add note..." value="${u.reason || ''}" onchange="updateReason('${u.name}',this.value)" />`
          : `<span style="font-size:12px;color:var(--color-text-secondary)">${u.reason || '—'}</span>`
        return `<tr>
          <td><strong>${u.name}</strong>${isNH ? ' <span class="badge b-prog" style="font-size:10px">New hire</span>' : ''}${isTAM ? ' <span class="badge b-none" style="font-size:10px">TAM</span>' : ''}</td>
          <td style="font-size:12px;color:var(--color-text-secondary)">${u.title}</td>
          <td><span class="badge b-dept">${u.dept}</span></td>
          <td>${makeScoreCell(u.name, 'pathScore', u.pathScore, isTAM || isNH)}</td>
          <td>${makeScoreCell(u.name, 'guideScore', u.guideScore, false)}</td>
          <td>${makeScoreCell(u.name, 'callScore', u.callScore, isTAM)}</td>
          <td>${makeStatusCell(u.name, st)}</td>
          <td>${reasonCell}</td>
        </tr>`
      }).join('')
  }

  function renderCallScores() {
    const withCall = DATA.filter(u => u.callScore != null)
    const dist: Record<number, number> = {}
    withCall.forEach(u => { dist[u.callScore!] = (dist[u.callScore!] || 0) + 1 })
    const scores = Object.keys(dist).map(Number).sort((a, b) => a - b)
    const maxC = Math.max(...Object.values(dist), 1)
    const passed = withCall.filter(u => u.callScore! >= 16).length
    const avg = withCall.length ? withCall.reduce((s, u) => s + u.callScore!, 0) / withCall.length : 0
    document.getElementById('cs-metrics')!.innerHTML = `
      <div class="metric"><div class="metric-label">Calls scored</div><div class="metric-value">${withCall.length}</div></div>
      <div class="metric"><div class="metric-label">Passed (≥16)</div><div class="metric-value" style="color:#248567">${passed}</div><div class="metric-sub">${withCall.length ? Math.round(passed / withCall.length * 100) : 0}%</div></div>
      <div class="metric"><div class="metric-label">Did not pass</div><div class="metric-value" style="color:#E24B4A">${withCall.length - passed}</div></div>
      <div class="metric"><div class="metric-label">Avg score</div><div class="metric-value">${avg.toFixed(1)}</div></div>`
    document.getElementById('cs-dist')!.innerHTML = scores.map(s => {
      const cnt = dist[s], pct = Math.round(cnt / maxC * 100), color = s >= 16 ? '#248567' : '#E24B4A'
      return `<div class="cs-card"><div class="cs-score">${s}</div><div class="cs-count">${cnt} rep${cnt !== 1 ? 's' : ''}</div><div class="cs-bar"><div class="cs-bar-fill" style="width:${pct}%;background:${color}"></div></div></div>`
    }).join('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Chart = (window as any).Chart
    if (csChart) { csChart.destroy(); csChart = null }
    csChart = new Chart(document.getElementById('csChart'), { type: 'bar', data: { labels: scores.map(String), datasets: [{ label: '# of reps', data: scores.map(s => dist[s]), backgroundColor: scores.map(s => s >= 16 ? '#248567' : '#E24B4A'), borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Call score', font: { size: 12 } }, ticks: { autoSkip: false } }, y: { title: { display: true, text: '# of reps', font: { size: 12 } }, ticks: { stepSize: 1 } } } } })
  }

  function renderCertified() {
    const depts = ['CS', 'IE', 'Support', 'Leadership']
    const certByDept: Record<string, number> = {}
    depts.forEach(d => { certByDept[d] = DATA.filter(u => u.dept === d && (isCertified(u) || statusOverrides[u.name] === 'Certified')).length })
    const totalCert = DATA.filter(u => isCertified(u) || statusOverrides[u.name] === 'Certified').length
    document.getElementById('cert-metrics')!.innerHTML = `
      <div class="metric"><div class="metric-label">Total certified</div><div class="metric-value" style="color:#248567">${totalCert}</div><div class="metric-sub">of ${DATA.length}</div></div>
      ${depts.map(d => { const c = certByDept[d], t = DATA.filter(u => u.dept === d).length; return `<div class="metric"><div class="metric-label">${d}</div><div class="metric-value">${c}</div><div class="metric-sub">of ${t}</div></div>` }).join('')}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Chart = (window as any).Chart
    if (certChart) { certChart.destroy(); certChart = null }
    certChart = new Chart(document.getElementById('certChart'), { type: 'bar', data: { labels: depts, datasets: [{ label: 'Certified', data: depts.map(d => certByDept[d]), backgroundColor: ['#248567', '#378ADD', '#D6CEFF', '#EF9F27'], borderRadius: 4 }, { label: 'Not yet', data: depts.map(d => DATA.filter(u => u.dept === d).length - certByDept[d]), backgroundColor: depts.map(() => 'rgba(136,135,128,0.18)'), borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } })
    const certified = DATA.filter(u => isCertified(u) || statusOverrides[u.name] === 'Certified').sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name))
    document.getElementById('cert-body')!.innerHTML = certified.map(u => `<tr>
      <td><strong>${u.name}</strong></td>
      <td style="font-size:12px;color:var(--color-text-secondary)">${u.title}</td>
      <td><span class="badge b-dept">${u.dept}</span></td>
      <td class="${scoreClass(u.pathScore)}">${tamNames.has(u.name) || newHireNames.has(u.name) ? '<span class="score-na">N/A</span>' : scoreDisp(u.pathScore)}</td>
      <td class="${scoreClass(u.guideScore)}">${scoreDisp(u.guideScore)}</td>
      <td>${tamNames.has(u.name) ? '<span class="score-na">N/A</span>' : callDisp(u.callScore)}</td>
    </tr>`).join('')
  }

  function renderCompletion() {
    const depts = ['CS', 'IE', 'Support', 'Leadership']
    const rows = depts.map(d => {
      const users = DATA.filter(u => u.dept === d), t = users.length
      const c = users.filter(u => isCertified(u) || statusOverrides[u.name] === 'Certified').length
      const ip = users.filter(u => getEffectiveStatus(u) === 'In progress').length
      const fl = users.filter(u => getEffectiveStatus(u) === 'Failed / needs retry').length
      const ns = users.filter(u => getEffectiveStatus(u) === 'Not started').length
      return { d, t, c, ip, fl, ns, pct: t ? Math.round(c / t * 100) : 0 }
    })
    const overall = Math.round(DATA.filter(u => isCertified(u) || statusOverrides[u.name] === 'Certified').length / DATA.length * 100)
    document.getElementById('comp-metrics')!.innerHTML = `
      <div class="metric"><div class="metric-label">Overall rate</div><div class="metric-value" style="color:#248567">${overall}%</div></div>
      ${rows.map(r => `<div class="metric"><div class="metric-label">${r.d}</div><div class="metric-value">${r.pct}%</div><div class="metric-sub">${r.c} of ${r.t}</div></div>`).join('')}`
    document.getElementById('comp-dept-cards')!.innerHTML = rows.map(r => `
      <div class="dept-card">
        <div class="dept-header">
          <div><div class="dept-name">${r.d}</div><div class="dept-count">${r.t} assigned · ${r.c} certified · ${r.fl} need retry · ${r.ns} not started</div></div>
          <div class="dept-pct" style="color:${r.pct >= 70 ? '#248567' : r.pct >= 40 ? '#EF9F27' : '#E24B4A'}">${r.pct}%</div>
        </div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${r.pct}%"></div></div>
      </div>`).join('') + `
      <div class="legend-row" style="margin-top:8px">
        <div class="legend-item"><div class="legend-dot" style="background:#248567"></div>Certified</div>
        <div class="legend-item"><div class="legend-dot" style="background:#EF9F27"></div>In progress</div>
        <div class="legend-item"><div class="legend-dot" style="background:#E24B4A"></div>Failed / needs retry</div>
        <div class="legend-item"><div class="legend-dot" style="background:rgba(136,135,128,0.3);border:.5px solid #888"></div>Not started</div>
      </div>`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Chart = (window as any).Chart
    if (compChart) { compChart.destroy(); compChart = null }
    compChart = new Chart(document.getElementById('compChart'), { type: 'bar', data: { labels: depts, datasets: [{ label: 'Certified', data: rows.map(r => r.c), backgroundColor: '#248567', stack: 's', borderRadius: [4, 4, 0, 0] }, { label: 'In progress', data: rows.map(r => r.ip), backgroundColor: '#EF9F27', stack: 's' }, { label: 'Failed', data: rows.map(r => r.fl), backgroundColor: '#E24B4A', stack: 's' }, { label: 'Not started', data: rows.map(r => r.ns), backgroundColor: 'rgba(136,135,128,0.25)', stack: 's' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } } })
  }

  function refreshAll() {
    renderScoresTable()
    renderCallScores()
    renderCertified()
    renderCompletion()
  }

  // Expose globals needed by inline onclick handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any

  w.renderScoresTable = renderScoresTable

  w.showSection =(id: string, btn: HTMLElement) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'))
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('sec-' + id)!.classList.add('visible')
    btn.classList.add('active')
  }

  w.startEditScore = (el: HTMLElement, name: string, field: string) => {
    if (!isAdmin || el.querySelector('input')) return
    const u = DATA.find(d => d.name === name)!
    const cur = (u as Record<string, unknown>)[field] != null ? (u as Record<string, unknown>)[field] : ''
    el.classList.add('editing')
    el.innerHTML = `<input type="number" min="0" max="100" value="${cur}" style="width:56px" onblur="commitScore(this,'${name}','${field}')" onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape'){event.target.closest('.editable-cell').dataset.cancel=1;this.blur()}" />`
    el.querySelector('input')!.focus()
    ;(el.querySelector('input') as HTMLInputElement).select()
  }

  w.commitScore = (input: HTMLInputElement, name: string, field: string) => {
    const el = input.closest('.editable-cell') as HTMLElement & { dataset: DOMStringMap }
    if (el.dataset.cancel) { delete el.dataset.cancel; el.classList.remove('editing'); renderScoresTable(); return }
    const val = input.value.trim()
    const u = DATA.find(d => d.name === name)!
    ;(u as Record<string, unknown>)[field] = val === '' ? null : Math.min(100, Math.max(0, parseInt(val)))
    renderScoresTable()
  }

  w.overrideStatus = (name: string, val: string) => { statusOverrides[name] = val; renderScoresTable() }

  w.updateReason = (name: string, val: string) => {
    const u = DATA.find(d => d.name === name)
    if (u) u.reason = val
  }

  w.saveAll = async () => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: DATA }),
      })
      if (!res.ok) throw new Error('Save failed')
      const msg = document.getElementById('saved-msg')!
      msg.classList.add('show')
      setTimeout(() => msg.classList.remove('show'), 2000)
      refreshAll()
    } catch {
      alert('Failed to save. Please try again.')
    }
  }

  // Load saved data then render
  fetch('/api/data')
    .then(r => r.ok ? r.json() : null)
    .then(json => {
      if (json?.data?.length) {
        json.data.forEach((saved: Partial<User>) => {
          const d = DATA.find(x => x.name === saved.name)
          if (d) {
            if (saved.pathScore !== undefined) d.pathScore = saved.pathScore
            if (saved.guideScore !== undefined) d.guideScore = saved.guideScore
            if (saved.callScore !== undefined) d.callScore = saved.callScore
            if (saved.reason !== undefined) d.reason = saved.reason || ''
          }
        })
      }
    })
    .catch(() => {})
    .finally(() => refreshAll())
}

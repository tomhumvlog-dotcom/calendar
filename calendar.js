// =============================================
// StudyTracker — calendar.js  (full rewrite)
// Views: Month | Week | Day
// Current date: May 19, 2026
// =============================================

// ─── Constants ───────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PRIORITY = {
  high:       { label:"High Priority", barCls:"bg-error",    badgeCls:"bg-error-container text-on-error-container",         calCls:"bg-error-container text-on-error-container" },
  medium:     { label:"Medium",        barCls:"bg-secondary", badgeCls:"bg-secondary-container text-on-secondary-container", calCls:"bg-secondary-container text-on-secondary-container" },
  assignment: { label:"Assignment",    barCls:"bg-tertiary",  badgeCls:"bg-tertiary-container text-on-tertiary-container",   calCls:"bg-tertiary-container text-on-tertiary-container" }
};

// ─── App State ───────────────────────────────
const state = {
  today:        new Date(2026, 4, 19),   // May 19 2026
  currentDate:  new Date(2026, 4, 1),    // month pointer
  selectedDate: new Date(2026, 4, 19),
  view:         "month",                 // "month" | "week" | "day"
  nextId:       20,
  tasks: {
    "2026-05-01": [
      { id:1,  title:"Finals Prep Kick-off", time:"09:00", priority:"high",       description:"Plan the full study schedule for finals week." }
    ],
    "2026-05-05": [
      { id:2,  title:"CS401 Assignment",     time:"23:59", priority:"assignment", description:"Submit linked-list implementation.", progress:65 },
      { id:3,  title:"Study Group",          time:"15:00", priority:"medium",     description:"Algorithms review with classmates." }
    ],
    "2026-05-07": [
      { id:4,  title:"Math Final Exam",      time:"10:00", priority:"high",       description:"Chapters 9–14. Focus on differential equations." }
    ],
    "2026-05-12": [
      { id:5,  title:"History Essay Due",    time:"23:59", priority:"assignment", description:"Upload to the portal.", progress:90 },
      { id:6,  title:"Review Flashcards",    time:"14:00", priority:"medium",     description:"Go through all Anki decks." }
    ],
    "2026-05-14": [
      { id:7,  title:"Physics Lab Report",   time:"17:00", priority:"assignment", description:"Write up experiment results.", progress:40 }
    ],
    "2026-05-19": [
      { id:8,  title:"CS Seminar Prep",      time:"09:00", priority:"high",       description:"Prepare slides for tomorrow's presentation." },
      { id:9,  title:"Review Notes",         time:"14:00", priority:"medium",     description:"Consolidate all lecture notes before finals." },
      { id:10, title:"Gym & Rest",           time:"18:00", priority:"assignment", description:"Active recovery — keep the mind fresh." }
    ],
    "2026-05-21": [
      { id:11, title:"Project Pitch",        time:"13:00", priority:"high",       description:"Present capstone project to the panel." }
    ],
    "2026-05-26": [
      { id:12, title:"Memorial Day",         time:"",      priority:"assignment", description:"No classes — rest and recharge." }
    ],
    "2026-05-28": [
      { id:13, title:"Final Exam — CS401",   time:"08:00", priority:"high",       description:"Cumulative. Focus on graphs and dynamic programming." },
      { id:14, title:"Post-exam Debrief",    time:"14:00", priority:"medium",     description:"Review what went well and what to improve." }
    ]
  }
};

// ─── Utility helpers ─────────────────────────
const dateKey = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const sameDay = (a,b) =>
  a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

const addDays = (base, n) => { const d=new Date(base); d.setDate(d.getDate()+n); return d; };

function formatTime(t) {
  if (!t) return "";
  const [h,m] = t.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

function escHtml(s) {
  const d=document.createElement("div"); d.textContent=s||""; return d.innerHTML;
}

function startOfWeek(d) {
  const r=new Date(d); r.setDate(r.getDate()-r.getDay()); return r;
}

// ─── Master render dispatcher ─────────────────
function render() {
  updateHeader();
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if      (state.view==="month") renderMonth(grid);
  else if (state.view==="week")  renderWeek(grid);
  else                           renderDay(grid);

  renderSidePanel();
}

// ─── Header ──────────────────────────────────
function updateHeader() {
  const y=state.currentDate.getFullYear(), m=state.currentDate.getMonth();
  const sd=state.selectedDate;
  let title="", sub="";

  if (state.view==="month") {
    title = `${MONTH_NAMES[m]} ${y}`;
    sub   = "Monthly overview";
  } else if (state.view==="week") {
    const ws=startOfWeek(sd), we=addDays(ws,6);
    title = ws.getMonth()===we.getMonth()
      ? `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
      : `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
    sub   = "Weekly schedule";
  } else {
    title = `${DAY_NAMES[sd.getDay()]}, ${MONTH_NAMES[sd.getMonth()]} ${sd.getDate()}, ${sd.getFullYear()}`;
    sub   = "Daily planner";
  }

  const disp = document.querySelector(".font-display.text-display");
  if (disp) disp.textContent = title;
  const subEl = disp?.nextElementSibling;
  if (subEl?.tagName==="P") subEl.textContent = sub;

  const mob = document.querySelector(".md\\:hidden.flex .font-h2.text-h2.text-on-surface");
  if (mob) mob.textContent = state.view==="month"
    ? `${MONTH_NAMES[m].slice(0,3)} ${y}`
    : title.slice(0,20);
}

// ═══════════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════════
function renderMonth(grid) {
  grid.className = "flex-1 grid grid-cols-7 bg-outline-variant gap-px";

  ensureDayHeader(true);

  const y=state.currentDate.getFullYear(), mo=state.currentDate.getMonth();
  const firstDay  = new Date(y,mo,1).getDay();
  const daysInMo  = new Date(y,mo+1,0).getDate();
  const prevLast  = new Date(y,mo,0).getDate();

  for (let i=0; i<35; i++) {
    let date; let inMonth=true;
    if (i<firstDay)                   { date=new Date(y,mo-1,prevLast-firstDay+i+1); inMonth=false; }
    else if (i>=firstDay+daysInMo)    { date=new Date(y,mo+1,i-firstDay-daysInMo+1); inMonth=false; }
    else                              { date=new Date(y,mo,i-firstDay+1); }
    grid.appendChild(buildMonthCell(date,inMonth));
  }
}

function buildMonthCell(date, inMonth) {
  const isToday    = sameDay(date, state.today);
  const isSelected = sameDay(date, state.selectedDate);
  const tasks      = state.tasks[dateKey(date)] || [];

  const cell = document.createElement("div");
  cell.className = [
    "p-2 min-h-[100px] flex flex-col relative transition-colors",
    inMonth
      ? "bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer"
      : "bg-surface-bright opacity-40 pointer-events-none"
  ].join(" ");

  if (isSelected && inMonth) {
    const ring = document.createElement("div");
    ring.className = "absolute inset-0 border-2 border-primary rounded z-10 pointer-events-none";
    cell.appendChild(ring);
  }

  const span = document.createElement("span");
  span.className = "font-body-sm text-body-sm font-medium ml-1 mb-1 " +
    (isToday ? "bg-primary text-on-primary w-6 h-6 inline-flex items-center justify-center rounded-full"
             : "text-on-surface");
  span.textContent = date.getDate();
  cell.appendChild(span);

  tasks.slice(0,3).forEach(t => {
    const chip = document.createElement("div");
    const p = PRIORITY[t.priority]||PRIORITY.assignment;
    chip.className = `${p.calCls} font-label-sm text-label-sm px-1.5 py-0.5 rounded mb-1 truncate shadow-sm`;
    chip.textContent = t.title;
    cell.appendChild(chip);
  });
  if (tasks.length>3) {
    const more=document.createElement("div");
    more.className="font-label-sm text-label-sm text-on-surface-variant px-1.5";
    more.textContent=`+${tasks.length-3} more`;
    cell.appendChild(more);
  }

  if (inMonth) cell.addEventListener("click", ()=>selectDate(date));
  return cell;
}

// ═══════════════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════════════
function renderWeek(grid) {
  grid.className = "flex-1 flex flex-col bg-surface-container-lowest overflow-hidden";

  const ws   = startOfWeek(state.selectedDate);
  const days = Array.from({length:7}, (_,i)=>addDays(ws,i));

  // Custom day header for week
  ensureDayHeader(false);
  const header = document.getElementById("day-header-row");
  header.innerHTML = "";
  header.className = "flex border-b border-outline-variant bg-surface-bright sticky top-0 z-20";

  // Time gutter spacer
  const gutterSpacer = document.createElement("div");
  gutterSpacer.className = "w-14 shrink-0 border-r border-outline-variant";
  header.appendChild(gutterSpacer);

  days.forEach(d => {
    const isToday = sameDay(d, state.today);
    const isSel   = sameDay(d, state.selectedDate);
    const col = document.createElement("div");
    col.className = [
      "flex-1 text-center py-2 border-r border-outline-variant last:border-r-0",
      "cursor-pointer hover:bg-surface-container transition-colors",
      isSel ? "bg-surface-container" : ""
    ].join(" ");
    col.innerHTML = `
      <div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">${DAY_SHORT[d.getDay()]}</div>
      <div class="mt-0.5">
        <span class="font-body-sm text-body-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full
          ${isToday?"bg-primary text-on-primary":"text-on-surface"}">${d.getDate()}</span>
      </div>`;
    col.addEventListener("click", ()=>selectDate(d));
    header.appendChild(col);
  });

  // Scrollable time body
  const body = document.createElement("div");
  body.className = "flex flex-1 overflow-y-auto custom-scrollbar";
  body.style.maxHeight = "520px";

  // Time gutter
  body.appendChild(buildTimeGutter(56));

  // 7 day columns
  days.forEach(d => {
    const col = document.createElement("div");
    const isSel = sameDay(d, state.selectedDate);
    col.className = "flex-1 border-r border-outline-variant last:border-r-0 relative " +
      (isSel ? "bg-surface-container-low" : "bg-surface-container-lowest");

    // Hour slots
    for (let h=0; h<24; h++) {
      const slot = document.createElement("div");
      slot.className = "h-14 border-b border-outline-variant hover:bg-surface-container transition-colors cursor-pointer";
      slot.addEventListener("click", ()=>{ selectDate(d); openNewTaskModalAt(d,`${String(h).padStart(2,"0")}:00`); });
      col.appendChild(slot);
    }

    // Current time line
    if (sameDay(d, state.today)) col.appendChild(buildTimeLine(56));

    // Task events
    (state.tasks[dateKey(d)]||[]).forEach(task => {
      if (!task.time) return;
      const [h,m] = task.time.split(":").map(Number);
      const topPct = ((h*60+m)/(24*60))*100;
      const p = PRIORITY[task.priority]||PRIORITY.assignment;
      const ev = document.createElement("div");
      ev.className = `absolute left-0.5 right-0.5 z-10 rounded px-1.5 py-1 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${p.calCls}`;
      ev.style.top = `${topPct}%`;
      ev.style.minHeight = "44px";
      ev.innerHTML = `
        <div class="font-label-sm text-label-sm font-semibold truncate">${escHtml(task.title)}</div>
        <div class="font-label-sm text-label-sm opacity-75">${formatTime(task.time)}</div>`;
      ev.addEventListener("click", e=>{ e.stopPropagation(); selectDate(d); openEditModal(task, dateKey(d)); });
      col.appendChild(ev);
    });

    body.appendChild(col);
  });

  grid.appendChild(body);
  setTimeout(()=>{ body.scrollTop = 7*56; }, 60);
}

// ═══════════════════════════════════════════════
// DAY VIEW
// ═══════════════════════════════════════════════
function renderDay(grid) {
  grid.className = "flex-1 flex flex-col bg-surface-container-lowest overflow-hidden";

  const sd = state.selectedDate;

  // Custom day header
  ensureDayHeader(false);
  const header = document.getElementById("day-header-row");
  header.innerHTML = "";
  header.className = "flex border-b border-outline-variant bg-surface-bright sticky top-0 z-20";

  const gutterSpacer = document.createElement("div");
  gutterSpacer.className = "w-14 shrink-0 border-r border-outline-variant";
  header.appendChild(gutterSpacer);

  const dayCol = document.createElement("div");
  const isToday = sameDay(sd, state.today);
  dayCol.className = "flex-1 text-center py-3 bg-surface-container";
  dayCol.innerHTML = `
    <div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">${DAY_NAMES[sd.getDay()]}</div>
    <div class="mt-1">
      <span class="font-h2 text-h2 font-semibold inline-flex items-center justify-center w-10 h-10 rounded-full
        ${isToday?"bg-primary text-on-primary":"text-on-surface"}">${sd.getDate()}</span>
    </div>`;
  header.appendChild(dayCol);

  // Scrollable time body
  const body = document.createElement("div");
  body.className = "flex flex-1 overflow-y-auto custom-scrollbar";
  body.style.maxHeight = "520px";

  // Time gutter
  body.appendChild(buildTimeGutter(64));

  // Single column
  const col = document.createElement("div");
  col.className = "flex-1 relative bg-surface-container-low";

  for (let h=0; h<24; h++) {
    const slot = document.createElement("div");
    slot.className = "h-16 border-b border-outline-variant hover:bg-surface-container transition-colors cursor-pointer";
    // Half-hour dashed separator
    const half = document.createElement("div");
    half.className = "h-8 border-b border-dashed border-outline-variant/50";
    slot.appendChild(half);
    slot.addEventListener("click", ()=>openNewTaskModalAt(sd, `${String(h).padStart(2,"0")}:00`));
    col.appendChild(slot);
  }

  if (sameDay(sd, state.today)) col.appendChild(buildTimeLine(64));

  // Task blocks
  const tasks = state.tasks[dateKey(sd)] || [];
  const timedTasks   = tasks.filter(t=>t.time);
  const untimedTasks = tasks.filter(t=>!t.time);

  timedTasks.forEach(task => {
    const [h,m] = task.time.split(":").map(Number);
    const topPct = ((h*60+m)/(24*60))*100;
    const p = PRIORITY[task.priority]||PRIORITY.assignment;
    const ev = document.createElement("div");
    ev.className = `absolute left-2 right-2 z-10 rounded-xl px-3 py-2 cursor-pointer shadow-md hover:shadow-lg transition-all ${p.calCls}`;
    ev.style.top = `${topPct}%`;
    ev.style.minHeight = "56px";
    ev.innerHTML = `
      <div class="font-label-md text-label-md font-semibold">${escHtml(task.title)}</div>
      <div class="font-label-sm text-label-sm opacity-75 mt-0.5">${formatTime(task.time)}${task.description?" · "+escHtml(task.description.slice(0,50)):""}</div>
      ${task.progress!==undefined
        ? `<div class="mt-2 flex items-center gap-2">
             <div class="flex-1 bg-black/10 rounded-full h-1">
               <div class="${p.barCls} h-1 rounded-full" style="width:${task.progress}%"></div>
             </div>
             <span class="font-label-sm text-label-sm">${task.progress}%</span>
           </div>` : ""}`;
    ev.addEventListener("click", e=>{ e.stopPropagation(); openEditModal(task, dateKey(sd)); });
    col.appendChild(ev);
  });

  // Untimed tasks as floating chips at top
  if (untimedTasks.length) {
    const ribbon = document.createElement("div");
    ribbon.className = "absolute top-2 left-2 right-2 z-10 flex flex-col gap-1";
    untimedTasks.forEach(task => {
      const p = PRIORITY[task.priority]||PRIORITY.assignment;
      const chip = document.createElement("div");
      chip.className = `${p.calCls} rounded-lg px-2 py-1.5 font-label-sm text-label-sm cursor-pointer shadow-sm`;
      chip.textContent = task.title;
      chip.addEventListener("click", e=>{ e.stopPropagation(); openEditModal(task, dateKey(sd)); });
      ribbon.appendChild(chip);
    });
    col.appendChild(ribbon);
  }

  body.appendChild(col);
  grid.appendChild(body);
  setTimeout(()=>{ body.scrollTop = 7*64; }, 60);
}

// ─── Shared time-grid sub-builders ───────────
function buildTimeGutter(rowH) {
  const g = document.createElement("div");
  g.className = "w-14 shrink-0 border-r border-outline-variant bg-surface-bright";
  for (let h=0; h<24; h++) {
    const s = document.createElement("div");
    s.className = `border-b border-outline-variant flex items-start justify-end pr-2 pt-1`;
    s.style.height = `${rowH}px`;
    const label = h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`;
    s.innerHTML = `<span class="font-label-sm text-label-sm text-on-surface-variant">${label}</span>`;
    g.appendChild(s);
  }
  return g;
}

function buildTimeLine(rowH) {
  const now = new Date();
  const pct = ((now.getHours()*60+now.getMinutes())/(24*60))*100;
  const line = document.createElement("div");
  line.className = "absolute left-0 right-0 z-20 pointer-events-none flex items-center";
  line.style.top = `${pct}%`;
  line.innerHTML = `<div class="w-2.5 h-2.5 rounded-full bg-error -ml-1 shrink-0"></div><div class="flex-1 h-0.5 bg-error"></div>`;
  return line;
}

// ─── Day header row management ────────────────
function ensureDayHeader(showWeekdays) {
  let row = document.getElementById("day-header-row");
  if (!row) {
    row = document.createElement("div");
    row.id = "day-header-row";
    const existing = document.querySelector(".grid.grid-cols-7.border-b");
    if (existing) existing.replaceWith(row);
    else document.getElementById("calendar-grid")
                 ?.parentElement
                 ?.insertBefore(row, document.getElementById("calendar-grid"));
  }
  if (showWeekdays) {
    row.className = "grid grid-cols-7 border-b border-outline-variant bg-surface-bright";
    row.innerHTML = DAY_SHORT.map(d=>
      `<div class="py-sm text-center font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">${d}</div>`
    ).join("");
  }
  // week / day views manage the header themselves
}

// ─── Date selection ───────────────────────────
function selectDate(date) {
  state.selectedDate = date;
  if (state.view==="month") {
    state.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  render();
}

// ─── Navigation ──────────────────────────────
function navigatePrev() {
  if (state.view==="month") {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth()-1, 1);
    render();
  } else if (state.view==="week") {
    selectDate(addDays(state.selectedDate,-7));
  } else {
    selectDate(addDays(state.selectedDate,-1));
  }
}

function navigateNext() {
  if (state.view==="month") {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth()+1, 1);
    render();
  } else if (state.view==="week") {
    selectDate(addDays(state.selectedDate,7));
  } else {
    selectDate(addDays(state.selectedDate,1));
  }
}

function goToToday() {
  state.currentDate = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
  selectDate(new Date(state.today));
}

// ─── View switch ─────────────────────────────
function setView(view) {
  state.view = view;
  // Sync month pointer when switching to week/day
  if (view!=="month") {
    state.currentDate = new Date(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), 1);
  }

  document.querySelectorAll(".view-toggle-btn").forEach(btn => {
    const active = btn.dataset.view===view;
    btn.classList.remove("bg-primary-container","text-on-primary-container","shadow-sm","text-on-surface-variant");
    btn.classList.add(active ? "bg-primary-container" : "text-on-surface-variant");
    if (active) btn.classList.add("text-on-primary-container","shadow-sm");
  });

  render();
}

// ─── Side Panel ──────────────────────────────
function renderSidePanel() {
  const key   = dateKey(state.selectedDate);
  const tasks = state.tasks[key] || [];
  const dateEl  = document.getElementById("side-panel-date");
  const tasksEl = document.getElementById("side-panel-tasks");
  if (!dateEl||!tasksEl) return;

  const d=state.selectedDate;
  dateEl.textContent = `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;

  const sub=dateEl.nextElementSibling;
  if (sub) sub.textContent = tasks.length===0
    ? "No items scheduled"
    : `${tasks.length} item${tasks.length>1?"s":""} scheduled`;

  tasksEl.innerHTML="";

  if (!tasks.length) {
    tasksEl.innerHTML=`
      <div class="flex flex-col items-center justify-center py-12 text-center opacity-60">
        <span class="material-symbols-outlined text-5xl text-outline-variant mb-3">event_available</span>
        <p class="font-body-md text-body-md text-on-surface-variant">No tasks for this day.</p>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Click "+ New Task" to add one.</p>
      </div>`;
    return;
  }
  tasks.forEach(t => tasksEl.appendChild(buildTaskCard(t,key)));
}

function buildTaskCard(task, key) {
  const p = PRIORITY[task.priority]||PRIORITY.assignment;
  const card = document.createElement("div");
  card.className = "bg-surface-bright border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden";

  card.innerHTML = `
    <div class="absolute left-0 top-0 bottom-0 w-1 ${p.barCls}"></div>
    <div class="flex justify-between items-start mb-2 pl-2">
      <span class="${p.badgeCls} font-label-sm text-label-sm px-2 py-0.5 rounded-full">${p.label}</span>
      ${task.time
        ? `<span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
             <span class="material-symbols-outlined text-[14px]">schedule</span>${formatTime(task.time)}
           </span>` : ""}
    </div>
    <h4 class="font-h3 text-h3 text-on-surface pl-2 mb-1">${escHtml(task.title)}</h4>
    ${task.description
      ? `<p class="font-body-sm text-body-sm text-on-surface-variant pl-2 line-clamp-2">${escHtml(task.description)}</p>` : ""}
    ${task.progress!==undefined
      ? `<div class="pl-2 mt-2 flex items-center gap-2">
           <div class="flex-1 bg-surface-variant rounded-full h-1.5">
             <div class="${p.barCls} h-1.5 rounded-full" style="width:${task.progress}%"></div>
           </div>
           <span class="font-label-sm text-label-sm text-on-surface-variant">${task.progress}%</span>
         </div>` : ""}
    <div class="mt-3 pl-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="btn-edit text-on-surface-variant hover:text-primary transition-colors" title="Edit">
        <span class="material-symbols-outlined text-[20px]">edit</span>
      </button>
      <button class="btn-delete text-on-surface-variant hover:text-error transition-colors" title="Delete">
        <span class="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>`;

  card.querySelector(".btn-edit").addEventListener("click", e=>{ e.stopPropagation(); openEditModal(task,key); });
  card.querySelector(".btn-delete").addEventListener("click", e=>{ e.stopPropagation(); deleteTask(task.id,key); });
  return card;
}

// ─── Task CRUD ────────────────────────────────
let _editId=null, _editKey=null;

function openNewTaskModal() {
  openNewTaskModalAt(state.selectedDate,"");
}

function openNewTaskModalAt(date, time) {
  _editId=null; _editKey=dateKey(date);
  state.selectedDate=date;
  document.getElementById("task-title").value    ="";
  document.getElementById("task-time").value     =time;
  document.getElementById("task-priority").value ="medium";
  document.getElementById("task-desc").value     ="";
  document.getElementById("task-modal").querySelector("h2").textContent="Create New Task";
  showModal();
}

function openEditModal(task, key) {
  _editId=task.id; _editKey=key;
  document.getElementById("task-title").value    =task.title;
  document.getElementById("task-time").value     =task.time||"";
  document.getElementById("task-priority").value =task.priority;
  document.getElementById("task-desc").value     =task.description||"";
  document.getElementById("task-modal").querySelector("h2").textContent="Edit Task";
  showModal();
}

function showModal() {
  document.getElementById("task-modal").classList.remove("hidden");
  setTimeout(()=>document.getElementById("task-title").focus(),50);
}

function hideModal() {
  document.getElementById("task-modal").classList.add("hidden");
  _editId=null; _editKey=null;
}

function saveTask() {
  const titleEl = document.getElementById("task-title");
  const title   = titleEl.value.trim();
  if (!title) {
    titleEl.classList.add("border-error","ring-1","ring-error");
    titleEl.focus(); return;
  }
  titleEl.classList.remove("border-error","ring-1","ring-error");

  const task = {
    id:          _editId ?? state.nextId++,
    title,
    time:        document.getElementById("task-time").value,
    priority:    document.getElementById("task-priority").value,
    description: document.getElementById("task-desc").value.trim()
  };

  const key = _editKey;
  if (!state.tasks[key]) state.tasks[key]=[];

  if (_editId!==null) {
    const idx=state.tasks[key].findIndex(t=>t.id===_editId);
    if (idx!==-1) state.tasks[key][idx]=task; else state.tasks[key].push(task);
  } else {
    state.tasks[key].push(task);
  }

  // Sort by time
  state.tasks[key].sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));

  hideModal(); render();
  showToast(_editId!==null ? "✅ Task updated!" : "✅ Task created!");
}

function deleteTask(id, key) {
  if (!state.tasks[key]) return;
  state.tasks[key] = state.tasks[key].filter(t=>t.id!==id);
  if (!state.tasks[key].length) delete state.tasks[key];
  render();
  showToast("🗑 Task deleted.");
}

// ─── Toast ────────────────────────────────────
function showToast(msg, ms=2800) {
  let c=document.getElementById("toast-container");
  if (!c) {
    c=document.createElement("div");
    c.id="toast-container";
    c.className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none";
    document.body.appendChild(c);
  }
  const t=document.createElement("div");
  t.className="bg-inverse-surface text-inverse-on-surface font-body-sm text-body-sm px-5 py-2.5 rounded-full shadow-lg pointer-events-auto opacity-0 translate-y-2 transition-all duration-300";
  t.textContent=msg;
  c.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.remove("opacity-0","translate-y-2")));
  setTimeout(()=>{ t.classList.add("opacity-0","translate-y-2"); setTimeout(()=>t.remove(),300); },ms);
}

// ─── Keyboard shortcuts ───────────────────────
function setupKeyboard() {
  document.addEventListener("keydown", e=>{
    const modalOpen = !document.getElementById("task-modal").classList.contains("hidden");
    if (e.key==="Escape"&&modalOpen)                        { hideModal(); return; }
    if ((e.ctrlKey||e.metaKey)&&e.key==="Enter"&&modalOpen) { saveTask(); return; }
    if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
    if (e.key==="ArrowLeft")           navigatePrev();
    else if (e.key==="ArrowRight")     navigateNext();
    else if (e.key==="t"||e.key==="T") goToToday();
    else if (e.key==="n"||e.key==="N") openNewTaskModal();
    else if (e.key==="1")              setView("day");
    else if (e.key==="2")              setView("week");
    else if (e.key==="3")              setView("month");
  });
}

// ─── Wire static HTML buttons ────────────────
function wireButtons() {
  // Chevron navigation
  document.querySelectorAll("button").forEach(btn=>{
    const icon=btn.querySelector(".material-symbols-outlined");
    if (!icon) return;
    const t=icon.textContent.trim();
    if (t==="chevron_left")  btn.addEventListener("click",navigatePrev);
    if (t==="chevron_right") btn.addEventListener("click",navigateNext);
  });

  // Today button
  document.querySelectorAll("button").forEach(btn=>{
    if (btn.textContent.trim()==="Today") btn.addEventListener("click",goToToday);
  });

  // New Task
  document.getElementById("btn-new-task")?.addEventListener("click",openNewTaskModal);

  // Modal
  document.getElementById("btn-cancel-task")?.addEventListener("click",hideModal);
  document.getElementById("btn-save-task")?.addEventListener("click",saveTask);
  document.getElementById("task-modal")?.addEventListener("click",e=>{
    if (e.target===document.getElementById("task-modal")) hideModal();
  });

  // View toggle (Day / Week / Month)
  document.querySelectorAll(".flex.items-center.bg-surface-container-lowest button").forEach(btn=>{
    const v=btn.textContent.trim().toLowerCase();
    if (!["day","week","month"].includes(v)) return;
    btn.dataset.view=v;
    btn.classList.add("view-toggle-btn");
    btn.addEventListener("click",()=>setView(v));
  });

  // Start Focus Session
  document.querySelectorAll("button").forEach(btn=>{
    if (btn.textContent.trim()==="Start Focus Session")
      btn.addEventListener("click",()=>showToast("🎯 Focus session started! Stay focused."));
  });
}

// ─── Bootstrap ───────────────────────────────
document.addEventListener("DOMContentLoaded", ()=>{
  wireButtons();
  setupKeyboard();
  setView("month"); // calls render() internally
});
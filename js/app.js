// Application Centralized State Object
let state = {
  students: [],
  tasks: [],
  teachingProgress: [],
  studentProgress: [],
  incomeHistory: []
};

let currentView = 'dashboard';
let activeSim = 'inclined';
let simRunning = false;
let simTime = 0;
let simAnimationId = null;

// Load persisted state from local storage
function loadState() {
  const saved = localStorage.getItem('tf_state_v6');
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }
}

// Persist state changes
function saveState() {
  localStorage.setItem('tf_state_v6', JSON.stringify(state));
  render();
}

// Navigation Handler
function navigateTo(view, sim = 'inclined') {
  currentView = view;
  activeSim = sim;
  document.getElementById('navMenuModal').classList.add('hidden');
  render();
}


// Action: Delete Specific Income History Item (Updates Total Earnings)
window.deleteIncomeHistoryItem = function(incomeId) {
  state.incomeHistory = state.incomeHistory.filter(item => item.id !== incomeId);
  saveState();
};

// Action: Mark Salary Paid for Student
window.markSalaryPaid = function(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const today = new Date().toISOString().split('T')[0];

  state.incomeHistory.unshift({
    id: Date.now().toString(),
    studentId: student.id,
    studentName: student.name,
    salary: Number(student.salary),
    date: today
  });

  saveState();
  renderStudentListInModal();
};

// Action: Toggle Task State
window.toggleTaskComplete = function(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderTaskListInModal();
  }
};

// Action: Delete Task
window.deleteTask = function(taskId) {
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  saveState();
  renderTaskListInModal();
};

// Action: Delete Student
window.deleteStudent = function(studentId) {
  state.students = state.students.filter(s => s.id !== studentId);
  state.teachingProgress = state.teachingProgress.filter(tp => tp.studentId !== studentId);
  state.studentProgress = state.studentProgress.filter(sp => sp.studentId !== studentId);
  saveState();
  renderStudentListInModal();
};


function render() {
  const main = document.getElementById('mainContainer');

  if (currentView === 'physics') {
    renderPhysicsLab(main);
    return;
  }

  const totalMonthlyIncome = state.incomeHistory.reduce((acc, item) => acc + (Number(item.salary) || 0), 0);
  const pendingTasks = state.tasks.filter(t => !t.completed);

  main.innerHTML = `
    <!-- Header -->
    <header class="flex items-center justify-between bg-slate-900 border border-slate-800/80 p-4 rounded-2xl shadow-xl">
      <button id="logoBtn" class="flex items-center gap-3.5 group focus:outline-none text-left">
        <div class="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
          <div class="w-full h-full bg-slate-950 rounded-[10.5px] flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557c0 1.542.27 3.018.762 4.382 border-2" />
            </svg>
          </div>
        </div>
        <div>
          <span class="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            TutorFlow
          </span>
          <p class="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400/90 -mt-1">Smart Educator Suite</p>
        </div>
      </button>

      <button id="openMenuBtn" class="text-xs font-semibold px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl transition-all shadow-sm flex items-center gap-2">
        <span>Menu</span>
        <span class="text-indigo-400 font-bold">☰</span>
      </button>
    </header>

    <!-- Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      <!-- Active Students Count -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-[11px] uppercase font-bold tracking-wider text-slate-400">Active Students</p>
          <p class="text-3xl font-black text-indigo-400 mt-1">${state.students.length}</p>
        </div>
        <button id="openStudentModal" class="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-2xl font-bold flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95">
          +
        </button>
      </div>

      <!-- Total Earnings -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-lg">
        <p class="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Income Logged</p>
        <p class="text-3xl font-black text-emerald-400 mt-1">৳${totalMonthlyIncome.toLocaleString()}</p>
      </div>

      <!-- Tasks List -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 md:col-span-2 shadow-lg">
        <div class="flex items-center justify-between mb-3.5">
          <h3 class="font-bold text-slate-200 text-base flex items-center gap-2">
            <span>📌</span> Pending Tasks (${pendingTasks.length})
          </h3>
          <button id="openTaskModal" class="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors shadow-md">
            +
          </button>
        </div>
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          ${state.tasks.length === 0 ? `
            <div class="bg-slate-950/60 p-4 rounded-xl border border-dashed border-slate-800 text-center">
              <p class="text-xs text-slate-500">No pending tasks. Click "+" to create a task.</p>
            </div>
          ` : state.tasks.map(t => `
            <div class="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-sm">
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete('${t.id}')" class="w-4 h-4 accent-indigo-600 rounded cursor-pointer">
                <span class="${t.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'} text-xs md:text-sm">${t.title}</span>
              </label>
              <span class="text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">${t.time}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Income History with Delete Button -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 md:col-span-2 shadow-lg">
        <h3 class="font-bold text-slate-200 text-base mb-3 flex items-center gap-2">
          <span>💳</span> Income History
        </h3>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          ${state.incomeHistory.length === 0 ? `
            <div class="bg-slate-950/60 p-4 rounded-xl border border-dashed border-slate-800 text-center">
              <p class="text-xs text-slate-500">No income recorded yet. Click "Salary Paid" on active students to log payment.</p>
            </div>
          ` : state.incomeHistory.map(i => `
            <div class="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-sm">
              <span class="text-slate-200 font-medium text-xs md:text-sm">${i.studentName}</span>
              <div class="flex items-center gap-3">
                <span class="text-emerald-400 font-bold font-mono text-xs md:text-sm">+৳${i.salary.toLocaleString()}</span>
                <span class="text-[11px] text-slate-500 font-mono">${i.date}</span>
                <button onclick="deleteIncomeHistoryItem('${i.id}')" title="Delete Income Record" class="text-red-400 hover:text-red-300 font-bold px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs transition-colors">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Dynamic Graph -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 md:col-span-2 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-200 text-base flex items-center gap-2">
            <span>🎯</span> Teaching Progress Graph
          </h3>
          <button id="openTeachingModal" class="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 px-3 py-1.5 rounded-lg font-semibold transition-colors">
            + Add Record
          </button>
        </div>

        ${state.students.length === 0 ? `
          <div class="bg-slate-950/60 p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-1">
            <p class="text-xs text-slate-400 font-medium">No Active Students Registered</p>
            <p class="text-[11px] text-slate-500">Add active students to view dynamic graphs.</p>
          </div>
        ` : `
          <div class="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
            <div class="relative flex items-center justify-center">
              <canvas id="teachingPieCanvas" width="200" height="200"></canvas>
            </div>
            <div class="space-y-2 w-full md:w-auto max-h-56 overflow-y-auto pr-1">
              ${state.teachingProgress.length === 0 ? `
                <p class="text-xs text-slate-500 text-center py-4">No progress records added yet.</p>
              ` : state.teachingProgress.map((p, idx) => `
                <div class="flex items-center justify-between gap-4 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${getPaletteColor(idx)}"></span>
                    <span class="text-slate-200 font-semibold">${p.studentName}</span>
                    <span class="text-slate-500">(${p.targetChapter})</span>
                  </div>
                  <span class="font-bold text-indigo-400 font-mono text-sm">${p.progressPct}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>

      <!-- Exam Marks List -->
      <div class="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 md:col-span-2 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-200 text-base flex items-center gap-2">
            <span>🏅</span> Exam Marks & Evaluations
          </h3>
          <button id="openExamModal" class="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors shadow-md">
            +
          </button>
        </div>
        ${state.studentProgress.length === 0 ? `
          <div class="bg-slate-950/60 p-4 rounded-xl border border-dashed border-slate-800 text-center">
            <p class="text-xs text-slate-500">No exam marks logged yet.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th class="p-2.5">Student</th>
                  <th class="p-2.5">Exam</th>
                  <th class="p-2.5">Chapter</th>
                  <th class="p-2.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                ${state.studentProgress.map(sp => `
                  <tr class="hover:bg-slate-950/40 transition-colors">
                    <td class="p-2.5 font-medium text-slate-200">${sp.studentName}</td>
                    <td class="p-2.5 text-slate-400">${sp.examName}</td>
                    <td class="p-2.5 text-slate-400">${sp.chapter}</td>
                    <td class="p-2.5 text-right font-bold text-emerald-400 font-mono text-sm">${sp.marks}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

    </div>
  `;

  bindDashboardEvents();
  renderPieChart();
}


function getPaletteColor(index) {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4'];
  return colors[index % colors.length];
}

function renderPieChart() {
  const canvas = document.getElementById('teachingPieCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.teachingProgress.length === 0) {
    ctx.beginPath();
    ctx.arc(100, 100, 70, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 20;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No Progress', 100, 98);
    ctx.fillText('Data Yet', 100, 114);
    return;
  }

  let total = state.teachingProgress.reduce((sum, item) => sum + Number(item.progressPct), 0) || 1;
  let startAngle = -Math.PI / 2;

  state.teachingProgress.forEach((item, index) => {
    let sliceAngle = (Number(item.progressPct) / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(100, 100, 70, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = getPaletteColor(index);
    ctx.lineWidth = 22;
    ctx.stroke();
    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.teachingProgress.length}`, 100, 98);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  ctx.fillText('Topics Logged', 100, 115);
}

function bindDashboardEvents() {
  const menuTrigger = () => document.getElementById('navMenuModal').classList.remove('hidden');
  document.getElementById('logoBtn').addEventListener('click', menuTrigger);
  document.getElementById('openMenuBtn').addEventListener('click', menuTrigger);

  document.getElementById('openStudentModal').addEventListener('click', () => {
    document.getElementById('studentModal').classList.remove('hidden');
    renderStudentListInModal();
  });

  document.getElementById('openTaskModal').addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('hidden');
    renderTaskListInModal();
  });

  document.getElementById('openTeachingModal').addEventListener('click', () => {
    populateStudentSelect('tpStudentSelect');
    document.getElementById('teachingModal').classList.remove('hidden');
  });

  document.getElementById('openExamModal').addEventListener('click', () => {
    populateStudentSelect('epStudentSelect');
    document.getElementById('examModal').classList.remove('hidden');
  });
}

function populateStudentSelect(selectElemId) {
  const select = document.getElementById(selectElemId);
  if (!select) return;
  if (state.students.length === 0) {
    select.innerHTML = `<option value="">No students registered - add a student first</option>`;
  } else {
    select.innerHTML = state.students.map(s => `
      <option value="${s.id}">${s.name} (${s.class})</option>
    `).join('');
  }
}

function renderStudentListInModal() {
  const container = document.getElementById('studentListContainer');
  if (!container) return;

  if (state.students.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-2 text-center">No active students added.</p>`;
    return;
  }

  container.innerHTML = state.students.map(s => `
    <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2">
      <div>
        <p class="font-bold text-white text-xs">${s.name} <span class="text-slate-400 font-normal">(${s.class})</span></p>
        <p class="text-slate-400 text-[11px]">Phone: ${s.phone} | Fee: ৳${Number(s.salary).toLocaleString()}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="markSalaryPaid('${s.id}')" class="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm">
          Salary Paid
        </button>
        <button onclick="deleteStudent('${s.id}')" class="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 rounded-lg text-xs">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

function renderTaskListInModal() {
  const container = document.getElementById('taskListModalContainer');
  if (!container) return;

  if (state.tasks.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-2 text-center">No tasks added.</p>`;
    return;
  }

  container.innerHTML = state.tasks.map(t => `
    <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete('${t.id}')" class="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer">
        <span class="${t.completed ? 'line-through text-slate-500' : 'text-slate-200'} font-medium">${t.title} (${t.time})</span>
      </div>
      <button onclick="deleteTask('${t.id}')" class="text-red-400 hover:text-red-300 font-bold px-2 py-0.5 bg-red-500/10 rounded-lg">
        ✕
      </button>
    </div>
  `).join('');
}


function renderPhysicsLab(main) {
  main.innerHTML = `
    <header class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
      <button id="logoBtnLab" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1.5px]">
          <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12 12 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
            </svg>
          </div>
        </div>
        <span class="text-xl font-extrabold text-white tracking-tight">TutorFlow Physics Lab</span>
      </button>
      <div class="flex gap-2">
        <button id="switchInclined" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSim === 'inclined' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}">
          Inclined Plane
        </button>
        <button id="switchRelative" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSim === 'relative' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}">
          Relative Velocity
        </button>
      </div>
    </header>

    <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
      <canvas id="simCanvas" width="750" height="300" class="w-full bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner"></canvas>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2" id="simControls">
        ${activeSim === 'inclined' ? `
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Ramp Angle (°): <span id="angleVal" class="text-indigo-400 font-bold font-mono">30</span></label>
            <input type="range" id="angleInput" min="5" max="60" value="30" class="w-full accent-indigo-500 cursor-pointer">
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Friction Coeff (μ): <span id="muVal" class="text-indigo-400 font-bold font-mono">0.1</span></label>
            <input type="range" id="muInput" min="0" max="0.8" step="0.05" value="0.1" class="w-full accent-indigo-500 cursor-pointer">
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Mass (kg): <span id="massVal" class="text-indigo-400 font-bold font-mono">5</span></label>
            <input type="range" id="massInput" min="1" max="20" value="5" class="w-full accent-indigo-500 cursor-pointer">
          </div>
        ` : `
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Vel A (m/s): <span id="vAVal" class="text-indigo-400 font-bold font-mono">10</span></label>
            <input type="range" id="vAInput" min="1" max="30" value="10" class="w-full accent-indigo-500 cursor-pointer">
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Vel B (m/s): <span id="vBVal" class="text-indigo-400 font-bold font-mono">5</span></label>
            <input type="range" id="vBInput" min="1" max="30" value="5" class="w-full accent-indigo-500 cursor-pointer">
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">Direction</label>
            <select id="dirInput" class="w-full bg-slate-900 text-xs border border-slate-800 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="same">Same Direction</option>
              <option value="opposite">Opposite Direction</option>
            </select>
          </div>
        `}
      </div>

      <div class="flex gap-3 pt-2">
        <button id="toggleSimBtn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/20">
          Run Simulation
        </button>
        <button id="resetSimBtn" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors">
          Reset
        </button>
      </div>
    </div>
  `;

  document.getElementById('logoBtnLab').addEventListener('click', () => {
    document.getElementById('navMenuModal').classList.remove('hidden');
  });

  document.getElementById('switchInclined').addEventListener('click', () => navigateTo('physics', 'inclined'));
  document.getElementById('switchRelative').addEventListener('click', () => navigateTo('physics', 'relative'));

  initSimEngine();
}

function initSimEngine() {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  simTime = 0;
  simRunning = false;

  const runLoop = () => {
    if (simRunning) simTime += 0.03;

    if (activeSim === 'inclined') {
      const angle = Number(document.getElementById('angleInput').value);
      const mu = Number(document.getElementById('muInput').value);
      const mass = Number(document.getElementById('massInput').value);

      document.getElementById('angleVal').innerText = angle;
      document.getElementById('muVal').innerText = mu;
      document.getElementById('massVal').innerText = mass;

      if (window.drawInclinedPlane) {
        window.drawInclinedPlane(ctx, canvas.width, canvas.height, angle, mu, mass, simTime);
      }
    } else {
      const vA = Number(document.getElementById('vAInput').value);
      const vB = Number(document.getElementById('vBInput').value);
      const dir = document.getElementById('dirInput').value;

      document.getElementById('vAVal').innerText = vA;
      document.getElementById('vBVal').innerText = vB;

      if (window.drawRelativeMotion) {
        window.drawRelativeMotion(ctx, canvas.width, canvas.height, vA, vB, dir, simTime);
      }
    }

    simAnimationId = requestAnimationFrame(runLoop);
  };

  if (simAnimationId) cancelAnimationFrame(simAnimationId);
  runLoop();

  document.getElementById('toggleSimBtn').addEventListener('click', () => {
    simRunning = !simRunning;
    document.getElementById('toggleSimBtn').innerText = simRunning ? 'Pause Simulation' : 'Run Simulation';
  });

  document.getElementById('resetSimBtn').addEventListener('click', () => {
    simTime = 0;
    simRunning = false;
    document.getElementById('toggleSimBtn').innerText = 'Run Simulation';
  });
}

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  render();

  document.getElementById('navDashboard').addEventListener('click', () => navigateTo('dashboard'));
  document.getElementById('navLab').addEventListener('click', () => navigateTo('physics', 'inclined'));
  document.getElementById('navInclined').addEventListener('click', () => navigateTo('physics', 'inclined'));
  document.getElementById('navRelative').addEventListener('click', () => navigateTo('physics', 'relative'));

  document.querySelectorAll('.closeModal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-bg').classList.add('hidden');
    });
  });

  document.getElementById('studentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.students.push({
      id: Date.now().toString(),
      name: document.getElementById('stName').value.trim(),
      phone: document.getElementById('stPhone').value.trim(),
      class: document.getElementById('stClass').value.trim(),
      salary: Number(document.getElementById('stSalary').value)
    });
    saveState();
    
    document.getElementById('stName').value = '';
    document.getElementById('stPhone').value = '';
    document.getElementById('stClass').value = '';
    document.getElementById('stSalary').value = '';
    document.getElementById('studentModal').classList.add('hidden');
  });

  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.tasks.push({
      id: Date.now().toString(),
      title: document.getElementById('taskWork').value.trim(),
      time: document.getElementById('taskTime').value.trim(),
      completed: false
    });
    saveState();
    renderTaskListInModal();
    document.getElementById('taskWork').value = '';
    document.getElementById('taskTime').value = '';
  });

  document.getElementById('teachingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentSelect = document.getElementById('tpStudentSelect');
    const selectedStudent = state.students.find(s => s.id === studentSelect.value);

    if (!selectedStudent) return;

    state.teachingProgress.push({
      id: Date.now().toString(),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      targetChapter: document.getElementById('tpChapter').value.trim(),
      progressPct: Number(document.getElementById('tpProgress').value)
    });

    saveState();
    document.getElementById('tpChapter').value = '';
    document.getElementById('tpProgress').value = '';
    document.getElementById('teachingModal').classList.add('hidden');
  });

  document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentSelect = document.getElementById('epStudentSelect');
    const selectedStudent = state.students.find(s => s.id === studentSelect.value);

    if (!selectedStudent) return;

    state.studentProgress.push({
      id: Date.now().toString(),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      examName: document.getElementById('epExam').value.trim(),
      chapter: document.getElementById('epChapt').value.trim(),
      marks: Number(document.getElementById('epMarks').value)
    });

    saveState();
    document.getElementById('epExam').value = '';
    document.getElementById('epChapt').value = '';
    document.getElementById('epMarks').value = '';
    document.getElementById('examModal').classList.add('hidden');
  });
});
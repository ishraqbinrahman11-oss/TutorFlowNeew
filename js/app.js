import { drawInclinedPlaneSim } from './sim-inclined.js';
import { drawRelativeMotionSim } from './sim-relative.js';

let state = {
  students: [
    { id: '1', name: 'Student 1', phone: '01700000000', class: 'HSC Physics', salary: 6000 },
    { id: '2', name: 'Student 2', phone: '01800000000', class: 'Higher Math', salary: 5000 }
  ],
  tasks: [
    { id: '1', title: 'Worksheet on Vectors', time: '10:00 AM' },
    { id: '2', title: 'Check Exam 1 papers', time: '04:00 PM' }
  ],
  // Active progress (1 unique record per student)
  teachingProgress: [
    { id: '1', studentId: '1', studentName: 'Fahad', targetChapter: 'Vector Kinematics', progressPct: 75, date: '2026-10-01' },
    { id: '2', studentId: '2', studentName: 'Student 2', targetChapter: 'Integration Basics', progressPct: 45, date: '2026-10-02' }
  ],
  // History log for old/superseded progress records
  teachingProgressHistory: [],
  studentProgress: [
    { id: '1', studentId: '1', studentName: 'Fahad', examName: 'Exam 1', chapter: 'Vector', marks: 80 },
    { id: '2', studentId: '1', studentName: 'Fahad', examName: 'Exam 2', chapter: 'Dynamics', marks: 60 },
    { id: '3', studentId: '2', studentName: 'Student 2', examName: 'Exam 1', chapter: 'Calculus', marks: 70 },
    { id: '4', studentId: '2', studentName: 'Student 2', examName: 'Exam 2', chapter: 'Algebra', marks: 90 }
  ],
  incomeHistory: [
    { id: '1', studentName: 'Fahad', salary: 6000, date: '2026-10-01' },
    { id: '2', studentName: 'Student 2', salary: 5000, date: '2026-10-02' }
  ]
};

let currentView = 'dashboard';
let activeSim = 'inclined';
let simRunning = false;
let simTime = 0;
let simAnimationId = null;

function loadState() {
  const saved = localStorage.getItem('tf_state_v3');
  if (saved) {
    try { state = JSON.parse(saved); } catch (e) { console.error(e); }
  }
}

function saveState() {
  localStorage.setItem('tf_state_v3', JSON.stringify(state));
  render();
}

function navigateTo(view, sim = 'inclined') {
  currentView = view;
  activeSim = sim;
  document.getElementById('navMenuModal').classList.add('hidden');
  render();
}

function render() {
  const main = document.getElementById('mainContainer');

  if (currentView === 'physics') {
    renderPhysicsLab(main);
    return;
  }

  // Dashboard Rendering
  main.innerHTML = `
    <!-- Top Bar with Custom Logo -->
    <header class="flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 rounded-2xl mb-6">
      <button id="logoBtn" class="flex items-center gap-3 group focus:outline-none">
        <div class="border-2 border-slate-200 rounded-full w-9 h-9 flex items-center justify-center font-bold text-slate-200 text-lg group-hover:border-indigo-400">
          $\\approx$
        </div>
        <span class="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400">TutorFlow</span>
      </button>
      <div class="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
        Dashboard View
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Card 1: Active Student (+) & Income -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <p class="text-xs uppercase font-semibold text-slate-400">Active Students</p>
          <p class="text-3xl font-black text-indigo-400 mt-1">${state.students.length}</p>
        </div>
        <button id="openStudentModal" class="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xl font-bold flex items-center justify-center shadow-lg shadow-indigo-600/30">
          +
        </button>
      </div>

      <!-- Total Income Card -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <p class="text-xs uppercase font-semibold text-slate-400">Monthly Income</p>
        <p class="text-3xl font-black text-emerald-400 mt-1">
          ৳${state.students.reduce((acc, s) => acc + (Number(s.salary) || 0), 0)}
        </p>
      </div>

      <!-- Card 2: Pending Tasks -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 md:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-slate-200">Pending Tasks (${state.tasks.length})</h3>
          <button id="openTaskModal" class="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center">
            +
          </button>
        </div>
        <ul class="space-y-2">
          ${state.tasks.map(t => `
            <li class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
              <span class="text-slate-300">o ${t.title}</span>
              <span class="text-xs text-indigo-400 font-mono">${t.time}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Card 3: Income History -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 md:col-span-2">
        <h3 class="font-bold text-slate-200 mb-3">Income History</h3>
        <div class="space-y-2">
          ${state.incomeHistory.map(i => `
            <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
              <span class="text-slate-300">o ${i.studentName}</span>
              <span class="text-slate-400">৳${i.salary}</span>
              <span class="text-xs text-slate-500 font-mono">${i.date}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Card 4: Teaching Progress (Single Unique Slice per Student) -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 md:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-200">Teaching Progress (Current Active)</h3>
          <button id="openTeachingModal" class="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 px-3 py-1.5 rounded-lg font-semibold">
            edit / add
          </button>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-around gap-6">
          <canvas id="teachingPieCanvas" width="180" height="180"></canvas>
          <div class="space-y-2 w-full md:w-auto">
            ${state.teachingProgress.map(p => `
              <div class="flex items-center justify-between gap-4 text-sm bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span class="text-slate-300 font-semibold">${p.studentName}</span>
                <span class="text-xs text-slate-400">(${p.targetChapter})</span>
                <span class="font-bold text-indigo-400 font-mono">${p.progressPct}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Archived Record History -->
        ${state.teachingProgressHistory.length > 0 ? `
          <div class="mt-6 border-t border-slate-800 pt-4">
            <h4 class="text-xs font-semibold uppercase text-slate-400 mb-2">Previous Progress History</h4>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              ${state.teachingProgressHistory.map(h => `
                <div class="flex items-center justify-between text-xs text-slate-500 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                  <span>${h.studentName} - ${h.targetChapter} (${h.progressPct}%)</span>
                  <span class="font-mono">${h.date || 'Archived'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Card 5: Student Exam Marks Progress -->
      <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 md:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-200">Student Exam Performance</h3>
          <button id="openExamModal" class="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center">
            +
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400">
                <th class="p-2">Student</th>
                <th class="p-2">Exam</th>
                <th class="p-2">Chapter</th>
                <th class="p-2">Marks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              ${state.studentProgress.map(sp => `
                <tr>
                  <td class="p-2 text-slate-200">${sp.studentName}</td>
                  <td class="p-2 text-slate-400">${sp.examName}</td>
                  <td class="p-2 text-slate-400">${sp.chapter}</td>
                  <td class="p-2 font-bold text-emerald-400 font-mono">${sp.marks}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  bindDashboardEvents();
  renderPieChart();
}

function bindDashboardEvents() {
  document.getElementById('logoBtn').addEventListener('click', () => {
    document.getElementById('navMenuModal').classList.remove('hidden');
  });

  document.getElementById('openStudentModal').addEventListener('click', () => {
    document.getElementById('studentModal').classList.remove('hidden');
    renderStudentListInModal();
  });

  document.getElementById('openTaskModal').addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('hidden');
  });

  document.getElementById('openTeachingModal').addEventListener('click', () => {
    document.getElementById('teachingModal').classList.remove('hidden');
  });

  document.getElementById('openExamModal').addEventListener('click', () => {
    document.getElementById('examModal').classList.remove('hidden');
  });
}

function renderPieChart() {
  const canvas = document.getElementById('teachingPieCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
  let total = state.teachingProgress.reduce((sum, item) => sum + item.progressPct, 0) || 1;
  let startAngle = 0;

  state.teachingProgress.forEach((item, index) => {
    let sliceAngle = (item.progressPct / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.arc(90, 90, 75, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    startAngle += sliceAngle;
  });
}

function renderStudentListInModal() {
  const container = document.getElementById('studentListContainer');
  container.innerHTML = state.students.map(s => `
    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
      <div>
        <p class="font-bold text-white">${s.name} <span class="text-slate-400">(${s.class})</span></p>
        <p class="text-slate-500">Phone: ${s.phone} | Salary: ৳${s.salary}</p>
      </div>
      <button onclick="deleteStudent('${s.id}')" class="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 rounded-lg">
        Delete
      </button>
    </div>
  `).join('');
}

window.deleteStudent = function(id) {
  state.students = state.students.filter(s => s.id !== id);
  saveState();
  renderStudentListInModal();
};

function renderPhysicsLab(main) {
  main.innerHTML = `
    <header class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-6">
      <button id="logoBtnLab" class="flex items-center gap-3">
        <div class="border-2 border-slate-200 rounded-full w-9 h-9 flex items-center justify-center font-bold text-slate-200 text-lg">
          $\\approx$
        </div>
        <span class="text-xl font-bold text-white">TutorFlow</span>
      </button>
      <div class="flex gap-2">
        <button id="switchInclined" class="px-3 py-1.5 rounded-lg text-xs font-bold ${activeSim === 'inclined' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">
          Inclined Plane
        </button>
        <button id="switchRelative" class="px-3 py-1.5 rounded-lg text-xs font-bold ${activeSim === 'relative' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">
          Relative Velocity
        </button>
      </div>
    </header>

    <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
      <canvas id="simCanvas" width="750" height="300" class="w-full bg-slate-950 rounded-xl border border-slate-800"></canvas>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2" id="simControls">
        ${activeSim === 'inclined' ? `
          <div>
            <label class="text-xs font-semibold text-slate-400">Ramp Angle (°): <span id="angleVal">30</span></label>
            <input type="range" id="angleInput" min="5" max="60" value="30" class="w-full accent-indigo-500">
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-400">Friction Coeff ($\mu$): <span id="muVal">0.1</span></label>
            <input type="range" id="muInput" min="0" max="0.8" step="0.05" value="0.1" class="w-full accent-indigo-500">
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-400">Mass (kg): <span id="massVal">5</span></label>
            <input type="range" id="massInput" min="1" max="20" value="5" class="w-full accent-indigo-500">
          </div>
        ` : `
          <div>
            <label class="text-xs font-semibold text-slate-400">Vel A (m/s): <span id="vAVal">10</span></label>
            <input type="range" id="vAInput" min="1" max="30" value="10" class="w-full accent-indigo-500">
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-400">Vel B (m/s): <span id="vBVal">5</span></label>
            <input type="range" id="vBInput" min="1" max="30" value="5" class="w-full accent-indigo-500">
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-400">Direction</label>
            <select id="dirInput" class="w-full bg-slate-950 text-xs border border-slate-800 rounded-lg p-2 text-slate-200">
              <option value="same">Same Direction</option>
              <option value="opposite">Opposite Direction</option>
            </select>
          </div>
        `}
      </div>

      <div class="flex gap-3 pt-2">
        <button id="toggleSimBtn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-sm">
          Run Simulation
        </button>
        <button id="resetSimBtn" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-sm">
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

      drawInclinedPlaneSim(ctx, canvas.width, canvas.height, angle, mu, mass, simTime);
    } else {
      const vA = Number(document.getElementById('vAInput').value);
      const vB = Number(document.getElementById('vBInput').value);
      const dir = document.getElementById('dirInput').value;

      document.getElementById('vAVal').innerText = vA;
      document.getElementById('vBVal').innerText = vB;

      drawRelativeMotionSim(ctx, canvas.width, canvas.height, vA, vB, dir, simTime);
    }

    simAnimationId = requestAnimationFrame(runLoop);
  };

  if (simAnimationId) cancelAnimationFrame(simAnimationId);
  runLoop();

  document.getElementById('toggleSimBtn').addEventListener('click', () => {
    simRunning = !simRunning;
    document.getElementById('toggleSimBtn').innerText = simRunning ? 'Pause' : 'Run Simulation';
  });

  document.getElementById('resetSimBtn').addEventListener('click', () => {
    simTime = 0;
    simRunning = false;
    document.getElementById('toggleSimBtn').innerText = 'Run Simulation';
  });
}

// Modal Form Handling
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  render();

  // Navigation Links
  document.getElementById('navDashboard').addEventListener('click', () => navigateTo('dashboard'));
  document.getElementById('navLab').addEventListener('click', () => navigateTo('physics', 'inclined'));
  document.getElementById('navInclined').addEventListener('click', () => navigateTo('physics', 'inclined'));
  document.getElementById('navRelative').addEventListener('click', () => navigateTo('physics', 'relative'));

  // Close Modals
  document.querySelectorAll('.closeModal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-bg').classList.add('hidden');
    });
  });

  // Save Student
  document.getElementById('studentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.students.push({
      id: Date.now().toString(),
      name: document.getElementById('stName').value,
      phone: document.getElementById('stPhone').value,
      class: document.getElementById('stClass').value,
      salary: Number(document.getElementById('stSalary').value)
    });
    saveState();
    document.getElementById('studentModal').classList.add('hidden');
  });

  // Save Task
  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.tasks.push({
      id: Date.now().toString(),
      title: document.getElementById('taskWork').value,
      time: document.getElementById('taskTime').value
    });
    saveState();
    document.getElementById('taskModal').classList.add('hidden');
  });

  // Save Teaching Progress (Consolidate student data & archive old entry)
  document.getElementById('teachingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputStudent = document.getElementById('tpStudent').value.trim();
    const inputChapter = document.getElementById('tpChapter').value;
    const inputProgress = Number(document.getElementById('tpProgress').value);
    const currentDate = new Date().toISOString().split('T')[0];

    // Find if the student already exists in teaching progress
    const existingIndex = state.teachingProgress.findIndex(
      p => p.studentName.toLowerCase() === inputStudent.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Archive old record to history
      const oldRecord = state.teachingProgress[existingIndex];
      state.teachingProgressHistory.unshift({ ...oldRecord });

      // Update active record with new values
      state.teachingProgress[existingIndex] = {
        ...oldRecord,
        targetChapter: inputChapter,
        progressPct: inputProgress,
        date: currentDate
      };
    } else {
      // Create new student entry
      state.teachingProgress.push({
        id: Date.now().toString(),
        studentName: inputStudent,
        targetChapter: inputChapter,
        progressPct: inputProgress,
        date: currentDate
      });
    }

    saveState();
    document.getElementById('teachingModal').classList.add('hidden');
  });

  // Save Student Exam Performance Marks
  document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.studentProgress.push({
      id: Date.now().toString(),
      studentName: document.getElementById('epStudent').value,
      examName: document.getElementById('epExam').value,
      chapter: document.getElementById('epChapt').value,
      marks: Number(document.getElementById('epMarks').value)
    });
    saveState();
    document.getElementById('examModal').classList.add('hidden');
  });
});

// =============================================
// LIFE DASHBOARD — script.js
// All features: Clock, Greeting, Timer,
// To-Do List, Quick Links, Theme, Custom Name
// Data persisted via Local Storage
// =============================================

// ---- DOM REFERENCES ----
const clockEl        = document.getElementById('clock');
const dateEl         = document.getElementById('date');
const greetingEl     = document.getElementById('greeting');
const nameInput      = document.getElementById('name-input');
const saveNameBtn    = document.getElementById('save-name-btn');

const timerDisplay   = document.getElementById('timer-display');
const timerStartBtn  = document.getElementById('timer-start');
const timerStopBtn   = document.getElementById('timer-stop');
const timerResetBtn  = document.getElementById('timer-reset');

const taskInput      = document.getElementById('task-input');
const addTaskBtn     = document.getElementById('add-task-btn');
const taskList       = document.getElementById('task-list');
const dupWarning     = document.getElementById('duplicate-warning');

const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const addLinkBtn     = document.getElementById('add-link-btn');
const linksContainer = document.getElementById('links-container');

const themeToggle    = document.getElementById('theme-toggle');

// =============================================
// 1. CLOCK & GREETING
// =============================================

// Days and months for formatting the date string
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

/**
 * Returns a greeting string based on the current hour.
 * 0–11  → Good Morning
 * 12–16 → Good Afternoon
 * 17–20 → Good Evening
 * 21–23 → Good Night
 */
function getGreeting(hour) {
  if (hour < 12)  return 'Good Morning';
  if (hour < 17)  return 'Good Afternoon';
  if (hour < 21)  return 'Good Evening';
  return 'Good Night';
}

/**
 * Updates the clock, date, and greeting every second.
 * Also appends the user's saved name to the greeting if available.
 */
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');

  clockEl.textContent = `${h}:${m}:${s}`;

  const dayName   = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const day       = now.getDate();
  const year      = now.getFullYear();
  dateEl.textContent = `${dayName}, ${monthName} ${day}, ${year}`;

  const baseGreeting = getGreeting(now.getHours());
  const savedName    = localStorage.getItem('userName');
  greetingEl.textContent = savedName
    ? `${baseGreeting}, ${savedName}!`
    : `${baseGreeting}!`;
}

// Start the clock — update immediately then every 1 second
updateClock();
setInterval(updateClock, 1000);

// =============================================
// 2. CUSTOM NAME
// =============================================

// Load saved name into the input field on page load
function loadName() {
  const saved = localStorage.getItem('userName');
  if (saved) nameInput.value = saved;
}

// Save name to Local Storage when button is clicked
saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name) {
    localStorage.setItem('userName', name);
  } else {
    // If input is cleared, remove the saved name
    localStorage.removeItem('userName');
  }
  updateClock(); // refresh greeting immediately
});

// Also save when user presses Enter in the name field
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
});

loadName();

// =============================================
// 3. FOCUS TIMER
// =============================================

const TIMER_DEFAULT = 25 * 60; // 25 minutes in seconds
let timerSeconds    = TIMER_DEFAULT;
let timerInterval   = null;
let timerRunning    = false;

/**
 * Formats a number of seconds into MM:SS string.
 */
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Renders the current timer value to the display. */
function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

/** Starts the countdown. Does nothing if already running. */
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  // Add glow class while timer is active
  timerDisplay.classList.add('timer-active');
  document.getElementById('timer-ring').classList.add('timer-active');
  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      renderTimer();
    } else {
      // Timer reached zero — stop and alert
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('timer-active');
      document.getElementById('timer-ring').classList.remove('timer-active');
      alert('⏰ Focus session complete! Take a break.');
    }
  }, 1000);
}

/** Pauses the countdown without resetting. */
function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  // Remove glow when paused
  timerDisplay.classList.remove('timer-active');
  document.getElementById('timer-ring').classList.remove('timer-active');
}

/** Resets the timer back to 25:00. */
function resetTimer() {
  stopTimer();
  timerSeconds = TIMER_DEFAULT;
  renderTimer();
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

renderTimer(); // show 25:00 on load

// =============================================
// 4. TO-DO LIST
// =============================================

/**
 * Tasks are stored as an array of objects in Local Storage:
 * { id: number, text: string, done: boolean }
 */

/** Loads tasks array from Local Storage (returns [] if none). */
function loadTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

/** Saves the tasks array to Local Storage. */
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Renders the full task list to the DOM.
 * Each task gets: checkbox, text (or edit input), edit button, delete button.
 */
function renderTasks() {
  const tasks = loadTasks();
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox to toggle done state
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked   = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as done`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Task text label
    const span = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className   = 'btn-icon';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => startEditTask(task.id, li, span));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'btn-icon btn-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

/**
 * Adds a new task.
 * Prevents duplicates (case-insensitive check).
 */
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const tasks = loadTasks();

  // Duplicate check — compare lowercase
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );

  if (isDuplicate) {
    // Show warning and hide it after 2 seconds
    dupWarning.classList.remove('hidden');
    setTimeout(() => dupWarning.classList.add('hidden'), 2000);
    return;
  }

  dupWarning.classList.add('hidden');

  // Create new task object with unique timestamp-based ID
  const newTask = { id: Date.now(), text, done: false };
  tasks.push(newTask);
  saveTasks(tasks);
  taskInput.value = '';
  renderTasks();
}

/** Toggles the done state of a task by its ID. */
function toggleTask(id) {
  const tasks = loadTasks().map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTasks(tasks);
  renderTasks();
}

/** Deletes a task by its ID, with an exit animation. */
function deleteTask(id, liEl) {
  // Add the exit animation class, then remove from DOM + storage after it plays
  if (liEl) {
    liEl.classList.add('removing');
    liEl.addEventListener('animationend', () => {
      const tasks = loadTasks().filter((t) => t.id !== id);
      saveTasks(tasks);
      renderTasks();
    }, { once: true });
  } else {
    const tasks = loadTasks().filter((t) => t.id !== id);
    saveTasks(tasks);
    renderTasks();
  }
}

/**
 * Switches a task row into edit mode.
 * Replaces the text span with an input field.
 * Saves on Enter or blur.
 */
function startEditTask(id, li, span) {
  const tasks      = loadTasks();
  const task       = tasks.find((t) => t.id === id);
  if (!task) return;

  // Replace span with an input
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'task-edit-input';
  editInput.value     = task.text;
  editInput.maxLength = 100;
  li.replaceChild(editInput, span);
  editInput.focus();

  /** Saves the edited text back to storage. */
  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText && newText !== task.text) {
      const updated = loadTasks().map((t) =>
        t.id === id ? { ...t, text: newText } : t
      );
      saveTasks(updated);
    }
    renderTasks(); // re-render whether changed or not
  }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks(); // cancel edit
  });
  editInput.addEventListener('blur', saveEdit);
}

// Add task on button click or Enter key
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

renderTasks(); // load tasks on page start

// =============================================
// 5. QUICK LINKS
// =============================================

/**
 * Links are stored as an array of objects:
 * { id: number, name: string, url: string }
 */

/** Loads links array from Local Storage. */
function loadLinks() {
  return JSON.parse(localStorage.getItem('links') || '[]');
}

/** Saves links array to Local Storage. */
function saveLinks(links) {
  localStorage.setItem('links', JSON.stringify(links));
}

/** Renders all saved links as clickable buttons with a delete option. */
function renderLinks() {
  const links = loadLinks();
  linksContainer.innerHTML = '';

  links.forEach((link) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-item';

    // Anchor styled as a button
    const anchor = document.createElement('a');
    anchor.href        = link.url;
    anchor.target      = '_blank';
    anchor.rel         = 'noopener noreferrer'; // security best practice
    anchor.className   = 'link-btn';
    anchor.textContent = link.name;

    // Delete button for this link
    const delBtn = document.createElement('button');
    delBtn.className   = 'link-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    wrapper.appendChild(anchor);
    wrapper.appendChild(delBtn);
    linksContainer.appendChild(wrapper);
  });
}

/** Adds a new link after basic validation. */
function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();

  if (!name || !url) return;

  // Auto-prepend https:// if the user forgot the protocol
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const links   = loadLinks();
  const newLink = { id: Date.now(), name, url };
  links.push(newLink);
  saveLinks(links);

  linkNameInput.value = '';
  linkUrlInput.value  = '';
  renderLinks();
}

/** Deletes a link by its ID. */
function deleteLink(id) {
  const links = loadLinks().filter((l) => l.id !== id);
  saveLinks(links);
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);

// Allow pressing Enter in either link input to add the link
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});
linkNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

renderLinks(); // load links on page start

// =============================================
// 6. LIGHT / DARK THEME TOGGLE
// =============================================

/** Applies the given theme ('light' or 'dark') to the page. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

/** Toggles between light and dark, saves preference. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// Load saved theme on startup (default to light)
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeToggle.addEventListener('click', toggleTheme);

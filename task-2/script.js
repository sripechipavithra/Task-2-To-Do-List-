// Simple To-Do app with: add, toggle, edit (dblclick), search, due date, clear completed, localStorage

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dueInput = document.getElementById('due-input');
const list = document.getElementById('task-list');
const search = document.getElementById('search');
const clearCompletedBtn = document.getElementById('clear-completed');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

// helper: save
const save = () => localStorage.setItem('tasks', JSON.stringify(tasks));

// safe text rendering
function escapeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

// render (optionally pass an array to render)
function renderTasks(arr = tasks) {
  list.innerHTML = '';
  // sort: incomplete first, then by due date (earliest)
  arr.slice().sort((a, b) => {
    if (a.completed !== b.completed) return a.completed - b.completed;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return new Date(a.due) - new Date(b.due);
  }).forEach(task => {
    const li = document.createElement('li');
    li.className = 'task' + (task.completed ? ' completed' : '') + (task.due && !task.completed && new Date(task.due) < new Date() ? ' overdue' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <div class="left">
        <input class="checkbox" type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle complete" />
        <div class="task-text" tabindex="0" title="Double-click to edit">${escapeHtml(task.text)}</div>
        <div class="meta">${task.due ? new Date(task.due).toLocaleDateString() : ''}</div>
      </div>
      <div class="right">
        <button class="remove-btn" aria-label="Remove task">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// add task
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    alert('Please enter a task.');
    return;
  }
  const task = { id: Date.now().toString(), text, completed: false, due: dueInput.value || null };
  tasks.push(task);
  save();
  renderTasks();
  input.value = '';
  dueInput.value = '';
  input.focus();
});

// event delegation for toggle / remove / edit
list.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.classList.contains('remove-btn')) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    renderTasks();
    return;
  }
  if (e.target.classList.contains('checkbox')) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: e.target.checked } : t);
    save();
    renderTasks();
  }
});

// double-click to edit text
list.addEventListener('dblclick', e => {
  const textEl = e.target.closest('.task-text');
  if (!textEl) return;
  textEl.contentEditable = 'true';
  textEl.focus();

  function finishEdit() {
    const li = textEl.closest('li');
    const id = li.dataset.id;
    const newText = textEl.textContent.trim();
    if (!newText) {
      // if emptied, revert to previous
      const original = tasks.find(t => t.id === id)?.text || '';
      textEl.textContent = original;
    } else {
      tasks = tasks.map(t => t.id === id ? { ...t, text: newText } : t);
      save();
    }
    textEl.contentEditable = 'false';
    textEl.removeEventListener('blur', finishEdit);
    textEl.removeEventListener('keydown', onKey);
    renderTasks();
  }

  function onKey(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      textEl.blur();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      textEl.textContent = tasks.find(t => t.id === textEl.closest('li').dataset.id).text;
      textEl.blur();
    }
  }

  textEl.addEventListener('blur', finishEdit);
  textEl.addEventListener('keydown', onKey);
});

// search filter
search.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderTasks();
    return;
  }
  const filtered = tasks.filter(t => t.text.toLowerCase().includes(q));
  renderTasks(filtered);
});

// clear completed
clearCompletedBtn.addEventListener('click', () => {
  if (!confirm('Remove all completed tasks?')) return;
  tasks = tasks.filter(t => !t.completed);
  save();
  renderTasks();
});

// initial render
renderTasks();
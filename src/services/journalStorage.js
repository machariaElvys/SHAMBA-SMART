const NOTES_KEY = "shambaSmart.fieldNotes.v1";
const TASKS_KEY = "shambaSmart.farmTasks.v1";
const IRRIGATION_KEY = "shambaSmart.irrigation.v1";

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, entries) {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export const journalStorage = {
  getNotes: () => readList(NOTES_KEY),
  saveNotes: (notes) => writeList(NOTES_KEY, notes),
  addNote({ cropId, cropName, category, text }) {
    const note = { id: makeId(), cropId, cropName, category, text, createdAt: new Date().toISOString() };
    writeList(NOTES_KEY, [note, ...readList(NOTES_KEY)]);
    return note;
  },
  removeNote(id) {
    writeList(NOTES_KEY, readList(NOTES_KEY).filter((note) => note.id !== id));
  },

  getTasks: () => readList(TASKS_KEY),
  saveTasks: (tasks) => writeList(TASKS_KEY, tasks),
  addTask({ title, cropId, cropName, dueDate }) {
    const task = {
      id: makeId(), title, cropId: cropId || null, cropName: cropName || "All crops",
      dueDate: dueDate || "", completed: false, createdAt: new Date().toISOString(), completedAt: null,
    };
    writeList(TASKS_KEY, [task, ...readList(TASKS_KEY)]);
    return task;
  },
  updateTask(id, updates) {
    const tasks = readList(TASKS_KEY).map((task) => task.id === id ? { ...task, ...updates } : task);
    writeList(TASKS_KEY, tasks);
    return tasks;
  },
  removeTask(id) {
    writeList(TASKS_KEY, readList(TASKS_KEY).filter((task) => task.id !== id));
  },

  getIrrigation: () => readList(IRRIGATION_KEY),
  saveIrrigation: (logs) => writeList(IRRIGATION_KEY, logs),
  addIrrigation({ cropId, cropName, type, before, after }) {
    const entry = {
      id: makeId(), cropId, cropName, type, before, after, createdAt: new Date().toISOString(),
    };
    writeList(IRRIGATION_KEY, [entry, ...readList(IRRIGATION_KEY)].slice(0, 80));
    return entry;
  },
};

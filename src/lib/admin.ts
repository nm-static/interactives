import type { InteractiveStatus } from "./interactives";

const ADMIN_KEY = "interactives_admin";
const NOTES_KEY = "interactives_notes";
const STATUS_KEY = "interactives_status_overrides";
const IDEAS_KEY = "interactives_ideas";
const TODOS_KEY = "interactives_todos";

export const ADMIN_PASSWORD = "yukti2025";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  remark?: string;
  doneDate?: string;
  /** Short human-readable ID like "T1", "T2" for cross-referencing */
  refId?: string;
}

export interface IdeaEntry {
  id: string;
  title: string;
  description: string;
  themes: string[];
  subcategory?: string;
  status: InteractiveStatus;
  notes: string;
  createdAt: string;
}

// --- Auth ---

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function setAdminLoggedIn(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(ADMIN_KEY, "true");
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
}

// --- Server API helpers ---

async function apiCall(
  method: "GET" | "POST",
  body?: any
): Promise<any> {
  const res = await fetch("/api/admin", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": ADMIN_PASSWORD,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// --- Notes ---

export function getNote(slug: string): string {
  if (typeof window === "undefined") return "";
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  return notes[slug] || "";
}

export function setNote(slug: string, note: string) {
  if (typeof window === "undefined") return;
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  if (note.trim()) {
    notes[slug] = note;
  } else {
    delete notes[slug];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  // Persist to server
  apiCall("POST", { action: "setNote", slug, note });
}

// --- Status overrides ---

export function getStatusOverride(
  slug: string
): InteractiveStatus | undefined {
  if (typeof window === "undefined") return undefined;
  const overrides = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  return overrides[slug];
}

export function setStatusOverride(slug: string, status: InteractiveStatus) {
  if (typeof window === "undefined") return;
  const overrides = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  overrides[slug] = status;
  localStorage.setItem(STATUS_KEY, JSON.stringify(overrides));
  // Persist to server
  apiCall("POST", { action: "setStatus", slug, status });
}

/** Delete an interactive from interactives.ts and clean up admin data. */
export async function deleteInteractive(slug: string): Promise<boolean> {
  const res = await apiCall("POST", { action: "deleteInteractive", slug });
  return res.deleted === true;
}

/** Write the status directly into interactives.ts and clear the override. */
export async function commitStatus(
  slug: string,
  status: InteractiveStatus
): Promise<boolean> {
  const res = await apiCall("POST", { action: "commitStatus", slug, status });
  if (res.committed) {
    // Clear local override since it's now in the source
    const overrides = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
    delete overrides[slug];
    localStorage.setItem(STATUS_KEY, JSON.stringify(overrides));
    return true;
  }
  return false;
}

export function clearStatusOverride(slug: string) {
  if (typeof window === "undefined") return;
  const overrides = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  delete overrides[slug];
  localStorage.setItem(STATUS_KEY, JSON.stringify(overrides));
  apiCall("POST", { action: "clearStatus", slug });
}

export function getAllStatusOverrides(): Record<string, InteractiveStatus> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
}

export function getAllNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
}

// --- Ideas ---

export function getIdeas(): IdeaEntry[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(IDEAS_KEY) || "[]");
}

export function addIdea(idea: Omit<IdeaEntry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const newIdea = {
    ...idea,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  const ideas = getIdeas();
  ideas.push(newIdea);
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  // Persist to server — send the complete idea so IDs stay in sync
  apiCall("POST", { action: "addIdea", idea: newIdea });
}

export function removeIdea(id: string) {
  if (typeof window === "undefined") return;
  const ideas = getIdeas().filter((i) => i.id !== id);
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  apiCall("POST", { action: "removeIdea", id });
}

export function updateIdea(id: string, updates: Partial<IdeaEntry>) {
  if (typeof window === "undefined") return;
  const ideas = getIdeas().map((i) =>
    i.id === id ? { ...i, ...updates } : i
  );
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  apiCall("POST", { action: "updateIdea", id, updates });
}

// --- Todos ---

function getAllTodos(): Record<string, TodoItem[]> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(TODOS_KEY) || "{}");
}

function saveAllTodos(todos: Record<string, TodoItem[]>) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  apiCall("POST", { action: "setTodos", todos });
}

export function getTodos(slug: string): TodoItem[] {
  return getAllTodos()[slug] || [];
}

/** Get the next refId (T1, T2, ...) within a single interactive's todos */
function nextRefId(list: TodoItem[]): string {
  let max = 0;
  for (const t of list) {
    const m = t.refId?.match(/^T(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `T${max + 1}`;
}

export function addTodo(slug: string, text: string) {
  if (typeof window === "undefined") return;
  const all = getAllTodos();
  const list = all[slug] || [];
  list.push({
    id: crypto.randomUUID(),
    text,
    done: false,
    refId: nextRefId(list),
  });
  all[slug] = list;
  saveAllTodos(all);
}

export function toggleTodo(slug: string, todoId: string, remark?: string) {
  if (typeof window === "undefined") return;
  const all = getAllTodos();
  const list = all[slug] || [];
  all[slug] = list.map((t) => {
    if (t.id !== todoId) return t;
    const nowDone = !t.done;
    return {
      ...t,
      done: nowDone,
      doneDate: nowDone ? new Date().toISOString().split("T")[0] : undefined,
      remark: nowDone ? (remark || t.remark) : t.remark,
    };
  });
  saveAllTodos(all);
}

export function updateTodoRemark(slug: string, todoId: string, remark: string) {
  if (typeof window === "undefined") return;
  const all = getAllTodos();
  all[slug] = (all[slug] || []).map((t) =>
    t.id === todoId ? { ...t, remark } : t
  );
  saveAllTodos(all);
}

export function removeTodo(slug: string, todoId: string) {
  if (typeof window === "undefined") return;
  const all = getAllTodos();
  all[slug] = (all[slug] || []).filter((t) => t.id !== todoId);
  if (all[slug].length === 0) delete all[slug];
  saveAllTodos(all);
}

export function getAllTodoCounts(): Record<string, { total: number; done: number }> {
  const all = getAllTodos();
  const counts: Record<string, { total: number; done: number }> = {};
  for (const [slug, items] of Object.entries(all)) {
    counts[slug] = { total: items.length, done: items.filter((t) => t.done).length };
  }
  return counts;
}

// --- Sync: load server data into localStorage ---

export async function syncFromServer(): Promise<void> {
  try {
    const data = await apiCall("GET");
    if (data.error) return; // auth failed
    if (data.statusOverrides !== undefined) {
      localStorage.setItem(STATUS_KEY, JSON.stringify(data.statusOverrides));
    }
    if (data.notes !== undefined) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(data.notes));
    }
    if (data.ideas !== undefined) {
      localStorage.setItem(IDEAS_KEY, JSON.stringify(data.ideas));
    }
    if (data.todos !== undefined) {
      localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
    }
  } catch {
    // Offline or server unavailable — use localStorage as fallback
  }
}

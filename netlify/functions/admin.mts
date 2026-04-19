import type { Context } from "@netlify/functions";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yukti2025";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = "nm-static/interactives";
const GITHUB_BRANCH = "main";

const DEFAULT_DATA = { statusOverrides: {}, notes: {}, ideas: [], todos: {} };

// --- GitHub API helpers ---

async function githubGetFile(path: string): Promise<{ content: string; sha: string } | null> {
  if (!GITHUB_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, sha: data.sha };
  } catch { return null; }
}

async function githubPutFile(path: string, content: string, message: string, sha?: string): Promise<boolean> {
  if (!GITHUB_TOKEN) return false;
  try {
    const body: any = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch: GITHUB_BRANCH,
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.ok;
  } catch { return false; }
}

// --- Data helpers ---

async function readData() {
  const file = await githubGetFile("src/data/admin-data.json");
  if (file) return { ...DEFAULT_DATA, ...JSON.parse(file.content), _sha: file.sha };
  return { ...DEFAULT_DATA };
}

async function writeData(data: any, message = "admin: update admin data") {
  const { _sha, ...cleanData } = data;
  const content = JSON.stringify(cleanData, null, 2) + "\n";
  await githubPutFile("src/data/admin-data.json", content, message, _sha);
}

type TodoLike = { id: string; refId?: string; done?: boolean; remark?: string };

/** Describe what changed between two whole-todos snapshots. */
function describeTodoChanges(
  oldTodos: Record<string, TodoLike[]> = {},
  newTodos: Record<string, TodoLike[]> = {}
): string | null {
  const perSlug: string[] = [];
  const slugs = new Set([...Object.keys(oldTodos), ...Object.keys(newTodos)]);
  for (const slug of slugs) {
    const oldList = oldTodos[slug] || [];
    const newList = newTodos[slug] || [];
    const oldById = new Map(oldList.map((t) => [t.id, t]));
    const newById = new Map(newList.map((t) => [t.id, t]));

    const added: TodoLike[] = [];
    const removed: TodoLike[] = [];
    const markedDone: TodoLike[] = [];
    const reopened: TodoLike[] = [];
    const remarkChanged: TodoLike[] = [];

    for (const [id, t] of newById) {
      if (!oldById.has(id)) added.push(t);
    }
    for (const [id, t] of oldById) {
      if (!newById.has(id)) removed.push(t);
    }
    for (const [id, newT] of newById) {
      const oldT = oldById.get(id);
      if (!oldT) continue;
      if ((oldT.done ?? false) !== (newT.done ?? false)) {
        (newT.done ? markedDone : reopened).push(newT);
      } else if ((oldT.remark || "") !== (newT.remark || "")) {
        remarkChanged.push(newT);
      }
    }

    const refs = (list: TodoLike[]) =>
      list.map((t) => t.refId || t.id.slice(0, 8)).join(", ");
    const parts: string[] = [];
    if (added.length) parts.push(`add ${refs(added)}`);
    if (removed.length) parts.push(`remove ${refs(removed)}`);
    if (markedDone.length) parts.push(`mark ${refs(markedDone)} done`);
    if (reopened.length) parts.push(`reopen ${refs(reopened)}`);
    if (remarkChanged.length) parts.push(`remark on ${refs(remarkChanged)}`);
    if (parts.length) perSlug.push(`${slug}: ${parts.join(", ")}`);
  }
  return perSlug.length ? perSlug.join("; ") : null;
}

// --- Source file helpers ---

function applyStatusChange(source: string, slug: string, newStatus: string): string | null {
  const slugPattern = `slug: "${slug}"`;
  const slugIndex = source.indexOf(slugPattern);
  if (slugIndex === -1) return null;
  const closingIndex = source.indexOf("\n  },", slugIndex);
  if (closingIndex === -1) return null;
  const block = source.substring(slugIndex, closingIndex);
  const statusMatch = block.match(/status: "(\w+)" as const,/);
  if (!statusMatch) return null;
  const oldStatusStr = `status: "${statusMatch[1]}" as const,`;
  const newStatusStr = `status: "${newStatus}" as const,`;
  const statusOffset = block.indexOf(oldStatusStr);
  if (statusOffset === -1) return null;
  const absOffset = slugIndex + statusOffset;
  return source.substring(0, absOffset) + newStatusStr + source.substring(absOffset + oldStatusStr.length);
}

function applyDelete(source: string, slug: string): string | null {
  const slugPattern = `slug: "${slug}"`;
  const slugIndex = source.indexOf(slugPattern);
  if (slugIndex === -1) return null;
  let braceStart = source.lastIndexOf("  {", slugIndex);
  if (braceStart === -1) return null;
  const closingPattern = "\n  },";
  let braceEnd = source.indexOf(closingPattern, slugIndex);
  if (braceEnd === -1) return null;
  braceEnd += closingPattern.length;
  const beforeBrace = source.substring(0, braceStart);
  const lastNewline = beforeBrace.lastIndexOf("\n");
  const lineBefore = beforeBrace.substring(lastNewline + 1).trim();
  const deleteFrom = lineBefore.startsWith("//") ? lastNewline + 1 : braceStart;
  return source.substring(0, deleteFrom) + source.substring(braceEnd).replace(/\n{3,}/g, "\n\n");
}

async function updateInteractivesSource(slug: string, newStatus: string): Promise<boolean> {
  const file = await githubGetFile("src/lib/interactives.ts");
  if (!file) return false;
  const updated = applyStatusChange(file.content, slug, newStatus);
  if (!updated) return false;
  return await githubPutFile("src/lib/interactives.ts", updated, `admin: set ${slug} to ${newStatus}`, file.sha);
}

async function deleteInteractiveFromSource(slug: string): Promise<boolean> {
  const file = await githubGetFile("src/lib/interactives.ts");
  if (!file) return false;
  const updated = applyDelete(file.content, slug);
  if (!updated) return false;
  return await githubPutFile("src/lib/interactives.ts", updated, `admin: delete ${slug}`, file.sha);
}

// --- Auth ---

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("x-admin-password");
  return auth === ADMIN_PASSWORD;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// --- Handler ---

export default async (request: Request, context: Context) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
      },
    });
  }

  if (!checkAuth(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (request.method === "GET") {
    const data = await readData();
    const { _sha, ...cleanData } = data;
    return json(cleanData);
  }

  if (request.method === "POST") {
    const body = await request.json();
    const data = await readData();
    let message = "admin: update admin data";

    if (body.action === "setStatus") {
      data.statusOverrides[body.slug] = body.status;
      message = `admin: override ${body.slug} status to ${body.status}`;
    } else if (body.action === "clearStatus") {
      delete data.statusOverrides[body.slug];
      message = `admin: clear status override on ${body.slug}`;
    } else if (body.action === "commitStatus") {
      const success = await updateInteractivesSource(body.slug, body.status);
      if (success) {
        delete data.statusOverrides[body.slug];
        await writeData(data, `admin: clear override after committing ${body.slug} status`);
        return json({ ok: true, committed: true });
      }
      return json({ ok: false, error: "Failed to update source file" }, 500);
    } else if (body.action === "setNote") {
      if (body.note?.trim()) {
        data.notes[body.slug] = body.note;
        message = `admin: update note on ${body.slug}`;
      } else {
        delete data.notes[body.slug];
        message = `admin: clear note on ${body.slug}`;
      }
    } else if (body.action === "addIdea") {
      const idea = body.idea;
      data.ideas.push({
        ...idea,
        id: idea.id || crypto.randomUUID(),
        createdAt: idea.createdAt || new Date().toISOString().split("T")[0],
      });
      message = `admin: add idea "${idea.title || idea.id?.slice(0, 8) || ""}"`.trim();
    } else if (body.action === "removeIdea") {
      const removed = data.ideas.find((i: any) => i.id === body.id);
      data.ideas = data.ideas.filter((i: any) => i.id !== body.id);
      message = `admin: remove idea${removed?.title ? ` "${removed.title}"` : ""}`;
    } else if (body.action === "updateIdea") {
      const existing = data.ideas.find((i: any) => i.id === body.id);
      data.ideas = data.ideas.map((i: any) =>
        i.id === body.id ? { ...i, ...body.updates } : i
      );
      message = `admin: update idea${existing?.title ? ` "${existing.title}"` : ""}`;
    } else if (body.action === "deleteInteractive") {
      const success = await deleteInteractiveFromSource(body.slug);
      delete data.statusOverrides[body.slug];
      delete data.notes[body.slug];
      delete data.todos?.[body.slug];
      await writeData(data, `admin: clean up admin data for deleted ${body.slug}`);
      return json({ ok: success, deleted: success });
    } else if (body.action === "setTodos") {
      const desc = describeTodoChanges(data.todos, body.todos);
      data.todos = body.todos;
      if (desc) message = `admin: ${desc}`;
    } else if (body.action === "saveAll") {
      if (body.statusOverrides) data.statusOverrides = body.statusOverrides;
      if (body.notes) data.notes = body.notes;
      if (body.ideas) data.ideas = body.ideas;
      if (body.todos) data.todos = body.todos;
      message = "admin: bulk sync (saveAll)";
    }

    await writeData(data, message);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/admin",
};

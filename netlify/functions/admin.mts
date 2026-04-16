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

async function writeData(data: any) {
  const { _sha, ...cleanData } = data;
  const content = JSON.stringify(cleanData, null, 2) + "\n";
  await githubPutFile("src/data/admin-data.json", content, "admin: update admin data", _sha);
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

    if (body.action === "setStatus") {
      data.statusOverrides[body.slug] = body.status;
    } else if (body.action === "clearStatus") {
      delete data.statusOverrides[body.slug];
    } else if (body.action === "commitStatus") {
      const success = await updateInteractivesSource(body.slug, body.status);
      if (success) {
        delete data.statusOverrides[body.slug];
        await writeData(data);
        return json({ ok: true, committed: true });
      }
      return json({ ok: false, error: "Failed to update source file" }, 500);
    } else if (body.action === "setNote") {
      if (body.note?.trim()) { data.notes[body.slug] = body.note; }
      else { delete data.notes[body.slug]; }
    } else if (body.action === "addIdea") {
      const idea = body.idea;
      data.ideas.push({
        ...idea,
        id: idea.id || crypto.randomUUID(),
        createdAt: idea.createdAt || new Date().toISOString().split("T")[0],
      });
    } else if (body.action === "removeIdea") {
      data.ideas = data.ideas.filter((i: any) => i.id !== body.id);
    } else if (body.action === "updateIdea") {
      data.ideas = data.ideas.map((i: any) =>
        i.id === body.id ? { ...i, ...body.updates } : i
      );
    } else if (body.action === "deleteInteractive") {
      const success = await deleteInteractiveFromSource(body.slug);
      delete data.statusOverrides[body.slug];
      delete data.notes[body.slug];
      delete data.todos?.[body.slug];
      await writeData(data);
      return json({ ok: success, deleted: success });
    } else if (body.action === "setTodos") {
      data.todos = body.todos;
    } else if (body.action === "saveAll") {
      if (body.statusOverrides) data.statusOverrides = body.statusOverrides;
      if (body.notes) data.notes = body.notes;
      if (body.ideas) data.ideas = body.ideas;
      if (body.todos) data.todos = body.todos;
    }

    await writeData(data);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/admin",
};

import type { APIRoute } from "astro";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_PASSWORD } from "@/lib/admin";

export const prerender = false;

const DATA_PATH = resolve("src/data/admin-data.json");
const INTERACTIVES_PATH = resolve("src/lib/interactives.ts");

function readData() {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return { statusOverrides: {}, notes: {}, ideas: [], todos: {} };
  }
}

function writeData(data: any) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
}

function updateInteractivesSource(slug: string, newStatus: string): boolean {
  try {
    let source = readFileSync(INTERACTIVES_PATH, "utf-8");

    // Find the entry for this slug and update its status.
    // Pattern: slug: "the-slug", ... status: "old" as const,
    // We search for the slug, then find the next `status:` line within that block.
    const slugPattern = `slug: "${slug}"`;
    const slugIndex = source.indexOf(slugPattern);
    if (slugIndex === -1) return false;

    // Find the closing `},` of this entry (next occurrence after the slug)
    const closingIndex = source.indexOf("\n  },", slugIndex);
    if (closingIndex === -1) return false;

    // Find the status line within this block
    const block = source.substring(slugIndex, closingIndex);
    const statusMatch = block.match(/status: "(\w+)" as const,/);
    if (!statusMatch) return false;

    const oldStatusStr = `status: "${statusMatch[1]}" as const,`;
    const newStatusStr = `status: "${newStatus}" as const,`;
    const blockStart = slugIndex;
    const statusOffset = block.indexOf(oldStatusStr);
    if (statusOffset === -1) return false;

    const absOffset = blockStart + statusOffset;
    source =
      source.substring(0, absOffset) +
      newStatusStr +
      source.substring(absOffset + oldStatusStr.length);

    writeFileSync(INTERACTIVES_PATH, source);
    return true;
  } catch (e) {
    console.error("Failed to update interactives.ts:", e);
    return false;
  }
}

function deleteInteractiveFromSource(slug: string): boolean {
  try {
    let source = readFileSync(INTERACTIVES_PATH, "utf-8");
    const slugPattern = `slug: "${slug}"`;
    const slugIndex = source.indexOf(slugPattern);
    if (slugIndex === -1) return false;

    // Find the opening `{` before the slug
    let braceStart = source.lastIndexOf("  {", slugIndex);
    if (braceStart === -1) return false;

    // Find the closing `},` after the slug
    const closingPattern = "\n  },";
    let braceEnd = source.indexOf(closingPattern, slugIndex);
    if (braceEnd === -1) return false;
    braceEnd += closingPattern.length;

    // Also remove any comment line directly before the entry
    const beforeBrace = source.substring(0, braceStart);
    const lastNewline = beforeBrace.lastIndexOf("\n");
    const lineBefore = beforeBrace.substring(lastNewline + 1).trim();
    const deleteFrom = lineBefore.startsWith("//") ? lastNewline + 1 : braceStart;

    source = source.substring(0, deleteFrom) + source.substring(braceEnd);
    // Clean up double blank lines
    source = source.replace(/\n{3,}/g, "\n\n");
    writeFileSync(INTERACTIVES_PATH, source);
    return true;
  } catch (e) {
    console.error("Failed to delete from interactives.ts:", e);
    return false;
  }
}

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("x-admin-password");
  return auth === ADMIN_PASSWORD;
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  return new Response(JSON.stringify(readData()), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json();
  const data = readData();

  if (body.action === "setStatus") {
    data.statusOverrides[body.slug] = body.status;
  } else if (body.action === "clearStatus") {
    delete data.statusOverrides[body.slug];
  } else if (body.action === "commitStatus") {
    // Write status change directly into interactives.ts
    const success = updateInteractivesSource(body.slug, body.status);
    if (success) {
      // Clear the override since it's now in the source
      delete data.statusOverrides[body.slug];
      writeData(data);
      return new Response(
        JSON.stringify({ ok: true, committed: true, data }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to update source file" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (body.action === "setNote") {
    if (body.note?.trim()) {
      data.notes[body.slug] = body.note;
    } else {
      delete data.notes[body.slug];
    }
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
    const success = deleteInteractiveFromSource(body.slug);
    // Also clean up admin data for this slug
    delete data.statusOverrides[body.slug];
    delete data.notes[body.slug];
    delete data.todos[body.slug];
    writeData(data);
    return new Response(
      JSON.stringify({ ok: success, deleted: success, data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } else if (body.action === "setTodos") {
    data.todos = body.todos;
  } else if (body.action === "saveAll") {
    if (body.statusOverrides) data.statusOverrides = body.statusOverrides;
    if (body.notes) data.notes = body.notes;
    if (body.ideas) data.ideas = body.ideas;
    if (body.todos) data.todos = body.todos;
  }

  writeData(data);
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
};

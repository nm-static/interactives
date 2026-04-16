import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lock, Search, ExternalLink, LogOut, Trash2, StickyNote,
  Lightbulb, ListTodo, CheckCircle, Circle,
} from "lucide-react";
import {
  allInteractives,
  type InteractiveStatus,
} from "@/lib/interactives";
import {
  ADMIN_PASSWORD,
  isAdminLoggedIn,
  setAdminLoggedIn,
  getAllStatusOverrides,
  getAllNotes,
  getIdeas,
  removeIdea,
  syncFromServer,
  deleteInteractive,
  getTodos,
  type IdeaEntry,
  type TodoItem,
} from "@/lib/admin";

const statusColors: Record<InteractiveStatus, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  idea: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const AdminDashboard: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<InteractiveStatus | "all">("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [overrides, setOverrides] = useState<Record<string, InteractiveStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [allTodos, setAllTodos] = useState<{ slug: string; title: string; todos: TodoItem[] }[]>([]);
  const [todoFilter, setTodoFilter] = useState<"open" | "done" | "all">("open");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [interactivesPage, setInteractivesPage] = useState(1);
  const [todosPage, setTodosPage] = useState(1);
  const [ideasPage, setIdeasPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (isAdminLoggedIn()) setAuthenticated(true);
  }, []);

  const refreshFromStorage = () => {
    setOverrides(getAllStatusOverrides());
    setNotes(getAllNotes());
    setIdeas(getIdeas());
    // Load todos for all interactives
    const todosData = allInteractives
      .map((i) => ({ slug: i.slug, title: i.title, todos: getTodos(i.slug) }))
      .filter((t) => t.todos.length > 0);
    setAllTodos(todosData);
  };

  useEffect(() => {
    if (authenticated) {
      syncFromServer().then(refreshFromStorage).catch(refreshFromStorage);
    }
  }, [authenticated]);

  // Reset pagination when filters change
  useEffect(() => { setInteractivesPage(1); }, [searchTerm, filterStatus, filterTheme]);
  useEffect(() => { setTodosPage(1); }, [todoFilter]);
  useEffect(() => { setIdeasPage(1); }, [searchTerm, filterStatus, filterTheme]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    setAuthenticated(false);
    setPassword("");
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">Incorrect password.</p>}
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const effectiveStatus = (slug: string, sourceStatus: InteractiveStatus) =>
    overrides[slug] || sourceStatus;

  const filteredInteractives = allInteractives.filter((i) => {
    const matchesSearch = !searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const status = effectiveStatus(i.slug, i.status);
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    const matchesTheme = filterTheme === "all" || i.themes.includes(filterTheme);
    return matchesSearch && matchesStatus && matchesTheme;
  });

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = !searchTerm || idea.title.toLowerCase().includes(searchTerm.toLowerCase()) || idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || filterStatus === "idea";
    const matchesTheme = filterTheme === "all" || idea.themes.includes(filterTheme);
    return matchesSearch && matchesStatus && matchesTheme;
  });

  const counts = {
    published: allInteractives.filter((i) => effectiveStatus(i.slug, i.status) === "published").length,
    draft: allInteractives.filter((i) => effectiveStatus(i.slug, i.status) === "draft").length,
    idea: allInteractives.filter((i) => effectiveStatus(i.slug, i.status) === "idea").length + ideas.length,
  };

  const uniqueThemes = Array.from(new Set([...allInteractives.flatMap((i) => i.themes), ...ideas.flatMap((i) => i.themes)])).sort();
  const hasOverrides = Object.keys(overrides).length > 0;

  const handleRemoveIdea = (id: string) => { removeIdea(id); refreshFromStorage(); };

  const handleDeleteInteractive = async (slug: string) => {
    if (!confirm(`Delete "${slug}" permanently? This removes it from interactives.ts.`)) return;
    setDeleting(slug);
    await deleteInteractive(slug);
    setDeleting(null);
    // Page needs reload since allInteractives is static
    window.location.reload();
  };

  // Todos aggregation
  const totalOpenTodos = allTodos.reduce((sum, t) => sum + t.todos.filter((x) => !x.done).length, 0);
  const totalDoneTodos = allTodos.reduce((sum, t) => sum + t.todos.filter((x) => x.done).length, 0);

  const filteredTodos = allTodos
    .map((entry) => ({
      ...entry,
      todos: entry.todos.filter((t) => {
        if (todoFilter === "open") return !t.done;
        if (todoFilter === "done") return t.done;
        return true;
      }),
    }))
    .filter((entry) => entry.todos.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Admin Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(["published", "draft", "idea"] as const).map((s) => {
          const colors = { published: "text-green-600", draft: "text-yellow-600", idea: "text-blue-600" };
          const rings = { published: "ring-green-500", draft: "ring-yellow-500", idea: "ring-blue-500" };
          return (
            <Card key={s} className={`cursor-pointer transition-shadow hover:shadow-md ${filterStatus === s ? `ring-2 ${rings[s]}` : ""}`}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}>
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${colors[s]}`}>{counts[s]}</div>
                <p className="text-sm text-muted-foreground capitalize">{s}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasOverrides && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm"><strong>{Object.keys(overrides).length} pending status change(s)</strong> — use the Save button on each interactive's page to commit.</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="interactives">
        <TabsList>
          <TabsTrigger value="interactives">Interactives</TabsTrigger>
          <TabsTrigger value="todos" className="gap-1.5">
            Todos
            {totalOpenTodos > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{totalOpenTodos}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ideas" className="gap-1.5">
            Ideas
            {ideas.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{ideas.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Interactives Tab ─── */}
        <TabsContent value="interactives" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="idea">Idea</option>
            </select>
            <select value={filterTheme} onChange={(e) => setFilterTheme(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All themes</option>
              {uniqueThemes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredInteractives.length} of {allInteractives.length}
          </p>

          {filteredInteractives.length > 0 && (() => {
            const totalInteractivesPages = Math.ceil(filteredInteractives.length / PAGE_SIZE);
            const paginatedInteractives = filteredInteractives.slice((interactivesPage - 1) * PAGE_SIZE, interactivesPage * PAGE_SIZE);
            return (<>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Interactive</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Theme</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Added</th>
                    <th className="px-4 py-3 font-medium w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedInteractives.map((item) => {
                    const status = effectiveStatus(item.slug, item.status);
                    const hasNote = notes[item.slug];
                    const todoCount = getTodos(item.slug).filter((t) => !t.done).length;
                    return (
                      <tr key={item.slug} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.slug}</p>
                            </div>
                            {hasNote && <StickyNote className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                            {todoCount > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <ListTodo className="w-3 h-3" />{todoCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {item.themes.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>{status}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.dateAdded}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a href={`/i/${item.slug}`} className="text-muted-foreground hover:text-foreground" target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteInteractive(item.slug)}
                              disabled={deleting === item.slug}
                              className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                              title="Delete interactive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalInteractivesPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setInteractivesPage(p => p - 1)} disabled={interactivesPage === 1}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {interactivesPage} of {totalInteractivesPages}</span>
                <Button variant="outline" size="sm" onClick={() => setInteractivesPage(p => p + 1)} disabled={interactivesPage === totalInteractivesPages}>Next</Button>
              </div>
            )}
            </>);
          })()}
        </TabsContent>

        {/* ─── Todos Tab ─── */}
        <TabsContent value="todos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {totalOpenTodos} open, {totalDoneTodos} done
              </p>
            </div>
            <div className="flex gap-1">
              {(["open", "done", "all"] as const).map((f) => (
                <Button key={f} variant={todoFilter === f ? "default" : "ghost"} size="sm"
                  className={todoFilter === f ? "!h-8 !min-h-8 rounded-full !px-4" : ""}
                  onClick={() => setTodoFilter(f)}>
                  {f === "open" ? "Open" : f === "done" ? "Done" : "All"}
                </Button>
              ))}
            </div>
          </div>

          {filteredTodos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {todoFilter === "open" ? "No open todos." : todoFilter === "done" ? "No completed todos." : "No todos."}
              </p>
            </div>
          )}

          {(() => {
            const totalTodosPages = Math.ceil(filteredTodos.length / PAGE_SIZE);
            const paginatedTodos = filteredTodos.slice((todosPage - 1) * PAGE_SIZE, todosPage * PAGE_SIZE);
            return (<>
          {paginatedTodos.map((entry) => (
            <Card key={entry.slug}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <a href={`/i/${entry.slug}`} className="hover:text-primary transition-colors">
                    {entry.title}
                  </a>
                  <Badge variant="outline" className="text-xs font-mono">{entry.slug}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {entry.todos.map((todo) => (
                    <li key={todo.id} className="flex items-start gap-2">
                      {todo.done ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-primary/60">{todo.refId}</span>
                          <span className={`text-sm ${todo.done ? "line-through text-muted-foreground" : ""}`}>
                            {todo.text}
                          </span>
                        </div>
                        {todo.remark && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{todo.remark}</p>
                        )}
                        {todo.done && todo.doneDate && (
                          <span className="text-xs text-green-600">Done {todo.doneDate}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {totalTodosPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setTodosPage(p => p - 1)} disabled={todosPage === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {todosPage} of {totalTodosPages}</span>
              <Button variant="outline" size="sm" onClick={() => setTodosPage(p => p + 1)} disabled={todosPage === totalTodosPages}>Next</Button>
            </div>
          )}
          </>);
          })()}
        </TabsContent>

        {/* ─── Ideas Tab ─── */}
        <TabsContent value="ideas" className="space-y-4 mt-4">
          {ideas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No ideas yet. Add ideas from theme or subcategory pages.</p>
            </div>
          )}
          {(() => {
            const totalIdeasPages = Math.ceil(filteredIdeas.length / PAGE_SIZE);
            const paginatedIdeas = filteredIdeas.slice((ideasPage - 1) * PAGE_SIZE, ideasPage * PAGE_SIZE);
            return (<>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedIdeas.map((idea) => (
              <Card key={idea.id} className="relative border-dashed border-blue-300 dark:border-blue-700">
                <button onClick={() => handleRemoveIdea(idea.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base pr-6 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
                    {idea.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {idea.description && <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {idea.themes.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    {idea.subcategory && <Badge variant="secondary" className="text-xs">{idea.subcategory}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Added {idea.createdAt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalIdeasPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIdeasPage(p => p - 1)} disabled={ideasPage === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {ideasPage} of {totalIdeasPages}</span>
              <Button variant="outline" size="sm" onClick={() => setIdeasPage(p => p + 1)} disabled={ideasPage === totalIdeasPages}>Next</Button>
            </div>
          )}
          </>);
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

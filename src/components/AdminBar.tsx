import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, StickyNote, ChevronDown, ChevronUp, Save, Check,
  Loader2, Plus, Trash2, ListTodo, MessageSquare,
} from "lucide-react";
import {
  isAdminLoggedIn,
  getNote,
  setNote,
  getStatusOverride,
  setStatusOverride,
  commitStatus,
  syncFromServer,
  getTodos,
  addTodo,
  toggleTodo,
  removeTodo,
  updateTodoRemark,
  type TodoItem,
} from "@/lib/admin";
import type { InteractiveStatus } from "@/lib/interactives";

interface AdminBarProps {
  slug: string;
  currentStatus: InteractiveStatus;
}

const statusOptions: { value: InteractiveStatus; label: string; color: string }[] = [
  { value: "published", label: "Published", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
];

const TodoRow: React.FC<{
  todo: TodoItem;
  slug: string;
  onToggle: () => void;
  onRemove: () => void;
  onRemarkChange: (remark: string) => void;
}> = ({ todo, slug, onToggle, onRemove, onRemarkChange }) => {
  const [showRemark, setShowRemark] = useState(false);
  const [remarkText, setRemarkText] = useState(todo.remark || "");

  const handleRemarkBlur = () => {
    if (remarkText !== (todo.remark || "")) {
      onRemarkChange(remarkText);
    }
  };

  return (
    <li className="group/todo">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={todo.done}
          onCheckedChange={onToggle}
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-primary/60">{todo.refId}</span>
            <span className={`text-sm ${todo.done ? "line-through text-muted-foreground" : ""}`}>
              {todo.text}
            </span>
          </div>
          {todo.done && todo.doneDate && (
            <span className="text-xs text-green-600">Done {todo.doneDate}</span>
          )}
          {todo.remark && !showRemark && (
            <p className="text-xs text-muted-foreground italic mt-0.5">{todo.remark}</p>
          )}
          {showRemark && (
            <Input
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              onBlur={handleRemarkBlur}
              onKeyDown={(e) => { if (e.key === "Enter") { handleRemarkBlur(); setShowRemark(false); } }}
              placeholder="Add a remark..."
              className="text-xs h-7 mt-1"
              autoFocus
            />
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover/todo:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setShowRemark((v) => !v)}
            className="p-1 text-muted-foreground hover:text-foreground"
            title="Add remark"
          >
            <MessageSquare className="w-3 h-3" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </li>
  );
};

const AdminBar: React.FC<AdminBarProps> = ({ slug, currentStatus }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<InteractiveStatus>(currentStatus);
  const [noteText, setNoteText] = useState("");
  const [hasOverride, setHasOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const refreshTodos = () => setTodos(getTodos(slug));

  useEffect(() => {
    const admin = isAdminLoggedIn();
    setIsAdmin(admin);
    if (admin) {
      syncFromServer().finally(() => {
        const override = getStatusOverride(slug);
        if (override) {
          setStatus(override);
          setHasOverride(true);
        }
        setNoteText(getNote(slug));
        refreshTodos();
      });
    }
  }, [slug]);

  if (!isAdmin) return null;

  const handleStatusChange = (newStatus: InteractiveStatus) => {
    setStatus(newStatus);
    setStatusOverride(slug, newStatus);
    setHasOverride(true);
    setSaved(false);
  };

  const handleNoteChange = (value: string) => {
    setNoteText(value);
    setNote(slug, value);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await commitStatus(slug, status);
    setSaving(false);
    if (success) {
      setHasOverride(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo(slug, newTodo.trim());
    setNewTodo("");
    refreshTodos();
  };

  const handleToggleTodo = (todoId: string) => {
    toggleTodo(slug, todoId);
    refreshTodos();
  };

  const handleRemoveTodo = (todoId: string) => {
    removeTodo(slug, todoId);
    refreshTodos();
  };

  const handleRemarkChange = (todoId: string, remark: string) => {
    updateTodoRemark(slug, todoId, remark);
    refreshTodos();
  };

  const isDirty = hasOverride;
  const doneCount = todos.filter((t) => t.done).length;
  const hasTodos = todos.length > 0;
  const openTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  return (
    <div className="mb-4 rounded-lg border-2 border-dashed border-primary/15 bg-primary/[0.02]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm"
      >
        <span className="flex items-center gap-2 text-primary font-medium">
          <Shield className="w-4 h-4" />
          Admin
          {isDirty && (
            <Badge variant="outline" className="text-xs">
              unsaved
            </Badge>
          )}
          {saved && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
              saved
            </Badge>
          )}
          {noteText && (
            <StickyNote className="w-3.5 h-3.5 text-yellow-600" />
          )}
          {hasTodos && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListTodo className="w-3.5 h-3.5" />
              {doneCount}/{todos.length}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            statusOptions.find((o) => o.value === status)?.color || ""
          }`}>
            {status}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Status control */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Status
            </label>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      status === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-current`
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="gap-1.5 h-7 text-xs ml-2"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : saved ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          {/* Todos */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Todos {hasTodos && <span className="text-muted-foreground/60">({doneCount}/{todos.length} done)</span>}
            </label>
            {openTodos.length > 0 && (
              <ul className="space-y-2 mb-2">
                {openTodos.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    slug={slug}
                    onToggle={() => handleToggleTodo(todo.id)}
                    onRemove={() => handleRemoveTodo(todo.id)}
                    onRemarkChange={(r) => handleRemarkChange(todo.id, r)}
                  />
                ))}
              </ul>
            )}
            {doneTodos.length > 0 && (
              <details className="mb-2">
                <summary className="text-xs text-muted-foreground cursor-pointer mb-1">
                  {doneTodos.length} completed
                </summary>
                <ul className="space-y-2 opacity-60">
                  {doneTodos.map((todo) => (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      slug={slug}
                      onToggle={() => handleToggleTodo(todo.id)}
                      onRemove={() => handleRemoveTodo(todo.id)}
                      onRemarkChange={(r) => handleRemarkChange(todo.id, r)}
                    />
                  ))}
                </ul>
              </details>
            )}
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a todo... (use T1, T2 to reference others)"
                className="text-sm h-8"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8 px-2" disabled={!newTodo.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Notes
            </label>
            <Textarea
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Add private notes about this interactive..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBar;

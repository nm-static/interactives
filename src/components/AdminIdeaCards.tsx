import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Pencil, Trash2, Check, X } from "lucide-react";
import {
  isAdminLoggedIn,
  getIdeas,
  syncFromServer,
  updateIdea,
  removeIdea,
  type IdeaEntry,
} from "@/lib/admin";

interface AdminIdeaCardsProps {
  theme?: string;
  subcategory?: string;
}

const IdeaCard: React.FC<{
  idea: IdeaEntry;
  onUpdate: (id: string, updates: Partial<IdeaEntry>) => void;
  onRemove: (id: string) => void;
}> = ({ idea, onUpdate, onRemove }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description);
  const [notes, setNotes] = useState(idea.notes || "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    onUpdate(idea.id, { title, description, notes });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(idea.title);
    setDescription(idea.description);
    setNotes(idea.notes || "");
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <div
        className="rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 p-4 h-full space-y-3"
        onKeyDown={handleKeyDown}
      >
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm font-semibold"
          placeholder="Title"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm"
          placeholder="Description"
          rows={2}
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-xs"
          placeholder="Private notes..."
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="gap-1 h-7 text-xs">
            <Check className="w-3 h-3" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1 h-7 text-xs">
            <X className="w-3 h-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-6 h-full opacity-70 group/idea relative">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/idea:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-500"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(idea.id)}
          className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800 text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-start gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
          {idea.title}
        </h3>
      </div>
      {idea.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {idea.description}
        </p>
      )}
      {idea.notes && (
        <p className="text-xs text-blue-500/70 italic mb-2 line-clamp-1">
          {idea.notes}
        </p>
      )}
      <Badge
        variant="outline"
        className="text-xs border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
      >
        idea
      </Badge>
    </div>
  );
};

const AdminIdeaCards: React.FC<AdminIdeaCardsProps> = ({ theme, subcategory }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);

  const loadIdeas = () => {
    const all = getIdeas();
    const filtered = all.filter((idea) => {
      if (theme && !idea.themes.includes(theme)) return false;
      if (subcategory && idea.subcategory !== subcategory) return false;
      return true;
    });
    setIdeas(filtered);
  };

  useEffect(() => {
    const admin = isAdminLoggedIn();
    setIsAdmin(admin);
    if (admin) {
      syncFromServer().finally(loadIdeas);
    }
  }, [theme, subcategory]);

  const handleUpdate = (id: string, updates: Partial<IdeaEntry>) => {
    updateIdea(id, updates);
    loadIdeas();
  };

  const handleRemove = (id: string) => {
    removeIdea(id);
    loadIdeas();
  };

  if (!isAdmin || ideas.length === 0) return null;

  return (
    <>
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      ))}
    </>
  );
};

export default AdminIdeaCards;

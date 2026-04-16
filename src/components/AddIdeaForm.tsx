import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { isAdminLoggedIn, addIdea } from "@/lib/admin";

interface AddIdeaFormProps {
  defaultTheme?: string;
  defaultSubcategory?: string;
}

const AddIdeaForm: React.FC<AddIdeaFormProps> = ({
  defaultTheme,
  defaultSubcategory,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
  }, []);

  if (!isAdmin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addIdea({
      title: title.trim(),
      description: description.trim(),
      themes: defaultTheme ? [defaultTheme] : [],
      subcategory: defaultSubcategory,
      status: "idea",
      notes: "",
    });

    setTitle("");
    setDescription("");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Add Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Interactive Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Stable Marriage Problem"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the interactive..."
              rows={3}
            />
          </div>
          {defaultTheme && (
            <p className="text-xs text-muted-foreground">
              Theme: <strong>{defaultTheme}</strong>
              {defaultSubcategory && (
                <> / <strong>{defaultSubcategory}</strong></>
              )}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={!title.trim()}>
            {saved ? "Saved!" : "Save Idea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIdeaForm;

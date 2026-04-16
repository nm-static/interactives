import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileEdit } from "lucide-react";
import { isAdminLoggedIn, syncFromServer, getAllStatusOverrides } from "@/lib/admin";
import { allInteractives, type InteractiveStatus } from "@/lib/interactives";

interface AdminDraftCardsProps {
  theme?: string;
  subcategory?: string;
}

const AdminDraftCards: React.FC<AdminDraftCardsProps> = ({ theme, subcategory }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [drafts, setDrafts] = useState<typeof allInteractives>([]);

  useEffect(() => {
    const admin = isAdminLoggedIn();
    setIsAdmin(admin);
    if (admin) {
      syncFromServer().finally(() => {
        const overrides = getAllStatusOverrides();
        const filtered = allInteractives.filter((i) => {
          const effectiveStatus: InteractiveStatus = overrides[i.slug] || i.status;
          if (effectiveStatus !== "draft") return false;
          if (theme && !i.themes.includes(theme)) return false;
          if (subcategory && i.subcategory !== subcategory) return false;
          return true;
        });
        setDrafts(filtered);
      });
    }
  }, [theme, subcategory]);

  if (!isAdmin || drafts.length === 0) return null;

  return (
    <>
      {drafts.map((item) => (
        <a key={item.slug} href={`/i/${item.slug}`} className="group">
          <div className="rounded-xl border-2 border-dashed border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20 p-6 h-full opacity-70">
            <div className="flex items-start gap-2 mb-2">
              <FileEdit className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 group-hover:text-yellow-600 transition-colors">
                {item.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
            <Badge
              variant="outline"
              className="text-xs border-yellow-400 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400"
            >
              draft
            </Badge>
          </div>
        </a>
      ))}
    </>
  );
};

export default AdminDraftCards;

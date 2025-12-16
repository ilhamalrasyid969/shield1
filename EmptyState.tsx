import { cn } from "@/lib/utils";
import { FolderOpen, Search, Trash2, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "drive" | "search" | "trash" | "shared" | "starred";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const emptyStateConfig = {
  drive: {
    icon: FolderOpen,
    title: "No files yet",
    description: "Upload files or create a folder to get started",
    iconColor: "text-muted-foreground",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters",
    iconColor: "text-muted-foreground",
  },
  trash: {
    icon: Trash2,
    title: "Trash is empty",
    description: "Items you delete will appear here",
    iconColor: "text-muted-foreground",
  },
  shared: {
    icon: Users,
    title: "Nothing shared yet",
    description: "Files shared with you will appear here",
    iconColor: "text-muted-foreground",
  },
  starred: {
    icon: Star,
    title: "No starred items",
    description: "Star files and folders to access them quickly",
    iconColor: "text-amber-500",
  },
};

export function EmptyState({ type, title, description, action, className }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)} data-testid={`empty-state-${type}`}>
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className={cn("h-12 w-12", config.iconColor)} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title || config.title}</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {description || config.description}
      </p>
      {action && (
        <Button onClick={action.onClick} data-testid="button-empty-state-action">
          {action.label}
        </Button>
      )}
    </div>
  );
}

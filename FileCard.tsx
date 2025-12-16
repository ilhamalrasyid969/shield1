import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileIcon } from "@/components/FileIcon";
import { formatFileSize, formatDate } from "@/lib/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Star, 
  Download, 
  Share2, 
  Pencil, 
  Trash2,
  FolderInput,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { File } from "@shared/schema";

interface FileCardProps {
  file: File;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FileCard({
  file,
  isSelected,
  onSelect,
  onClick,
  onStar,
  onRename,
  onMove,
  onCopy,
  onShare,
  onDownload,
  onDelete,
  className,
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-transparent p-3 transition-all cursor-pointer hover-elevate",
        isSelected && "bg-primary/10 border-primary/30",
        !isSelected && "hover:bg-muted/50",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-testid={`file-card-${file.id}`}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 transition-opacity",
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        )}
        style={{ visibility: isHovered || isSelected ? "visible" : "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect?.(!!checked)}
          data-testid={`checkbox-file-${file.id}`}
        />
      </div>

      {/* Star button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 right-2 h-7 w-7 transition-opacity",
          file.isStarred ? "opacity-100" : (isHovered ? "opacity-100" : "opacity-0")
        )}
        style={{ visibility: file.isStarred || isHovered ? "visible" : "hidden" }}
        onClick={(e) => {
          e.stopPropagation();
          onStar?.();
        }}
        data-testid={`button-star-${file.id}`}
      >
        <Star
          className={cn(
            "h-4 w-4",
            file.isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          )}
        />
      </Button>

      {/* File thumbnail/icon */}
      <div className="flex items-center justify-center h-24 mb-3">
        {file.thumbnailUrl && !file.isFolder ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded"
          />
        ) : (
          <FileIcon type={file.type} isFolder={file.isFolder} size="xl" />
        )}
      </div>

      {/* File info */}
      <div className="space-y-1">
        <p className="text-sm font-medium truncate" title={file.name} data-testid={`text-filename-${file.id}`}>
          {file.name}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{file.isFolder ? "Folder" : formatFileSize(file.size)}</span>
          <span>{formatDate(file.updatedAt)}</span>
        </div>
      </div>

      {/* Context menu */}
      <div
        className={cn(
          "absolute bottom-2 right-2 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{ visibility: isHovered ? "visible" : "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-menu-${file.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!file.isFolder && (
              <DropdownMenuItem onClick={onDownload} data-testid={`menu-download-${file.id}`}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onShare} data-testid={`menu-share-${file.id}`}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename} data-testid={`menu-rename-${file.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove} data-testid={`menu-move-${file.id}`}>
              <FolderInput className="h-4 w-4 mr-2" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy} data-testid={`menu-copy-${file.id}`}>
              <Copy className="h-4 w-4 mr-2" />
              Make a copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              className="text-destructive focus:text-destructive"
              data-testid={`menu-delete-${file.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {file.isTrashed ? "Delete forever" : "Move to trash"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

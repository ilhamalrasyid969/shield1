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
  Copy,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { File } from "@shared/schema";

type SortField = "name" | "size" | "updatedAt";
type SortOrder = "asc" | "desc";

interface FileListProps {
  files: File[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onClick: (file: File) => void;
  onStar: (file: File) => void;
  onRename: (file: File) => void;
  onMove: (file: File) => void;
  onCopy: (file: File) => void;
  onShare: (file: File) => void;
  onDownload: (file: File) => void;
  onDelete: (file: File) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}

export function FileList({
  files,
  selectedIds,
  onSelect,
  onSelectAll,
  onClick,
  onStar,
  onRename,
  onMove,
  onCopy,
  onShare,
  onDownload,
  onDelete,
  sortField,
  sortOrder,
  onSort,
  className,
}: FileListProps) {
  const allSelected = files.length > 0 && files.every(f => selectedIds.has(f.id));
  const someSelected = files.some(f => selectedIds.has(f.id)) && !allSelected;

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b text-sm text-muted-foreground font-medium">
        <div className="w-6">
          <Checkbox
            checked={allSelected}
            ref={(ref) => {
              if (ref) {
                (ref as any).indeterminate = someSelected;
              }
            }}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
            data-testid="checkbox-select-all"
          />
        </div>
        <button
          className="flex-1 flex items-center text-left hover:text-foreground transition-colors"
          onClick={() => onSort("name")}
          data-testid="sort-name"
        >
          Name <SortIndicator field="name" />
        </button>
        <button
          className="w-24 flex items-center hover:text-foreground transition-colors"
          onClick={() => onSort("size")}
          data-testid="sort-size"
        >
          Size <SortIndicator field="size" />
        </button>
        <button
          className="w-32 flex items-center hover:text-foreground transition-colors"
          onClick={() => onSort("updatedAt")}
          data-testid="sort-modified"
        >
          Modified <SortIndicator field="updatedAt" />
        </button>
        <div className="w-8" />
      </div>

      {/* File rows */}
      <div className="divide-y">
        {files.map((file) => {
          const isSelected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-4 px-4 py-3 group cursor-pointer hover-elevate",
                isSelected && "bg-primary/5"
              )}
              onClick={() => onClick(file)}
              data-testid={`file-row-${file.id}`}
            >
              <div className="w-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(file.id, !!checked)}
                  data-testid={`checkbox-file-${file.id}`}
                />
              </div>
              
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <FileIcon type={file.type} isFolder={file.isFolder} size="sm" />
                <span className="truncate font-medium" data-testid={`text-filename-${file.id}`}>
                  {file.name}
                </span>
                {file.isStarred && (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </div>
              
              <div className="w-24 text-sm text-muted-foreground">
                {file.isFolder ? "—" : formatFileSize(file.size)}
              </div>
              
              <div className="w-32 text-sm text-muted-foreground">
                {formatDate(file.updatedAt)}
              </div>
              
              <div className="w-8" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-menu-${file.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onStar(file)}>
                      <Star className={cn(
                        "h-4 w-4 mr-2",
                        file.isStarred && "fill-amber-400 text-amber-400"
                      )} />
                      {file.isStarred ? "Remove star" : "Add star"}
                    </DropdownMenuItem>
                    {!file.isFolder && (
                      <DropdownMenuItem onClick={() => onDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onShare(file)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onRename(file)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(file)}>
                      <FolderInput className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy(file)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Make a copy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(file)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {file.isTrashed ? "Delete forever" : "Move to trash"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

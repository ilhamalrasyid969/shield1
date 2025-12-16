import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCard } from "@/components/FileCard";
import { EmptyState } from "@/components/EmptyState";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, X, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileList } from "@/components/FileList";
import type { File } from "@shared/schema";

type ViewMode = "grid" | "list";
type SortField = "name" | "size" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function Shared() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/files/shared"],
  });

  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      let comparison = 0;
      if (sortField === "name") comparison = a.name.localeCompare(b.name);
      else if (sortField === "size") comparison = a.size - b.size;
      else comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [files, searchQuery, sortField, sortOrder]);

  const handleFileClick = (file: File) => {
    if (file.isFolder) {
      setLocation(`/drive/${file.id}`);
    } else {
      setPreviewFile(file);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-4 p-4 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Shared with me</h1>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search shared..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-none rounded-l-md", viewMode === "grid" && "bg-muted")}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-none rounded-r-md", viewMode === "list" && "bg-muted")}
            onClick={() => setViewMode("list")}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState type="shared" />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selectedIds.has(file.id)}
                onSelect={(selected) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    selected ? next.add(file.id) : next.delete(file.id);
                    return next;
                  });
                }}
                onClick={() => handleFileClick(file)}
                onDownload={() => window.open(`/api/files/${file.id}/download`, "_blank")}
              />
            ))}
          </div>
        ) : (
          <FileList
            files={filteredFiles}
            selectedIds={selectedIds}
            onSelect={(id, selected) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                selected ? next.add(id) : next.delete(id);
                return next;
              });
            }}
            onSelectAll={(selected) => {
              setSelectedIds(selected ? new Set(filteredFiles.map((f) => f.id)) : new Set());
            }}
            onClick={handleFileClick}
            onStar={() => {}}
            onRename={() => {}}
            onMove={() => {}}
            onCopy={() => {}}
            onShare={() => {}}
            onDownload={(file) => window.open(`/api/files/${file.id}/download`, "_blank")}
            onDelete={() => {}}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onDownload={() => previewFile && window.open(`/api/files/${previewFile.id}/download`, "_blank")}
      />
    </div>
  );
}

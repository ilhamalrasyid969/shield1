import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCard } from "@/components/FileCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  Search, 
  X, 
  RotateCcw, 
  Trash,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { File } from "@shared/schema";

export default function TrashPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/files/trash"],
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/files/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Success", description: "File restored" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore", variant: "destructive" });
    },
  });

  const deletePermanentlyMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/files/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "File permanently deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/files/trash/empty");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Trash emptied" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to empty trash", variant: "destructive" });
    },
  });

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const query = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-4 p-4 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Trash2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Trash</h1>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trash..."
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

        {files.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setEmptyTrashOpen(true)}
            data-testid="button-empty-trash"
          >
            <Trash className="h-4 w-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Items in trash will be automatically deleted after 30 days
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState type="trash" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="relative group">
                <FileCard
                  file={file}
                  isSelected={selectedIds.has(file.id)}
                  onSelect={(selected) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      selected ? next.add(file.id) : next.delete(file.id);
                      return next;
                    });
                  }}
                  onClick={() => {}}
                  onDelete={() => deletePermanentlyMutation.mutate(file.id)}
                />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => restoreMutation.mutate(file.id)}
                    data-testid={`button-restore-${file.id}`}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {files.length} item(s) in your trash. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emptyTrashMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

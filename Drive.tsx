import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileCard } from "@/components/FileCard";
import { FileList } from "@/components/FileList";
import { EmptyState } from "@/components/EmptyState";
import { UploadZone } from "@/components/UploadZone";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { ShareDialog } from "@/components/ShareDialog";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutGrid, 
  List, 
  Search, 
  X,
  Upload,
  FolderPlus,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STORAGE_PLANS } from "@shared/schema";
import type { File } from "@shared/schema";

type ViewMode = "grid" | "list";
type SortField = "name" | "size" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function Drive() {
  const { folderId } = useParams<{ folderId?: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Dialog State
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [renameFile, setRenameFile] = useState<File | null>(null);

  const plan = user ? STORAGE_PLANS[user.plan as keyof typeof STORAGE_PLANS] : STORAGE_PLANS.free;

  // Fetch files
  const { data: filesData, isLoading } = useQuery<{ files: File[]; breadcrumb: { id: string; name: string }[] }>({
    queryKey: ["/api/files", folderId || "root"],
    queryFn: async () => {
      const url = folderId ? `/api/files?folderId=${folderId}` : "/api/files";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
  });

  const files = filesData?.files || [];
  const breadcrumb = filesData?.breadcrumb || [];

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Files uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload files", variant: "destructive" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/files/folder", { name, parentId: folderId || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Success", description: "Folder created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    },
  });

  const starMutation = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      return apiRequest("PATCH", `/api/files/${id}`, { isStarred: starred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest("PATCH", `/api/files/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Success", description: "Renamed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Moved to trash" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      // Folders first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "size") {
        comparison = a.size - b.size;
      } else if (sortField === "updatedAt") {
        comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, sortField, sortOrder]);

  const handleUpload = async (fileList: globalThis.File[]) => {
    const formData = new FormData();
    fileList.forEach((file) => formData.append("files", file));
    if (folderId) formData.append("parentId", folderId);
    await uploadMutation.mutateAsync(formData);
  };

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

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b">
        {/* Breadcrumb */}
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/drive" data-testid="breadcrumb-root">
                My Drive
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumb.map((item, index) => (
              <BreadcrumbItem key={item.id}>
                <BreadcrumbSeparator />
                {index === breadcrumb.length - 1 ? (
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={`/drive/${item.id}`}>{item.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            data-testid="input-search"
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-new">
                <FolderPlus className="h-4 w-4 mr-2" />
                New
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCreateFolderOpen(true)} data-testid="menu-new-folder">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} data-testid="menu-upload-file">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUploadZone(!showUploadZone)}
            className={cn(showUploadZone && "bg-muted")}
            data-testid="button-toggle-upload"
          >
            <Upload className="h-5 w-5" />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-none rounded-l-md", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-none rounded-r-md", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleUpload(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {/* Upload Zone */}
      {showUploadZone && (
        <div className="p-4 border-b">
          <UploadZone
            onUpload={handleUpload}
            maxFileSize={plan.maxFileSize}
            disabled={uploadMutation.isPending}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState
            type={searchQuery ? "search" : "drive"}
            action={
              !searchQuery
                ? { label: "Upload Files", onClick: () => setShowUploadZone(true) }
                : undefined
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selectedIds.has(file.id)}
                onSelect={(selected) => handleSelect(file.id, selected)}
                onClick={() => handleFileClick(file)}
                onStar={() => starMutation.mutate({ id: file.id, starred: !file.isStarred })}
                onRename={() => setRenameFile(file)}
                onShare={() => setShareFile(file)}
                onDownload={() => window.open(`/api/files/${file.id}/download`, "_blank")}
                onDelete={() => deleteMutation.mutate(file.id)}
              />
            ))}
          </div>
        ) : (
          <FileList
            files={filteredFiles}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onClick={handleFileClick}
            onStar={(file) => starMutation.mutate({ id: file.id, starred: !file.isStarred })}
            onRename={(file) => setRenameFile(file)}
            onMove={() => {}}
            onCopy={() => {}}
            onShare={(file) => setShareFile(file)}
            onDownload={(file) => window.open(`/api/files/${file.id}/download`, "_blank")}
            onDelete={(file) => deleteMutation.mutate(file.id)}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={(name) => createFolderMutation.mutateAsync(name)}
      />

      <RenameDialog
        file={renameFile}
        open={!!renameFile}
        onOpenChange={(open) => !open && setRenameFile(null)}
        onRename={(name) => renameMutation.mutateAsync({ id: renameFile!.id, name })}
      />

      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onStar={() => previewFile && starMutation.mutate({ id: previewFile.id, starred: !previewFile.isStarred })}
        onShare={() => {
          setShareFile(previewFile);
          setPreviewFile(null);
        }}
        onDownload={() => previewFile && window.open(`/api/files/${previewFile.id}/download`, "_blank")}
        onDelete={() => {
          if (previewFile) {
            deleteMutation.mutate(previewFile.id);
            setPreviewFile(null);
          }
        }}
      />

      <ShareDialog
        file={shareFile}
        open={!!shareFile}
        onOpenChange={(open) => !open && setShareFile(null)}
        onShare={async (settings) => {
          // API call would go here
          return `${window.location.origin}/share/${shareFile?.id}`;
        }}
      />
    </div>
  );
}

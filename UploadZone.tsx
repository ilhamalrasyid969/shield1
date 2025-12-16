import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/formatters";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFileSize?: number;
  className?: string;
  disabled?: boolean;
}

export function UploadZone({ onUpload, maxFileSize, className, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const files = Array.from(fileList);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (maxFileSize && file.size > maxFileSize) {
        setUploads(prev => [...prev, {
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: "error",
          error: `File exceeds maximum size of ${formatFileSize(maxFileSize)}`
        }]);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const newUploads = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "uploading" as const,
      }));
      
      setUploads(prev => [...prev, ...newUploads]);
      setIsUploading(true);

      try {
        await onUpload(validFiles);
        setUploads(prev => prev.map(u => 
          newUploads.some(n => n.id === u.id) 
            ? { ...u, progress: 100, status: "completed" as const }
            : u
        ));
      } catch (error) {
        setUploads(prev => prev.map(u => 
          newUploads.some(n => n.id === u.id) 
            ? { ...u, status: "error" as const, error: "Upload failed" }
            : u
        ));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [disabled, onUpload, maxFileSize]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== "completed"));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        data-testid="upload-dropzone"
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={disabled || isUploading}
          data-testid="input-file-upload"
        />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className={cn(
            "rounded-full p-4 mb-4 transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <p className="text-sm font-medium mb-1">
            {isDragging ? "Drop files here" : "Drag files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            {maxFileSize ? `Max file size: ${formatFileSize(maxFileSize)}` : "Upload any file"}
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploads</span>
            {uploads.some(u => u.status === "completed") && (
              <Button variant="ghost" size="sm" onClick={clearCompleted} data-testid="button-clear-completed">
                Clear completed
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map(upload => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                data-testid={`upload-item-${upload.id}`}
              >
                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </span>
                    {upload.status === "uploading" && (
                      <Progress value={upload.progress} className="h-1 flex-1" />
                    )}
                    {upload.status === "error" && (
                      <span className="text-xs text-red-500">{upload.error}</span>
                    )}
                  </div>
                </div>
                {upload.status === "completed" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                {upload.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeUpload(upload.id)}
                  data-testid={`button-remove-upload-${upload.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

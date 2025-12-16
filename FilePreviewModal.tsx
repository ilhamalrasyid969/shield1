import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileIcon } from "@/components/FileIcon";
import { formatFileSize, formatDate } from "@/lib/formatters";
import { X, Download, Share2, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { File } from "@shared/schema";

interface FilePreviewModalProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStar?: () => void;
  onDelete?: () => void;
}

export function FilePreviewModal({
  file,
  open,
  onOpenChange,
  onDownload,
  onShare,
  onStar,
  onDelete,
}: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  const renderPreview = () => {
    if (isImage && file.url) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-[60vh] object-contain rounded-lg"
          data-testid="preview-image"
        />
      );
    }

    if (isPdf && file.url) {
      return (
        <iframe
          src={file.url}
          className="w-full h-[60vh] rounded-lg border"
          title={file.name}
          data-testid="preview-pdf"
        />
      );
    }

    if (isVideo && file.url) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-[60vh] rounded-lg"
          data-testid="preview-video"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isAudio && file.url) {
      return (
        <div className="flex flex-col items-center gap-6 p-8">
          <FileIcon type={file.type} size="xl" />
          <audio src={file.url} controls className="w-full max-w-md" data-testid="preview-audio">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // Default - show file icon
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FileIcon type={file.type} isFolder={file.isFolder} size="xl" />
        <p className="mt-4 text-muted-foreground">Preview not available</p>
        {file.url && (
          <Button variant="outline" className="mt-4" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download to view
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" data-testid="file-preview-modal">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon type={file.type} isFolder={file.isFolder} size="md" />
            <div className="min-w-0">
              <DialogTitle className="truncate" data-testid="preview-filename">
                {file.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)} · {formatDate(file.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onStar}
              data-testid="preview-button-star"
            >
              <Star className={cn(
                "h-5 w-5",
                file.isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              data-testid="preview-button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            {!file.isFolder && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                data-testid="preview-button-download"
              >
                <Download className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              data-testid="preview-button-delete"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="preview-button-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Preview content */}
        <div className="flex items-center justify-center p-6 bg-muted/30 min-h-[300px] overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

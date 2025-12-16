import {
  Folder,
  FileText,
  Image,
  Film,
  Music,
  FileCode,
  File,
  FileSpreadsheet,
  Presentation,
  FileArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
  type: string;
  isFolder?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
};

export function FileIcon({ type, isFolder, className, size = "md" }: FileIconProps) {
  const sizeClass = sizeClasses[size];
  
  if (isFolder) {
    return <Folder className={cn(sizeClass, "text-orange-500", className)} />;
  }

  const mimeType = type.toLowerCase();
  
  // Images
  if (mimeType.startsWith("image/")) {
    return <Image className={cn(sizeClass, "text-pink-500", className)} />;
  }
  
  // Videos
  if (mimeType.startsWith("video/")) {
    return <Film className={cn(sizeClass, "text-purple-500", className)} />;
  }
  
  // Audio
  if (mimeType.startsWith("audio/")) {
    return <Music className={cn(sizeClass, "text-emerald-500", className)} />;
  }
  
  // PDF
  if (mimeType === "application/pdf") {
    return <FileText className={cn(sizeClass, "text-red-500", className)} />;
  }
  
  // Documents
  if (
    mimeType.includes("document") ||
    mimeType.includes("msword") ||
    mimeType.includes("text/")
  ) {
    return <FileText className={cn(sizeClass, "text-blue-500", className)} />;
  }
  
  // Spreadsheets
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className={cn(sizeClass, "text-green-600", className)} />;
  }
  
  // Presentations
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return <Presentation className={cn(sizeClass, "text-orange-600", className)} />;
  }
  
  // Archives
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("7z")
  ) {
    return <FileArchive className={cn(sizeClass, "text-amber-600", className)} />;
  }
  
  // Code files
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  ) {
    return <FileCode className={cn(sizeClass, "text-gray-600 dark:text-gray-400", className)} />;
  }
  
  // Default
  return <File className={cn(sizeClass, "text-gray-500", className)} />;
}

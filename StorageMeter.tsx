import { Progress } from "@/components/ui/progress";
import { formatFileSize, formatStoragePercentage, getStorageBarColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface StorageMeterProps {
  used: number;
  total: number;
  showUpgrade?: boolean;
  className?: string;
}

export function StorageMeter({ used, total, showUpgrade = false, className }: StorageMeterProps) {
  const percentage = formatStoragePercentage(used, total);
  const barColor = getStorageBarColor(percentage);
  const isUnlimited = total < 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Storage</span>
        <span className="font-medium" data-testid="text-storage-used">
          {formatFileSize(used)} {isUnlimited ? "" : `of ${formatFileSize(total)}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className="h-2"
          indicatorClassName={barColor}
        />
      )}
      {showUpgrade && percentage >= 80 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Running low on storage. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

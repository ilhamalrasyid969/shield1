import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Link, Lock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

interface ShareDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare?: (settings: ShareSettings) => Promise<string>;
}

interface ShareSettings {
  permission: "view" | "comment" | "edit";
  password?: string;
  expiresAt?: Date;
}

export function ShareDialog({ file, open, onOpenChange, onShare }: ShareDialogProps) {
  const { toast } = useToast();
  const [permission, setPermission] = useState<"view" | "comment" | "edit">("view");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState("7");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateLink = async () => {
    if (!onShare) return;
    
    setIsLoading(true);
    try {
      const expiresAt = useExpiry 
        ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000)
        : undefined;
      
      const link = await onShare({
        permission,
        password: usePassword ? password : undefined,
        expiresAt,
      });
      
      setShareLink(link);
      toast({
        title: "Link created",
        description: "Share link has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    }
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle>Share "{file.name}"</DialogTitle>
          <DialogDescription>
            Create a shareable link with custom permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Permission selector */}
          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <Select value={permission} onValueChange={(v) => setPermission(v as any)}>
              <SelectTrigger id="permission" data-testid="select-permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Can view</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="use-password">Password protection</Label>
              </div>
              <Switch
                id="use-password"
                checked={usePassword}
                onCheckedChange={setUsePassword}
                data-testid="switch-password"
              />
            </div>
            {usePassword && (
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            )}
          </div>

          {/* Expiry date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="use-expiry">Set expiry date</Label>
              </div>
              <Switch
                id="use-expiry"
                checked={useExpiry}
                onCheckedChange={setUseExpiry}
                data-testid="switch-expiry"
              />
            </div>
            {useExpiry && (
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger data-testid="select-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Generate/Copy link */}
          <div className="space-y-3">
            {!shareLink ? (
              <Button 
                onClick={generateLink} 
                className="w-full" 
                disabled={isLoading || (usePassword && !password)}
                data-testid="button-generate-link"
              >
                <Link className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Link"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="flex-1"
                  data-testid="input-share-link"
                />
                <Button 
                  variant="outline" 
                  onClick={copyLink}
                  data-testid="button-copy-link"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { StorageMeter } from "@/components/StorageMeter";
import {
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Cloud,
  CreditCard,
  Plus,
  Upload,
} from "lucide-react";
import type { User } from "@shared/schema";
import { STORAGE_PLANS } from "@shared/schema";

interface AppSidebarProps {
  user: User;
  onNewFolder?: () => void;
  onUpload?: () => void;
}

const navItems = [
  { title: "My Drive", icon: HardDrive, path: "/drive" },
  { title: "Shared with me", icon: Users, path: "/shared" },
  { title: "Recent", icon: Clock, path: "/recent" },
  { title: "Starred", icon: Star, path: "/starred" },
  { title: "Trash", icon: Trash2, path: "/trash" },
];

export function AppSidebar({ user, onNewFolder, onUpload }: AppSidebarProps) {
  const [location] = useLocation();
  const plan = STORAGE_PLANS[user.plan as keyof typeof STORAGE_PLANS] || STORAGE_PLANS.free;
  const isFreePlan = user.plan === "free";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        {/* Logo */}
        <Link href="/drive" className="flex items-center gap-2 px-2" data-testid="link-logo">
          <Cloud className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold">Cloud Hammy's</span>
        </Link>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onNewFolder}
            data-testid="button-new-folder"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button onClick={onUpload} data-testid="button-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.path || 
                  (item.path === "/drive" && location.startsWith("/drive"));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(isActive && "bg-sidebar-accent")}
                    >
                      <Link href={item.path} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(location === "/billing" && "bg-sidebar-accent")}
                >
                  <Link href="/billing" data-testid="nav-billing">
                    <CreditCard className="h-5 w-5" />
                    <span>Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <StorageMeter
          used={user.storageUsed}
          total={user.storageLimit}
          showUpgrade={isFreePlan}
        />
        {isFreePlan && (
          <Link href="/billing">
            <Button variant="outline" className="w-full mt-3" data-testid="button-upgrade">
              Upgrade Storage
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

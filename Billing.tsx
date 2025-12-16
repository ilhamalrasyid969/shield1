import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/PricingCard";
import { StorageMeter } from "@/components/StorageMeter";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Receipt, ExternalLink } from "lucide-react";
import { STORAGE_PLANS } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  business: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  enterprise: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout", variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal", variant: "destructive" });
    },
  });

  if (!user) return null;

  const currentPlan = STORAGE_PLANS[user.plan as keyof typeof STORAGE_PLANS] || STORAGE_PLANS.free;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Current Plan
            <Badge className={cn("no-default-hover-elevate no-default-active-elevate", planColors[user.plan])}>
              {currentPlan.name}
            </Badge>
          </CardTitle>
          <CardDescription>Your current storage plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StorageMeter used={user.storageUsed} total={user.storageLimit} />
          
          <div className="flex flex-wrap gap-4">
            {user.stripeSubscriptionId && (
              <Button variant="outline" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(STORAGE_PLANS).map(([key, plan]) => (
            <PricingCard
              key={key}
              name={plan.name}
              price={key === "enterprise" ? "Custom" : plan.price}
              storage={plan.storageDisplay}
              features={plan.features}
              color={plan.color}
              isCurrentPlan={user.plan === key}
              isRecommended={key === "pro"}
              onSelect={() => {
                if (key === "enterprise") {
                  window.location.href = "mailto:sales@cloudhammy.com";
                } else {
                  // Would need actual Stripe price IDs
                  checkoutMutation.mutate(`price_${key}`);
                }
              }}
              disabled={checkoutMutation.isPending}
            />
          ))}
        </div>
      </div>

      {/* Billing History */}
      {user.stripeSubscriptionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Button variant="link" className="p-0" onClick={() => portalMutation.mutate()}>
                  View billing history in customer portal
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

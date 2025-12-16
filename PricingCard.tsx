import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface PricingCardProps {
  name: string;
  price: number | string;
  storage: string;
  features: string[];
  color: string;
  isCurrentPlan?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

const colorVariants: Record<string, { badge: string; button: string; border: string }> = {
  gray: {
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    button: "bg-gray-600 hover:bg-gray-700",
    border: "border-gray-200 dark:border-gray-700",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    button: "bg-violet-600 hover:bg-violet-700",
    border: "border-violet-200 dark:border-violet-800",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    button: "bg-blue-600 hover:bg-blue-700",
    border: "border-blue-200 dark:border-blue-800",
  },
};

export function PricingCard({
  name,
  price,
  storage,
  features,
  color,
  isCurrentPlan,
  isRecommended,
  onSelect,
  disabled,
  className,
}: PricingCardProps) {
  const variant = colorVariants[color] || colorVariants.gray;

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-6 transition-all",
        isRecommended ? variant.border : "border-border",
        isRecommended && "ring-2 ring-primary/20",
        className
      )}
      data-testid={`pricing-card-${name.toLowerCase()}`}
    >
      {isRecommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Recommended
        </Badge>
      )}

      <div className="space-y-4">
        {/* Plan name */}
        <div className="flex items-center gap-2">
          <Badge className={cn("no-default-hover-elevate no-default-active-elevate", variant.badge)}>
            {name}
          </Badge>
        </div>

        {/* Price */}
        <div className="space-y-1">
          {typeof price === "number" ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" data-testid={`text-price-${name.toLowerCase()}`}>
                  {price === 0 ? "Free" : formatCurrency(price)}
                </span>
                {price > 0 && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-3xl font-bold" data-testid={`text-price-${name.toLowerCase()}`}>
              {price}
            </span>
          )}
        </div>

        {/* Storage */}
        <div className="text-lg font-semibold text-foreground" data-testid={`text-storage-${name.toLowerCase()}`}>
          {storage} Storage
        </div>

        {/* Features */}
        <ul className="space-y-3 py-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action button */}
        <Button
          className={cn("w-full", !isCurrentPlan && variant.button)}
          variant={isCurrentPlan ? "outline" : "default"}
          onClick={onSelect}
          disabled={disabled || isCurrentPlan}
          data-testid={`button-select-${name.toLowerCase()}`}
        >
          {isCurrentPlan ? "Current Plan" : name === "Enterprise" ? "Contact Sales" : "Upgrade"}
        </Button>
      </div>
    </div>
  );
}

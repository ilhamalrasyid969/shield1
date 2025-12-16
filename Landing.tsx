import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Cloud, 
  Upload, 
  Share2, 
  Shield, 
  Zap, 
  Globe,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { STORAGE_PLANS } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";

const features = [
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Drag and drop files or folders. Upload anything with resume support.",
  },
  {
    icon: Share2,
    title: "Secure Sharing",
    description: "Share files with anyone. Set permissions, passwords, and expiry dates.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your files are encrypted and protected with industry-leading security.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Access your files instantly from anywhere in the world.",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description: "Your files are available on any device, anytime, anywhere.",
  },
  {
    icon: Cloud,
    title: "Unlimited Storage",
    description: "Scale your storage as you grow with our flexible plans.",
  },
];

const plans = [
  { ...STORAGE_PLANS.free, key: "free" },
  { ...STORAGE_PLANS.pro, key: "pro", recommended: true },
  { ...STORAGE_PLANS.business, key: "business" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Cloud Hammy's</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>
            <Button asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your files,{" "}
            <span className="text-primary">anywhere</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Store, share, and collaborate on files and folders from any device. 
            Simple, secure, and lightning fast cloud storage for everyone.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild data-testid="button-hero-get-started">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free 5GB storage. No credit card required.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for individuals and teams of all sizes.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for you. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.key} 
              className={plan.recommended ? "border-primary ring-2 ring-primary/20 relative" : "border-border"}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}
              <CardContent className="pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    {plan.storageDisplay} Storage
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  asChild
                >
                  <a href="/api/login" data-testid={`button-plan-${plan.key}`}>
                    {plan.price === 0 ? "Get Started" : "Upgrade Now"}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Need more? <a href="#" className="text-primary hover:underline">Contact us</a> for Enterprise pricing.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust Cloud Hammy's for their file storage needs.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <a href="/api/login" data-testid="button-cta-get-started">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Cloud Hammy's. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

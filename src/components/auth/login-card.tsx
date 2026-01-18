import { useState } from "react";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordForm } from "./password-form";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

interface LoginCardProps {
  isLoading?: boolean;
}

export function LoginCard({ isLoading = false }: LoginCardProps) {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");

  return (
    <Card
      className={cn(
        "w-full max-w-md relative overflow-hidden",
        // Generous padding, soft shadow with coral undertone, rounded corners (12-16px)
        "p-10 md:p-12 shadow-[0_8px_30px_oklch(0.70_0.08_30/0.15)] rounded-2xl"
      )}
    >
      {/* Full-form frosted glass overlay during loading */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-[oklch(0.70_0.16_30/0.08)]">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <CardHeader className="p-0 pb-8 text-center space-y-2">
        <h1 className="text-2xl font-semibold font-mono tracking-tight text-foreground">
          AI Safety Talent Network
        </h1>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* OAuth buttons first */}
        <OAuthButtons />

        {/* Separator with "or" text - 32px minimum spacing */}
        <div className="relative py-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
            or continue with email
          </span>
        </div>

        {/* Tabs for Sign In / Sign Up */}
        <Tabs
          value={flow}
          onValueChange={(v) => setFlow(v as "signIn" | "signUp")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="signIn">Sign In</TabsTrigger>
            <TabsTrigger value="signUp">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signIn" className="mt-6">
            <PasswordForm flow="signIn" />
          </TabsContent>
          <TabsContent value="signUp" className="mt-6">
            <PasswordForm flow="signUp" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

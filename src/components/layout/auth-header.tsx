import { Link } from "@tanstack/react-router";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

export function AuthHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold text-slate-900 font-mono">
          AI Safety Talent Network
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/opportunities"
            className="text-sm text-slate-600 hover:text-slate-900 [&.active]:text-slate-900 [&.active]:font-medium"
          >
            Opportunities
          </Link>

          {/* Auth state: loading, signed out, signed in */}
          <AuthLoading>
            <div className="size-8 rounded-full bg-slate-100 animate-pulse" />
          </AuthLoading>

          <Unauthenticated>
            <Button size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </Unauthenticated>

          <Authenticated>
            <UserMenu />
          </Authenticated>
        </nav>
      </div>
    </header>
  );
}

function UserMenu() {
  const { signOut } = useAuthActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, Home, Settings, Target, User } from "lucide-react";

interface TabConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
}

const tabs: TabConfig[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/opportunities", label: "Opportunities", icon: Briefcase, exact: false },
  { to: "/matches", label: "Matches", icon: Target, exact: false },
  { to: "/profile", label: "Profile", icon: User, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
];

export function BottomTabBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (tab: TabConfig): boolean => {
    if (tab.exact) {
      return currentPath === tab.to;
    }
    return currentPath === tab.to || currentPath.startsWith(`${tab.to}/`);
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    tab: TabConfig
  ) => {
    if (isActive(tab)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background tab-bar-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-[var(--tab-bar-height)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={(e) => handleClick(e, tab)}
              activeOptions={{ exact: tab.exact }}
              className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] py-2 text-muted-foreground transition-colors"
              activeProps={{
                className:
                  "flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] py-2 text-primary font-semibold transition-colors",
              }}
            >
              <Icon className="size-5" />
              <span className="text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

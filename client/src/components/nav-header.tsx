import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, User as UserIcon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import type { User } from "@shared/schema";

interface NavHeaderProps {
  user?: User;
}

export function NavHeader({ user }: NavHeaderProps) {
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
    return null;
  }

  const getInitials = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email || "User";
  };

  const navLinks = user.role === "student"
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/study-plans", label: "Study Plans" },
        { href: "/quizzes", label: "Quizzes" },
        { href: "/exams", label: "Exams" },
        { href: "/materials", label: "Materials" },
        { href: "/performance", label: "Performance" },
      ]
    : [
        { href: "/admin/materials", label: "Materials" },
        { href: "/admin/subjects", label: "Subjects" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/reports", label: "Reports" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user.role === "student" ? "/dashboard" : "/admin/materials"}>
            <div className="flex items-center gap-2 cursor-pointer hover-elevate px-2 py-1 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold font-display hidden sm:block">
                CCIT Study Plan
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="hover-elevate"
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Side - Theme Toggle & User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover-elevate"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <div className="flex items-center cursor-pointer w-full" data-testid="link-profile">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

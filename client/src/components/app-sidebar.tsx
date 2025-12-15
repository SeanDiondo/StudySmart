import { Link, useLocation } from "wouter";
import {
  Home,
  BookOpen,
  ClipboardList,
  FileText,
  BarChart3,
  GraduationCap,
  Users,
  FolderOpen,
  FileBarChart,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { User } from "@shared/schema";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const studentItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Study Plans",
      url: "/study-plans",
      icon: BookOpen,
    },
    {
      title: "Quizzes",
      url: "/quizzes",
      icon: ClipboardList,
    },
    {
      title: "Exams",
      url: "/exams",
      icon: GraduationCap,
    },
    {
      title: "Materials",
      url: "/materials",
      icon: FileText,
    },
    {
      title: "Performance",
      url: "/performance",
      icon: BarChart3,
    },
  ];

  // Professor: Manage materials, subjects, quizzes, and view reports
  const professorItems = [
    {
      title: "Materials",
      url: "/admin/materials",
      icon: FolderOpen,
    },
    {
      title: "Subjects",
      url: "/admin/subjects",
      icon: BookOpen,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: FileBarChart,
    },
  ];

  // Admin: Full system access (includes user management)
  const adminItems = [
    {
      title: "Materials",
      url: "/admin/materials",
      icon: FolderOpen,
    },
    {
      title: "Subjects",
      url: "/admin/subjects",
      icon: BookOpen,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: FileBarChart,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: TrendingUp,
    },
  ];

  const getNavigationItems = () => {
    switch (user.role) {
      case "student":
        return studentItems;
      case "professor":
        return professorItems;
      case "admin":
        return adminItems;
      default:
        return studentItems;
    }
  };

  const items = getNavigationItems();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-sidebar-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

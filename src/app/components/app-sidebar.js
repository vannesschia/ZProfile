import { Home, Book, TreePine, Command, UserPen, Handshake, ClipboardCheck, Info, Bug, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarSeparator
} from "@/components/ui/sidebar"

import { NavUser } from "./nav-user"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Course Directory",
    url: "/course-directory",
    icon: Book,
  },
  {
    title: "Brothers Directory",
    url: "/brothers",
    icon: Handshake,
  },
  {
    title: "Family Tree",
    url: "/family-tree",
    icon: TreePine,
  },
  {
    title: "Requirement Info",
    url: "/requirements",
    icon: ClipboardCheck,
  },
  {
    title: "Report Bugs",
    url: "/support",
    icon: Bug,
  }
]

const admin_items = [
  {
    title: "Admin",
    url: "/admin/dashboard",
    icon: UserPen,
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
      },
      {
        title: "Coffee Chat Approval",
        url: "/admin/approval",
      },
      {
        title: "Requirement Settings",
        url: "/admin/requirements-form",
      }
    ]
  },
]

export function AppSidebar({ user }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavUser user={user} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url || "#"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>

                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                            <a href={subItem.url || "#"}>{subItem.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent className="mt-8">
            <SidebarMenu>
              {user.admin && admin_items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={item.isActive}>
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="!w-auto"/>
      <SidebarFooter>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            {/* POST form so the browser follows the server's 303 redirect */}
            <form action="/auth/sign-out" method="POST">
              {/* You can change ?next=... or add &scope=global for "sign out everywhere" */}
              <button type="submit" className="w-full text-left flex items-center gap-2 cursor-pointer">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </form>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}
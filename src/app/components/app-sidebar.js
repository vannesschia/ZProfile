import { Home, Book, TreePine, Command, UserPen, Handshake, ClipboardCheck, Info, Bug } from "lucide-react"

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
  SidebarHeader
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
    url: "/brothers/active",
    icon: Handshake,
    items: [
      { title: "Active Brothers", url: "/brothers/active" },
      { title: "Alumni", url: "/brothers/alumni" },
    ]
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
    title: "Report Bug",
    url: "#",
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
        url: "#",
      }
    ]
  },
]

export function AppSidebar({ user }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Zeta Pi</span>
                  {/* <span className="truncate text-xs">Zeta Pi</span> */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>General</SidebarGroupLabel> */}
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
              {admin_items.map((item) => (
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

      <SidebarFooter>
        {/* <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href='/support'>
                  <Bug />
                  <span>Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent> */}
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
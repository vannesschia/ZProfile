import { Home, Book, TreePine, UserPen, Handshake, ClipboardCheck, Bug, LogOut } from "lucide-react"

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
        title: "Coffee Chat Archive",
        url: "/admin/archive",
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
            <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-12 text-sm group-data-[collapsible=icon]:p-0!">
              <img src="/zp-black.svg" alt="Zeta Pi" className="h-8 w-auto rounded-sm dark:hidden" />
              <img src="/zp-white.svg" alt="Zeta Pi" className="h-8 w-auto rounded-sm hidden dark:inline" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Zeta Pi</span>
              </div>
            </div>
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
      <SidebarSeparator className="!w-auto" />
      <SidebarFooter>
        <SidebarMenuButton size="lg" asChild>
          <NavUser user={user} />
        </SidebarMenuButton>
        <form action="/auth/sign-out" method="POST">
          <SidebarMenuItem>
            <SidebarMenuButton type="submit" className="w-full cursor-pointer">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
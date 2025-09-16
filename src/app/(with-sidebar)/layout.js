import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader
} from "@/components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar";
import { getServerClient } from "@/lib/supabaseServer";
import DynamicBreadcrumb from "../components/DynamicBreadcrumb";
import ChangeThemeButton from "../components/change-theme-button";

export default async function WithNavbarLayout({ children }) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser()

  const uniqname = user.email.split("@")[0];

  const { data: member, error } = await supabase
    .from('members')
    .select('name, email_address, admin')
    .eq('uniqname', uniqname)
    .single();

  return (
      <SidebarProvider>
        <AppSidebar user={ member }/>
        <SidebarInset>
          <header className="flex justify-between h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex flex-row items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
            </div>
            <ChangeThemeButton />
          </header>
          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

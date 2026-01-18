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
    .select('name, email_address, admin, profile_picture_url')
    .eq('uniqname', uniqname)
    .single();

  const { data: rushEventIds} = await supabase
    .from('rush_events')
    .select('id');

  const listRushEventsIds = rushEventIds.map(obj => obj.id);

  const { data: eventsAttended } = await supabase
    .from('event_attendance')
    .select('event_id')
    .eq('uniqname', uniqname);

  let hasAttendedRushEvent = false;

  eventsAttended.forEach(obj => {
    if (listRushEventsIds.includes(obj.event_id)) {
      hasAttendedRushEvent = true;
    }
  })

  return (
      <SidebarProvider>
        <AppSidebar user={ member } hasAttendedRushEvent={ hasAttendedRushEvent }/>
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

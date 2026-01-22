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

  if (!user?.email) {
    // If no user, return minimal layout (shouldn't happen due to auth middleware)
    return (
      <SidebarProvider>
        <SidebarInset>
          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const uniqname = user.email.split("@")[0];

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('name, email_address, admin, profile_picture_url')
    .eq('uniqname', uniqname)
    .single();

  // Handle error case - if member fetch fails, treat as non-admin
  if (memberError || !member) {
    console.error("Error fetching member:", memberError?.message);
  }

  // Check if user has attended a rush event
  // Admins always have access, but we still check for non-admins
  const isAdmin = member?.admin === true;
  
  let hasAttendedRushEvent = false;
  
  // Admins always have access, but we still check attendance for consistency
  // For non-admins, we need to check if they attended a rush event
  if (!isAdmin) {
    const { data: rushEvents, error: rushEventsError } = await supabase
      .from('event_attendance')
      .select(`
        events!inner (
          event_type
        )
      `)
      .eq('uniqname', uniqname)
      .eq('events.event_type', 'rush_event')
      .limit(1);

    if (!rushEventsError && rushEvents && rushEvents.length > 0) {
      hasAttendedRushEvent = true;
    }
  } else {
    // Admins always have access
    hasAttendedRushEvent = true;
  }

  // Ensure member object has admin property explicitly set
  const memberForSidebar = member || { admin: false, name: null, email_address: null, profile_picture_url: null };
  
  return (
      <SidebarProvider>
        <AppSidebar user={ memberForSidebar } hasAttendedRushEvent={ hasAttendedRushEvent }/>
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

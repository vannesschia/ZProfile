import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/app/components/app-sidebar";
import ChangeThemeButton from "@/app/components/change-theme-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import FamilyTree from "@/app/(with-sidebar)/family-tree/ClientView";
import { localPreview } from "./local-data";

export default async function FamilyTreePreview({ searchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const params = await searchParams;
  const local = await localPreview();
  const isAdmin = params.role !== "member";
  const previewHref = `/family-tree-preview?role=${isAdmin ? "admin" : "member"}`;

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ admin: isAdmin }}
        hasAttendedRushEvent={false}
        previewHref={previewHref}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <span className="truncate text-sm">Family Tree</span>
            <Link
              className="ml-2 whitespace-nowrap text-xs text-muted-foreground underline underline-offset-4"
              href={`/family-tree-preview?role=${isAdmin ? "member" : "admin"}`}
            >
              {isAdmin ? "Member view" : "Admin view"}
            </Link>
          </div>
          <ChangeThemeButton />
        </header>
        <main className="min-w-0 p-4">
          {!local ? (
            <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 text-sm">
              <h1 className="text-lg font-semibold">Family Tree preview unavailable</h1>
              <p className="mt-2 text-muted-foreground">
                The preview database could not be reached. Start the development
                database and reload to load the imported roster and saved relationships.
              </p>
            </div>
          ) : local.members.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 text-sm">
              <h1 className="text-lg font-semibold">No preview members found</h1>
              <p className="mt-2 text-muted-foreground">
                The preview database does not contain any member records yet.
              </p>
            </div>
          ) : (
            <FamilyTree
              members={local.members}
              relationships={local.relationships}
              classOptions={local.classOptions}
              classOrder={local.classOrder}
              canEdit={isAdmin}
              preview
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

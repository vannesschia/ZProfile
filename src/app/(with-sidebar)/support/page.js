import BugReportForm from "@/app/components/bug-report/bug-report-form";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  return (
    <div className="flex flex-col m-4 gap-4">
      <span className="font-bold text-xl">Report Bugs</span>
      <BugReportForm />
    </div>
  )
}
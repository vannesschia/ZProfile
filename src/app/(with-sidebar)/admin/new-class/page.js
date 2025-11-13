import NewClassForm from "./new-class-form";

export default async function NewClassPage() {
  return (
    <div className="m-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">New Class</h2>
      <NewClassForm />
    </div>
  )
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/students/$id")({
  component: StudentDetails,
});

function StudentDetails() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">StudentDetails Page</h1>
      <p className="text-muted-foreground mt-2">Placeholder page for /_authenticated/students/$id</p>
    </div>
  );
}

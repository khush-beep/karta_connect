import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/student/saved")({
  component: SavedPosts,
});

function SavedPosts() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">SavedPosts Page</h1>
      <p className="text-muted-foreground mt-2">Placeholder page for /_authenticated/student/saved</p>
    </div>
  );
}

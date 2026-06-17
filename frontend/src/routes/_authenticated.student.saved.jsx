import { createFileRoute } from "@tanstack/react-router";
import { requireStudent } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/student/saved")({
    beforeLoad: requireStudent,
    component: SavedPosts,
});
function SavedPosts() {
    return (<div className="p-6">
      <h1 className="text-2xl font-bold">SavedPosts Page</h1>
      <p className="text-muted-foreground mt-2">Placeholder page for /_authenticated/student/saved</p>
    </div>);
}

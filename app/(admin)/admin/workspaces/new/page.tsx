import { WorkspaceEditor } from "@/components/workspace/workspace-editor";

export default function NewWorkspacePage() {
  return (
    <div className="-mx-4 -my-3 flex flex-col h-[calc(100vh-44px)]">
      <WorkspaceEditor mode="create" />
    </div>
  );
}

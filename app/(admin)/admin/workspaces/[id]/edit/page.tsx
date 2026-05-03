import { WorkspaceEditor } from "@/components/workspace/workspace-editor";

type Props = { params: Promise<{ id: string }> };

export default async function EditWorkspacePage(props: Props) {
  const { id } = await props.params;
  return (
    <div className="-mx-4 -my-3 flex flex-col h-[calc(100vh-44px)]">
      <WorkspaceEditor mode="edit" workspaceId={id} />
    </div>
  );
}

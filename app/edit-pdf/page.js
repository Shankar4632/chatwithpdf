import { ToolPage } from "@/components/tools/ui";
import EditPdf from "@/components/tools/EditPdf";

export const metadata = { title: "Edit PDF", description: "Add text, drawings, highlights, images and white-out to a PDF." };

export default function Page() {
  return (
    <ToolPage href="/edit-pdf" description="Add text, drawings, highlights, images and white-out to a PDF.">
      <EditPdf />
    </ToolPage>
  );
}

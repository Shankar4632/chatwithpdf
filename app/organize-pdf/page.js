import { ToolPage } from "@/components/tools/ui";
import OrganizePdf from "@/components/tools/OrganizePdf";

export const metadata = { title: "Rotate & reorder", description: "Rotate, reorder and remove pages in a PDF." };

export default function Page() {
  return (
    <ToolPage href="/organize-pdf" description="Rotate, reorder and remove pages in a PDF.">
      <OrganizePdf />
    </ToolPage>
  );
}

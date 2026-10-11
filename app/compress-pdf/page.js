import { ToolPage } from "@/components/tools/ui";
import CompressPdf from "@/components/tools/CompressPdf";

export const metadata = { title: "Compress PDF", description: "Make a PDF file smaller to email or upload." };

export default function Page() {
  return (
    <ToolPage href="/compress-pdf" description="Make a PDF file smaller to email or upload.">
      <CompressPdf />
    </ToolPage>
  );
}

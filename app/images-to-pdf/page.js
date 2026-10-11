import { ToolPage } from "@/components/tools/ui";
import ImagesToPdf from "@/components/tools/ImagesToPdf";

export const metadata = { title: "Images to PDF", description: "Combine photos and images into a single PDF, one image per page." };

export default function Page() {
  return (
    <ToolPage href="/images-to-pdf" description="Combine photos and images into a single PDF, one image per page.">
      <ImagesToPdf />
    </ToolPage>
  );
}

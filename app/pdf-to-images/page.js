import { ToolPage } from "@/components/tools/ui";
import PdfToImages from "@/components/tools/PdfToImages";

export const metadata = { title: "PDF to images", description: "Save every page of a PDF as a PNG or JPG image." };

export default function Page() {
  return (
    <ToolPage href="/pdf-to-images" description="Save every page of a PDF as a PNG or JPG image.">
      <PdfToImages />
    </ToolPage>
  );
}

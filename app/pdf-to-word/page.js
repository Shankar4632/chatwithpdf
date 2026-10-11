import { ToolPage } from "@/components/tools/ui";
import PdfToWord from "@/components/tools/PdfToWord";

export const metadata = { title: "PDF to Word", description: "Turn a PDF into a Word document (.docx) you can edit." };

export default function Page() {
  return (
    <ToolPage href="/pdf-to-word" description="Turn a PDF into a Word document (.docx) you can edit.">
      <PdfToWord />
    </ToolPage>
  );
}

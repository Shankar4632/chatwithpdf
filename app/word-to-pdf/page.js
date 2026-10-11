import { ToolPage } from "@/components/tools/ui";
import WordToPdf from "@/components/tools/WordToPdf";

export const metadata = { title: "Word to PDF", description: "Turn a Word document (.docx) into a PDF." };

export default function Page() {
  return (
    <ToolPage href="/word-to-pdf" description="Turn a Word document (.docx) into a PDF.">
      <WordToPdf />
    </ToolPage>
  );
}

import { ToolPage } from "@/components/tools/ui";
import ConvertImage from "@/components/tools/ConvertImage";

export const metadata = { title: "Convert image", description: "Convert images to JPG, PNG or WEBP, several at once." };

export default function Page() {
  return (
    <ToolPage href="/convert-image" description="Convert images to JPG, PNG or WEBP, several at once.">
      <ConvertImage />
    </ToolPage>
  );
}

import { ToolPage } from "@/components/tools/ui";
import ResizeImage from "@/components/tools/ResizeImage";

export const metadata = { title: "Resize image", description: "Change an image's width and height in pixels, or scale it by percentage." };

export default function Page() {
  return (
    <ToolPage href="/resize-image" description="Change an image's width and height in pixels, or scale it by percentage.">
      <ResizeImage />
    </ToolPage>
  );
}

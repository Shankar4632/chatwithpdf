import { ToolPage } from "@/components/tools/ui";
import CompressImage from "@/components/tools/CompressImage";

export const metadata = { title: "Compress image", description: "Make photos and images smaller to share or upload, with control over quality." };

export default function Page() {
  return (
    <ToolPage href="/compress-image" description="Make photos and images smaller to share or upload, with control over quality.">
      <CompressImage />
    </ToolPage>
  );
}

import {
  FileImage,
  FilePen,
  FileText,
  FileType,
  Images,
  LayoutGrid,
  MessageSquareText,
  Minimize2,
  Repeat,
  Scaling,
  Shrink,
} from "lucide-react";

export const SITE_NAME = "PDF Toolkit";

export const NAV = [
  {
    heading: "AI",
    items: [{ href: "/", label: "Chat with PDF", icon: MessageSquareText }],
  },
  {
    heading: "Image tools",
    items: [
      { href: "/resize-image", label: "Resize image", icon: Scaling },
      { href: "/convert-image", label: "Convert image", icon: Repeat },
      { href: "/compress-image", label: "Compress image", icon: Minimize2 },
    ],
  },
  {
    heading: "PDF tools",
    items: [
      { href: "/edit-pdf", label: "Edit PDF", icon: FilePen },
      { href: "/pdf-to-word", label: "PDF to Word", icon: FileType },
      { href: "/word-to-pdf", label: "Word to PDF", icon: FileText },
      { href: "/images-to-pdf", label: "Images to PDF", icon: Images },
      { href: "/pdf-to-images", label: "PDF to images", icon: FileImage },
      { href: "/compress-pdf", label: "Compress PDF", icon: Shrink },
      { href: "/organize-pdf", label: "Rotate & reorder", icon: LayoutGrid },
    ],
  },
];

export function findTool(href) {
  return NAV.flatMap((group) => group.items).find((item) => item.href === href);
}

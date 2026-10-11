import "./globals.css";
import AppShell from "../components/AppShell";
import { SITE_NAME } from "../lib/site";

export const metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "Chat with your PDFs, and convert, resize and compress images and documents in your browser.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

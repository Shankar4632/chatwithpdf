import "./globals.css";

export const metadata = {
  title: "Chat with PDF",
  description: "Chat with your PDF documents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}

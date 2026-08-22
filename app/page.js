import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import ActionBar from "../components/ActionBar";
import PdfViewer from "../components/PdfViewer";
import ChatPanel from "../components/ChatPanel";
import { PdfProvider } from "../components/PdfContext";

export default function Home() {
  return (
    <PdfProvider>
      <div className="flex h-screen w-full bg-white">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <ActionBar />

          <div className="flex min-h-0 flex-1">
            <PdfViewer />
            <ChatPanel />
          </div>
        </div>
      </div>
    </PdfProvider>
  );
}

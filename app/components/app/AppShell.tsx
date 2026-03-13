import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
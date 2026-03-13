export default function Topbar() {
  return (
    <header className="h-14 border-b border-black/10 bg-white flex items-center justify-between px-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
        <span className="font-medium text-black tracking-tight">DocuMind</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 rounded-sm text-black/50 hover:text-black hover:bg-black/5 transition-colors text-xs font-medium">
          Profile
        </button>
      </div>
    </header>
  );
}
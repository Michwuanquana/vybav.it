import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  UploadCloud, 
  Users, 
  Settings, 
  Home,
  LogOut
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-heading font-bold text-sage flex items-center gap-2">
            Vybaveno <span className="text-[10px] bg-sage/20 text-sage px-2 py-0.5 rounded uppercase tracking-widest">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
            <Package className="w-5 h-5" />
            <span>Produkty</span>
          </Link>
          <Link href="/admin/import" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
            <UploadCloud className="w-5 h-5" />
            <span>Import CSV</span>
          </Link>
          <Link href="/admin/sessions" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
            <Users className="w-5 h-5" />
            <span>Session Log</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
            <Home className="w-5 h-5" />
            <span>Zpět na web</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300">
            <LogOut className="w-5 h-5" />
            <span>Odhlásit se</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="font-semibold text-charcoal">Administrace</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-xs">
              AD
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

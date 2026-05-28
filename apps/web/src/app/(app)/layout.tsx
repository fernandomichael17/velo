import { Sidebar } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-surface">
                {/* Navbar */}
                <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
                    <div /> {/* Breadcrumb (nanti) */}
                    <div className="flex items-center gap-3">
                        {/* User avatar / menu (nanti) */}
                    </div>
                </header>
                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    IconLayoutDashboard,
    IconFolder,
    IconSettings,
    IconUsers,
    IconChevronDown,
} from "@tabler/icons-react";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
    { label: "Projects", href: "/projects", icon: IconFolder },
    { label: "Members", href: "/members", icon: IconUsers },
    { label: "Settings", href: "/settings", icon: IconSettings },
];

interface SidebarProps {
    workspaceName?: string;
    workspaceSlug?: string;
}

export function Sidebar({ workspaceName = "My Workspace" }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="flex flex-col w-[260px] h-screen border-r border-gray-200 bg-white">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200">
                <svg width="28" height="28" viewBox="0 0 44 44">
                    <polygon points="6,8 18,32 30,8" fill="#2563EB" />
                    <polygon points="18,8 30,32 42,8" fill="#2563EB" opacity="0.35" />
                </svg>
                <span className="font-bold text-lg tracking-tight text-ink">velo</span>
            </div>

            {/* Workspace Switcher */}
            <button className="flex items-center justify-between mx-3 mt-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-velo-blue flex items-center justify-center text-white text-xs font-bold">
                        {workspaceName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-ink truncate max-w-[140px]">
                        {workspaceName}
                    </span>
                </div>
                <IconChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Navigation */}
            <nav className="flex-1 mt-4 px-3">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${isActive
                                            ? "bg-blue-light text-velo-blue font-medium"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-ink"
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
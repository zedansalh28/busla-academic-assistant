import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MessageSquare, Home, BookOpen, Settings, LogOut, GraduationCap } from 'lucide-react';

export const Sidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/courses', icon: GraduationCap, label: 'Courses' },
    { path: '/planner', icon: BookOpen, label: 'Planner' },
    { path: '/profile', icon: Settings, label: 'Profile' },
  ];

  return (
    <aside className="w-64 bg-secondary text-white h-screen shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-primary">Busla</h2>
        <p className="text-xs text-gray-400">Academic Assistant</p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-danger hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

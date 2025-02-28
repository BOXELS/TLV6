import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Telegram Bot Administration & Management Dashboard for SValePay',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <body className={`${inter.className} bg-theme-main text-theme-main h-screen overflow-hidden flex antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-200`}>
        <ThemeProvider>
          <SidebarProvider>
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-theme-main">
              {children}
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { LogOut, BookOpen, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto max-w-6xl flex justify-between items-center px-4 py-3">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Vibego
          </h1>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <>
              <nav className="hidden sm:flex items-center gap-2">
                <Link href="/journeys">
                  <Button 
                    variant={pathname === "/journeys" ? "default" : "ghost"} 
                    size="sm" 
                    className={pathname === "/journeys" 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    My Journeys
                  </Button>
                </Link>
              </nav>
              <nav className="flex sm:hidden items-center gap-1">
                <Link href="/">
                  <Button 
                    variant={pathname === "/" ? "default" : "ghost"} 
                    size="sm" 
                    className={pathname === "/" 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/journeys">
                  <Button 
                    variant={pathname === "/journeys" ? "default" : "ghost"} 
                    size="sm" 
                    className={pathname === "/journeys" 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </Link>
              </nav>
              <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 pl-3 sm:pl-4">
                <p className="text-gray-700 text-sm block font-medium">
                  Welcome, <span className="text-purple-600">{user.email?.split('@')[0]}</span>
                </p>
                <Button 
                  onClick={() => signOut(auth)} 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 bg-white transition-colors"
                >
                  <LogOut className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </>
          )}
          {!user && (
            <div className="text-gray-600 text-sm">
              Sign in to access your journeys
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 
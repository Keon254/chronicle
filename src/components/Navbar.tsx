import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, Lock, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <Newspaper className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">The Chronicle</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-white/10 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/admin') ? 'bg-white/10 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                {isAdmin && (
                  <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 ml-4 pl-4 border-l border-white/10 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Admin Login
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 pb-3 pt-2 px-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-white/10 text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/admin') ? 'bg-white/10 text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

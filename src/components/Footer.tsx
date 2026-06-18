import { Newspaper } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <span className="text-white font-bold">The Chronicle</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} The Chronicle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

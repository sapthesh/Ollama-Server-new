import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const _t = useTranslations();
  const disclaimerItems = _t.raw('footer.disclaimer.items') as string[];

  return (
    <footer className="mt-16 border-t border-[#2d2d2d] pt-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Author Information */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">About</h3>
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400">
                Developed by 
                <a 
                  href="https://github.com/sapthesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 hover:text-cyan-400 ml-1 transition-colors"
                >
                  Sapthesh (@sapthesh)
                </a>
              </p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Distributed under MIT License
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Disclaimer</h3>
            <div className="space-y-2">
              {disclaimerItems.map((item: string, index: number) => (
                <p key={index} className="text-[10px] font-bold text-zinc-500 flex items-start leading-tight">
                  <span className="mr-2 text-zinc-700 opacity-50">/</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#2d2d2d]/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} OLLAMA MONITOR // BUILD 15.1.9
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/sapthesh/Ollama-Server"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-black text-zinc-600 hover:text-cyan-500 uppercase tracking-widest transition-colors"
            >
              Repository
            </a>
            <span className="text-zinc-900">|</span>
            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">
              Status: Operational
            </span>
            <span className="text-zinc-900">|</span>
            <Link href="/admin-portal" className="text-[9px] font-black text-zinc-800 hover:text-white transition-colors opacity-30 tracking-widest">
              [MNT]
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

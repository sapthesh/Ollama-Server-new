import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();
  const disclaimerItems = t.raw('footer.disclaimer.items') as string[];

  return (
    <footer className="mt-16 border-t border-white/5 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Author Information */}
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-6 tracking-tight">{t('footer.about.title')}</h3>
            <div className="space-y-3">
              <p className="text-slate-400 leading-relaxed">
                {t('footer.about.author')}
                <a 
                  href="https://github.com/sapthesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200 ml-1"
                >
                  Sapthesh (@sapthesh)
                </a>
              </p>
              <p className="text-slate-400 leading-relaxed">
                {t('footer.about.license')}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-6 tracking-tight">{t('footer.disclaimer.title')}</h3>
            <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
              {disclaimerItems.map((item: string, index: number) => (
                <p key={index} className="flex items-start">
                  <span className="mr-2 text-cyan-500/50">•</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Information */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-500 text-sm font-medium">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/sapthesh/Ollama-Server"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-cyan-400 text-sm font-medium transition-all duration-200"
              >
                GitHub
              </a>
              <span className="text-slate-800">|</span>
              <a
                href="https://github.com/sapthesh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-cyan-400 text-sm font-medium transition-all duration-200"
              >
                MIT License
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-white/[0.04] bg-[#060608]">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Privacy & Terms */}
          <div className="flex items-center gap-4 text-[11px] text-zinc-600">
            <a
              href="https://www.freeprivacypolicy.com/live/d696c224-4eb5-4b30-9358-d5c92ac33409"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-zinc-800">·</span>
            <Link
              href="/terms"
              className="hover:text-zinc-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          {/* Right: Copyright + Made by */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{t('footer.copyright')}</span>
            <span className="text-zinc-800">·</span>
            <span>
              {t('footer.madeBy')}{' '}
              <a
                href="https://qingtengstudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                QingTengStudio
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

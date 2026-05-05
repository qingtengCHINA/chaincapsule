'use client'

import CapsulePlaza from '@/components/capsule/CapsulePlaza'
import { useI18n } from '@/lib/i18n/context'

export default function PlazaPage() {
  const { t } = useI18n()

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t('plaza.title')}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t('plaza.desc')}</p>
      <CapsulePlaza />
    </main>
  )
}

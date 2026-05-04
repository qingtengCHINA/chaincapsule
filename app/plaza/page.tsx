import CapsulePlaza from '@/components/capsule/CapsulePlaza'

export default function PlazaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">广场</h1>
      <p className="mt-2 text-sm text-zinc-500">探索其他人封存的时光</p>
      <CapsulePlaza />
    </main>
  )
}

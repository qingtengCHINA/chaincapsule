import CapsuleForm from '@/components/capsule/CapsuleForm'

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-medium text-zinc-100 mb-2">创建胶囊</h1>
        <p className="text-sm text-zinc-500 mb-8">封存你的话语，留给未来的某个人</p>
        <CapsuleForm />
      </div>
    </main>
  )
}

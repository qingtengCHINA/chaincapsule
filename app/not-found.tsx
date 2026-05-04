'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <h1 className="text-7xl font-bold text-zinc-800">404</h1>
        <p className="text-xl text-zinc-300">胶囊未找到</p>
        <p className="text-sm text-zinc-600">该页面不存在或已被移除</p>
        <div className="mt-6 flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            返回首页
          </Link>
          <Link
            href="/plaza"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            去广场看看
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

import { Loader2 } from 'lucide-react'

export default function ArticleLoading() {
  return (
    <div className="bg-kb-bg min-h-screen">
      {/* Header skeleton */}
      <section className="bg-kb-navy text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 bg-white/20 rounded mb-6 animate-pulse" />
          <div className="h-10 w-3/4 bg-white/20 rounded mb-4 animate-pulse" />
          <div className="h-6 w-full bg-white/15 rounded mb-2 animate-pulse" />
          <div className="h-6 w-2/3 bg-white/15 rounded mb-6 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-7 w-28 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 py-16">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            <span className="text-gray-500 text-lg font-medium">Loading article…</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-10 space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                {i % 3 === 0 && (
                  <div
                    className="h-7 bg-gray-100 rounded animate-pulse"
                    style={{ width: `${40 + Math.random() * 30}%` }}
                  />
                )}
                <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                <div
                  className="h-4 bg-gray-100 rounded animate-pulse"
                  style={{ width: `${60 + Math.random() * 35}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

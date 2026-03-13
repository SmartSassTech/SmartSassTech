/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the server starts. We use it to pre-build the search
 * index so the first search query is instant.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmUpSearchIndex } = await import('./lib/search-index')
    // Fire-and-forget — the index builds in the background
    warmUpSearchIndex()
  }
}

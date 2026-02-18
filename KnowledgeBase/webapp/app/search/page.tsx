import { redirect } from 'next/navigation'

interface SearchPageProps {
  searchParams: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  // Redirect to /articles with the query parameter if provided
  const query = searchParams.q ? `?q=${encodeURIComponent(searchParams.q)}` : ''
  redirect(`/articles${query}`)
}

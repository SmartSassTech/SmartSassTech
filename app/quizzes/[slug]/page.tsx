import { getQuizData } from '@/lib/quizzes'
import QuizComponent from '@/components/QuizComponent'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export function generateStaticParams() {
    return [
        { slug: 'computer' },
        { slug: 'phone' },
        { slug: 'internet-provider' },
        { slug: 'printer' },
        { slug: 'security-camera' },
        { slug: 'smartwatch' },
        { slug: 'streaming' },
        { slug: 'keyboard-mouse' },
    ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const quiz = getQuizData(resolvedParams.slug)
    if (!quiz) return { title: 'Quiz Not Found' }

    return {
        title: `${quiz.title} | SmartSass Tech`,
        description: quiz.description,
    }
}

export default async function QuizPage({ params }: PageProps) {
    const resolvedParams = await params;
    const quiz = getQuizData(resolvedParams.slug)

    if (!quiz) {
        notFound()
    }

    return (
        <main id="main-content" className="min-h-screen bg-kb-bg pt-10">
            <QuizComponent quiz={quiz} />
        </main>
    )
}

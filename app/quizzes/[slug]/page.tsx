import { getQuizData } from '@/lib/quizzes'
import QuizComponent from '@/components/QuizComponent'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
    params: {
        slug: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const quiz = getQuizData(params.slug)
    if (!quiz) return { title: 'Quiz Not Found' }

    return {
        title: `${quiz.title} | SmartSass Tech`,
        description: quiz.description,
    }
}

export default function QuizPage({ params }: PageProps) {
    const quiz = getQuizData(params.slug)

    if (!quiz) {
        notFound()
    }

    return (
        <main id="main-content" className="min-h-screen bg-kb-bg pt-10">
            <QuizComponent quiz={quiz} />
        </main>
    )
}

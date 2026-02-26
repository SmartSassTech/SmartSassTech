'use client'

import React, { useState, useEffect } from 'react'
import { QuizData, QuizRecommendation } from '@/types/quiz'
import { computeResults } from '@/lib/quizzes'
import Link from 'next/link'

interface QuizComponentProps {
    quiz: QuizData
}

export default function QuizComponent({ quiz }: QuizComponentProps) {
    const [step, setStep] = useState<'start' | 'questions' | 'results'>('start')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [results, setResults] = useState<QuizRecommendation | null>(null)

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const progress = (currentQuestionIndex / quiz.questions.length) * 100

    const handleStart = () => {
        setStep('questions')
        setCurrentQuestionIndex(0)
    }

    const handleOptionSelect = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            const computedResults = computeResults(quiz.id, answers)
            setResults(computedResults)
            setStep('results')
        }
    }

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        } else {
            setStep('start')
        }
    }

    const handleStartOver = () => {
        setAnswers({})
        setStep('start')
        setCurrentQuestionIndex(0)
        setResults(null)
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 font-sans">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-kb-pale/50 mb-12">
                {/* Header */}
                <div className="bg-kb-navy p-8 md:p-12 text-center text-white">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">{quiz.title}</h1>
                    <p className="text-lg md:text-xl opacity-90">{quiz.description}</p>
                </div>

                {/* Progress Bar */}
                {step === 'questions' && (
                    <div className="w-full h-3 bg-kb-pale">
                        <div
                            className="h-full bg-sst-accent transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div className="p-8 md:p-16">
                    {step === 'start' && (
                        <div className="text-center animate-fadeIn">
                            <h2 className="text-3xl font-bold text-kb-navy mb-6">Ready to find your match?</h2>
                            <p className="text-xl text-kb-dark mb-10 leading-relaxed max-w-2xl mx-auto">
                                We'll ask you a few simple questions to help find the perfect {quiz.id} for you.
                                This will only take a minute or two!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleStart}
                                    className="bg-kb-navy text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-kb-slate transition-all transform hover:-translate-y-1 shadow-lg"
                                >
                                    Let's Get Started
                                </button>
                                <Link
                                    href="/articles"
                                    className="bg-kb-bg text-kb-dark px-10 py-5 rounded-2xl text-xl font-bold hover:bg-kb-pale transition-all text-center"
                                >
                                    Back to Resources
                                </Link>
                            </div>
                        </div>
                    )}

                    {step === 'questions' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl md:text-3xl font-bold text-kb-navy mb-8 leading-tight">
                                {currentQuestion.title}
                            </h2>

                            <div className="space-y-4 mb-12">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                                        className={`w-full p-6 text-left rounded-2xl border-2 transition-all text-lg md:text-xl font-medium ${answers[currentQuestion.id] === option.value
                                            ? 'border-kb-navy bg-kb-navy text-white shadow-md'
                                            : 'border-kb-pale hover:border-kb-slate hover:bg-kb-bg text-kb-dark'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-kb-bg/50 p-6 rounded-2xl">
                                <button
                                    onClick={handleBack}
                                    className="text-kb-slate font-bold text-lg hover:text-kb-navy transition-colors px-4 py-2"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!answers[currentQuestion.id]}
                                    className={`px-10 py-4 rounded-xl text-xl font-bold transition-all ${answers[currentQuestion.id]
                                        ? 'bg-kb-navy text-white hover:bg-kb-slate shadow-md'
                                        : 'bg-kb-light text-white cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    {currentQuestionIndex === quiz.questions.length - 1 ? 'See Results' : 'Next Question →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'results' && results && (
                        <div className="animate-fadeIn">
                            <div className="bg-sst-beige/30 p-8 rounded-3xl border-2 border-sst-beige mb-10 text-center">
                                <h2 className="text-2xl font-bold text-kb-navy mb-2">Our Top Recommendation</h2>
                                <div className="text-4xl md:text-5xl font-black text-kb-navy leading-tight">
                                    {results.recommendation}
                                </div>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-bold text-kb-navy mb-6">Why this is perfect for you:</h3>
                                <ul className="space-y-4">
                                    {results.reasons.map((reason, i) => (
                                        <li key={i} className="flex items-start gap-4 text-lg md:text-xl text-kb-dark leading-relaxed">
                                            <span className="text-kb-navy text-2xl mt-0.5">✓</span>
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <h3 className="text-2xl font-bold text-kb-navy mb-8">{results.productTitle || 'Recommended Models'}</h3>
                            <div className="space-y-8 mb-12">
                                {results.products.map((product, i) => (
                                    <div key={i} className="bg-kb-bg/30 rounded-3xl p-8 border border-kb-pale hover:border-kb-navy transition-all hover:shadow-xl">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <h4 className="text-2xl font-bold text-kb-navy">{product.name}</h4>
                                            <span className="text-3xl font-black text-kb-slate">{product.price}</span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                                            <div>
                                                <h5 className="font-bold text-kb-navy mb-3 uppercase tracking-wider text-sm">Key Features</h5>
                                                <ul className="space-y-2">
                                                    {product.specs.map((spec, j) => (
                                                        <li key={j} className="text-kb-dark text-lg flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-kb-slate"></span>
                                                            {spec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-kb-navy mb-3 uppercase tracking-wider text-sm">Our Expert Take</h5>
                                                <p className="text-kb-dark text-lg leading-relaxed">{product.why}</p>
                                            </div>
                                        </div>

                                        <a
                                            href={product.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-center bg-kb-navy text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-kb-slate transition-all shadow-md"
                                        >
                                            View this {quiz.id}
                                        </a>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center border-t border-kb-pale pt-8">
                                <button
                                    onClick={handleStartOver}
                                    className="bg-kb-bg text-kb-navy px-8 py-4 rounded-xl text-lg font-bold hover:bg-kb-pale transition-all"
                                >
                                    Start Quiz Over
                                </button>
                                <Link
                                    href="/"
                                    className="bg-kb-navy text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-kb-slate transition-all text-center"
                                >
                                    Back to Home Page
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}

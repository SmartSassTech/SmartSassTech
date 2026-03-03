'use client'

import React, { useState, useEffect } from 'react'
import { QuizData, QuizRecommendation } from '@/types/quiz'
import { computeResults } from '@/lib/quizzes'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, RefreshCcw, LogIn, Award } from 'lucide-react'

interface QuizComponentProps {
    quiz: QuizData
}

export default function QuizComponent({ quiz }: QuizComponentProps) {
    const [step, setStep] = useState<'start' | 'questions' | 'results'>('start')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [results, setResults] = useState<QuizRecommendation | null>(null)

    // Backend Integration State
    const [session, setSession] = useState<any>(null)
    const [emailInput, setEmailInput] = useState('')
    const [emailSent, setEmailSent] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Smart Skip Engine State
    const [autoSkippedQuestions, setAutoSkippedQuestions] = useState<Set<string>>(new Set())

    // Check auth on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const currentSession = data.session;
            setSession(currentSession)

            // Auto-save & Smart Skip logic if authenticated
            if (currentSession?.user) {
                // Background fetch user devices for Smart Skip
                supabase
                    .from('user_devices')
                    .select('*')
                    .eq('user_id', currentSession.user.id)
                    .then(({ data: devices, error }) => {
                        if (!error && devices && devices.length > 0) {
                            let autoAnswers: Record<string, string> = {};
                            let autoSkipped = new Set<string>();

                            quiz.questions.forEach((q) => {
                                if (q.autoAnswerRule) {
                                    const hasMatchingDevice = devices.some((d: any) =>
                                        q.autoAnswerRule!.dependsOnDeviceBrand.some(brand =>
                                            (d.brand && d.brand.toLowerCase().includes(brand.toLowerCase())) ||
                                            (d.device_name && d.device_name.toLowerCase().includes(brand.toLowerCase())) ||
                                            (d.device_type && d.device_type.toLowerCase().includes(brand.toLowerCase()))
                                        )
                                    );
                                    if (hasMatchingDevice) {
                                        autoAnswers[q.id] = q.autoAnswerRule.answerValue;
                                        autoSkipped.add(q.id);
                                    }
                                }
                            });

                            if (Object.keys(autoAnswers).length > 0) {
                                setAnswers(prev => ({ ...prev, ...autoAnswers }));
                                setAutoSkippedQuestions(autoSkipped);
                            }
                        }
                    });

                const pendingStr = localStorage.getItem('pending_quiz_data');
                if (pendingStr) {
                    try {
                        const pendingData = JSON.parse(pendingStr);
                        if (pendingData.quizId === quiz.id) {
                            setAnswers(pendingData.answers);
                            setResults(pendingData.results);
                            setStep('results');

                            // Save to database
                            setIsSaving(true);
                            supabase.from('quiz_results').insert([
                                {
                                    user_id: currentSession.user.id,
                                    quiz_id: quiz.id,
                                    answers: pendingData.answers,
                                    recommendation: pendingData.results
                                }
                            ]).then(({ error }) => {
                                setIsSaving(false);
                                if (!error) {
                                    setSaveSuccess(true);
                                }
                                localStorage.removeItem('pending_quiz_data');
                            });
                        }
                    } catch (e) {
                        console.error('Failed to parse pending quiz data:', e)
                    }
                }
            }
        })
    }, [quiz.id])

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const progress = (currentQuestionIndex / quiz.questions.length) * 100

    const handleStart = () => {
        setStep('questions')

        let startIndex = 0;
        while (startIndex < quiz.questions.length && autoSkippedQuestions.has(quiz.questions[startIndex].id)) {
            startIndex++;
        }

        if (startIndex < quiz.questions.length) {
            setCurrentQuestionIndex(startIndex)
        } else {
            // Edge case: entire quiz skipped
            const computedResults = computeResults(quiz.id, answers)
            setResults(computedResults)
            setStep('results')
            saveOrPromptUser(computedResults)
        }
    }

    const handleOptionSelect = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleNext = async () => {
        let nextIndex = currentQuestionIndex + 1;
        while (nextIndex < quiz.questions.length && autoSkippedQuestions.has(quiz.questions[nextIndex].id)) {
            nextIndex++;
        }

        if (nextIndex < quiz.questions.length) {
            setCurrentQuestionIndex(nextIndex)
        } else {
            const computedResults = computeResults(quiz.id, answers)
            setResults(computedResults)
            setStep('results')
            await saveOrPromptUser(computedResults)
        }
    }

    const saveOrPromptUser = async (recommendationData: QuizRecommendation) => {
        // Double check session in case it changed
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
            setIsSaving(true)
            const { error } = await supabase.from('quiz_results').insert([
                {
                    user_id: currentSession.user.id,
                    quiz_id: quiz.id,
                    answers: answers,
                    recommendation: recommendationData
                }
            ])
            setIsSaving(false)
            if (!error) {
                setSaveSuccess(true)
            }
        }
    }

    const handleEmailSubmit = async () => {
        if (!emailInput || !results) return;
        setIsSaving(true);

        try {
            const res = await fetch('/api/quiz/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput,
                    quizTitle: quiz.title,
                    recommendation: results.recommendation,
                    products: results.products
                })
            });

            if (res.ok) {
                setEmailSent(true);
                // Save anonymous entry
                await supabase.from('quiz_results').insert([
                    {
                        user_id: null,
                        email: emailInput,
                        quiz_id: quiz.id,
                        answers: answers,
                        recommendation: results
                    }
                ]);
                setSaveSuccess(true);
            } else {
                alert('Failed to send email. Please try again.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    }

    const handleBack = () => {
        let prevIndex = currentQuestionIndex - 1;
        while (prevIndex >= 0 && autoSkippedQuestions.has(quiz.questions[prevIndex].id)) {
            prevIndex--;
        }

        if (prevIndex >= 0) {
            setCurrentQuestionIndex(prevIndex)
        } else {
            setStep('start')
        }
    }

    const handleStartOver = () => {
        setAnswers({})
        setStep('start')
        setCurrentQuestionIndex(0)
        setResults(null)
        setEmailSent(false)
        setSaveSuccess(false)
        setEmailInput('')
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-16 font-sans">
            <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(46,59,105,0.15)] overflow-hidden border border-kb-pale/40 mb-12 relative isolate">

                {/* Header */}
                <div className="bg-gradient-to-br from-kb-navy to-kb-slate p-10 md:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 font-heading tracking-tight drop-shadow-sm relative z-10">{quiz.title}</h1>
                    <p className="text-lg md:text-2xl text-white max-w-3xl mx-auto font-medium leading-relaxed relative z-10">{quiz.description}</p>
                </div>

                {/* Progress Bar */}
                {step === 'questions' && (
                    <div className="w-full h-4 bg-kb-pale/50">
                        <div
                            className="h-full bg-sst-secondary transition-all duration-700 ease-out relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                )}

                <div className="p-8 md:p-16 min-h-[400px] flex flex-col justify-center">

                    {/* START STEP */}
                    {step === 'start' && (
                        <div className="text-center animate-fadeIn max-w-3xl mx-auto">
                            <div className="w-24 h-24 bg-kb-bg rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Award className="w-12 h-12 text-kb-navy" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-kb-navy mb-6">Ready to find your match?</h2>
                            <p className="text-xl text-kb-dark mb-12 leading-relaxed">
                                We'll ask you a few simple questions to help find the perfect {quiz.id} for you.
                                This will only take a minute or two!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                                <button
                                    onClick={handleStart}
                                    className="bg-kb-navy text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-opacity-90 transition-all transform hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(46,59,105,0.5)] flex items-center justify-center gap-2 group"
                                >
                                    Let's Get Started
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link
                                    href="/articles"
                                    className="bg-kb-bg text-kb-dark border-2 border-kb-pale px-10 py-5 rounded-2xl text-xl font-bold hover:border-kb-muted hover:bg-kb-pale/30 transition-all text-center"
                                >
                                    Back to Resources
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* QUESTIONS STEP */}
                    {step === 'questions' && (
                        <div className="animate-fadeIn max-w-3xl mx-auto w-full">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-10 leading-tight">
                                {currentQuestion.question || currentQuestion.title}
                            </h2>

                            <div className="space-y-4 mb-16">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                                        className={`w-full p-6 md:p-8 text-left rounded-2xl border-2 transition-all duration-300 text-lg md:text-xl font-medium flex items-center justify-between group ${answers[currentQuestion.id] === option.value
                                            ? 'border-kb-navy bg-kb-navy/10 text-kb-navy shadow-inner font-bold'
                                            : 'border-kb-slate hover:border-sst-secondary hover:bg-sst-beige/30 text-[#111827]'
                                            }`}
                                    >
                                        <span className="font-semibold">{option.text || option.label}</span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option.value ? 'border-kb-navy bg-kb-navy' : 'border-kb-slate group-hover:border-sst-secondary'}`}>
                                            {answers[currentQuestion.id] === option.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-kb-bg/60 p-4 md:p-6 rounded-2xl border border-kb-pale/50">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-kb-slate font-bold text-lg hover:text-kb-navy transition-colors px-4 py-2"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!answers[currentQuestion.id]}
                                    className={`px-10 py-4 rounded-xl text-lg md:text-xl font-bold transition-all flex items-center gap-2 ${answers[currentQuestion.id]
                                        ? 'bg-kb-navy text-white hover:bg-kb-slate shadow-lg hover:-translate-y-0.5'
                                        : 'bg-kb-light text-white cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    {currentQuestionIndex === quiz.questions.length - 1 ? 'See Results' : 'Next Question'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RESULTS STEP */}
                    {step === 'results' && results && (
                        <div className="animate-fadeIn">
                            <div className="bg-gradient-to-r from-sst-beige/40 to-kb-bg p-10 md:p-14 rounded-[2rem] border border-kb-pale mb-12 text-center shadow-inner relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
                                <h2 className="text-xl md:text-2xl font-bold text-kb-slate mb-4 tracking-widest uppercase">Our Top Recommendation</h2>
                                <div className="text-4xl md:text-6xl font-black text-kb-navy leading-tight">
                                    {results.recommendation}
                                </div>
                            </div>

                            {/* IF USER IS NOT LOGGED IN, PROMPT TO EMAIL/SAVE */}
                            {!session?.user && !saveSuccess && (
                                <div className="bg-white p-8 md:p-10 rounded-3xl mt-2 mb-12 border-2 border-kb-pale shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-3 h-full bg-sst-accent"></div>
                                    <h3 className="text-2xl font-bold text-kb-navy mb-3">Save these results?</h3>
                                    <p className="text-kb-dark text-lg mb-8">Log in to add this recommendation to your profile, or email the results to yourself directly!</p>

                                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                                        <Link
                                            href={`/login?redirect=/quizzes/${quiz.id}`}
                                            onClick={() => {
                                                localStorage.setItem('pending_quiz_data', JSON.stringify({
                                                    quizId: quiz.id,
                                                    answers: answers,
                                                    results: results
                                                }))
                                            }}
                                            className="bg-white border-2 border-kb-navy text-kb-navy px-8 py-4 rounded-xl font-bold hover:bg-kb-navy hover:text-white transition-all w-full lg:w-auto text-center flex items-center justify-center gap-2"
                                        >
                                            <LogIn className="w-5 h-5" /> Log In
                                        </Link>

                                        <div className="flex items-center justify-center px-4"><span className="text-kb-light font-bold">OR</span></div>

                                        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-kb-muted w-5 h-5" />
                                                <input
                                                    type="email"
                                                    placeholder="Your email address"
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-kb-pale focus:border-kb-navy outline-none bg-kb-bg/30 text-kb-dark transition-colors"
                                                    value={emailInput}
                                                    onChange={(e) => setEmailInput(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={handleEmailSubmit}
                                                disabled={isSaving || !emailInput}
                                                className="bg-sst-secondary text-white px-8 py-4 rounded-xl font-bold hover:bg-kb-navy transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                                            >
                                                {isSaving ? 'Sending...' : 'Email Me'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {emailSent && (
                                <div className="bg-[#EFFFED] p-6 rounded-2xl mb-12 border border-[#B3E6A1] flex items-center gap-4 text-[#2b6819] animate-fadeIn">
                                    <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                                    <p className="text-lg font-medium">Success! We've emailed you the results. Check your inbox momentarily.</p>
                                </div>
                            )}

                            {session?.user && saveSuccess && !emailSent && (
                                <div className="bg-[#EFFFED] p-6 rounded-2xl mb-12 border border-[#B3E6A1] flex items-center gap-4 text-[#2b6819] animate-fadeIn">
                                    <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                                    <p className="text-lg font-medium">These recommendations have been automatically saved to your profile!</p>
                                </div>
                            )}

                            <div className="mb-16">
                                <h3 className="text-3xl font-bold text-kb-navy mb-8">Why this is perfect for you:</h3>
                                <div className="grid gap-4">
                                    {results.reasons.map((reason, i) => (
                                        <div key={i} className="flex items-start gap-5 bg-kb-bg/50 p-6 rounded-2xl border border-kb-pale/50">
                                            <div className="bg-kb-navy rounded-full p-2 mt-0.5">
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-xl text-kb-dark leading-relaxed">{reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold text-kb-navy mb-8">{results.productTitle || 'Recommended Models'}</h3>
                            <div className="space-y-8 mb-16">
                                {results.products.map((product, i) => (
                                    <div key={i} className="bg-white rounded-3xl p-8 md:p-10 border-2 border-kb-pale hover:border-sst-accent transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(91,100,134,0.2)]">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                            <h4 className="text-2xl md:text-3xl font-bold text-kb-navy">{product.name}</h4>
                                            <span className="text-3xl font-black text-sst-secondary bg-sst-beige/30 px-6 py-2 rounded-xl">{product.price}</span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-10 mb-10">
                                            <div>
                                                <h5 className="font-bold text-kb-muted mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                                                    <span className="w-8 h-px bg-kb-pale"></span> Key Features
                                                </h5>
                                                <ul className="space-y-4">
                                                    {(product.specs || product.features || []).map((spec, j) => (
                                                        <li key={j} className="text-kb-dark text-lg flex items-start gap-3">
                                                            <span className="w-2 h-2 rounded-full bg-sst-secondary mt-2 flex-shrink-0"></span>
                                                            <span className="leading-relaxed">{spec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-kb-bg/50 p-6 rounded-2xl">
                                                <h5 className="font-bold text-kb-muted mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                                                    <span className="w-8 h-px bg-kb-pale"></span> Our Expert Take
                                                </h5>
                                                <p className="text-kb-dark text-lg leading-relaxed">{product.why}</p>
                                            </div>
                                        </div>

                                        <a
                                            href={product.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-center bg-kb-navy text-white px-8 py-5 rounded-xl text-xl font-bold hover:bg-kb-slate transition-all shadow-md group"
                                        >
                                            View {quiz.id} Options <ArrowRight className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 border-t-2 border-kb-pale/50">
                                <button
                                    onClick={handleStartOver}
                                    className="bg-kb-bg text-kb-navy px-8 py-4 rounded-xl text-lg font-bold hover:bg-kb-pale transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw className="w-5 h-5" /> Start Quiz Over
                                </button>
                                <Link
                                    href="/"
                                    className="bg-white border-2 border-kb-navy text-kb-navy px-8 py-4 rounded-xl text-lg font-bold hover:bg-kb-navy hover:text-white transition-all text-center flex items-center justify-center"
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
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    )
}

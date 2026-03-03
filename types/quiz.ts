export interface QuizOption {
    text?: string;
    label?: string;
    value: string;
}

export interface AutoAnswerRule {
    dependsOnDeviceBrand: string[];
    answerValue: string;
}

export interface QuizQuestion {
    id: string;
    question?: string;
    title?: string;
    options: QuizOption[];
    autoAnswerRule?: AutoAnswerRule;
}

export interface Product {
    name: string;
    price: string;
    specs?: string[];
    features?: string[];
    why: string;
    link: string;
}

export interface QuizRecommendation {
    deviceType: string;
    platform: string;
    reasons: string[];
    recommendation: string;
    products: Product[];
    productTitle?: string;
}

export interface QuizData {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    products?: any;
    recommendations?: Record<string, {
        title: string;
        reasons: string[];
        products: Product[];
    }>;
}

export interface QuizOption {
    label: string;
    value: string;
}

export interface QuizQuestion {
    id: string;
    title: string;
    options: QuizOption[];
}

export interface Product {
    name: string;
    price: string;
    specs: string[];
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

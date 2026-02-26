import { QuizData, QuizRecommendation, Product } from '@/types/quiz';
import computerData from './quiz-data/computer.json';
import phoneData from './quiz-data/phone.json';
import internetData from './quiz-data/internet-provider.json';
import printerData from './quiz-data/printer.json';
import securityCameraData from './quiz-data/security-camera.json';
import smartwatchData from './quiz-data/smartwatch.json';
import streamingData from './quiz-data/streaming.json';
import keyboardMouseData from './quiz-data/keyboard-mouse.json';

export const quizRegistry: Record<string, QuizData> = {
    'computer': computerData as unknown as QuizData,
    'phone': phoneData as unknown as QuizData,
    'internet-provider': internetData as unknown as QuizData,
    'printer': printerData as unknown as QuizData,
    'security-camera': securityCameraData as unknown as QuizData,
    'smartwatch': smartwatchData as unknown as QuizData,
    'streaming': streamingData as unknown as QuizData,
    'keyboard-mouse': keyboardMouseData as unknown as QuizData,
};

export function getQuizData(slug: string): QuizData | null {
    return quizRegistry[slug] || null;
}

export function computeResults(slug: string, answers: Record<string, string>): QuizRecommendation {
    if (slug === 'computer') {
        return computeComputerResults(answers);
    }
    if (slug === 'phone') {
        return computePhoneResults(answers);
    }
    if (slug === 'internet-provider') {
        return computeInternetResults(answers);
    }
    if (slug === 'printer') {
        return computePrinterResults(answers);
    }
    if (slug === 'security-camera') {
        return computeSecurityCameraResults(answers);
    }
    if (slug === 'smartwatch') {
        return computeSmartwatchResults(answers);
    }
    if (slug === 'streaming') {
        return computeStreamingResults(answers);
    }
    if (slug === 'keyboard-mouse') {
        return computeKeyboardMouseResults(answers);
    }
    // Fallback or error
    throw new Error(`No logic implemented for quiz: ${slug}`);
}

function computeComputerResults(answers: Record<string, string>): QuizRecommendation {
    let deviceType = '';
    let platform = '';
    let reasons: string[] = [];

    // Determine device type (desktop vs laptop)
    if (answers.portability === 'home') {
        deviceType = 'desktop';
        reasons.push("A desktop is perfect since you'll mainly use it in one spot at home");
    } else if (answers.portability === 'travel') {
        deviceType = 'laptop';
        reasons.push("A laptop gives you the portability you need to take it with you");
    } else {
        if (answers.screenSize === 'very') {
            deviceType = 'desktop';
            reasons.push("A desktop will give you the large screen you want for comfortable viewing");
        } else {
            deviceType = 'laptop';
            reasons.push("A laptop offers flexibility to move around your home while still being easy to use");
        }
    }

    // Determine platform (Apple vs Windows)
    if (answers.apple === 'yes') {
        platform = 'apple';
        reasons.push("Since you already use an iPhone or iPad, an Apple computer will work seamlessly with your devices");
    } else if (answers.comfort === 'new' || answers.comfort === 'basics') {
        if (answers.apple === 'no') {
            platform = 'windows';
            reasons.push("Windows computers are familiar, affordable, and perfect for your everyday needs");
        } else {
            platform = 'windows';
            reasons.push("Windows offers great value and is easy to learn for essential tasks");
        }
    } else {
        if (answers.budget === 'over1200') {
            platform = 'apple';
            reasons.push("Your budget allows for Apple's premium quality and long-lasting performance");
        } else {
            platform = 'windows';
            reasons.push("Windows gives you excellent features at a great price point");
        }
    }

    // Add comfort-specific reasons
    if (answers.comfort === 'new') {
        if (platform === 'apple') {
            reasons.push("Apple computers are known for their simple, intuitive interface - perfect for beginners");
        } else {
            reasons.push("Modern Windows computers are designed to be user-friendly and easy to learn");
        }
    }

    // Add screen size reason
    if (answers.screenSize === 'very' && deviceType === 'desktop') {
        reasons.push("Desktop computers can have large 24\" monitors that make everything easy to see");
    } else if (answers.screenSize === 'very' && deviceType === 'laptop') {
        reasons.push("We'll recommend laptops with 15.6\" or larger screens for comfortable viewing");
    }

    const recommendation = `${platform === 'apple' ? 'Apple' : 'Windows'} ${deviceType === 'desktop' ? 'Desktop' : 'Laptop'}`;

    const products = getProducts('computer', deviceType, platform, answers.budget);

    return {
        deviceType,
        platform,
        reasons,
        recommendation,
        products
    };
}

function computePhoneResults(answers: Record<string, string>): QuizRecommendation {
    let deviceType = '';
    let platform = '';
    let reasons: string[] = [];

    // Determine device type (flip vs smartphone)
    if (answers.phoneType === 'simple') {
        deviceType = 'flip';
        reasons.push('A flip phone keeps things simple - just the basics you need');
    } else {
        deviceType = 'smartphone';
        if (answers.phoneType === 'smartphone-easy') {
            reasons.push("We've selected smartphones that are designed to be easy to use");
        } else {
            reasons.push("You'll have access to all the latest smartphone features");
        }
    }

    // Determine platform
    if (deviceType === 'smartphone') {
        if (answers.ecosystem === 'yes') {
            platform = 'iphone';
            reasons.push('Since you already use Apple products, an iPhone will work seamlessly with your other devices');
        } else if (answers.ecosystem === 'no') {
            platform = 'android';
            reasons.push('Android phones offer great value and work perfectly with your current setup');
        } else {
            if (answers.budget === 'over500' || answers.budget === '300-500') {
                platform = 'iphone';
                reasons.push('Your budget allows for an iPhone, which is known for being user-friendly and reliable');
            } else {
                platform = 'android';
                reasons.push('Android phones offer excellent value with all the features you need');
            }
        }
    } else {
        platform = 'flip';
        reasons.push('Simple physical buttons make dialing and texting straightforward');
    }

    // Add special needs reasons
    if (answers.specialNeeds === 'hearing') {
        reasons.push('These phones are compatible with hearing aids for clear sound');
    } else if (answers.specialNeeds === 'vision') {
        reasons.push('Large text and buttons make everything easy to see and tap');
    } else if (answers.specialNeeds === 'emergency') {
        reasons.push('Quick access to emergency services for your safety and peace of mind');
    }

    if (answers.screenSize === 'very' && deviceType === 'smartphone') {
        reasons.push('Large screen makes reading texts, viewing photos, and browsing much easier');
    }

    const recommendation = deviceType === 'flip' ? 'Easy Flip Phone' :
        (platform === 'iphone' ? 'iPhone' : 'Android Smartphone');

    const products = getProducts('phone', deviceType, platform, answers.budget);

    return {
        deviceType,
        platform,
        reasons,
        recommendation,
        products
    };
}

function computeInternetResults(answers: Record<string, string>): QuizRecommendation {
    let provider = '';
    let reasons: string[] = [];

    // Determine provider based on priority and usage
    if (answers.priority === 'local' || answers.priority === 'reliability') {
        provider = 'greenlight';
        reasons.push('Greenlight Networks is rated #1 in Rochester by Consumer Reports');
        reasons.push('Local Rochester company with outstanding customer service');
        reasons.push('100% fiber optic - the most reliable internet technology');
    } else if (answers.usage === 'heavy' || answers.usage === 'gaming' || answers.priority === 'speed') {
        provider = 'greenlight';
        reasons.push('Greenlight offers the fastest fiber speeds in Rochester');
        reasons.push('Symmetrical speeds - upload as fast as download');
    } else if (answers.budget === 'budget' || answers.priority === 'price') {
        provider = 'spectrum';
        reasons.push('Spectrum offers competitive pricing for basic needs');
        reasons.push('Widely available across Rochester with no contracts');
    } else {
        provider = 'greenlight';
        reasons.push('Greenlight provides the best overall value and reliability in Rochester');
        reasons.push('No data caps, no contracts, no hidden fees');
    }

    // Add usage-based reasons
    if (answers.usage === 'work') {
        reasons.push('Fast upload speeds perfect for video calls and file sharing');
    } else if (answers.usage === 'streaming') {
        reasons.push('More than enough speed for smooth 4K streaming');
    }

    // Add house size reason
    if (answers.houseSize === 'large') {
        reasons.push('For a large home, we recommend adding a mesh Wi-Fi system for full coverage');
    }

    const recommendation = provider === 'greenlight' ? 'Greenlight Networks' : 'Spectrum';
    const products = (quizRegistry['internet-provider'] as any).products[provider];

    return {
        deviceType: provider,
        platform: '',
        reasons,
        recommendation,
        products,
        productTitle: 'Recommended Plans'
    };
}

function computePrinterResults(answers: Record<string, string>): QuizRecommendation {
    let printerType = '';
    const reasons: string[] = [];

    if (answers.printingType === 'black-white' && answers.pageVolume === 'low') {
        printerType = 'laser';
    } else if ((answers.printingType === 'mixed' || answers.pageVolume === 'high') && answers.inkImportance === 'very') {
        printerType = 'tank';
    } else if (answers.budget === 'under100' && answers.pageVolume === 'low') {
        printerType = 'basic';
    } else if (answers.scannerNeed === 'yes' || answers.scannerNeed === 'all') {
        printerType = 'all-in-one';
    } else {
        printerType = 'all-in-one';
    }

    const data = quizRegistry['printer'];
    const recData = data.recommendations![printerType];

    return {
        deviceType: printerType,
        platform: '',
        reasons: recData.reasons,
        recommendation: recData.title,
        products: recData.products
    };
}

function computeSecurityCameraResults(answers: Record<string, string>): QuizRecommendation {
    let cameraType = '';

    if (answers.subscription === 'no' && answers.storage === 'local') {
        cameraType = 'no-subscription';
    } else if (answers.budget === 'under50' || answers.budget === '50-100') {
        cameraType = 'budget';
    } else if (answers.features === 'quality' || answers.budget === 'over200') {
        cameraType = 'premium';
    } else {
        cameraType = 'mid-range';
    }

    const data = quizRegistry['security-camera'];
    const recData = data.recommendations![cameraType];

    return {
        deviceType: cameraType,
        platform: '',
        reasons: recData.reasons,
        recommendation: recData.title,
        products: recData.products
    };
}

function computeSmartwatchResults(answers: Record<string, string>): QuizRecommendation {
    let deviceType = '';
    let platform = '';

    if (answers.goal === 'safety' || answers.goal === 'all' || answers.comfort === 'advanced') {
        deviceType = 'smartwatch';
    } else if (answers.goal === 'health' || answers.goal === 'fitness') {
        if (answers.comfort === 'simple' || answers.battery === 'very') {
            deviceType = 'tracker';
        } else {
            deviceType = 'smartwatch';
        }
    } else {
        deviceType = 'smartwatch';
    }

    if (answers.phone === 'iphone') {
        platform = 'Apple Watch';
    } else if (answers.phone === 'android') {
        platform = 'Android Smartwatch';
    } else {
        platform = 'Standalone Smartwatch';
    }

    const recommendationKey = deviceType === 'tracker' ? 'Fitness Tracker' : platform;
    const data = quizRegistry['smartwatch'];
    const recData = data.recommendations![recommendationKey];

    return {
        deviceType,
        platform,
        reasons: recData.reasons,
        recommendation: recData.title,
        products: recData.products
    };
}

function computeStreamingResults(answers: Record<string, string>): QuizRecommendation {
    let primaryService = '';

    if (answers.shows === 'netflix') {
        primaryService = 'Netflix';
    } else if (answers.shows === 'hbo') {
        primaryService = 'HBO Max';
    } else if (answers.shows === 'disney') {
        primaryService = 'Disney+';
    } else if (answers.shows === 'prime') {
        primaryService = 'Amazon Prime Video';
    } else if (answers.shows === 'apple') {
        primaryService = 'Apple TV+';
    } else {
        if (answers.genre === 'family') {
            primaryService = 'Disney+';
        } else if (answers.genre === 'scifi') {
            primaryService = 'Netflix';
        } else if (answers.genre === 'drama') {
            primaryService = 'HBO Max';
        } else if (answers.genre === 'comedy') {
            primaryService = 'Netflix';
        } else if (answers.genre === 'action') {
            primaryService = 'Amazon Prime Video';
        } else {
            primaryService = 'Netflix';
        }
    }

    const data = quizRegistry['streaming'];
    const recData = data.recommendations![primaryService];

    return {
        deviceType: primaryService,
        platform: '',
        reasons: recData.reasons,
        recommendation: recData.title,
        products: recData.products
    };
}

function computeKeyboardMouseResults(answers: Record<string, string>): QuizRecommendation {
    let setupType = '';

    if (answers.computerType === 'laptop-only') {
        setupType = 'Laptop Accessories & Upgrades';
    } else if ((answers.comfort === 'wrist' || answers.comfort === 'hand' || answers.comfort === 'shoulder') &&
        (answers.typingVolume === 'moderate' || answers.typingVolume === 'heavy')) {
        setupType = 'Ergonomic Keyboard & Mouse';
    } else if (answers.budget === 'budget' || answers.priority === 'simple') {
        setupType = 'Basic Keyboard & Mouse';
    } else if (answers.priority === 'compact') {
        setupType = 'Compact Keyboard & Mouse';
    } else {
        setupType = 'Standard Keyboard & Mouse';
    }

    const data = quizRegistry['keyboard-mouse'];
    const recData = data.recommendations![setupType];

    return {
        deviceType: setupType,
        platform: '',
        reasons: recData.reasons,
        recommendation: recData.title,
        products: recData.products
    };
}

function getProducts(quizId: string, deviceType: string, platform: string, budget: string): Product[] {
    const data = (quizRegistry[quizId] as any).products;
    let selectedProducts = data?.[deviceType]?.[platform]?.[budget] || [];

    if (selectedProducts.length === 0) {
        // Fallback logic
        const budgetOrder = ['under500', '500-800', '800-1200', 'over1200'];
        const idx = budgetOrder.indexOf(budget);
        if (idx !== -1) {
            // Try higher budgets
            for (let i = idx + 1; i < budgetOrder.length; i++) {
                selectedProducts = data?.[deviceType]?.[platform]?.[budgetOrder[i]] || [];
                if (selectedProducts.length > 0) break;
            }
        }
    }

    if (selectedProducts.length === 0) {
        return [{
            name: 'Budget Recommendation',
            price: 'See options',
            specs: [`Unfortunately, there are no quality ${platform} ${deviceType}s in this exact price range.`],
            why: `For quality ${platform} computers, we recommend looking at the next budget range up, or considering Windows alternatives which offer excellent value in this price range.`,
            link: platform === 'apple' ? 'https://www.apple.com/shop/refurbished' : 'https://www.bestbuy.com/site/computers-for-seniors/pcmcat1587576358464.c?id=pcmcat1587576358464'
        }];
    }

    return selectedProducts.slice(0, 3);
}

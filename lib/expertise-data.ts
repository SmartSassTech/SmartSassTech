export interface ExpertisePageData {
    title: string
    heroTitle: string
    quizLink: string
    quizName: string
    comparison: {
        title: string
        cards: { title: string; description: string }[]
    }
    tip: string
    matchTitle: string
    matchDescription: string
    helpItems: { icon: string; title: string; description: string }[]
    officialResources: { title: string; url: string }[]
}

export const EXPERTISE_DATA: Record<string, ExpertisePageData> = {
    'laptops-desktops': {
        title: 'Laptops & Desktops',
        heroTitle: 'Laptop & Desktop Computers',
        quizLink: '/quizes/computer-quiz.html',
        quizName: 'Computer Match Quiz',
        comparison: {
            title: "What's the Difference Between a Laptop & Desktop?",
            cards: [
                { title: 'Laptop', description: 'Portable, battery-powered, folds up for travel. Great if you want to move around the house or take your computer with you.' },
                { title: 'Desktop', description: 'Larger, stays in one place, usually has a separate monitor, keyboard, and mouse. Typically offers more power and bigger screen.' }
            ]
        },
        tip: 'If you mostly use your computer at home and prefer a bigger screen, a desktop is probably the best choice for you. If you like to use your computer in different locations, go with a laptop!',
        matchTitle: 'Perfect Computer Match',
        matchDescription: 'Finding the perfect computer can be difficult. Take our quiz to find the perfect computer for your needs.',
        helpItems: [
            { icon: '🚀', title: 'New Computer Setup', description: "We'll help you get your new Mac or PC out of the box, connected to WiFi, and ready to use." },
            { icon: '🛡️', title: 'Virus & Scam Protection', description: 'Learn how to spot suspicious emails and keep your personal information safe from scammers.' },
            { icon: '📂', title: 'File & Photo Organization', description: "Stop worrying about losing your photos. We'll show you how to organize and back them up safely." },
            { icon: '⚡', title: 'Speed Up Your Slow PC', description: 'Is your computer running slowly? We can help clean it up and get it running like new again.' },
            { icon: '🔑', title: 'Password Help', description: "Forget your passwords? We'll help you set up a simple, secure way to keep track of them." },
            { icon: '🎓', title: 'Software Training', description: 'Learn how to use Word, Excel, Email, or any other program at your own pace with no jargon.' }
        ],
        officialResources: [
            { title: 'Apple Mac Support', url: 'https://support.apple.com/mac' },
            { title: 'Dell Support', url: 'https://www.dell.com/support' },
            { title: 'HP Support', url: 'https://support.hp.com' },
            { title: 'Lenovo Support', url: 'https://support.lenovo.com' },
            { title: 'Microsoft Support', url: 'https://support.microsoft.com' }
        ]
    },
    'tablets-phones': {
        title: 'Tablets & Phones',
        heroTitle: 'Tablets & Phones',
        quizLink: '/quizes/phone-quiz.html',
        quizName: 'Phone Match Quiz',
        comparison: {
            title: "What's the Difference Between a Tablet & Phone?",
            cards: [
                { title: 'Tablet', description: 'Larger screen (typically 7-13 inches), great for reading, watching videos, and browsing. Some tablets can make calls, but most focus on apps and media consumption.' },
                { title: 'Phone', description: 'Portable, fits in your pocket, makes calls and texts. Modern smartphones do everything: photos, videos, apps, navigation, and staying connected on the go.' }
            ]
        },
        tip: 'If you want something easy to carry everywhere for calls and quick tasks, go with a phone. If you prefer a bigger screen for reading or watching videos at home, consider a tablet!',
        matchTitle: 'Perfect Phone Match',
        matchDescription: 'Finding the right phone or tablet can be overwhelming. Take our quiz to discover the perfect device for your needs.',
        helpItems: [
            { icon: '📱', title: 'iPhone & Android Setup', description: "Bought a new phone? We'll help you transfer your contacts, photos, and apps from your old device." },
            { icon: '💬', title: 'Mastering Texting & Email', description: 'Learn how to send photos, use emojis, and manage your emails easily on your mobile device.' },
            { icon: '📹', title: 'Stay Connected via Video', description: "We'll show you how to use FaceTime, Zoom, or WhatsApp to see and talk to your family anytime." },
            { icon: '📸', title: 'Camera & Photo Skills', description: 'Learn how to take great photos, find them later, and share them with your loved ones.' },
            { icon: '🧩', title: 'App Instruction', description: "Want to use Uber, MyChart, or Facebook? We'll walk you through any app until you feel like a pro." },
            { icon: '☁️', title: 'Cloud Storage & Backups', description: "Never worry about losing your memories. We'll set up iCloud or Google Photos to keep them safe." }
        ],
        officialResources: [
            { title: 'Apple iPhone Support', url: 'https://support.apple.com/iphone' },
            { title: 'Apple iPad Support', url: 'https://support.apple.com/ipad' },
            { title: 'Samsung Mobile Support', url: 'https://www.samsung.com/us/support/mobile/' },
            { title: 'Android Support', url: 'https://support.google.com/android' },
            { title: 'Google Pixel Support', url: 'https://support.google.com/pixelphone' }
        ]
    },
    'watches-wearables': {
        title: 'Watches & Wearables',
        heroTitle: 'Smartwatches & Wearables',
        quizLink: '/quizes/smartwatch-quiz.html',
        quizName: 'Wearable Match Quiz',
        comparison: {
            title: "What's the Difference Between a Fitness Tracker & Smartwatch?",
            cards: [
                { title: 'Fitness Tracker', description: 'Focused on health: steps, heart rate, and sleep. Usually smaller with longer battery life. Great if you primarily want to track your activity.' },
                { title: 'Smartwatch', description: 'A tiny computer on your wrist. Handles calls, texts, apps, and health tracking. Larger screen and pairs deeply with your phone.' }
            ]
        },
        tip: 'If you just want to track your exercise and sleep, a fitness tracker is simple and effective. If you want to stay connected and use apps without reaching for your phone, go with a smartwatch!',
        matchTitle: 'Perfect Wearable Match',
        matchDescription: 'Not sure which watch is right for you? Take our quiz to find the perfect wearable for your lifestyle.',
        helpItems: [
            { icon: '⌚', title: 'Smartwatch Pairing', description: "We'll help you connect your Apple Watch, Fitbit, or Galaxy Watch to your phone and get it sync'd up." },
            { icon: '❤️', title: 'Health & Fitness Tracking', description: 'Learn how to monitor your heart rate, track your steps, and set health goals on your new device.' },
            { icon: '🔔', title: 'Managing Notifications', description: "Stop your watch from buzzing all day. We'll show you how to choose which alerts are actually important." },
            { icon: '🎵', title: 'Music & Apps on your Wrist', description: 'Learn how to listen to music, use GPS for walks, and install helpful apps directly on your watch.' }
        ],
        officialResources: [
            { title: 'Apple Watch Support', url: 'https://support.apple.com/watch' },
            { title: 'Fitbit Support', url: 'https://help.fitbit.com/' },
            { title: 'Samsung Wearables Support', url: 'https://www.samsung.com/us/support/mobile/wearables/' },
            { title: 'Garmin Support', url: 'https://support.garmin.com/' }
        ]
    },
    'tv-streaming': {
        title: 'TV & Streaming',
        heroTitle: 'TV & Streaming Support',
        quizLink: '/quizes/streaming-quiz.html',
        quizName: 'Streaming Match Quiz',
        comparison: {
            title: "What's the Difference Between a Smart TV & Streaming Device?",
            cards: [
                { title: 'Smart TV', description: 'The apps (like Netflix and YouTube) are built directly into the television. No extra boxes or cables needed.' },
                { title: 'Streaming Device', description: 'A small stick or box (like Roku or Apple TV) that plugs into any TV to add apps and modern features.' }
            ]
        },
        tip: "If you're buying a new TV anyway, a Smart TV is very convenient. If you like your current TV but want more apps, a streaming stick is an affordable and powerful upgrade!",
        matchTitle: 'Streaming Setup Help',
        matchDescription: 'Cut the cord and save money, or just get your favorites working. Take our quiz to find your perfect streaming setup.',
        helpItems: [
            { icon: '📺', title: 'Smart TV Setup', description: "We'll get your TV out of the box, connected to WiFi, and show you how to find your favorite shows." },
            { icon: '🎬', title: 'Streaming App Help', description: "Learn how to use Netflix, Prime Video, Hulu, or YouTube. We'll help you sign in and navigate with ease." },
            { icon: '🔗', title: 'Connecting Devices', description: 'Need to connect a DVD player, soundbar, or game console? We\'ll handle the cables and settings for you.' },
            { icon: '✂️', title: 'Cord Cutting Guidance', description: "Tired of high cable bills? We'll show you how to switch to streaming services and still watch the news and sports you love." }
        ],
        officialResources: [
            { title: 'Roku Support', url: 'https://support.roku.com/' },
            { title: 'Apple TV Support', url: 'https://support.apple.com/apple-tv' },
            { title: 'Amazon Fire TV Support', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GH7S9Y9BCY76929B' },
            { title: 'Samsung TV Support', url: 'https://www.samsung.com/us/support/televisions-home-theater/tvs/' }
        ]
    },
    'smart-home-security': {
        title: 'Smart Home & Security',
        heroTitle: 'Smart Home & Security',
        quizLink: '/quizes/security-camera-quiz.html',
        quizName: 'Security Cam Quiz',
        comparison: {
            title: "What's the Difference Between a Smart Hub & Standing Speaker?",
            cards: [
                { title: 'Smart Hub', description: 'Features a touch screen (like an Echo Show). Great for seeing who is at the door, watching videos, and video calls.' },
                { title: 'Smart Speaker', description: 'Voice-controlled speaker (like an Echo Dot). Perfect for music, setting timers, and asking questions by voice.' }
            ]
        },
        tip: 'If you want to view security cameras or follow recipes in the kitchen, a screen-based hub is best. For music and simple tasks in other rooms, a speaker is a great fit!',
        matchTitle: 'Smart Home Planning',
        matchDescription: 'Not sure which cameras or lights to buy? Take our quiz to build a smart home that works for you.',
        helpItems: [
            { icon: '📹', title: 'Security Camera Setup', description: "We'll help you install your Ring, Nest, or Arlo cameras and show you how to view the video on your phone." },
            { icon: '🔔', title: 'Smart Doorbell Help', description: "See who's at the door from anywhere. We'll set up your video doorbell and configure your notifications." },
            { icon: '💡', title: 'Smart Lighting & Plugs', description: "Learn how to turn your lights on and off with your voice or a schedule, making your home safer and more convenient." },
            { icon: '🗣️', title: 'Voice Assistant Training', description: "Master your Alexa or Google Home. Learn how to ask for the weather, set reminders, and control your home by voice." }
        ],
        officialResources: [
            { title: 'Ring Support', url: 'https://support.ring.com/' },
            { title: 'Google Nest Support', url: 'https://support.google.com/googlenest' },
            { title: 'Amazon Alexa Support', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=G201602230' },
            { title: 'Arlo Support', url: 'https://www.arlo.com/en-us/support/' }
        ]
    },
    'printers-scanners': {
        title: 'Printers & Scanners',
        heroTitle: 'Printers, Scanners & Copiers',
        quizLink: '/quizes/printer-quiz.html',
        quizName: 'Printer Match Quiz',
        comparison: {
            title: "What's the Difference Between Inkjet & Laser Printers?",
            cards: [
                { title: 'Inkjet', description: 'Uses liquid ink. Best for photos and color documents. Usually cheaper to buy but ink can be expensive over time.' },
                { title: 'Laser', description: 'Uses toner powder. Great for crisp text and high-volume printing. Very fast and toner often lasts longer than ink.' }
            ]
        },
        tip: 'If you print a lot of photos or colorful crafts, an inkjet is the way to go. If you mostly print black and white documents and want something reliable, a laser printer is a smart choice!',
        matchTitle: 'Find Your Perfect Printer',
        matchDescription: "Don't let printer jargon confuse you. Take our quiz to find a printer that actually works when you need it.",
        helpItems: [
            { icon: '🖨️', title: 'Wireless Printer Setup', description: "We'll get your printer connected to your WiFi so you can print from your computer, tablet, or phone." },
            { icon: '📄', title: 'Scanning to Computer', description: "Learn how to scan physical documents and photos and save them as files on your computer or send them via email." },
            { icon: '🛠️', title: 'Troubleshooting & Jams', description: "Printer not responding? We'll help clear errors, fix paper jams, and get those pages printing again." },
            { icon: '🧰', title: 'Ink & Toner Help', description: "We'll show you how to change your ink or toner and help you find the most affordable places to buy more." }
        ],
        officialResources: [
            { title: 'HP Printer Support', url: 'https://support.hp.com' },
            { title: 'Epson Support', url: 'https://epson.com/support' },
            { title: 'Brother Support', url: 'https://support.brother.com/' },
            { title: 'Canon Support', url: 'https://usa.canon.com/support' }
        ]
    },
    'wifi-networking': {
        title: 'WiFi & Networking',
        heroTitle: 'Internet & WiFi Support',
        quizLink: '/quizes/internet-provider-quiz.html',
        quizName: 'Internet Provider Quiz',
        comparison: {
            title: "What's the Difference Between a Modem & Router?",
            cards: [
                { title: 'Modem', description: 'The device that brings the internet into your home from your provider (like Spectrum or Greenlight).' },
                { title: 'Router', description: 'The device that takes that internet and spreads it through your house wirelessly (WiFi) to all your gadgets.' }
            ]
        },
        tip: 'Sometimes these two are combined into one box! If you have "dead zones" where WiFi doesn\'t reach, we can help you upgrade your router to cover your whole home.',
        matchTitle: 'Better Internet Planning',
        matchDescription: "Paying too much for slow internet? Take our quiz to find the best provider and speed for your home.",
        helpItems: [
            { icon: '📶', title: 'WiFi Dead Zone Fixes', description: "We'll help identify why your WiFi is slow in certain rooms and set up boosters or a mesh system to cover your whole house." },
            { icon: '🔒', title: 'Network Security', description: "Keep your home network safe with a strong password and secure settings, preventing strangers from using your internet." },
            { icon: '📱', title: 'Connecting All Devices', description: "We'll help you get your phones, tablets, computers, and TVs all connected to your WiFi correctly." },
            { icon: '🚦', title: 'Internet Speed Tests', description: "Is your internet actually as fast as you're paying for? We'll test your speed and help you talk to your provider if it's too slow." }
        ],
        officialResources: [
            { title: 'Spectrum Support', url: 'https://www.spectrum.net/support' },
            { title: 'Greenlight Networks Support', url: 'https://www.greenlightnetworks.com/support/' },
            { title: 'Netgear Support', url: 'https://www.netgear.com/support/' },
            { title: 'TP-Link Support', url: 'https://www.tp-link.com/us/support/' }
        ]
    },
    'accessories-peripherals': {
        title: 'Accessories',
        heroTitle: 'Accessories & Peripherals',
        quizLink: '/quizes/keyboard-mouse-quiz.html',
        quizName: 'Keyboard & Mouse Quiz',
        comparison: {
            title: "What's the Difference Between Wired & Wireless?",
            cards: [
                { title: 'Wired', description: 'Plugs directly into your computer. Very reliable, no batteries needed, but adds more cables to your desk.' },
                { title: 'Wireless', description: 'Connects via Bluetooth or a tiny USB plug. Keeps your desk clean and clutter-free, but requires occasional battery changes.' }
            ]
        },
        tip: 'For a primary desk setup, wireless accessories make for a much cleaner look. For travel, wired mice are often simpler as they never run out of power!',
        matchTitle: 'Find Productive Tools',
        matchDescription: 'The right keyboard or mouse can make using your computer much more comfortable. Take our quiz to find your fit.',
        helpItems: [
            { icon: '⌨️', title: 'Keyboard & Mouse Setup', description: "We'll help you connect your new accessories and show you how to customize buttons to work the way you want." },
            { icon: '🎧', title: 'Headphones & Speakers', description: "Get your Bluetooth headphones or desk speakers connected so you can enjoy music and clear audio on your calls." },
            { icon: '💾', title: 'External Storage & Backup', description: "Learn how to use external hard drives or thumb drives to save your important files and keep them safe." },
            { icon: '🔌', title: 'Cables & Adapters', description: "Not sure which cable goes where? We'll help you find the right adapters to connect your older devices to your new ones." }
        ],
        officialResources: [
            { title: 'Logitech Support', url: 'https://support.logi.com/' },
            { title: 'Microsoft Accessories Support', url: 'https://support.microsoft.com/accessories' },
            { title: 'Apple Accessories Support', url: 'https://support.apple.com/accessories' }
        ]
    }
}

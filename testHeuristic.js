function testHeuristics(type, brand, uaText) {
    const isMobileBrowser = /mobile|android|iphone|ipad|ipod/i.test(uaText);
    const isMac = /mac os x|macintosh/i.test(uaText);
    const isWindows = /windows nt/i.test(uaText);
    const isIOS = /iphone|ipad|ipod/i.test(uaText);
    
    // Default to true for unknown types to avoid false positives?
    const nonScannableTypes = ['printer', 'scanner', 'watch', 'smartwatch', 'wearable', 'security', 'camera', 'internet', 'router', 'modem', 'wifi', 'tv'];
    const isDesktopType = ['computer', 'laptop', 'desktop', 'mac', 'pc'].some(t => type.includes(t));
    const isMobileType = ['phone', 'smartphone', 'tablet', 'ipad'].some(t => type.includes(t));

    if (nonScannableTypes.some(t => type.includes(t))) {
        return `Scan refused: ${type}s cannot be scanned directly from the browser.`;
    } 
    if (isMobileBrowser && isDesktopType) {
        return "Scan refused: trying to scan desktop from mobile.";
    } 
    if (!isMobileBrowser && isMobileType) {
        return "Scan refused: trying to scan mobile from desktop.";
    } 
    
    const isAppleDevice = brand.includes('apple') || brand.includes('mac') || brand.includes('iphone') || brand.includes('ipad');
    if (isAppleDevice && !isMac && !isIOS) {
       return "Scan refused: trying to scan an Apple device from non-Apple OS.";
    } 
    
    const windowsBrands = ['dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'surface'];
    if (windowsBrands.some(b => brand.includes(b)) && !isWindows) {
        return `Scan refused: trying to scan a ${brand} device from non-Windows.`;
    }
    
    return "Allowed";
}

console.log("Laptop on phone: ", testHeuristics("laptop", "dell", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"));
console.log("Phone on desktop: ", testHeuristics("phone", "apple", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"));
console.log("Mac on Windows: ", testHeuristics("computer", "apple", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"));
console.log("Dell on Mac: ", testHeuristics("computer", "dell", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"));
console.log("Dell on Dell: ", testHeuristics("computer", "dell", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"));
console.log("Printer on Dell: ", testHeuristics("printer", "hp", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"));


import React from 'react'

interface BrandLogoProps {
  brand: string
  size?: number
  className?: string
}

const BrandLogo: React.FC<BrandLogoProps> = ({ brand, size = 24, className = "" }) => {
  const t = brand.toLowerCase()

  const logoMap: { [key: string]: string } = {
    'apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    'google': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
    'android': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg',
    'samsung': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    'microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    'dell': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg',
    'hp': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg',
    'lenovo': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg',
    'amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    'roku': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Roku_logo.svg',
    'fitbit': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Fitbit_logo.svg',
    'garmin': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Garmin_logo.svg',
    'ring': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Ring_logo.svg',
    'arlo': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Arlo_logo.svg',
    'epson': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Epson_logo.svg',
    'brother': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Brother_logo.svg',
    'canon': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Canon_logo.svg',
    'spectrum': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Spectrum_logo_2017.svg',
    'netgear': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Netgear_logo.svg',
    'tp-link': 'https://upload.wikimedia.org/wikipedia/commons/2/22/TP-Link_logo.svg',
    'logitech': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Logitech_logo.svg'
  }

  const matchingKey = Object.keys(logoMap).find(key => t.includes(key))

  if (matchingKey) {
    const isWide = ['samsung', 'dell', 'lenovo', 'amazon', 'roku', 'epson', 'brother', 'canon', 'spectrum', 'netgear', 'tp-link', 'logitech'].includes(matchingKey)
    return (
      <img
        src={logoMap[matchingKey]}
        style={{ width: isWide ? `${size * 2}px` : `${size}px`, height: `${size}px`, objectFit: 'contain' }}
        className={className}
        alt={`${matchingKey} logo`}
      />
    )
  }

  return (
    <div 
      className={`flex items-center justify-center bg-sst-primary text-white rounded-full font-bold shadow-inner ${className}`}
      style={{ width: `${size * 1.5}px`, height: `${size * 1.5}px`, fontSize: `${size * 0.7}px` }}
      aria-hidden="true"
    >
      {brand.charAt(0).toUpperCase()}
    </div>
  )
}

export default BrandLogo

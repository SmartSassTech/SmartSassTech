'use client'

import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

interface DeviceSlide {
    name: string
    img: string
    href: string
}

const slides: DeviceSlide[] = [
    { name: 'Laptops & Desktops', img: '/assets/images/Device Categories/Laptops & Desktops.jpg', href: '/expertise/laptops-desktops' },
    { name: 'Watches & Wearables', img: '/assets/images/Device Categories/Watches & Wearables.jpg', href: '/expertise/watches-wearables' },
    { name: 'Tablets & Phones', img: '/assets/images/Device Categories/Tablets & Phones.jpg', href: '/expertise/tablets-phones' },
    { name: 'TV & Streaming', img: '/assets/images/Device Categories/TV & Streaming.jpg', href: '/expertise/tv-streaming' },
    { name: 'Smart Home & Security', img: '/assets/images/Device Categories/Smart Home & Security.jpg', href: '/expertise/smart-home-security' },
    { name: 'Printers & Scanners', img: '/assets/images/Device Categories/Printers & Scanners.jpg', href: '/expertise/printers-scanners' },
    { name: 'WiFi & Networking', img: '/assets/images/Device Categories/WiFi & Networking.jpg', href: '/expertise/wifi-networking' },
    { name: 'Accessories', img: '/assets/images/Device Categories/Accessories & Peripherals.jpg', href: '/expertise/accessories-peripherals' },
]

export default function DeviceSlider() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const animationRef = useRef<number>()
    const scrollAmount = useRef<number>(0)

    // A smooth continuous scrolling implementation
    useEffect(() => {
        const track = scrollRef.current
        if (!track) return

        const scroll = () => {
            if (!isHovered && track) {
                track.scrollLeft += 0.5 // Adjust this value to change speed (lower = slower)

                // If we've scrolled past the first set of items, snap back to the start seamlessly
                if (track.scrollLeft >= track.scrollWidth / 2) {
                    track.scrollLeft = 0
                }
            }
            animationRef.current = requestAnimationFrame(scroll)
        }

        animationRef.current = requestAnimationFrame(scroll)

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [isHovered])

    const handleManualScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollDistance = 320 // Width of one card
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollDistance : scrollDistance,
                behavior: 'smooth'
            })
        }
    }

    // Duplicate slides for seamless loop
    const doubledSlides = [...slides, ...slides]

    return (
        <div
            className="continuous-slider-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
        >
            <button
                className="slim-arrow left-arrow"
                onClick={() => handleManualScroll('left')}
                aria-label="Scroll Left"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>

            <div className="continuous-slider-track" ref={scrollRef}>
                {doubledSlides.map((slide, idx) => (
                    <Link
                        key={idx}
                        href={slide.href}
                        className="continuous-slide"
                        aria-label={slide.name}
                    >
                        <div className="device-slide-card">
                            <img src={slide.img} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    </Link>
                ))}
            </div>

            <button
                className="slim-arrow right-arrow"
                onClick={() => handleManualScroll('right')}
                aria-label="Scroll Right"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
    )
}

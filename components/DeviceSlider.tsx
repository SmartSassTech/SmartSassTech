'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
    const [currentIndex, setCurrentIndex] = useState(0)
    const [slidesPerView, setSlidesPerView] = useState(3)
    const [isPaused, setIsPaused] = useState(false)
    const trackRef = useRef<HTMLDivElement>(null)
    const totalSlides = slides.length

    const updateSlidesPerView = useCallback(() => {
        const width = window.innerWidth
        if (width < 768) setSlidesPerView(1.2)
        else if (width < 1024) setSlidesPerView(2.2)
        else if (width < 1440) setSlidesPerView(2.8)
        else if (width < 1920) setSlidesPerView(3.8)
        else setSlidesPerView(4.8)
    }, [])

    useEffect(() => {
        updateSlidesPerView()
        window.addEventListener('resize', updateSlidesPerView)
        return () => window.removeEventListener('resize', updateSlidesPerView)
    }, [updateSlidesPerView])

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => {
            const next = prev + 1
            if (next > totalSlides - Math.floor(slidesPerView)) return 0
            return next
        })
    }, [totalSlides, slidesPerView])

    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => {
            const next = prev - 1
            if (next < 0) return Math.max(0, totalSlides - Math.floor(slidesPerView))
            return next
        })
    }, [totalSlides, slidesPerView])

    useEffect(() => {
        if (isPaused) return
        const interval = setInterval(nextSlide, 5000)
        return () => clearInterval(interval)
    }, [nextSlide, isPaused])

    const slideWidth = 100 / slidesPerView
    const offset = -currentIndex * slideWidth

    return (
        <div className="section" style={{ backgroundColor: 'transparent', padding: 'var(--spacing-lg) 0' }}>
            <div className="container relative">
                <button
                    onClick={prevSlide}
                    className="slider-arrow slider-arrow-prev"
                    aria-label="Previous device category"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <div
                    className="device-slider"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="slider-track"
                        style={{
                            transform: `translateX(${offset}%)`,
                            transition: 'transform 0.5s ease-in-out',
                            display: 'flex',
                            gap: '24px' // var(--spacing-lg)
                        }}
                    >
                        {slides.map((slide, idx) => (
                            <Link
                                key={idx}
                                href={slide.href}
                                className="device-slide"
                                style={{ flex: `0 0 calc(${slideWidth}% - 24px)` }}
                            >
                                <div className="device-slide-card">
                                    <img src={slide.img} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <button
                    onClick={nextSlide}
                    className="slider-arrow slider-arrow-next"
                    aria-label="Next device category"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    )
}

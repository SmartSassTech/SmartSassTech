'use client';

import React from 'react';
import Link from 'next/link';
import { EXPERTISE_DATA } from '@/lib/expertise-data';
import { 
  Laptop, 
  Smartphone, 
  Watch, 
  Tv, 
  Speaker, 
  Cpu,
  Search,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Printer,
  Wifi,
  ShieldCheck
} from 'lucide-react';

export default function ExpertisePage() {
  const categories = Object.keys(EXPERTISE_DATA).map(key => ({
    id: key,
    ...EXPERTISE_DATA[key as keyof typeof EXPERTISE_DATA]
  }));

  const getIcon = (key: string) => {
    switch(key) {
      case 'laptops-desktops': return <Laptop className="text-sst-primary" />;
      case 'tablets-phones': return <Smartphone className="text-sst-primary" />;
      case 'watches-wearables': return <Watch className="text-sst-primary" />;
      case 'tv-streaming': return <Tv className="text-sst-primary" />;
      case 'smart-home-security': return <ShieldCheck className="text-sst-primary" />;
      case 'printers-scanners': return <Printer className="text-sst-primary" />;
      case 'wifi-networking': return <Wifi className="text-sst-primary" />;
      case 'accessories-peripherals': return <Speaker className="text-sst-primary" />;
      default: return <BookOpen className="text-sst-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-kb-bg">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-kb-navy mb-4 tracking-tight">Knowledge Base</h1>
          <p className="text-kb-dark text-lg max-w-2xl mx-auto">
            Everything you need to master your technology. Expert guides, troubleshooting, and official resources.
          </p>
          
          <div className="mt-10 max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search for guides, devices, or issues..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-kb-pale shadow-sm focus:ring-2 focus:ring-sst-primary focus:border-transparent outline-none text-kb-navy"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-kb-muted" size={20} />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/expertise/${category.id}`}
              className="group bg-white rounded-3xl p-8 border border-kb-pale shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              <div className="w-14 h-14 bg-kb-bg rounded-2xl flex items-center justify-center mb-6 group-hover:bg-kb-pale transition-colors">
                {React.cloneElement(getIcon(category.id) as React.ReactElement, { size: 28 })}
              </div>
              
              <h2 className="text-2xl font-bold text-kb-navy mb-3 group-hover:text-sst-primary transition-colors">
                {category.title}
              </h2>
              
              <p className="text-kb-dark mb-6 flex-grow">
                {category.heroTitle}
              </p>
              
              <div className="flex items-center gap-2 text-sst-primary font-bold">
                Browse Guides <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Popular Articles Preview */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-kb-navy mb-8 flex items-center gap-2">
            <BookOpen className="text-sst-primary" size={24} /> Popular Resources
          </h2>
          <div className="bg-white rounded-3xl border border-kb-pale shadow-sm divide-y divide-kb-bg overflow-hidden">
            {[
              { title: "Essential MacBook Maintenance Guide", cat: "Laptops" },
              { title: "Optimizing iPhone Battery Life", cat: "Phones" },
              { title: "Setting up your Smart Home Hub", cat: "Smart Home" }
            ].map((item, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between hover:bg-kb-bg/50 transition-colors cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-sst-secondary uppercase tracking-widest mb-1">{item.cat}</span>
                  <span className="text-lg font-bold text-kb-navy group-hover:text-sst-primary transition-colors">{item.title}</span>
                </div>
                <ChevronRight size={20} className="text-kb-muted group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

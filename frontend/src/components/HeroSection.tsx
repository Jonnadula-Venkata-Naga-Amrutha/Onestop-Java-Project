import { Language } from '../data/translations';
import { NLPSearchResult } from '../services/aiEngine';
import NLPSearchBar from './NLPSearchBar';
import Card3D from './Card3D';
import ThreeHeroCanvas from './ThreeHeroCanvas';
import { ShieldCheck, Clock, Award, Star, ArrowUpRight, Zap } from 'lucide-react';

interface HeroSectionProps {
  lang: Language;
  onSearch: (result: NLPSearchResult) => void;
  onExplore: () => void;
  onEmergency: () => void;
}

export default function HeroSection({
  lang,
  onSearch,
  onExplore,
  onEmergency,
}: HeroSectionProps) {
  return (
    <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden border-b border-[#173D32]/10 bg-gradient-to-b from-[#F7F5EF] via-[#F7F5EF] to-[#EDE9DE]/50">
      {/* Three.js 3D Background */}
      <ThreeHeroCanvas />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch">
          
          {/* Left Column: Editorial Headline & Search (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Editorial Category Kicker (Quiet Unboxed Text) */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#173D32] tracking-wider uppercase mb-3">
              <span>Local Trust</span>
              <span aria-hidden="true">·</span>
              <span>Intelligent Technology</span>
              <span aria-hidden="true">·</span>
              <span>Andhra & Telangana</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#173D32] leading-[1.12] mb-6 [text-wrap:balance]">
              {lang === 'en'
                ? 'The right local expert. Right when you need one.'
                : 'మీకు అవసరమైన సరైన నిపుణుడు. సరైన సమయానికి.'}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#252A28]/80 leading-relaxed max-w-xl mb-8">
              {lang === 'en'
                ? 'Directly discover, compare quotations, and book government-verified electricians, plumbers, academic tutors, and master craftsmen with transparent pricing and zero markups.'
                : 'ధృవీకరించబడిన ఎలక్ట్రీషియన్లు, ప్లంబర్లు, ట్యూటర్లు మరియు సాంకేతిక నిపుణులతో పారదర్శకమైన కొటేషన్లు మరియు నేరుగా బుకింగ్ సౌకర్యం.'}
            </p>

            {/* Natural Language Search Input */}
            <div className="mb-8">
              <NLPSearchBar onSearch={onSearch} lang={lang} />
            </div>

            {/* Quick Guarantees (Clean unboxed metadata) */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-[#252A28]/70 pt-2 border-t border-[#173D32]/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#173D32]" />
                <span className="font-medium">100% Trade License Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#173D32]" />
                <span className="font-medium">45-Minute Emergency Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#173D32]" />
                <span className="font-medium">Direct Provider Quotations</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Visual Focal Carrier (5 Cols) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <Card3D className="w-full max-w-md lg:max-w-none rounded-3xl overflow-hidden bg-white shadow-2xl shadow-[#173D32]/15 border border-[#173D32]/15 group">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-stone-200">
                <img
                  src="/src/assets/images/hero_craftsman_service_1792931705892.jpg"
                  alt="Master craftsman in workshop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Live SOS Chip Badge */}
                <div className="absolute top-4 right-4 bg-[#C84C4C] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>SOS On-Call Dispatch</span>
                </div>

                {/* Floating Artisan Spotlight */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs uppercase tracking-wider text-[#D6B779] font-semibold mb-1">
                    Featured Master Artisan
                  </div>
                  <div className="text-xl font-bold font-serif-heading">Rajesh Kumar & Partners</div>
                  <div className="flex items-center gap-3 text-xs text-white/90 mt-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#D6B779] text-[#D6B779]" />
                      <strong className="text-white">4.9 / 5.0</strong> (148 reviews)
                    </span>
                    <span>·</span>
                    <span>Grade-A Electrical Contractor</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action Strip */}
              <div className="p-4 bg-white flex items-center justify-between text-xs border-t border-gray-100">
                <div>
                  <div className="text-gray-500">Service Coverage</div>
                  <div className="font-semibold text-[#173D32]">Vijayawada · Hyderabad · Vizag</div>
                </div>
                <button
                  onClick={onExplore}
                  className="flex items-center gap-1 font-semibold text-[#173D32] hover:text-[#102B25] group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Browse Directory</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </Card3D>
          </div>

        </div>

        {/* 4-Column KPI Proof Strip (Full width row below the hero split) */}
        <div className="mt-14 pt-8 border-t border-[#173D32]/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white/60 border border-[#173D32]/10 shadow-sm backdrop-blur-xs">
            <div className="text-3xl font-bold font-serif-heading text-[#173D32] tabular-nums">1,240+</div>
            <div className="text-xs text-[#252A28]/70 mt-1 font-medium">Verified Jobs Completed</div>
          </div>
          <div className="p-4 rounded-xl bg-white/60 border border-[#173D32]/10 shadow-sm backdrop-blur-xs">
            <div className="text-3xl font-bold font-serif-heading text-[#173D32] tabular-nums">99.4%</div>
            <div className="text-xs text-[#252A28]/70 mt-1 font-medium">On-Time Arrival Rate</div>
          </div>
          <div className="p-4 rounded-xl bg-white/60 border border-[#173D32]/10 shadow-sm backdrop-blur-xs">
            <div className="text-3xl font-bold font-serif-heading text-[#173D32] tabular-nums">4.92★</div>
            <div className="text-xs text-[#252A28]/70 mt-1 font-medium">Average Customer Rating</div>
          </div>
          <div className="p-4 rounded-xl bg-white/60 border border-[#173D32]/10 shadow-sm backdrop-blur-xs">
            <div className="text-3xl font-bold font-serif-heading text-[#173D32] tabular-nums">100%</div>
            <div className="text-xs text-[#252A28]/70 mt-1 font-medium">Vetted Government Licenses</div>
          </div>
        </div>

      </div>
    </section>
  );
}

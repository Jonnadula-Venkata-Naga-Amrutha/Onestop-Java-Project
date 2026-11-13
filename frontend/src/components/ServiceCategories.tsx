import { ServiceCategory } from '../types';
import { Language } from '../data/translations';
import Card3D from './Card3D';
import {
  Zap,
  Wrench,
  GraduationCap,
  Hammer,
  Tv,
  Sparkles,
  Paintbrush,
  Car,
  ArrowRight
} from 'lucide-react';

interface ServiceCategoriesProps {
  categories: ServiceCategory[];
  lang: Language;
  onSelectCategory: (categoryCode: string) => void;
}

export default function ServiceCategories({
  categories,
  lang,
  onSelectCategory,
}: ServiceCategoriesProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Zap': return <Zap className="w-5 h-5 text-[#D6B779]" />;
      case 'Wrench': return <Wrench className="w-5 h-5 text-[#D6B779]" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-[#D6B779]" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-[#D6B779]" />;
      case 'Tv': return <Tv className="w-5 h-5 text-[#D6B779]" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-[#D6B779]" />;
      case 'Paintbrush': return <Paintbrush className="w-5 h-5 text-[#D6B779]" />;
      case 'Car': return <Car className="w-5 h-5 text-[#D6B779]" />;
      default: return <Wrench className="w-5 h-5 text-[#D6B779]" />;
    }
  };

  return (
    <section className="py-16 bg-[#F7F5EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#173D32]/10 gap-4">
          <div>
            <div className="text-xs font-semibold text-[#173D32] tracking-wider uppercase mb-1">
              {lang === 'en' ? 'Domain Specialties' : 'సేవా విభాగాలు'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#173D32]">
              {lang === 'en' ? 'Curated Local Service Categories' : 'విశ్వసనీయ స్థానిక సేవలు'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#777F79] max-w-md">
            {lang === 'en'
              ? 'Every trade artisan is vetted for safety, government licensing, and peer-reviewed workmanship.'
              : 'ప్రతి సేవా నిపుణుడు ప్రభుత్వ ధృవీకరణ మరియు నైపుణ్య పరీక్షల తర్వాత మాత్రమే నమోదు చేయబడతారు.'}
          </p>
        </div>

        {/* Categories Grid (Asymmetric layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Card3D
              key={cat.id}
              onClick={() => onSelectCategory(cat.code)}
              className="group bg-white rounded-2xl border border-[#173D32]/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                <img
                  src={cat.imageUrl}
                  alt={cat.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-[#173D32]/90 backdrop-blur-xs flex items-center justify-center shadow-md">
                  {getIcon(cat.iconName)}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base leading-snug">
                    {lang === 'en' ? cat.nameEn : cat.nameTe}
                  </h3>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#252A28]/70 line-clamp-2 mb-4 leading-relaxed">
                  {cat.description}
                </p>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400">From</span>{' '}
                    <strong className="text-[#173D32] tabular-nums font-semibold">
                      ₹{cat.baseEstimate}
                    </strong>
                  </div>
                  <span className="flex items-center gap-1 font-semibold text-[#173D32] group-hover:translate-x-1 transition-transform">
                    <span>{lang === 'en' ? 'Book' : 'బుక్'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Card3D>
          ))}
        </div>

      </div>
    </section>
  );
}

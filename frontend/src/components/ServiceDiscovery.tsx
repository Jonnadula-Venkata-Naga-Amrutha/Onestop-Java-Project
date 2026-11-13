import { useState, useMemo } from 'react';
import { ProviderProfile, ServiceCategory } from '../types';
import { Language } from '../data/translations';
import ProviderCard from './ProviderCard';
import { Search, Filter, ShieldCheck, Zap, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface ServiceDiscoveryProps {
  providers: ProviderProfile[];
  categories: ServiceCategory[];
  lang: Language;
  initialCategory?: string;
  initialCity?: string;
  initialBudget?: number;
  initialUrgent?: boolean;
  onBook: (provider: ProviderProfile) => void;
  onRequestQuote: (provider: ProviderProfile) => void;
  onViewProfile: (provider: ProviderProfile) => void;
}

export default function ServiceDiscovery({
  providers,
  categories,
  lang,
  initialCategory = '',
  initialCity = '',
  initialBudget,
  initialUrgent = false,
  onBook,
  onRequestQuote,
  onViewProfile,
}: ServiceDiscoveryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(initialUrgent);
  const [maxPrice, setMaxPrice] = useState<number>(initialBudget || 1000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'priceAsc' | 'experience'>('relevance');

  // Filtered and sorted providers
  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => {
        if (selectedCategory && !p.serviceCategories.includes(selectedCategory)) {
          return false;
        }
        if (selectedCity && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
        if (onlyVerified && !p.isVerified) {
          return false;
        }
        if (onlyEmergency && !p.emergencyAvailable) {
          return false;
        }
        if (p.baseHourlyRate > maxPrice) {
          return false;
        }
        if (p.ratingAvg < minRating) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.fullName.toLowerCase().includes(q);
          const matchBiz = p.businessName.toLowerCase().includes(q);
          const matchBio = p.bio.toLowerCase().includes(q);
          const matchLoc = p.localities.some(l => l.toLowerCase().includes(q));
          if (!matchName && !matchBiz && !matchBio && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
        if (sortBy === 'priceAsc') return a.baseHourlyRate - b.baseHourlyRate;
        if (sortBy === 'experience') return b.yearsExperience - a.yearsExperience;
        // Default relevance / completed jobs
        return b.completedJobsCount - a.completedJobsCount;
      });
  }, [
    providers,
    selectedCategory,
    selectedCity,
    searchQuery,
    onlyVerified,
    onlyEmergency,
    maxPrice,
    minRating,
    sortBy,
  ]);

  return (
    <div className="py-10 bg-[#F7F5EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8 pb-4 border-b border-[#173D32]/10">
          <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
            Directory & Discovery
          </div>
          <h1 className="text-3xl font-bold font-serif-heading text-[#173D32]">
            Discover Verified Local Specialists
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Browse government licensed technicians across Andhra Pradesh and Telangana.
          </p>
        </div>

        {/* Filter Controls Strip */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, locality, or skill..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 focus:border-[#173D32] bg-white text-xs"
              >
                <option value="">All Service Domains</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 focus:border-[#173D32] bg-white text-xs"
              >
                <option value="">All Cities</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Guntur">Guntur</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 focus:border-[#173D32] bg-white text-xs"
              >
                <option value="relevance">Sort: Most Popular / Jobs</option>
                <option value="rating">Sort: Highest Rating (★)</option>
                <option value="priceAsc">Sort: Lowest Hourly Rate (₹)</option>
                <option value="experience">Sort: Years Experience</option>
              </select>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#173D32]"
                />
                <span className="font-semibold text-gray-700">Verified Trade License Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyEmergency}
                  onChange={(e) => setOnlyEmergency(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#C84C4C]"
                />
                <span className="font-semibold text-red-700">🚨 Emergency SOS Dispatch Available</span>
              </label>
            </div>

            {/* Price slider */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Max Rate:</span>
              <span className="font-mono-code font-bold text-[#173D32]">₹{maxPrice}/hr</span>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-28 accent-[#173D32]"
              />
            </div>
          </div>
        </div>

        {/* Results Count & Meta */}
        <div className="mb-6 flex items-center justify-between text-xs text-gray-600">
          <div>
            Showing <strong className="text-gray-900">{filteredProviders.length}</strong> matching professionals
          </div>
          {(selectedCategory || selectedCity || onlyVerified || onlyEmergency) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedCity('');
                setOnlyVerified(false);
                setOnlyEmergency(false);
                setMaxPrice(1000);
                setSearchQuery('');
              }}
              className="text-[#173D32] hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Provider Cards Grid */}
        {filteredProviders.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No matching professionals found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
              Try adjusting your price ceiling, removing the emergency requirement, or searching another city.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedCity('');
                setOnlyEmergency(false);
                setMaxPrice(1500);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#173D32] rounded-xl"
            >
              Show All Providers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((prov) => (
              <ProviderCard
                key={prov.id}
                provider={prov}
                lang={lang}
                onBook={onBook}
                onRequestQuote={onRequestQuote}
                onViewProfile={onViewProfile}
                filterCriteria={{
                  categoryCode: selectedCategory,
                  city: selectedCity,
                  targetBudget: maxPrice,
                  isUrgent: onlyEmergency,
                }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

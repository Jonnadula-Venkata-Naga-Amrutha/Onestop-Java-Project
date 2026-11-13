import { useState } from 'react';
import { Search, Sparkles, MapPin, Tag, Clock, ArrowRight } from 'lucide-react';
import { OneStopAIEngine, NLPSearchResult } from '../services/aiEngine';
import { Language } from '../data/translations';

interface NLPSearchBarProps {
  onSearch: (results: NLPSearchResult) => void;
  lang: Language;
}

export default function NLPSearchBar({ onSearch, lang }: NLPSearchBarProps) {
  const [query, setQuery] = useState('');
  const [nlpParsed, setNlpParsed] = useState<NLPSearchResult | null>(null);

  const sampleQueries = [
    'Affordable electrician near Vijayawada tomorrow evening',
    'Urgent plumber for water pipe leak in Hyderabad',
    'CBSE math tutor in Madhapur under 700',
    'Teak wood carpenter in Visakhapatnam',
  ];

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim().length > 3) {
      const parsed = OneStopAIEngine.parseNaturalLanguageQuery(val);
      setNlpParsed(parsed);
    } else {
      setNlpParsed(null);
    }
  };

  const handleExecute = (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim()) return;
    const parsed = OneStopAIEngine.parseNaturalLanguageQuery(q);
    setNlpParsed(parsed);
    onSearch(parsed);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Bar Input Container */}
      <div className="relative bg-white rounded-2xl shadow-xl shadow-[#173D32]/5 border border-[#173D32]/15 p-2 sm:p-2.5 transition-all focus-within:border-[#173D32] focus-within:ring-2 focus-within:ring-[#173D32]/20">
        <div className="flex items-center gap-3">
          <div className="pl-3 text-[#173D32]/60">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder={
              lang === 'en'
                ? 'Try: "Affordable electrician near Vijayawada tomorrow evening"...'
                : 'ఉదా: "రేపు సాయంత్రం విజయవాడలో ఎలక్ట్రీషియన్ కావాలి"...'
            }
            className="w-full bg-transparent text-sm sm:text-base text-[#252A28] placeholder-[#777F79] focus:outline-none"
          />
          <button
            onClick={() => handleExecute()}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#173D32] hover:bg-[#102B25] text-white font-medium text-xs sm:text-sm shrink-0 transition-transform active:scale-95 shadow-sm"
          >
            <span>{lang === 'en' ? 'Smart Search' : 'శోధన'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time NLP Parsed Chips */}
        {nlpParsed && (nlpParsed.extractedCategory || nlpParsed.extractedCity || nlpParsed.maxBudget || nlpParsed.isUrgent) && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 px-3 text-xs">
            <div className="flex items-center gap-1 text-[#173D32] font-semibold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D6B779]" />
              <span>Parsed Intent:</span>
            </div>

            {nlpParsed.extractedCategory && (
              <span className="inline-flex items-center gap-1 bg-[#173D32]/5 text-[#173D32] px-2.5 py-1 rounded-md font-medium">
                <Tag className="w-3 h-3 text-[#173D32]" />
                {nlpParsed.extractedCategory}
              </span>
            )}

            {nlpParsed.extractedCity && (
              <span className="inline-flex items-center gap-1 bg-[#A7BDA9]/20 text-[#173D32] px-2.5 py-1 rounded-md font-medium">
                <MapPin className="w-3 h-3 text-[#173D32]" />
                {nlpParsed.extractedCity}
              </span>
            )}

            {nlpParsed.maxBudget && (
              <span className="inline-flex items-center gap-1 bg-[#D6B779]/20 text-[#252A28] px-2.5 py-1 rounded-md font-medium">
                Max ₹{nlpParsed.maxBudget}
              </span>
            )}

            {nlpParsed.isUrgent ? (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-1 rounded-md font-semibold">
                🚨 Emergency Dispatch
              </span>
            ) : (
              nlpParsed.timePreference && (
                <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  {nlpParsed.timePreference}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-[#777F79]">
        <span className="font-medium text-[#252A28]/70">Examples:</span>
        {sampleQueries.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(sample);
              handleExecute(sample);
            }}
            className="hover:text-[#173D32] hover:underline underline-offset-2 transition-colors cursor-pointer text-left"
          >
            "{sample}" {idx < sampleQueries.length - 1 ? '·' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

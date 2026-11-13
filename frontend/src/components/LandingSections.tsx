import { useState } from 'react';
import { Language } from '../data/translations';
import { Review } from '../types';
import { ShieldCheck, Search, FileText, CheckCircle2, ChevronDown, Star, Sparkles } from 'lucide-react';

interface LandingSectionsProps {
  lang: Language;
  reviews: Review[];
  onExplore: () => void;
  onOpenJavaCode: () => void;
}

export default function LandingSections({
  lang,
  reviews,
  onExplore,
  onOpenJavaCode,
}: LandingSectionsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does OneStop verify local service professionals?',
      a: 'Every provider must submit their municipal trade license, government ID (Aadhaar / GST / Electrical Grade License), and undergo criminal record review before the verified badge is granted by administrators in MySQL.',
    },
    {
      q: 'How does the transparent quotation comparison work?',
      a: 'Instead of estimated opaque rates, multiple suitable local pros can submit itemized quotations detailing labor charges, estimated materials, and validity periods. You compare and award the booking to your chosen craftsman.',
    },
    {
      q: 'How does Emergency SOS dispatch operate?',
      a: 'When an emergency leak, short circuit, or lock hazard occurs, our rapid dispatch flags certified on-call providers in your municipal ward for arrival within 30–45 minutes with upfront emergency fee transparency.',
    },
    {
      q: 'Why does OneStop use Core Java + JDBC rather than Spring Boot?',
      a: 'OneStop is intentionally engineered on Core Java Servlets and JDBC PreparedStatements with HikariCP. This eliminates heavy framework magic, memory bloat, and provides predictable high-concurrency throughput and ACID transaction integrity.',
    },
    {
      q: 'Are client reviews restricted to completed bookings?',
      a: 'Yes! A customer can only submit a review after the provider marks the booking as COMPLETED. Database unique constraints prevent duplicate reviews or fake ratings.',
    },
  ];

  return (
    <div>
      {/* 1. How It Works Section */}
      <section className="py-20 bg-white border-b border-[#173D32]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-2">
              Simple 4-Step Process
            </div>
            <h2 className="text-3xl font-bold font-serif-heading text-[#173D32]">
              How OneStop Works
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              From discovering local certified artisans to receiving itemized quotations and guaranteed completion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 relative group hover:border-[#173D32]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#173D32] text-[#D6B779] flex items-center justify-center font-serif-heading font-bold text-lg mb-4 shadow-sm">
                01
              </div>
              <h3 className="font-bold text-base text-[#173D32] mb-2">
                1. Describe Your Need
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Type natural requirements like "leak in bathroom" or select a category. Our rule-based parser pinpoints the trade.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 relative group hover:border-[#173D32]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#173D32] text-[#D6B779] flex items-center justify-center font-serif-heading font-bold text-lg mb-4 shadow-sm">
                02
              </div>
              <h3 className="font-bold text-base text-[#173D32] mb-2">
                2. AI Provider Matching
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Our transparent 6-factor algorithm ranks certified pros based on proximity, rates, and validated reviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 relative group hover:border-[#173D32]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#173D32] text-[#D6B779] flex items-center justify-center font-serif-heading font-bold text-lg mb-4 shadow-sm">
                03
              </div>
              <h3 className="font-bold text-base text-[#173D32] mb-2">
                3. Compare Quotations
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Receive itemized labor and parts quotes. Select the expert who fits your schedule and budget.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 relative group hover:border-[#173D32]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#173D32] text-[#D6B779] flex items-center justify-center font-serif-heading font-bold text-lg mb-4 shadow-sm">
                04
              </div>
              <h3 className="font-bold text-base text-[#173D32] mb-2">
                4. Quality Job Delivery
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Track technician arrival in real-time, inspect completed workmanship, and release review feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust & Verification Guarantee */}
      <section className="py-20 bg-[#173D32] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="text-xs font-semibold text-[#D6B779] uppercase tracking-wider mb-2">
                Uncompromising Trust & Standards
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif-heading leading-tight mb-6">
                Direct Local Craftsmanship with Government License Verification
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed mb-8 max-w-xl">
                Unlike unverified aggregator directories, every professional on OneStop is manually reviewed with verified Aadhaar, trade licenses, and background checks. No middlemen, no unexpected surge multipliers.
              </p>

              <div className="space-y-4 text-xs text-stone-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#D6B779]/20 flex items-center justify-center text-[#D6B779] shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">State Electrical & Plumbing Licensing</strong>
                    Contractors are verified with state inspectorate numbers before receiving the green badge.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#D6B779]/20 flex items-center justify-center text-[#D6B779] shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">Audited Quotations & Transparent Receipts</strong>
                    Every rupee in labor and hardware parts is recorded for auditability and GST compliance.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#D6B779]/20 flex items-center justify-center text-[#D6B779] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">100% Verified Customer Reviews</strong>
                    Only customers with closed, completed bookings in MySQL can leave ratings. Zero spam.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                <div className="text-[#D6B779] font-mono-code text-xs uppercase tracking-wider mb-2">
                  System Architecture Guarantee
                </div>
                <h3 className="text-xl font-bold font-serif-heading mb-4 text-white">
                  Zero Framework Overhead
                </h3>
                <p className="text-stone-300 text-xs leading-relaxed mb-6">
                  Engineered with pure Core Java Servlets, PreparedStatements, and normalized MySQL tables. Experience rock-solid reliability without unpredictable framework updates.
                </p>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono-code text-[11px] text-stone-300 space-y-1.5 mb-6">
                  <div>// ACID Transaction Sample</div>
                  <div className="text-emerald-400">conn.setAutoCommit(false);</div>
                  <div className="text-stone-400">stmt1.executeUpdate(); // booking</div>
                  <div className="text-stone-400">stmt2.executeUpdate(); // audit log</div>
                  <div className="text-emerald-400">conn.commit();</div>
                </div>

                <button
                  onClick={onOpenJavaCode}
                  className="w-full py-3 rounded-xl bg-[#D6B779] hover:bg-[#c4a465] text-[#173D32] font-bold text-xs transition-colors shadow-sm"
                >
                  Inspect Java Backend Architecture
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Customer Reviews Section */}
      <section className="py-20 bg-[#F7F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-2">
              Real Client Experiences
            </div>
            <h2 className="text-3xl font-bold font-serif-heading text-[#173D32]">
              Customer Reviews from MySQL Database
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Every review below is bound to a verified completed booking reference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-6 rounded-2xl bg-white border border-[#173D32]/10 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D6B779] text-[#D6B779]" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic mb-4">
                    "{r.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{r.customerName}</div>
                    <div className="text-[11px] text-gray-400">Verified Booking</div>
                  </div>
                  <div className="text-[11px] font-mono-code text-[#173D32]">
                    5.0★ Service
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordion */}
      <section className="py-20 bg-white border-t border-[#173D32]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
              Common Inquiries
            </div>
            <h2 className="text-3xl font-bold font-serif-heading text-[#173D32]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-[#173D32] flex items-center justify-between bg-white hover:bg-stone-50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#173D32]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-gray-600 leading-relaxed bg-white border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Quiet Footer */}
      <footer className="bg-[#102B25] text-stone-300 py-12 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/10">
            <div>
              <div className="font-brand font-bold text-xl text-white mb-2">
                OneStop
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Smart local services platform connecting customers with trusted tradespeople via Core Java, JDBC, and transparent AI matching.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Service Sectors</div>
              <ul className="space-y-1.5 text-stone-400">
                <li>Electrician & Wiring</li>
                <li>HydroTech Plumbing</li>
                <li>STEM & Academic Tutoring</li>
                <li>Custom Teak Carpentry</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Regional Hubs</div>
              <ul className="space-y-1.5 text-stone-400">
                <li>Vijayawada (Benz Circle)</li>
                <li>Hyderabad (Madhapur & Gachibowli)</li>
                <li>Visakhapatnam (MVP Colony)</li>
                <li>Guntur Central</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Architecture & Standards</div>
              <p className="text-stone-400 mb-3">
                Built with Core Java Servlets, HikariCP, and MySQL onestop_db. Zero Spring Boot / ORM bloat.
              </p>
              <button
                onClick={onOpenJavaCode}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#D6B779] rounded-lg font-mono-code text-[11px]"
              >
                Inspect DAO Source
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
            <div>
              © 2026 OneStop Platform. All rights reserved.
            </div>
            <div>
              English & Telugu (తెలుగు) Multilingual Local Infrastructure
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { X, Sparkles, Send, Bot, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../data/translations';
import { OneStopAIEngine } from '../services/aiEngine';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  suggestedAction?: {
    label: string;
    action: () => void;
  };
}

interface SmartAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectCategory: (code: string) => void;
  onOpenEmergency: () => void;
  onOpenJavaCode: () => void;
}

export default function SmartAssistantDrawer({
  isOpen,
  onClose,
  lang,
  onSelectCategory,
  onOpenEmergency,
  onOpenJavaCode,
}: SmartAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: lang === 'en'
        ? "Hello! I am your OneStop Smart Service Assistant. Describe what is broken, leaking, or what tutoring you need, and I'll identify the right expert, diagnostic estimate, and safety instructions."
        : 'నమస్కారం! నేను మీ వన్ స్టాప్ స్మార్ట్ అసిస్టెంట్. మీ సమస్యను వివరించండి, నేను సరైన నిపుణుడిని మరియు ఖర్చు అంచనాను తెలియజేస్తాను.',
    },
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    const newMessages: Message[] = [...messages, { sender: 'user', text: userText }];

    // Intelligent diagnosis logic
    const parsed = OneStopAIEngine.parseNaturalLanguageQuery(userText);
    let replyText = '';
    let suggestedAction: { label: string; action: () => void } | undefined = undefined;

    if (parsed.isUrgent) {
      replyText = `⚠️ I detected an urgent emergency condition! Please cut off main power/water valve immediately if leaking. Emergency rapid dispatch is available with 45-minute on-site arrival.`;
      suggestedAction = {
        label: 'Launch Emergency SOS Dispatch',
        action: () => {
          onClose();
          onOpenEmergency();
        },
      };
    } else if (parsed.extractedCategory === 'ELECTRICIAN') {
      const guide = OneStopAIEngine.getPriceGuidance('ELECTRICIAN');
      replyText = `Based on your electrical symptoms, you need a certified Electrician. Common causes include breaker load imbalance or loose neutral. Typical diagnostic fee: ₹${guide.minPrice} - ₹${guide.medianPrice}. We have verified Grade-A contractors ready in your city.`;
      suggestedAction = {
        label: 'View Verified Electricians',
        action: () => {
          onClose();
          onSelectCategory('ELECTRICIAN');
        },
      };
    } else if (parsed.extractedCategory === 'PLUMBER') {
      const guide = OneStopAIEngine.getPriceGuidance('PLUMBER');
      replyText = `This indicates a plumbing or water pipeline issue. Avoid using corrosive chemical drain openers on copper pipes. Standard repair cost ranges from ₹${guide.minPrice} to ₹${guide.medianPrice}.`;
      suggestedAction = {
        label: 'View HydroTech Plumbers',
        action: () => {
          onClose();
          onSelectCategory('PLUMBER');
        },
      };
    } else if (parsed.extractedCategory === 'TUTOR') {
      replyText = `Looking for academic tutoring? Our verified educators specialize in CBSE/ICSE curriculum and competitive STEM prep with personalized 1-on-1 pacing.`;
      suggestedAction = {
        label: 'Browse Academic Tutors',
        action: () => {
          onClose();
          onSelectCategory('TUTOR');
        },
      };
    } else if (userText.toLowerCase().includes('java') || userText.toLowerCase().includes('jdbc') || userText.toLowerCase().includes('backend')) {
      replyText = `OneStop is engineered with a strict Core Java + JDBC + MySQL architecture: 19 normalized relational tables, zero Spring Boot or ORM overhead, pure Servlets, Hikari connection pooling, and PreparedStatement security.`;
      suggestedAction = {
        label: 'Inspect Java Architecture & DAOs',
        action: () => {
          onClose();
          onOpenJavaCode();
        },
      };
    } else {
      replyText = `I understand: "${userText}". To connect you with the right specialist, please specify if you need electrical repairs, plumbing, tutoring, carpentry, painting, or cleaning.`;
    }

    newMessages.push({ sender: 'ai', text: replyText, suggestedAction });
    setMessages(newMessages);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#173D32] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D6B779]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">OneStop Smart Assistant</h3>
              <p className="text-[11px] text-stone-300">Intelligent Service Triage & Pricing</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#173D32] text-[#D6B779] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#173D32] text-white rounded-tr-none'
                    : 'bg-[#F7F5EF] text-[#252A28] border border-[#173D32]/10 rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
                {m.suggestedAction && (
                  <button
                    onClick={m.suggestedAction.action}
                    className="mt-2.5 w-full py-1.5 px-2.5 bg-[#173D32] hover:bg-[#102B25] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{m.suggestedAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#A7BDA9] text-[#173D32] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-stone-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto text-[11px] text-gray-600 whitespace-nowrap">
          <button
            onClick={() => setInput('Frequent MCB tripping in my home')}
            className="px-2.5 py-1 bg-white rounded-md border border-gray-200 hover:border-[#173D32]"
          >
            MCB Tripping
          </button>
          <button
            onClick={() => setInput('Water leakage from concealed bathroom pipe')}
            className="px-2.5 py-1 bg-white rounded-md border border-gray-200 hover:border-[#173D32]"
          >
            Pipe Leak
          </button>
          <button
            onClick={() => setInput('CBSE Class 10 Math tutor in Hyderabad')}
            className="px-2.5 py-1 bg-white rounded-md border border-gray-200 hover:border-[#173D32]"
          >
            CBSE Tutor
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue or question..."
            className="flex-1 p-2.5 rounded-xl border border-gray-300 focus:border-[#173D32] text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="p-2.5 bg-[#173D32] hover:bg-[#102B25] text-white rounded-xl transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

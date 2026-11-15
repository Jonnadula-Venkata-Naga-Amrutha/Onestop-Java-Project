import { FormEvent, useState } from 'react';
import { ServiceCategory, User, UserRole } from '../types';
import { X } from 'lucide-react';
import { dbService } from '../services/storage';

interface AuthModalProps {
  categories: ServiceCategory[];
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export default function AuthModal({ categories, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Vijayawada');
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = mode === 'login'
        ? await dbService.login(email, password)
        : await dbService.register({
          email,
          password,
          fullName,
          phone,
          role,
          businessName: role === 'PROVIDER' ? businessName : undefined,
          city,
          serviceCategories: role === 'PROVIDER' ? serviceCategories : undefined,
        });
      onAuthenticated(user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to authenticate.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (code: string) => {
    setServiceCategories(current => current.includes(code)
      ? current.filter(item => item !== code)
      : [...current, code]);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl relative" onClick={event => event.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <div className="mb-6">
          <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">Secure account access</div>
          <h2 className="text-2xl font-bold font-serif-heading text-[#173D32]">
            {mode === 'login' ? 'Welcome back' : 'Create your ONESTOP account'}
          </h2>
        </div>
        <form onSubmit={submit} className="space-y-4 text-sm">
          {mode === 'register' && (
            <>
              <label className="block text-xs font-semibold text-gray-700">
                Account type
                <select value={role} onChange={event => setRole(event.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 bg-white">
                  <option value="CUSTOMER">Customer</option>
                  <option value="PROVIDER">Service provider</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input required value={fullName} onChange={event => setFullName(event.target.value)}
                  placeholder="Full name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                <input required value={phone} onChange={event => setPhone(event.target.value)}
                  placeholder="Phone number" className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
              </div>
              {role === 'PROVIDER' && (
                <>
                  <input required value={businessName} onChange={event => setBusinessName(event.target.value)}
                    placeholder="Business name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                  <input required value={city} onChange={event => setCity(event.target.value)}
                    placeholder="City" className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
                  <fieldset>
                    <legend className="text-xs font-semibold text-gray-700 mb-2">Services offered</legend>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs">
                          <input type="checkbox" checked={serviceCategories.includes(category.code)}
                            onChange={() => toggleCategory(category.code)} />
                          {category.nameEn}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
            </>
          )}
          <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}
            placeholder="Email address" className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
          <input required type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : undefined} value={password}
            onChange={event => setPassword(event.target.value)} placeholder="Password"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full rounded-xl bg-[#173D32] text-white py-3 font-semibold disabled:opacity-60">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-4 text-xs font-semibold text-[#173D32] hover:underline">
          {mode === 'login' ? 'New to ONESTOP? Create an account' : 'Already registered? Sign in'}
        </button>
      </div>
    </div>
  );
}

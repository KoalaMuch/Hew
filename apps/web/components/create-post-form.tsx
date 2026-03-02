'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, ShoppingBag, MapPin, Calendar, Send } from 'lucide-react';
import { getErrorMessage } from '@hew/shared';
import { createPost } from '@/lib/api';

type PostType = 'RUBHEW' | 'HAKHONG';

export function CreatePostForm() {
  const router = useRouter();
  const [type, setType] = useState<PostType>('RUBHEW');
  const [content, setContent] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await createPost({
        type,
        content: content.trim(),
        country: country || undefined,
        city: city || undefined,
        travelDate: travelDate ? new Date(travelDate).toISOString() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setType('RUBHEW')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            type === 'RUBHEW'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <Plane size={18} />
          รับหิ้ว
        </button>
        <button
          type="button"
          onClick={() => setType('HAKHONG')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            type === 'HAKHONG'
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <ShoppingBag size={18} />
          หาของ
        </button>
      </div>

      {/* Content */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === 'RUBHEW'
              ? 'จะไปไหน หิ้วอะไรได้บ้าง? ใส่ #แฮชแท็ก เพื่อให้ค้นหาง่ายขึ้น'
              : 'อยากได้อะไร จากไหน? ใส่ #แฮชแท็ก เพื่อให้ค้นหาง่ายขึ้น'
          }
          rows={5}
          maxLength={5000}
          className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {content.length}/5000
        </p>
      </div>

      {/* Travel metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="ประเทศ"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="เมือง (ถ้ามี)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        <div className="relative">
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            ฿
          </span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="งบประมาณ"
            min="0"
            step="1"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-7 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={18} />
        {submitting ? 'กำลังโพสต์...' : 'โพสต์'}
      </button>
    </form>
  );
}

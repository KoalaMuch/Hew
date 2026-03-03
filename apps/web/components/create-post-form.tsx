'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, ShoppingBag, MapPin, Calendar, Send, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getErrorMessage,
  MAX_POST_CONTENT_LENGTH,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_POST,
} from '@hew/shared';
import { createPost } from '@/lib/api';
import { trackPostCreated } from '@/lib/analytics';
import { useSession } from '@/lib/session-context';
import { Avatar } from '@/components/avatar';
import { HashtagInput } from '@/components/hashtag-input';

type PostType = 'RUBHEW' | 'HAKHONG';

export function CreatePostForm() {
  const router = useRouter();
  const { session } = useSession();
  const [type, setType] = useState<PostType>('RUBHEW');
  const [content, setContent] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [budget, setBudget] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = session?.displayName || 'ผู้ใช้';
  const avatarSeed = session?.avatarSeed || session?.id || 'anon';

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const { uploadImage } = await import('@/lib/api');
        const results = await Promise.all(
          imageFiles.map((f) => uploadImage(f, 'posts'))
        );
        imageUrls.push(...results.map((r) => r.url));
      }

      const hashtagSuffix =
        selectedHashtags.length > 0
          ? '\n' + selectedHashtags.join(' ')
          : '';
      await createPost({
        type,
        content: content.trim() + hashtagSuffix,
        imageUrls,
        country: country || undefined,
        city: city || undefined,
        travelDate: travelDate ? new Date(travelDate).toISOString() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
      });
      trackPostCreated(type);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const maxSize = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const valid = files.filter((f) => {
      if (f.size > maxSize) return false;
      if (!ALLOWED_IMAGE_TYPES.includes(f.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return false;
      return true;
    });
    setImageFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES_PER_POST));
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type tabs */}
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

      {/* Facebook-style: avatar + name + text area */}
      <div className="flex gap-3">
        <Avatar
          src={session?.avatarUrl}
          displayName={displayName}
          avatarSeed={avatarSeed}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'RUBHEW'
                ? 'จะไปไหน หิ้วอะไรได้บ้าง?'
                : 'อยากได้อะไร จากไหน?'
            }
            rows={2}
            maxLength={MAX_POST_CONTENT_LENGTH}
            className="mt-1 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {content.length}/{MAX_POST_CONTENT_LENGTH}
          </p>
        </div>
      </div>

      {/* Image attachment bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageFiles.length >= 10}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <ImagePlus size={18} />
          เพิ่มรูป ({imageFiles.length}/10)
        </button>
        {imageFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageFiles.map((file, i) => (
              <div
                key={i}
                className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hashtag chips */}
      <HashtagInput
        selectedTags={selectedHashtags}
        onChange={setSelectedHashtags}
        disabled={submitting}
      />

      {/* Collapsible metadata */}
      <div className="rounded-xl border border-gray-100">
        <button
          type="button"
          onClick={() => setMetadataExpanded((x) => !x)}
          className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          เพิ่มรายละเอียด
          {metadataExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {metadataExpanded && (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4">
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
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="เมือง"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
            />
            <div className="relative col-span-2">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </div>
            <div className="relative col-span-2">
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
                className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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

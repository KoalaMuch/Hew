'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import { searchHashtags } from '@/lib/api';
import { MAX_HASHTAGS_PER_POST } from '@hew/shared';

interface HashtagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

const TAG_REGEX = /^[\w\u0E00-\u0E7F]+$/;
const MAX_TAG_LENGTH = 50;

export function HashtagInput({
  selectedTags,
  onChange,
  disabled = false,
}: HashtagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchHashtags(q, 8);
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = input.replace(/^#/, '').trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalized = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;
    if (selectedTags.length >= MAX_HASHTAGS_PER_POST) return;
    if (selectedTags.some((t) => t.toLowerCase() === normalized.toLowerCase())) return;
    if (!TAG_REGEX.test(normalized.replace('#', ''))) return;
    if (normalized.replace('#', '').length > MAX_TAG_LENGTH) return;
    onChange([...selectedTags, normalized]);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (index: number) => {
    onChange(selectedTags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    }
  };

  const atLimit = selectedTags.length >= MAX_HASHTAGS_PER_POST;

  return (
    <div ref={wrapperRef} className="space-y-2">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-sm text-primary-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-primary-200 disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {!atLimit && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setFocused(true)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            <Tag size={16} />
            เพิ่มแท็ก
          </button>
          {(focused || input) && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="พิมพ์เพื่อค้นหา..."
                className="w-full rounded-t-xl border-0 border-b border-gray-100 px-3 py-2 text-sm outline-none focus:ring-0"
                autoFocus
              />
              {showDropdown && (loading || suggestions.length > 0 || input.trim()) && (
                <div className="max-h-48 overflow-y-auto py-1">
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">กำลังค้นหา...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addTag(s.name)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <span>{s.name}</span>
                        <span className="text-xs text-gray-400">{s.count}</span>
                      </button>
                    ))
                  ) : input.trim() ? (
                    <button
                      type="button"
                      onClick={() => addTag(input.trim())}
                      className="flex w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50"
                    >
                      สร้างแท็กใหม่: #{input.trim()}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {atLimit && (
        <p className="text-xs text-gray-500">สูงสุด {MAX_HASHTAGS_PER_POST} แท็ก</p>
      )}
    </div>
  );
}

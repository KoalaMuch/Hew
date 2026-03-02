'use client';

interface HashtagChipProps {
  tag: string;
  onClick?: (tag: string) => void;
  active?: boolean;
}

export function HashtagChip({ tag, onClick, active }: HashtagChipProps) {
  const displayTag = tag.startsWith('#') ? tag : `#${tag}`;

  return (
    <button
      type="button"
      onClick={() => onClick?.(tag)}
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {displayTag}
    </button>
  );
}

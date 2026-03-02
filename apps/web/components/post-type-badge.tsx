'use client';

import { Plane, ShoppingBag } from 'lucide-react';

interface PostTypeBadgeProps {
  type: 'RUBHEW' | 'HAKHONG';
  size?: 'sm' | 'md';
}

export function PostTypeBadge({ type, size = 'sm' }: PostTypeBadgeProps) {
  const isRubhew = type === 'RUBHEW';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${
        isRubhew
          ? 'bg-blue-50 text-blue-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {isRubhew ? <Plane size={iconSize} /> : <ShoppingBag size={iconSize} />}
      {isRubhew ? 'รับหิ้ว' : 'หาของ'}
    </span>
  );
}

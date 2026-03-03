'use client';

import Image from 'next/image';
import { getAvatarInitial } from '@/lib/utils';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const;

interface AvatarProps {
  src?: string | null;
  displayName?: string;
  avatarSeed?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({
  src,
  displayName,
  avatarSeed,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeClass = sizeMap[size];
  const initial = getAvatarInitial(displayName, avatarSeed);

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes={size === 'sm' ? '32px' : size === 'md' ? '40px' : '56px'}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-bold text-white ${sizeClass} ${className}`}
    >
      {initial}
    </div>
  );
}

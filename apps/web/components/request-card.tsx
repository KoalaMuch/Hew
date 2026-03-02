import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RequestCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrls?: string[];
  countries: string[];
  maxBudget?: number;
  status?: string;
}

export const RequestCard = memo(function RequestCard({
  id,
  title,
  description,
  imageUrls,
  countries,
  maxBudget,
  status,
}: RequestCardProps) {
  const imageUrl = imageUrls?.[0];

  return (
    <Link
      href={`/requests/${id}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
    >
      {imageUrl ? (
        <div className="relative aspect-video w-full bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-primary-50 to-accent-50" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{title}</h3>
          {status && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                status === 'OPEN'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'MATCHED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          ต้องการจาก: {countries.join(', ')}
        </p>
        {maxBudget && (
          <p className="mt-1 text-sm font-medium text-primary-600">
            งบประมาณสูงสุด ฿{maxBudget.toLocaleString()}
          </p>
        )}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
});

import { memo } from 'react';
import Link from 'next/link';

interface TripCardProps {
  id: string;
  country: string;
  city?: string;
  departureDate?: string;
  returnDate?: string;
  description?: string;
  status?: string;
}

export const TripCard = memo(function TripCard({
  id,
  country,
  city,
  departureDate,
  returnDate,
  description,
  status,
}: TripCardProps) {
  const dateRange =
    departureDate && returnDate
      ? `${new Date(departureDate).toLocaleDateString('th-TH')} - ${new Date(returnDate).toLocaleDateString('th-TH')}`
      : departureDate
        ? `ออกเดินทาง ${new Date(departureDate).toLocaleDateString('th-TH')}`
        : null;

  return (
    <Link
      href={`/trips/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">
            {country}
            {city && ` · ${city}`}
          </h3>
          {dateRange && (
            <p className="mt-1 text-sm text-gray-500">{dateRange}</p>
          )}
          {description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
        {status && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : status === 'COMPLETED'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </Link>
  );
});

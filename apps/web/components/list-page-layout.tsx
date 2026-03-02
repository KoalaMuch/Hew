import { Suspense } from 'react';
import Link from 'next/link';

interface ListPageLayoutProps {
  title: string;
  subtitle: string;
  basePath: string;
  emptyMessage: string;
  skeletonHeight: string;
  filters: React.ReactNode;
  children: React.ReactNode;
}

export function ListPageLayout({
  title,
  subtitle,
  filters,
  skeletonHeight,
  children,
}: ListPageLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-gray-600">{subtitle}</p>
      </div>

      {filters}

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`${skeletonHeight} animate-pulse rounded-xl bg-gray-200`}
              />
            ))}
          </div>
        }
      >
        <div className="mt-6">{children}</div>
      </Suspense>
    </div>
  );
}

export function EmptyListState({
  message,
  basePath,
}: {
  message: string;
  basePath: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
      <p className="text-gray-500">{message}</p>
      <Link
        href={basePath}
        className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        ล้างตัวกรอง
      </Link>
    </div>
  );
}

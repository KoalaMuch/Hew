export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

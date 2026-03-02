'use client';

import { useRouter } from 'next/navigation';

export function RequestsFilters({
  country,
  status,
}: {
  country?: string;
  status?: string;
}) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const countryVal = formData.get('country') as string;
    const statusVal = formData.get('status') as string;
    if (countryVal?.trim()) params.set('country', countryVal.trim());
    if (statusVal) params.set('status', statusVal);
    router.push(`/requests?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          ประเทศที่ต้องการ
        </label>
        <input
          id="country"
          name="country"
          type="text"
          placeholder="เช่น Japan, Korea"
          defaultValue={country}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          สถานะ
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status || ''}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">ทั้งหมด</option>
          <option value="OPEN">เปิดรับข้อเสนอ</option>
          <option value="MATCHED">จับคู่แล้ว</option>
          <option value="CLOSED">ปิดแล้ว</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          ค้นหา
        </button>
      </div>
    </form>
  );
}

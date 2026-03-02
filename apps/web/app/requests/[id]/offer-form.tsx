'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOffer } from '@/lib/api';
import { getErrorMessage } from '@hew/shared';
import { trackOfferSubmitted } from '@/lib/analytics';

interface OfferFormProps {
  itemRequestId: string;
}

export function OfferForm({ itemRequestId }: OfferFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createOffer({
        itemRequestId,
        productPrice: Number(formData.get('productPrice')),
        shippingFee: Number(formData.get('shippingFee')),
        notes: (formData.get('notes') as string) || undefined,
      });
      trackOfferSubmitted(itemRequestId);
      router.refresh();
      form.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700">
          ราคาสินค้า (฿)
        </label>
        <input
          id="productPrice"
          name="productPrice"
          type="number"
          min="1"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label htmlFor="shippingFee" className="block text-sm font-medium text-gray-700">
          ค่าส่ง (฿)
        </label>
        <input
          id="shippingFee"
          name="shippingFee"
          type="number"
          min="0"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          หมายเหตุ (ไม่บังคับ)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'กำลังส่ง...' : 'ส่งข้อเสนอ'}
      </button>
    </form>
  );
}

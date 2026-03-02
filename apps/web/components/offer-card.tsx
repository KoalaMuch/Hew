import { memo } from 'react';

interface OfferCardProps {
  id: string;
  productPrice: number;
  shippingFee: number;
  notes?: string;
  status?: string;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

export const OfferCard = memo(function OfferCard({
  id,
  productPrice,
  shippingFee,
  notes,
  status,
  onAccept,
  onReject,
  showActions = false,
}: OfferCardProps) {
  const total = productPrice + shippingFee;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">ราคาสินค้า</p>
          <p className="font-semibold text-gray-900">
            ฿{productPrice.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            ค่าส่ง ฿{shippingFee.toLocaleString()}
          </p>
          <p className="mt-2 font-medium text-primary-600">
            รวม ฿{total.toLocaleString()}
          </p>
          {notes && (
            <p className="mt-2 text-sm text-gray-600">{notes}</p>
          )}
        </div>
        {status && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'PENDING'
                ? 'bg-amber-100 text-amber-800'
                : status === 'ACCEPTED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {status}
          </span>
        )}
      </div>
      {showActions && status === 'PENDING' && onAccept && onReject && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onAccept(id)}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            ยอมรับ
          </button>
          <button
            type="button"
            onClick={() => onReject(id)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ปฏิเสธ
          </button>
        </div>
      )}
    </div>
  );
});

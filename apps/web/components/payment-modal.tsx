'use client';

import { useState } from 'react';
import { X, CreditCard, Smartphone } from 'lucide-react';
import { chargePayment } from '@/lib/api';

interface PaymentModalProps {
  orderId: string;
  orderName: string | null;
  orderImageUrl: string | null;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  orderId,
  orderName,
  orderImageUrl,
  totalAmount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'credit_card'>('promptpay');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await chargePayment({
        orderId,
        paymentMethod,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการชำระเงิน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">ชำระเงิน</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Order Summary */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex gap-3">
              {orderImageUrl ? (
                <img
                  src={orderImageUrl}
                  alt={orderName || 'Order'}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                  <span className="text-2xl">📦</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                  {orderName || 'ไม่มีชื่อ'}
                </p>
                <p className="mt-1 text-lg font-bold text-primary-600">
                  ฿{totalAmount.toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              วิธีการชำระเงิน
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${
                  paymentMethod === 'promptpay'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone size={20} />
                <span className="text-sm font-medium">PromptPay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${
                  paymentMethod === 'credit_card'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard size={20} />
                <span className="text-sm font-medium">บัตรเครดิต</span>
              </button>
            </div>
          </div>

          {/* Contact Info (Optional) */}
          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์ (ไม่บังคับ)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                อีเมล (ไม่บังคับ)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-400"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { createOrderFromChat, uploadImage } from '@/lib/api';

interface CreateOrderModalProps {
  roomId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrderModal({ roomId, onClose, onSuccess }: CreateOrderModalProps) {
  const [orderName, setOrderName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [shippingFee, setShippingFee] = useState('0');
  const [orderImageUrl, setOrderImageUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, 'posts');
      setOrderImageUrl(url);
    } catch {
      setError('อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(productPrice);
    const shipping = parseFloat(shippingFee);
    if (!orderName.trim() || isNaN(price) || price <= 0 || isNaN(shipping) || shipping < 0) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createOrderFromChat({
        roomId,
        orderName: orderName.trim(),
        orderImageUrl,
        productPrice: price,
        shippingFee: shipping,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างออเดอร์ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">สร้างออเดอร์</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ชื่อออเดอร์ *
            </label>
            <input
              type="text"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder="เช่น iPhone 15 Pro"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-400"
              maxLength={200}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              รูปสินค้า (ถ้ามี)
            </label>
            <div className="flex gap-3">
              {orderImageUrl ? (
                <div className="relative">
                  <img
                    src={orderImageUrl}
                    alt="Preview"
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderImageUrl(undefined)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  ) : (
                    <Upload size={24} className="text-gray-400" />
                  )}
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ราคาสินค้า (บาท) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ค่าจัดส่ง (บาท)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'กำลังสร้าง...' : 'สร้างออเดอร์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

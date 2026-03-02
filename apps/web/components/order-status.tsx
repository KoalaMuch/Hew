const ORDER_STATUS_STEPS = [
  { key: 'CREATED', label: 'สร้างคำสั่งซื้อ', labelEn: 'Order created' },
  { key: 'ESCROW_PENDING', label: 'รอชำระเงิน', labelEn: 'Awaiting payment' },
  { key: 'PAID', label: 'ชำระเงินแล้ว', labelEn: 'Paid' },
  { key: 'PURCHASING', label: 'กำลังซื้อสินค้า', labelEn: 'Purchasing' },
  { key: 'SHIPPED', label: 'จัดส่งแล้ว', labelEn: 'Shipped' },
  { key: 'DELIVERED', label: 'ได้รับสินค้า', labelEn: 'Delivered' },
  { key: 'COMPLETED', label: 'เสร็จสิ้น', labelEn: 'Completed' },
] as const;

const TERMINAL_STATUSES = [
  'CANCELLED',
  'REFUNDED',
  'DISPUTED',
  'RESOLVED_BUYER',
  'RESOLVED_TRAVELER',
];

interface OrderStatusProps {
  status: string;
  className?: string;
}

export function OrderStatus({ status, className = '' }: OrderStatusProps) {
  const currentIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === status);
  const isTerminal = TERMINAL_STATUSES.includes(status);

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-2 ring-primary-300 ring-offset-2' : ''}`}
                >
                  {isActive ? '✓' : index + 1}
                </div>
                {index < ORDER_STATUS_STEPS.length - 1 && (
                  <div
                    className={`mt-1 h-8 w-0.5 ${
                      isActive ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="pb-6">
                <p
                  className={`font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.labelEn}</p>
              </div>
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">สถานะ: {status}</p>
        </div>
      )}
    </div>
  );
}

'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h2 className="text-xl font-bold text-gray-900">เกิดข้อผิดพลาดร้ายแรง</h2>
          <p className="mt-2 text-sm text-gray-500">
            ระบบมีปัญหา กรุณาลองใหม่อีกครั้ง
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}

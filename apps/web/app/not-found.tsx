import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary-600">404</p>
        <h2 className="mt-4 text-xl font-bold text-gray-900">ไม่พบหน้าที่ค้นหา</h2>
        <p className="mt-2 text-sm text-gray-500">
          หน้าที่คุณกำลังมองหาอาจถูกลบ หรือเปลี่ยนชื่อไปแล้ว
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}

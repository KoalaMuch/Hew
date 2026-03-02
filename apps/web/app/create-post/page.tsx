import Link from 'next/link';
import { CreatePostForm } from '@/components/create-post-form';

export default function CreatePostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← กลับ
      </Link>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-xl font-bold text-gray-900">สร้างโพสต์</h1>
        <CreatePostForm />
      </div>
    </div>
  );
}

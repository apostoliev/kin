import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';
import { IrisWordmark, IrisLockup } from '@/components/iris/Marks';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const placeMakers = await prisma.placeMaker.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="border-b border-hair bg-paper/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-7 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-baseline gap-4 group">
            <IrisWordmark size={26} />
            <span className="text-stoneFaint">·</span>
            <IrisLockup property="Rosewood · Sand Hill" />
          </Link>
          <PersonaSwitcher
            options={placeMakers.map((p) => ({
              slug: p.slug,
              name: p.name,
              role: p.role,
              title: p.title,
            }))}
          />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-hair py-5 text-center">
        <span className="editorial-caps">Demo mode · Iris carries</span>
      </footer>
    </div>
  );
}

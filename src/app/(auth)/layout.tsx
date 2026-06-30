import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/login" className="mx-auto block w-fit">
          <Image
            src="/brand/mealgen-logo.png"
            alt="MealGen"
            width={190}
            height={95}
            priority
            className="h-auto w-44"
          />
        </Link>
        {children}
      </div>
    </main>
  );
}

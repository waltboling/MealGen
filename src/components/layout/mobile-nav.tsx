import { MobileNavLinks } from "@/components/layout/nav-links";

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-7 border-t border-border bg-card lg:hidden">
      <MobileNavLinks />
    </nav>
  );
}

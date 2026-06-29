import type { SVGProps } from "react";

export function ChiliPepperIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.2 4.2c1.6.2 2.8.9 3.6 2.1" />
      <path d="M17.1 7.4c-1.2.2-2.3-.3-3-1.2-.5-.7-.4-1.6.2-2.2.7-.6 1.7-.5 2.3.2.8.9 1 2 .5 3.2Z" />
      <path d="M18.6 8.1c.6 3.9-1.4 8.3-5.4 10.7-2.7 1.6-5.3 1.8-7.1.6-.7-.5-.8-1.5-.1-2.1 2.1-1.9 3.4-4.2 4.2-6.9.9-3 3.6-4.6 6.4-3.7l2 .7Z" />
    </svg>
  );
}

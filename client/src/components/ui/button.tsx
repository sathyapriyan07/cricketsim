import { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-medium hover:bg-sky-500 ${className}`} {...props} />;
}

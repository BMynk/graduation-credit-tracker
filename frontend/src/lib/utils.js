import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value, fallback = "—") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback;
  }

  return `${Number(value).toFixed(1)}%`;
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
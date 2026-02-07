"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABEL_KEYS: Record<string, string> = {
  success: "success.title",
  cancel: "cancel.title",
  "design-test": "design.title",
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const breadcrumbs: BreadcrumbItem[] = items ?? buildBreadcrumbs(pathname, t);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "glass-effect rounded-xl px-4 py-2.5 inline-flex items-center gap-2 text-sm",
        className
      )}
    >
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-starlight-100/40 shrink-0" />
              )}
              {isLast || !crumb.href ? (
                <span className="text-starlight-100 font-medium truncate max-w-[200px]">
                  {index === 0 && (
                    <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  )}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-starlight-100/60 hover:text-primary-cyan transition-colors truncate max-w-[200px]"
                >
                  {index === 0 && (
                    <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  )}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildBreadcrumbs(
  pathname: string,
  t: ReturnType<typeof useTranslations>
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  // segments[0] is the locale (en/vi)
  if (segments.length <= 1) return [];

  const locale = segments[0];
  const crumbs: BreadcrumbItem[] = [
    { label: "AgencyOS", href: `/${locale}` },
  ];

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const labelKey = ROUTE_LABEL_KEYS[segment];
    const label = labelKey ? safeTranslate(t, labelKey, segment) : segment;

    crumbs.push({
      label,
      href: i < segments.length - 1 ? href : undefined,
    });
  }

  return crumbs;
}

function safeTranslate(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback: string
): string {
  try {
    return t(key as Parameters<typeof t>[0]);
  } catch {
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }
}

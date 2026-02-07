"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { m as motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

import { LanguageSwitcher } from "@/components/language-switcher";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const SECTION_IDS = ["features", "pricing"] as const;

const menuItemVariants = {
  closed: { opacity: 0, x: -16 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: "easeOut" as const },
  }),
};

export function NavbarSection() {
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { scrollY } = useScroll();

  // Track which section is currently in viewport
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Scroll-driven glassmorphism: bg + border intensify as user scrolls
  const glassBg = useTransform(
    scrollY,
    [0, 120],
    ["rgba(3, 0, 20, 0.02)", "rgba(3, 0, 20, 0.85)"]
  );
  const glassBorder = useTransform(
    scrollY,
    [0, 120],
    ["1px solid rgba(255, 255, 255, 0)", "1px solid rgba(255, 255, 255, 0.12)"]
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    setHasScrolled(latest > 20);
  });

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = useCallback(
    (href: string) => {
      if (!href.startsWith("#")) return false;
      return activeSection === href.slice(1);
    },
    [activeSection]
  );

  const navItems = [
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: siteConfig.social.githubRepo, label: "GitHub", external: true },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 w-full"
      style={{
        backdropFilter: hasScrolled ? "blur(16px) saturate(1.4)" : "blur(8px)",
        WebkitBackdropFilter: hasScrolled ? "blur(16px) saturate(1.4)" : "blur(8px)",
      }}
    >
      {/* Scroll-reactive glass background */}
      <motion.div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: glassBg,
          borderBottom: glassBorder,
        }}
      />

      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-nebula-500 to-blue-500 flex items-center justify-center transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-nebula-500/30">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            AgencyOS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                isActive(item.href)
                  ? "text-primary-cyan"
                  : "text-starlight-200 hover:text-white"
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-active-indicator"
                  className="block h-0.5 mt-0.5 rounded-full bg-primary-cyan"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* Desktop CTA */}
          <motion.div className="hidden sm:block" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="#pricing"
              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-nebula-500 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-nebula-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-nebula-500/40 focus:outline-none focus:ring-2 focus:ring-nebula-500 focus:ring-offset-2 focus:ring-offset-deep-space-900"
            >
              {t("signup")}
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMenu}
            className="md:hidden p-2 text-starlight-200 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden overflow-hidden border-t border-white/10"
            style={{
              background: "rgba(3, 0, 20, 0.95)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            }}
          >
            <div className="container mx-auto px-4 py-6 space-y-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  custom={i}
                  variants={menuItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cn(
                      "flex items-center text-base font-medium transition-colors duration-200 min-h-[44px]",
                      isActive(item.href)
                        ? "text-primary-cyan"
                        : "text-starlight-200 hover:text-white"
                    )}
                  >
                    {isActive(item.href) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan mr-2 shrink-0" />
                    )}
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                custom={navItems.length}
                variants={menuItemVariants}
                initial="closed"
                animate="open"
                className="pt-4"
              >
                <Link
                  href="#pricing"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-nebula-500 to-blue-500 px-6 text-base font-medium text-white shadow-lg shadow-nebula-500/25 min-h-[48px] hover:shadow-xl hover:shadow-nebula-500/40 transition-shadow"
                >
                  {t("signup")}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

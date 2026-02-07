"use client";

import { useTranslations } from "next-intl";
import { m as motion } from "framer-motion";

const linkClass =
  "block py-2 text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200";

export function FooterSection() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10" style={{ background: "rgba(3, 0, 20, 0.6)" }}>
      <div className="container mx-auto px-4 py-8 md:py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                AgencyOS
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              {t("product.title")}
            </h3>
            <ul className="space-y-1">
              <li><a href="#features" className={linkClass}>{t("product.features")}</a></li>
              <li><a href="#pricing" className={linkClass}>{t("product.pricing")}</a></li>
              <li><a href="#" className={linkClass}>{t("product.marketplace")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              {t("resources.title")}
            </h3>
            <ul className="space-y-1">
              <li><a href="#" className={linkClass}>{t("resources.docs")}</a></li>
              <li><a href="#" className={linkClass}>{t("resources.api")}</a></li>
              <li><a href="#" className={linkClass}>{t("resources.blog")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              {t("legal.title")}
            </h3>
            <ul className="space-y-1">
              <li><a href="#" className={linkClass}>{t("legal.privacy")}</a></li>
              <li><a href="#" className={linkClass}>{t("legal.terms")}</a></li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 border-t border-white/10 pt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

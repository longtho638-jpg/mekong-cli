'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MD3Surface from './MD3Surface';

interface MD3DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function MD3Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  icon
}: MD3DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", duration: 0.3 }}
                >
                  <MD3Surface
                    shape="extra-large"
                    color="surface-container-high"
                    elevation={3}
                    className="w-full max-w-lg min-w-[320px] shadow-xl outline-none"
                    padding="24px"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex flex-col gap-2 text-center">
                         {icon && <div className="mx-auto mb-2 text-[var(--md-sys-color-secondary)]">{icon}</div>}
                        {title && (
                          <DialogPrimitive.Title className="text-headline-small text-[var(--md-sys-color-on-surface)]">
                            {title}
                          </DialogPrimitive.Title>
                        )}
                        {description && (
                          <DialogPrimitive.Description className="text-body-medium text-[var(--md-sys-color-on-surface-variant)]">
                            {description}
                          </DialogPrimitive.Description>
                        )}
                      </div>

                      {/* Content */}
                      <div className="py-2">
                        {children}
                      </div>

                      {/* Close Button (Absolute) */}
                      <DialogPrimitive.Close asChild>
                        <button
                          className="absolute right-4 top-4 rounded-full p-2 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                          aria-label="Close"
                        >
                          <X size={20} />
                        </button>
                      </DialogPrimitive.Close>
                    </div>
                  </MD3Surface>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

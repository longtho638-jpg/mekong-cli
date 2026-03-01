import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export interface SuccessAnimationProps {
  message: string;
  title?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ message, title = 'Success!' }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="glass-card max-w-md text-center p-8 bg-white"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold gradient-text mb-2">{title}</h3>
        <p className="text-slate-600">{message}</p>
      </motion.div>
    </motion.div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 2, className = '' }) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const displayValue = useTransform(spring, (current) => Math.round(current));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return displayValue.onChange((v) => setDisplay(v));
  }, [displayValue]);

  return <span className={className}>{display}</span>;
};

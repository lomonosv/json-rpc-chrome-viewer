'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface IRevealProps {
  children: ReactNode,
  delay?: number,
  y?: number,
  className?: string,
}

export default function Reveal({ children, delay = 0, y = 24, className }: IRevealProps) {
  return (
    <motion.div
      className={ className ? `reveal ${ className }` : 'reveal' }
      initial={ { opacity: 0, y, filter: 'blur(8px)' } }
      whileInView={ { opacity: 1, y: 0, filter: 'blur(0px)' } }
      viewport={ { once: true, margin: '-80px' } }
      transition={ { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } }
    >
      { children }
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

interface LaserAnimationProps {
  className?: string;
}

const LaserAnimation: React.FC<LaserAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Animated laser beams */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] opacity-10"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 300 + 100}px`,
            height: `${Math.random() * 300 + 100}px`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            scale: [1, 1.2, 0.9, 1.1, 1],
            opacity: [0.1, 0.2, 0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
      
      {/* Laser beams */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`laser-${i}`}
          className="absolute bg-[#9945FF] opacity-30"
          style={{
            height: '1px',
            width: '100%',
            left: 0,
            top: `${Math.random() * 100}%`,
            transformOrigin: 'left',
          }}
          animate={{
            scaleX: [0, 1, 1, 1, 0],
            opacity: [0, 0.3, 0.5, 0.3, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: i * 2 + Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 5 + 5,
          }}
        />
      ))}
      
      {/* Vertical laser beams */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`vlaser-${i}`}
          className="absolute bg-[#14F195] opacity-30"
          style={{
            width: '1px',
            height: '100%',
            top: 0,
            left: `${Math.random() * 100}%`,
            transformOrigin: 'top',
          }}
          animate={{
            scaleY: [0, 1, 1, 1, 0],
            opacity: [0, 0.3, 0.5, 0.3, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: i * 2 + Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 5 + 5,
          }}
        />
      ))}
    </div>
  );
};

export default LaserAnimation;

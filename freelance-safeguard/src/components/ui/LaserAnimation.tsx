import React from 'react';
import { motion } from 'framer-motion';

interface LaserAnimationProps {
  className?: string;
}

const LaserAnimation: React.FC<LaserAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Horizontal purple lasers */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`h-laser-${i}`}
            className="absolute h-[1px] w-full left-0"
            style={{
              top: `${15 + i * 15}%`,
              background: 'linear-gradient(to right, rgba(153, 69, 255, 0), rgba(153, 69, 255, 0.7), rgba(153, 69, 255, 0))'
            }}
            animate={{
              scaleX: [0, 1, 1, 1, 0],
              opacity: [0, 0.5, 0.7, 0.5, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              repeatType: "loop",
              delay: i * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle purple glow points */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => {
          const size = 3 + (i % 3) * 2;
          return (
            <motion.div
              key={`glow-${i}`}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                background: '#9945FF',
                boxShadow: '0 0 8px 2px rgba(153, 69, 255, 0.6)',
                left: `${10 + (i * 10)}%`,
                top: `${20 + (i * 7)}%`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LaserAnimation;

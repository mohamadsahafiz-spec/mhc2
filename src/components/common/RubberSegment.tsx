import React, { useRef, useState, useEffect, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface RubberSegmentOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export interface RubberSegmentProps {
  options: (RubberSegmentOption | string)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export const RubberSegment: React.FC<RubberSegmentProps> = ({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'sm',
  className = '',
  disabled = false,
  name,
  id: customId,
}) => {
  const generatedId = useId();
  const componentId = customId || generatedId;
  const prefersReducedMotion = Boolean(useReducedMotion());

  // Normalize options
  const normalizedOptions: RubberSegmentOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const [internalValue, setInternalValue] = useState<string>(() => {
    if (controlledValue !== undefined) return controlledValue;
    if (defaultValue !== undefined) return defaultValue;
    return normalizedOptions[0]?.value || '';
  });

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const selectedIndex = normalizedOptions.findIndex((opt) => opt.value === activeValue);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % normalizedOptions.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + normalizedOptions.length) % normalizedOptions.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = normalizedOptions.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextOpt = normalizedOptions[nextIndex];
      if (nextOpt) {
        handleSelect(nextOpt.value);
        setFocusedIndex(nextIndex);
      }
    }
  };

  const sizeClasses = {
    xs: 'p-0.5 text-[11px] gap-0.5',
    sm: 'p-1 text-xs gap-1',
    md: 'p-1.5 text-sm gap-1.5',
    lg: 'p-2 text-base gap-2',
  };

  const buttonPadding = {
    xs: 'px-2 py-0.5 h-6',
    sm: 'px-2.5 py-1 h-7',
    md: 'px-3.5 py-1.5 h-8',
    lg: 'px-4.5 py-2 h-10',
  };

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 420,
        damping: 32,
        mass: 0.8,
      };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      id={componentId}
      aria-label="Theme Selection"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        if (focusedIndex === -1 && selectedIndex >= 0) {
          setFocusedIndex(selectedIndex);
        }
      }}
      onBlur={() => setFocusedIndex(-1)}
      className={`inline-flex items-center rounded-button select-none relative border transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] ${
        sizeClasses[size]
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } bg-raised border-theme-default text-theme-primary ${className}`}
    >
      {normalizedOptions.map((option, index) => {
        const isSelected = option.value === activeValue;
        const isFocused = focusedIndex === index;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.ariaLabel || (typeof option.label === 'string' ? option.label : option.value)}
            disabled={disabled}
            tabIndex={-1}
            onClick={() => handleSelect(option.value)}
            className={`relative z-10 font-theme-label font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 rounded-button ${
              buttonPadding[size]
            } ${
              isSelected
                ? 'text-theme-primary font-semibold'
                : 'text-theme-muted hover:text-theme-primary'
            } ${isFocused ? 'ring-1 ring-inset ring-[var(--color-primary)]/50' : ''}`}
          >
            {isSelected && (
              <motion.div
                layoutId={`rubber-segment-thumb-${componentId}`}
                transition={springTransition}
                className="absolute inset-0 rounded-button shadow-xs bg-surface border border-theme-default"
                style={{ zIndex: -1 }}
              />
            )}
            {option.icon && <span className="shrink-0 text-current">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

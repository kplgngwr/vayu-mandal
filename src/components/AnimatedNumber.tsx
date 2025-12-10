'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    delay?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    formatWithCommas?: boolean;
}

// Easing function for smooth deceleration
const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export default function AnimatedNumber({
    value,
    duration = 1500,
    delay = 0,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
    formatWithCommas = true,
}: AnimatedNumberProps) {
    // Start with the actual value (shows real data before scroll animation triggers)
    const [displayValue, setDisplayValue] = useState(value);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<number | null>(null);

    const startAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startTime = performance.now() + delay;
        const startValue = 0;
        const endValue = value;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;

            if (elapsed < 0) {
                // Still in delay period - show 0 during delay
                setDisplayValue(0);
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const currentValue = startValue + (endValue - startValue) * easedProgress;

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        // Start at 0 immediately when animation begins
        setDisplayValue(0);
        animationRef.current = requestAnimationFrame(animate);
    }, [value, duration, delay]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Use Intersection Observer to trigger animation when element scrolls into view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);
                        startAnimation();
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [startAnimation, hasAnimated]);

    // Update display value when prop value changes (after animation has run once)
    useEffect(() => {
        if (hasAnimated) {
            // Re-animate when value changes
            startAnimation();
        } else {
            // Update static value if animation hasn't triggered yet
            setDisplayValue(value);
        }
    }, [value, hasAnimated, startAnimation]);

    const formatNumber = (num: number): string => {
        const fixedNum = num.toFixed(decimals);
        if (formatWithCommas) {
            const parts = fixedNum.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
        return fixedNum;
    };

    return (
        <span ref={elementRef} className={className}>
            {prefix}{formatNumber(displayValue)}{suffix}
        </span>
    );
}

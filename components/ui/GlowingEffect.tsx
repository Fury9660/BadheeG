"use client";

import { cn } from "@/lib/utils";
import { animate } from "motion/react";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

const isWeb = Platform.OS === 'web';

interface GlowingEffectProps {
    blur?: number;
    inactiveZone?: number;
    proximity?: number;
    spread?: number;
    variant?: "default" | "white";
    glow?: boolean;
    className?: string;
    disabled?: boolean;
    movementDuration?: number;
    borderWidth?: number;
}

const GlowingEffect = memo(
    ({
        blur = 0,
        inactiveZone = 0.7,
        proximity = 0,
        spread = 20,
        variant = "default",
        glow = false,
        className,
        movementDuration = 2,
        borderWidth = 1,
        disabled = true,
    }: GlowingEffectProps) => {
        if (!isWeb) return null;

        const containerRef = useRef<HTMLDivElement>(null);
        const lastPosition = useRef({ x: 0, y: 0 });
        const animationFrameRef = useRef<number>(0);

        const handleMove = useCallback(
            (e?: MouseEvent | { x: number; y: number }) => {
                if (!containerRef.current || disabled) return;

                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }

                animationFrameRef.current = requestAnimationFrame(() => {
                    const element = containerRef.current;
                    if (!element) return;

                    const mouseX = e?.x ?? lastPosition.current.x;
                    const mouseY = e?.y ?? lastPosition.current.y;

                    if (e) {
                        lastPosition.current = { x: mouseX, y: mouseY };
                    }

                    // Throttling: Only check bounds every few frames or if mouse moved significantly
                    const rect = element.getBoundingClientRect();
                    const { left, top, width, height } = rect;

                    // Optimization: Skip if mouse is way outside proximity
                    const safeProximity = Math.max(proximity, 200);
                    if (
                        mouseX < left - safeProximity ||
                        mouseX > left + width + safeProximity ||
                        mouseY < top - safeProximity ||
                        mouseY > top + height + safeProximity
                    ) {
                        element.style.setProperty("--active", "0");
                        return;
                    }

                    const center = [left + width * 0.5, top + height * 0.5];
                    const distanceFromCenter = Math.hypot(
                        mouseX - center[0],
                        mouseY - center[1]
                    );
                    const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

                    if (distanceFromCenter < inactiveRadius) {
                        element.style.setProperty("--active", "0");
                        return;
                    }

                    const isActive =
                        mouseX > left - proximity &&
                        mouseX < left + width + proximity &&
                        mouseY > top - proximity &&
                        mouseY < top + height + proximity;

                    element.style.setProperty("--active", isActive ? "1" : "0");

                    if (!isActive) return;

                    const currentAngle =
                        parseFloat(element.style.getPropertyValue("--start")) || 0;
                    let targetAngle =
                        (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
                        Math.PI +
                        90;

                    const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
                    const newAngle = currentAngle + angleDiff;

                    animate(currentAngle, newAngle, {
                        duration: movementDuration,
                        ease: [0.16, 1, 0.3, 1],
                        onUpdate: (value) => {
                            if (element) {
                                element.style.setProperty("--start", String(value));
                            }
                        },
                    });
                });
            },
            [inactiveZone, proximity, movementDuration, disabled]
        );

        useEffect(() => {
            if (disabled) return;

            // Use a small delay for scroll updates to reduce pressure
            let scrollTimeout: any;
            const handleScroll = () => {
                if (scrollTimeout) return;
                scrollTimeout = setTimeout(() => {
                    handleMove();
                    scrollTimeout = null;
                }, 50);
            };

            const handlePointerMove = (e: any) => handleMove(e);

            window.addEventListener("scroll", handleScroll, { passive: true });
            document.body.addEventListener("pointermove", handlePointerMove, {
                passive: true,
            });

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (scrollTimeout) clearTimeout(scrollTimeout);
                window.removeEventListener("scroll", handleScroll);
                document.body.removeEventListener("pointermove", handlePointerMove);
            };
        }, [handleMove, disabled]);

        return (
            <>
                {/* Border / Static Glow Container */}
                <div
                    className={cn("glowing-effect-border", className)}
                    style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        border: `${borderWidth}px solid transparent`,
                        // Apply Static Border Color if present
                        borderColor: variant === 'white' ? '#ffffff' : 'transparent',
                        opacity: glow ? 1 : 0,
                        transition: 'opacity 300ms',
                        display: disabled ? 'block' : 'none',
                    }}
                />

                {/* Dynamic Gradient Effect - No Masking, just a plate behind the content */}
                {React.createElement('div', {
                    ref: containerRef,
                    style: {
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        opacity: 1,
                        transition: 'opacity 300ms',
                        display: disabled ? 'none' : 'block',

                        // CSS Variables
                        "--blur": `${blur}px`,
                        "--spread": spread,
                        "--start": "0",
                        "--active": "0",
                        "--glowingeffect-border-width": `${borderWidth}px`,
                        "--repeating-conic-gradient-times": "5",
                        "--gradient":
                            variant === "white"
                                ? `repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  var(--black),
                  var(--black) calc(25% / var(--repeating-conic-gradient-times))
                )`
                                : `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
                radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #dd7bbb 0%,
                  #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                  #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                  #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                  #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                )`,
                        filter: blur > 0 ? `blur(${blur}px)` : undefined,
                    } as React.CSSProperties,
                    className: cn("glowing-effect-container", className)
                },
                    // The Inner Child (Glow Beam)
                    React.createElement('div', {
                        className: 'glow',
                        style: {
                            borderRadius: 'inherit',
                            width: '100%', height: '100%',
                            position: 'absolute',
                            inset: 0,

                            // Background is the gradient
                            background: 'var(--gradient)',
                            backgroundAttachment: 'fixed',
                            opacity: 'var(--active)',
                            transition: 'opacity 300ms',

                            // Masking: 
                            // We use a Conic Gradient Mask to effectively limit the beam to a segment (the "moving" part).
                            // But we DO NOT punch a hole in the middle, because the Inner Card covers the middle.
                            // This ensures the border is always solid color where the beam is.

                            maskImage: 'conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #0000 0deg, #fff, #0000 calc(var(--spread) * 2deg))',
                            WebkitMaskImage: 'conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #0000 0deg, #fff, #0000 calc(var(--spread) * 2deg))',
                        }
                    })
                )}
            </>
        );
    }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };

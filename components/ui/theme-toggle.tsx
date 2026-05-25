"use client"

import { useTheme } from "@/store/ThemeContext"
import { Moon, Sun } from "lucide-react"
import React from "react"
import { Platform } from "react-native"

interface ThemeToggleProps {
    className?: string
}

const isWeb = Platform.OS === 'web';

export function ThemeToggle({ className }: ThemeToggleProps) {
    if (!isWeb) return null;

    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div
            style={{
                display: 'flex',
                width: 64,
                height: 32,
                padding: 4,
                borderRadius: 9999,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: isDarkMode ? '#09090b' : '#000000',
                border: isDarkMode ? '1px solid #27272a' : '1px solid #333333',
                position: 'relative',
                overflow: 'hidden'
            }}
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%' }}>
                {/* Active Handle / Icon */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        transition: 'transform 0.3s ease, background-color 0.3s ease',
                        backgroundColor: isDarkMode ? '#27272a' : '#f3f4f6',
                        transform: isDarkMode ? 'translateX(0)' : 'translateX(32px)',
                        zIndex: 10
                    }}
                >
                    {isDarkMode ? (
                        <Moon
                            size={14}
                            color="white"
                            strokeWidth={1.5}
                        />
                    ) : (
                        <Sun
                            size={14}
                            color="#3f3f46"
                            strokeWidth={1.5}
                        />
                    )}
                </div>

                {/* Opposite Icon (Background) */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        transition: 'transform 0.3s ease, opacity 0.3s ease',
                        transform: isDarkMode ? 'translateX(0)' : 'translateX(-32px)',
                        opacity: 1,
                        zIndex: 5
                    }}
                >
                    {isDarkMode ? (
                        <Sun
                            size={14}
                            color="#71717a"
                            strokeWidth={1.5}
                        />
                    ) : (
                        <Moon
                            size={14}
                            color="#18181b"
                            strokeWidth={1.5}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

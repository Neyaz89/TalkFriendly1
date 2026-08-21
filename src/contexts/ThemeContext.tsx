'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  showBorders: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleBorders: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [showBorders, setShowBorders] = useState(false) // Default to FALSE (no borders)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('talkfriendly_theme') as Theme
    const savedBorders = localStorage.getItem('talkfriendly_borders')
    
    if (savedTheme) {
      setThemeState(savedTheme)
    }
    
    if (savedBorders !== null) {
      setShowBorders(savedBorders === 'true')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Apply theme - only add/remove 'dark' class
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Apply borders - when showBorders is FALSE, add 'no-borders' class
    if (!showBorders) {
      root.classList.add('no-borders')
    } else {
      root.classList.remove('no-borders')
    }

    // Save to localStorage
    localStorage.setItem('talkfriendly_theme', theme)
    localStorage.setItem('talkfriendly_borders', String(showBorders))
  }, [theme, showBorders, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleBorders = () => {
    setShowBorders(prev => !prev)
  }

  const value = {
    theme,
    showBorders,
    setTheme,
    toggleTheme,
    toggleBorders,
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

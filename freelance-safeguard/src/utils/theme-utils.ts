/**
 * Theme synchronization utility for Solana UI integration
 * Ensures consistent theme application across the application
 */

// Function to apply theme class to document
export function applyThemeClass(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Apply theme class
  root.classList.add(theme);
  
  // Update meta theme-color for better mobile integration
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F1116' : '#F8FAFC');
  }
  
  // Store in localStorage for persistence
  localStorage.setItem('freelance-shield-theme', theme);
}

// Function to get current theme
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'; // Default to dark when SSR
  
  // Check localStorage first
  const savedTheme = localStorage.getItem('freelance-shield-theme');
  
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme as 'light' | 'dark';
  
  // If no saved preference, use dark mode as default
  return 'dark';
}

// Initialize theme on page load
export function initializeTheme(): void {
  const theme = getCurrentTheme();
  applyThemeClass(theme);
}

// Call initialization on module load
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure it runs after the DOM is fully available
  setTimeout(() => {
    initializeTheme();
  }, 0);
}

/**
 * Device detection and responsive utilities for Bigg Buzz
 * Enhanced for proper responsive design across all device types
 */

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
  userAgent: string;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Enhanced hook to detect device type and responsive breakpoints
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1024,
    screenHeight: 768,
    orientation: 'landscape',
    touchDevice: false,
    userAgent: '',
    breakpoint: 'lg'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      // Responsive breakpoint detection based on Tailwind CSS breakpoints
      let breakpoint: DeviceInfo['breakpoint'];
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;

      if (width < 640) {
        breakpoint = 'xs';
        isMobile = true;
      } else if (width < 768) {
        breakpoint = 'sm';
        isMobile = true;
      } else if (width < 1024) {
        breakpoint = 'md';
        isTablet = true;
      } else if (width < 1280) {
        breakpoint = 'lg';
        isDesktop = true;
      } else if (width < 1536) {
        breakpoint = 'xl';
        isDesktop = true;
      } else {
        breakpoint = '2xl';
        isDesktop = true;
      }

      // Enhanced mobile detection combining width and user agent
      const isMobileByUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
      const isTabletByUA = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);

      // Override based on user agent for better accuracy
      if (isMobileByUA && !isTabletByUA) {
        isMobile = true;
        isTablet = false;
        isDesktop = false;
      } else if (isTabletByUA) {
        isMobile = false;
        isTablet = true;
        isDesktop = false;
      }

      // Orientation detection
      const orientation = width > height ? 'landscape' : 'portrait';

      // Touch device detection
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation,
        touchDevice,
        userAgent,
        breakpoint
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for resize events with debouncing
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
    };
  }, []);

  return deviceInfo;
}

/**
 * Get responsive classes based on device type and screen breakpoint
 * Uses proper Tailwind CSS responsive utilities
 */
export function getResponsiveClasses(deviceInfo: DeviceInfo) {
  const { touchDevice, breakpoint } = deviceInfo;

  return {
    // Container: Responsive across all screen sizes
    container: 'w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 sm:px-6 md:px-8',

    // Card padding: Responsive padding for proper spacing
    cardPadding: 'p-4 sm:p-6 md:p-8',

    // Header padding: Responsive header spacing
    headerPadding: 'p-4 pb-3 sm:p-6 sm:pb-4 md:p-8 md:pb-6',

    // Content padding: Responsive content spacing
    contentPadding: 'p-4 pt-0 sm:p-6 sm:pt-0 md:p-8 md:pt-0',

    // Typography: Responsive text sizing
    titleSize: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    headingSize: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    subheadingSize: 'text-lg sm:text-xl md:text-2xl',
    bodySize: 'text-base sm:text-lg md:text-xl',

    // Interactive elements: Touch-optimized for touch devices
    buttonSize: touchDevice
      ? 'min-h-12 px-6 py-3 text-base sm:text-lg'
      : 'min-h-10 px-4 py-2 text-sm sm:text-base md:text-lg',

    inputSize: touchDevice
      ? 'min-h-12 px-4 text-base'
      : 'min-h-10 px-3 text-sm md:text-base',

    // OTP input: Responsive sizing for better usability
    otpSlotSize: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',

    // Spacing: Responsive vertical spacing
    spacing: 'space-y-4 sm:space-y-6 md:space-y-8',
    spacingLarge: 'space-y-6 sm:space-y-8 md:space-y-10',

    // Icons: Responsive icon sizing
    iconSize: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
    iconSizeSmall: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',

    // Grid layouts: Responsive grid columns
    gridCols: 'grid-cols-1 md:grid-cols-2',
    gridColsThree: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',

    // Layout utilities
    flexDirection: 'flex flex-col sm:flex-row',
    flexDirectionReverse: 'flex flex-col-reverse sm:flex-row',

    // Responsive gaps
    gap: 'gap-4 sm:gap-6 md:gap-8',
    gapSmall: 'gap-2 sm:gap-3 md:gap-4',

    // Responsive margins and padding
    marginY: 'my-4 sm:my-6 md:my-8',
    paddingY: 'py-4 sm:py-6 md:py-8',
    paddingX: 'px-4 sm:px-6 md:px-8',

    // Form-specific responsive classes
    formContainer: 'space-y-4 sm:space-y-6 md:space-y-8',
    formGrid: 'grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2',
    formButton: touchDevice
      ? 'w-full min-h-12 text-base font-semibold'
      : 'w-full min-h-10 text-sm sm:text-base font-semibold',

    // Step indicator
    stepIndicator: 'text-center mb-6 sm:mb-8 md:mb-10',
    stepText: 'text-base sm:text-lg md:text-xl',
    stepDots: 'flex justify-center space-x-2 mt-3 sm:mt-4',
    stepDot: 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300'
  };
}

/**
 * Get mobile-optimized viewport meta content
 */
export function getMobileViewportMeta(): string {
  return 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
}

/**
 * Check if the current device is likely a mobile phone
 */
export function isMobilePhone(): boolean {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth;
  const userAgent = navigator.userAgent;

  // Check for mobile phone specific indicators
  const isMobileWidth = width < 480;
  const isMobileUA = /iPhone|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return isMobileWidth || isMobileUA;
}

/**
 * Check if the current device is likely a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth;
  const userAgent = navigator.userAgent;

  // Check for tablet specific indicators
  const isTabletWidth = width >= 768 && width < 1024;
  const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);

  return isTabletWidth || isTabletUA;
}

/**
 * Get optimal form layout classes for responsive design
 */
export function getOptimalFormLayout(deviceInfo: DeviceInfo): string {
  const { isMobile, isTablet, orientation } = deviceInfo;

  if (isMobile) {
    return orientation === 'portrait'
      ? 'min-h-screen flex flex-col justify-start pt-8 px-4'
      : 'min-h-screen flex flex-col justify-center px-4';
  }

  if (isTablet) {
    return 'min-h-screen flex flex-col justify-center px-6 md:px-8';
  }

  return 'min-h-screen flex flex-col justify-center px-8 lg:px-12';
}

/**
 * Get device-specific container classes
 */
export function getDeviceContainerClasses(deviceInfo: DeviceInfo): string {
  const { breakpoint } = deviceInfo;

  switch (breakpoint) {
    case 'xs':
      return 'w-full px-4 py-6';
    case 'sm':
      return 'w-full max-w-sm mx-auto px-4 py-6';
    case 'md':
      return 'w-full max-w-md mx-auto px-6 py-8';
    case 'lg':
      return 'w-full max-w-lg mx-auto px-8 py-10';
    case 'xl':
      return 'w-full max-w-xl mx-auto px-10 py-12';
    case '2xl':
      return 'w-full max-w-2xl mx-auto px-12 py-16';
    default:
      return 'w-full max-w-lg mx-auto px-6 py-8';
  }
}
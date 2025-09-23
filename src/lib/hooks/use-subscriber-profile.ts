'use client';

import { useState, useEffect, useCallback } from 'react';

// Types for the subscriber profile API
export interface SubscriberProfile {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tokenBalance: number;
  isActive: boolean;
  phoneVerified?: Date;
  emailVerified?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface UseSubscriberProfileResult {
  subscriber: SubscriberProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSubscriberProfile = (): UseSubscriberProfileResult => {
  const [subscriber, setSubscriber] = useState<SubscriberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriberProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribers/profile');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setSubscriber(data.subscriber);

    } catch (err) {
      console.error('Error fetching subscriber profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setSubscriber(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriberProfile();
  }, [fetchSubscriberProfile]);

  const refetch = useCallback(() => {
    fetchSubscriberProfile();
  }, [fetchSubscriberProfile]);

  return {
    subscriber,
    loading,
    error,
    refetch
  };
};
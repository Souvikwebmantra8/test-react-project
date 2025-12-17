import { useEffect, useRef } from 'react';
import { getUser } from '../config/api';
import { getLogin } from '../utils/storage';

/**
 * Custom hook to periodically check if user is still active
 * Checks every 60 seconds (1 minute)
 * If Active === "0", calls onUserBlocked callback
 * 
 * @param {boolean} enabled - Whether to enable the check (should be true when user is logged in)
 * @param {function} onUserBlocked - Callback when user is blocked (Active = "0")
 */
export const useUserStatusCheck = (enabled, onUserBlocked) => {
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Only run if enabled (user is logged in)
    if (!enabled) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkUserStatus = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        console.log('[UserStatusCheck] Already checking, skipping...');
        return;
      }

      try {
        isCheckingRef.current = true;
        console.log('[UserStatusCheck] Checking user status...');

        // Get AdminUserMasterID from localStorage
        const loginData = getLogin();
        
        if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
          console.log('[UserStatusCheck] No AdminUserMasterID found, stopping check');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const adminUserMasterID = loginData.userData.AdminUserMasterID;

        // Call GetUser API to check Active status
        const userData = await getUser(adminUserMasterID);
        
        console.log('[UserStatusCheck] User data received:', {
          Active: userData.Active,
          AdminUserMasterID: userData.AdminUserMasterID,
          Email: userData.Email
        });

        // Check if user is active
        if (userData.Active === "0" || userData.Active === 0) {
          console.warn('[UserStatusCheck] User is BLOCKED (Active = 0)');
          console.warn('[UserStatusCheck] Forcing logout...');
          
          // Clear interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Call callback to handle logout
          if (onUserBlocked) {
            onUserBlocked(userData);
          }
        } else {
          console.log('[UserStatusCheck] User is active (Active =', userData.Active, ')');
        }
      } catch (error) {
        console.error('[UserStatusCheck] Error checking user status:', error);
        // Don't stop checking on error - might be temporary network issue
        // Continue checking in next interval
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check immediately on mount
    checkUserStatus();

    // Set up interval to check every 60 seconds (1 minute)
    intervalRef.current = setInterval(() => {
      checkUserStatus();
    }, 60000); // 60 seconds = 60000 milliseconds

    console.log('[UserStatusCheck] Started periodic user status check (every 60 seconds)');

    // Cleanup on unmount or when disabled
    return () => {
      if (intervalRef.current) {
        console.log('[UserStatusCheck] Stopping periodic user status check');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, onUserBlocked]);
};

export default useUserStatusCheck;


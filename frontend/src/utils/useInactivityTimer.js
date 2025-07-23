import { useEffect, useRef } from 'react';

/**
 * A custom hook that triggers a callback after a period of inactivity.
 * @param {function} onTimeout - The function to call when the timer expires.
 * @param {number} [timeout=900000] - The inactivity timeout in milliseconds (defaults to 15 minutes).
 * @param {boolean} [enabled=true] - A flag to enable or disable the timer.
 */
const useInactivityTimer = (onTimeout, timeout = 5000, enabled = true) => {
    const timeoutId = useRef(null);
    const savedCallback = useRef(onTimeout);

    // Keep the saved callback updated with the latest version of the onTimeout function
    useEffect(() => {
        savedCallback.current = onTimeout;
    }, [onTimeout]);

    // Main effect for setting up and cleaning up the timer
    useEffect(() => {
        if (!enabled) {
            // If the timer is disabled, do nothing and ensure any existing timers are cleared.
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            return;
        }

        const handleTimeout = () => {
            console.log(`User inactive for ${timeout / 1000}s, triggering logout.`);
            savedCallback.current();
        };

        const resetTimer = () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            timeoutId.current = setTimeout(handleTimeout, timeout);
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const handleUserActivity = () => {
            resetTimer();
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Start the initial timer
        resetTimer();

        // Cleanup function
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [timeout, enabled]); // Re-run the effect if the timeout or enabled state changes

    return null;
};

export default useInactivityTimer;
import { useEffect, useState } from "react";


/*
 * Keeps a page's loader up for at least `minDuration` ms so fast
 * responses don't flash it on and off, and for as long as the first
 * fetch is still running. It only gates the *first* load: once
 * settled, later refetches (e.g. after saving a budget) fall back to
 * each page's own inline loading state instead of blanking the page.
 */
export function useMinimumLoading(isLoading, minDuration = 1000) {
    const [minElapsed, setMinElapsed] =
        useState(false);

    const [settled, setSettled] =
        useState(false);


    useEffect(() => {
        const timer = setTimeout(
            () => setMinElapsed(true),
            minDuration
        );

        return () => clearTimeout(timer);
    }, [minDuration]);


    // Adjusting state during render is React's recommended pattern for
    // latching a value derived from props, and avoids an extra effect.
    if (!settled && minElapsed && !isLoading) {
        setSettled(true);
    }


    return !settled && (isLoading || !minElapsed);
}

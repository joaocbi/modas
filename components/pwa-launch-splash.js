"use client";

import { useEffect, useState } from "react";

const SPLASH_MS = 2000;

function isStandaloneDisplayMode() {
    if (typeof window === "undefined") {
        return false;
    }

    const standaloneMq = window.matchMedia?.("(display-mode: standalone)")?.matches;
    const iosStandalone = typeof window.navigator !== "undefined" && window.navigator.standalone === true;

    return Boolean(standaloneMq || iosStandalone);
}

/**
 * Full-screen splash when the PWA opens in standalone mode.
 * Native splash timing is OS-controlled; this caps branded overlay at SPLASH_MS.
 */
export function PwaLaunchSplash() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isStandaloneDisplayMode()) {
            console.log("[PwaLaunchSplash] Skipped: not in standalone display mode.");
            return undefined;
        }

        console.log("[PwaLaunchSplash] Showing launch overlay.", { durationMs: SPLASH_MS });
        setVisible(true);
        const hideTimer = window.setTimeout(() => {
            setVisible(false);
            console.log("[PwaLaunchSplash] Launch overlay hidden.");
        }, SPLASH_MS);

        return () => window.clearTimeout(hideTimer);
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <div className="pwa-launch-splash" aria-hidden="true">
            <div className="pwa-launch-splash-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apple-icon" alt="" className="pwa-launch-splash-logo" width={180} height={180} />
            </div>
        </div>
    );
}

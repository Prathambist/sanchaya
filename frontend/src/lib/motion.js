/*
 * Shared framer-motion presets.
 *
 * Every spring/variant used by more than one animated component lives
 * here so tuning a feel (e.g. the nav's spring stiffness) only has to
 * happen in one place instead of being copy-pasted per component.
 */

export const springs = {
    // Small interactive nudges: hover/tap on nav rows, buttons, avatars.
    snappy: {
        type: "spring",
        stiffness: 500,
        damping: 30,
    },

    // Slightly softer than `snappy`, used for icon/logo hover states.
    smooth: {
        type: "spring",
        stiffness: 450,
        damping: 28,
    },

    // The sliding "active" surface behind the current nav item.
    nav: {
        type: "spring",
        stiffness: 480,
        damping: 34,
        mass: 0.55,
    },

    // Route-level page transitions.
    page: {
        type: "spring",
        stiffness: 240,
        damping: 28,
        mass: 0.72,
    },

    // Content entrance (staggered cards/sections).
    content: {
        type: "spring",
        stiffness: 320,
        damping: 27,
        mass: 0.7,
    },
};


// Shared "fade + rise" entrance used by PageContent's items and PageSection.
export const fadeUpVariants = {
    hidden: {
        opacity: 0,
        y: 18,
    },

    visible: {
        opacity: 1,
        y: 0,
        transition: springs.content,
    },
};

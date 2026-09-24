import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    useLocation,
} from "react-router-dom";

import {
    useRef,
} from "react";

import { springs } from "../lib/motion";


const routeOrder = {
    "/": 0,
    "/transactions": 1,
    "/budgets": 2,
    "/goals": 3,
    "/analytics": 4,
    "/settings": 5,
};


function getRouteIndex(pathname) {
    return (
        routeOrder[pathname] ??
        0
    );
}


/*
 * The entire page moves according to the
 * position of that page in the sidebar.
 *
 * `filter: none` once the entrance settles matters: any other filter
 * value (even blur(0px)) makes this wrapper the containing block for
 * position:fixed descendants, which would pin the pages' modals to the
 * page instead of the viewport.
 */
const settledFilter = {
    filter: "none",
};

const pageVariants = {
    forward: {
        initial: {
            opacity: 0,
            y: 70,
            filter: "blur(6px)",
        },

        animate: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transitionEnd: settledFilter,
        },

        exit: {
            opacity: 0,
            y: -55,
            filter: "blur(4px)",
        },
    },

    backward: {
        initial: {
            opacity: 0,
            y: -70,
            filter: "blur(6px)",
        },

        animate: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transitionEnd: settledFilter,
        },

        exit: {
            opacity: 0,
            y: 55,
            filter: "blur(4px)",
        },
    },
};


const pageTransition = springs.page;


function PageTransition({
    children,
}) {
    const location =
        useLocation();


    const previousPath =
        useRef(
            location.pathname
        );


    const currentIndex =
        getRouteIndex(
            location.pathname
        );

    const previousIndex =
        getRouteIndex(
            previousPath.current
        );


    const direction =
        currentIndex >
        previousIndex
            ? "forward"
            : currentIndex <
                previousIndex
              ? "backward"
              : "forward";


    const variants =
        pageVariants[direction];


    return (
        <div
            className="relative w-full"
            style={{
                minHeight: "calc(100vh - 120px)",
            }}
        >

            <AnimatePresence
                initial={false}
                mode="popLayout"
            >

                <motion.div
                    key={
                        location.pathname
                    }
                    initial={
                        variants.initial
                    }
                    animate={
                        variants.animate
                    }
                    exit={
                        variants.exit
                    }
                    transition={
                        pageTransition
                    }
                    className="w-full"
                    style={{
                        backfaceVisibility:
                            "hidden",
                    }}
                    onAnimationComplete={() => {
                        previousPath.current =
                            location.pathname;
                    }}
                >

                    {children}

                </motion.div>

            </AnimatePresence>

        </div>
    );
}


export default PageTransition;
import {
    AnimatePresence,
    motion,
} from "framer-motion";

import { springs } from "../lib/motion";


/*
 * Fades a page's content up into place once its loader is dismissed.
 * Wrapped in its own AnimatePresence for the same reason as
 * PageLoader: without a fresh presence context, the entrance would be
 * silently skipped on the first page after a refresh (see the comment
 * in PageLoader). Only opacity and y animate, and framer-motion resets
 * the transform to `none` once y settles at 0, so this wrapper doesn't
 * leave behind a containing block that would trap the pages'
 * position:fixed modals.
 */
function Reveal({
    children,
    className,
}) {
    return (
        <AnimatePresence>

            <motion.div
                key="page-content"
                className={className}
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={springs.content}
            >
                {children}
            </motion.div>

        </AnimatePresence>
    );
}


export default Reveal;

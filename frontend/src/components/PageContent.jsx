import { motion } from "framer-motion";

import { fadeUpVariants } from "../lib/motion";


const containerVariants = {
    hidden: {},

    visible: {
        transition: {
            staggerChildren: 0.075,
            delayChildren: 0.12,
        },
    },
};


function PageContent({
    children,
}) {
    return (
        <motion.div
            variants={
                containerVariants
            }
            initial="hidden"
            animate="visible"
            className="w-full"
        >
            {children}
        </motion.div>
    );
}


export function PageItem({
    children,
    className = "",
}) {
    return (
        <motion.div
            variants={
                fadeUpVariants
            }
            className={className}
        >
            {children}
        </motion.div>
    );
}


export default PageContent;

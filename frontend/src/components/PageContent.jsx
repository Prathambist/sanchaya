import { motion } from "framer-motion";


const containerVariants = {
    hidden: {},

    visible: {
        transition: {
            staggerChildren: 0.075,
            delayChildren: 0.12,
        },
    },
};


const itemVariants = {
    hidden: {
        opacity: 0,
        y: 18,
    },

    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 320,
            damping: 27,
            mass: 0.7,
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
                itemVariants
            }
            className={className}
        >
            {children}
        </motion.div>
    );
}


export default PageContent;
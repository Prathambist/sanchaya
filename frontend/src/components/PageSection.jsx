import { motion } from "framer-motion";


const variants = {
    hidden: {
        opacity: 0,
        y: 18,
    },

    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 26,
            mass: 0.7,
        },
    },
};


function PageSection({
    children,
    className = "",
    delay = 0,
}) {
    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{
                delay,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}


export default PageSection;
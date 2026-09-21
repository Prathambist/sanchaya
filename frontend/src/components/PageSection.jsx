import { motion } from "framer-motion";

import { fadeUpVariants } from "../lib/motion";


function PageSection({
    children,
    className = "",
    delay = 0,
}) {
    return (
        <motion.div
            variants={fadeUpVariants}
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

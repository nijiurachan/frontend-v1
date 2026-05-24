import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface ExpandableBannerProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  duration?: number;
}

export const ExpandableBanner: React.FunctionComponent<
  ExpandableBannerProps
> = ({ trigger, children, duration = 0.2 }: ExpandableBannerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={(): void => setIsExpanded((prev) => !prev)}
        className="flex items-center"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

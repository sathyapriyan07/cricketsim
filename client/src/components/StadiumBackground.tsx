import { motion } from "framer-motion";

export function StadiumBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-[-25%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <div className="absolute bottom-[-18%] left-0 right-0 h-96 rounded-[50%] bg-emerald-500/10 blur-3xl" />
    </div>
  );
}

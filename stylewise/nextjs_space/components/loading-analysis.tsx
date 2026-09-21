"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface LoadingAnalysisProps {
  message?: string;
}

export function LoadingAnalysis({ message = "Analisando..." }: LoadingAnalysisProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 rounded-full champagne-gradient flex items-center justify-center"
      >
        <Sparkles className="w-7 h-7 text-white" />
      </motion.div>
      <motion.p
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-muted-foreground text-sm font-medium"
      >
        {message}
      </motion.p>
    </div>
  );
}

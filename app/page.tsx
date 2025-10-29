import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800">
      <motion.h1
        className="text-5xl font-bold text-[#0062FF]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        BOS CNT Explorer
      </motion.h1>
      <p className="text-gray-500 mt-4 mb-8">
        Official Token Dashboard for the BOS Token on Cardano
      </p>
      <Link
        href="/token"
        className="px-6 py-3 bg-[#0062FF] text-white rounded-2xl shadow hover:bg-blue-600"
      >
        View Token
      </Link>
    </main>
  );
}

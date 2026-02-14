"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface FlowerCardProps {
    flower: {
        id: string;
        name: string;
        imageUrl: string;
        personality: string;
    };
}

export default function FlowerCard({ flower }: FlowerCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-soft-yellow group cursor-pointer"
        >
            {/* Image */}
            <Image
                src={flower.imageUrl}
                alt={flower.name}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 768px) 50vw, 33vw"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Heart Icon */}
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all z-10">
                <Heart className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md font-sans">
                    {flower.name}
                </h3>
            </div>
        </motion.div>
    );
}

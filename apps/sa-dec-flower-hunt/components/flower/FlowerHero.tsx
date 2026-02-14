"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Share2, Cuboid } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import WishlistButton from "@/components/WishlistButton";
import { useRouter } from "next/navigation";

interface FlowerHeroProps {
    image: string;
    name: string;
    id: number;
    onOpenAR: () => void;
}

export function FlowerHero({ image, name, id, onOpenAR }: FlowerHeroProps) {
    const router = useRouter();

    return (
        <div className="relative w-full aspect-[4/5] md:aspect-video md:h-[60vh] bg-stone-200">
            <motion.div
                className="w-full h-full relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <Image
                    src={image}
                    alt={name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
            </motion.div>

            {/* Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5 text-stone-900" />
                </Button>

                <div className="flex gap-3">
                    <div className="bg-white/90 backdrop-blur-md rounded-full p-1 shadow-sm">
                        <WishlistButton
                            flowerId={id}
                            flowerName={name}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-sm"
                    >
                        <Share2 className="w-5 h-5 text-stone-900" />
                    </Button>
                </div>
            </div>

            {/* AR Button */}
            <div className="absolute bottom-4 right-4">
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 backdrop-blur-md shadow-lg text-stone-900 font-bold rounded-full px-4 h-10 gap-2 hover:bg-white"
                    onClick={onOpenAR}
                >
                    <Cuboid className="w-4 h-4 text-blue-600" />
                    Xem AR
                </Button>
            </div>
        </div>
    );
}

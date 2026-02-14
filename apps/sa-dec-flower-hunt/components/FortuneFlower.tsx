"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, useAnimation } from "framer-motion";
import { Sparkles, Share2, RotateCw, Dna } from "lucide-react";
import { FLOWERS } from "@/data/flowers";
import Image from "next/image";

export function FortuneFlower() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null); // Flower object
  const [fortune, setFortune] = useState<string>("");
  const controls = useAnimation();
  const [isOpen, setIsOpen] = useState(false);

  // Pick 6 random flowers for the wheel
  const wheelFlowers = FLOWERS.slice(0, 6);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setFortune("");

    // Random rotations (5-10 full spins + random offset)
    const randomStop = Math.floor(Math.random() * 6);
    const spins = 360 * 8;
    const segmentAngle = 360 / 6;
    const stopAngle = spins + (segmentAngle * randomStop) + (segmentAngle / 2); // Center of segment

    await controls.start({
      rotate: stopAngle,
      transition: { duration: 4, ease: "circOut" }
    });

    const selectedFlower = wheelFlowers[5 - randomStop]; // Calculate index based on rotation
    setResult(selectedFlower);

    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        body: JSON.stringify({ flower_name: selectedFlower.name }),
      });
      const data = await res.json();
      setFortune(data.fortune_text);
    } catch (e) {
      setFortune("Tết này vận đỏ như son!");
    }

    setSpinning(false);
    // Reset rotation for next time (optional, but keeps logic simple)
    controls.set({ rotate: stopAngle % 360 });
  };

  const share = () => {
    if (!result || !result.name) return;
    const text = encodeURIComponent(`Tôi vừa bói được ${result.name}: "${fortune}" tại Sa Đéc Flower Hunt! 🧧🌸`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://sadec-flower-hunt.vercel.app")}&quote=${text}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full gap-2">
          <Sparkles className="w-4 h-4" />
          Bói Hoa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-purple-50 to-white border-purple-100" aria-describedby="fortune-desc">
        <DialogTitle className="sr-only">Vận Mệnh Hoa 2026</DialogTitle>
        <div id="fortune-desc" className="sr-only">Quay vòng quay để bói vận mệnh năm mới cùng các loài hoa Sa Đéc</div>
        <div className="flex flex-col items-center py-6">
          <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
            <Dna className="w-6 h-6" /> Vận Mệnh Hoa 2026
          </h2>

          <div className="relative w-64 h-64 mb-8">
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-red-500">
              ▼
            </div>

            {/* Wheel */}
            <motion.div
              animate={controls}
              className="w-full h-full rounded-full border-4 border-purple-200 relative overflow-hidden shadow-inner bg-white"
              style={{ transformOrigin: "center" }}
            >
              {wheelFlowers.map((flower, index) => {
                const angle = 360 / 6;
                return (
                  <div
                    key={flower.id}
                    className="absolute w-full h-full flex justify-center pt-2 origin-center"
                    style={{
                      transform: `rotate(${index * angle}deg)`,
                      // Clip path logic is complex in pure CSS without SVG, 
                      // Using simplified visual representation: placing images at cardinal points
                    }}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white shadow-sm z-10 bg-white">
                      <Image
                        src={flower.image}
                        alt={flower.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    {/* Divider lines could go here */}
                    <div className="absolute top-1/2 left-1/2 w-[1px] h-1/2 bg-purple-100 origin-top -translate-x-1/2 -translate-y-1/2 -z-10"></div>
                  </div>
                )
              })}
            </motion.div>

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-2 border-purple-500 shadow-md z-20 flex items-center justify-center text-purple-500 font-bold text-xs">
              🌸
            </div>
          </div>

          {!result ? (
            <Button
              onClick={spin}
              disabled={spinning}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-6 rounded-full text-lg shadow-xl disabled:opacity-50"
            >
              {spinning ? <RotateCw className="w-5 h-5 animate-spin mr-2" /> : "🔮 QUAY VẬN MAY"}
            </Button>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-purple-200 mb-4 shadow-lg">
                <Image src={result.image} alt={result.name} width={96} height={96} className="object-cover w-full h-full" />
              </div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">{result.name}</h3>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-4">
                <p className="text-purple-800 font-medium italic">
                  "{fortune || "Đang luận giải..."}"
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={spin} variant="outline" className="border-purple-200">Quay lại</Button>
                <Button onClick={share} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Share2 className="w-4 h-4" /> Khoe Facebook
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

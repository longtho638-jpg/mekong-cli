import { GlassContainer } from "@/components/glass";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-space-900">
      <GlassContainer>
        <div className="flex flex-col items-center gap-8 py-24">
          {/* Orbital spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-cyan animate-spin" />
            <div
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent-purple animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary-cyan animate-pulse" />
            </div>
          </div>

          {/* Skeleton content */}
          <div className="w-full max-w-md space-y-4 animate-pulse">
            <div className="h-8 bg-white/5 rounded-lg w-3/4 mx-auto" />
            <div className="h-4 bg-white/5 rounded-lg w-1/2 mx-auto" />
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}

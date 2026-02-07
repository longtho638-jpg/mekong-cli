import { GlassCard, GlassContainer } from "@/components/glass";

export function SectionSkeleton() {
  return (
    <section className="relative py-24">
      <GlassContainer>
        <div className="space-y-8 animate-pulse">
          <div className="h-12 bg-white/5 rounded-lg w-1/3 mx-auto" />
          <div className="h-6 bg-white/5 rounded-lg w-1/2 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-64" />
            ))}
          </div>
        </div>
      </GlassContainer>
    </section>
  );
}

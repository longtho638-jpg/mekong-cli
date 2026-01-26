"use client";
import React from "react";
import { BentoGrid, BentoGridItem } from "../../components/ui/bento-grid";
import { Spotlight } from "../../components/ui/spotlight";

export function Features() {
  return (
    <section className="py-20 w-full relative overflow-hidden bg-black antialiased" id="features">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Everything you need to <span className="text-purple-500">Scale</span>
          </h2>
          <p className="text-neutral-400 text-lg">
            A comprehensive kit to help you ship your landing page faster.
          </p>
        </div>

        <BentoGrid className="max-w-4xl mx-auto">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={i === 3 || i === 6 ? "md:col-span-2" : ""}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700"></div>
);

const items = [
  {
    title: "Analytics",
    description: "Track your progress with built-in analytics dashboard.",
    header: <Skeleton />,
    icon: <span className="text-2xl">📊</span>,
  },
  {
    title: "Automated",
    description: "Set it and forget it. Automation handles the rest.",
    header: <Skeleton />,
    icon: <span className="text-2xl">🤖</span>,
  },
  {
    title: "Global Scale",
    description: "Deploy to edge locations worldwide in seconds.",
    header: <Skeleton />,
    icon: <span className="text-2xl">🌍</span>,
  },
  {
    title: "Secure by Default",
    description: "Enterprise-grade security without the enterprise price tag.",
    header: <Skeleton />,
    icon: <span className="text-2xl">🔒</span>,
  },
  {
    title: "Community",
    description: "Join thousands of developers building the future.",
    header: <Skeleton />,
    icon: <span className="text-2xl">👥</span>,
  },
];

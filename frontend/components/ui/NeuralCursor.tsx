'use client';

import React, { useEffect, useRef } from 'react';

export function NeuralCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const trail: { x: number; y: number; age: number }[] = [];
        const trailLength = 20;

        const handleMouseMove = (e: MouseEvent) => {
            trail.push({ x: e.clientX, y: e.clientY, age: 0 });
            if (trail.length > trailLength) {
                trail.shift();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Trail
            if (trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(trail[0].x, trail[0].y);

                // Quadratic bezier curve for smooth trail
                for (let i = 1; i < trail.length - 1; i++) {
                    const xc = (trail[i].x + trail[i + 1].x) / 2;
                    const yc = (trail[i].y + trail[i + 1].y) / 2;
                    ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
                }

                // Connect last point
                if (trail.length > 2) {
                    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
                }

                const gradient = ctx.createLinearGradient(
                    trail[0].x, trail[0].y,
                    trail[trail.length - 1].x, trail[trail.length - 1].y
                );
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0.8)'); // Green-purple energy

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
                ctx.stroke();
            }

            // Decay trail (optional, here we purely rely on shift)
            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]" // Topmost layer
        />
    );
}

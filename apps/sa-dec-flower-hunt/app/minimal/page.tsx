"use client";

export default function MinimalTest() {
    return (
        <div className="p-8 bg-white min-h-screen">
            <h1 className="text-3xl font-bold">Minimal Test Page</h1>
            <p>If this page loads without crashing, the bug is in a component.</p>
            <p>If this crashes too, the bug is in layout/global code.</p>
        </div>
    );
}

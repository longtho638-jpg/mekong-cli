export default function SuppliersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-stone-950">
            {children}
        </div>
    );
}

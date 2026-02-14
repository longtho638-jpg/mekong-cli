export interface Product {
    id: string;
    name: string;
    type: string;
    price: number;
    originalPrice: number;
    image: string;
    farmer: {
        id: string;
        name: string;
        rating: number;
    };
    stats: {
        harvestDate: string;
        shelfLife: string;
        origin: string;
        blockchainHash: string;
    };
    stock: number;
}

export const MOCK_MARKET_PRODUCTS: Product[] = [
    {
        id: "AST-8821-ROSE",
        name: "Cyber Rose 'Velvet'",
        type: "Premium Cut",
        price: 180000,
        originalPrice: 240000,
        image: "🌹",
        farmer: { id: "F01", name: "Ut Hien", rating: 4.9 },
        stats: {
            harvestDate: "2025-12-09",
            shelfLife: "7 Days",
            origin: "Smart Garden #04",
            blockchainHash: "0x8f...2a91"
        },
        stock: 50
    },
    {
        id: "AST-9932-LOTUS",
        name: "Quantum Lotus",
        type: "Potted",
        price: 450000,
        originalPrice: 500000,
        image: "🪷",
        farmer: { id: "F02", name: "Hai Lua", rating: 5.0 },
        stats: {
            harvestDate: "Live Plant",
            shelfLife: "Perennial",
            origin: "Hydro-Zone Alpha",
            blockchainHash: "0x3c...b112"
        },
        stock: 5
    },
    {
        id: "AST-7744-CHRYS",
        name: "Neon Chrysanthemum",
        type: "Tet Special",
        price: 120000,
        originalPrice: 150000,
        image: "🌼",
        farmer: { id: "F03", name: "Ba Giao", rating: 4.8 },
        stats: {
            harvestDate: "2025-12-10",
            shelfLife: "14 Days",
            origin: "Solar Greenhouse",
            blockchainHash: "0x1d...e445"
        },
        stock: 120
    }
];

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FARMER_STORIES } from "@/lib/farmerStories";

// Mock Farmer: Picking "Uncle Ba Doi" (ID 6) as the logged-in user for Demo
const MOCK_FARMER_ID = 6;

interface FarmerContextType {
    farmerId: number;
    profile: typeof FARMER_STORIES[keyof typeof FARMER_STORIES];
    balance: number;
    totalRevenue: number;
    pendingOrders: number;
    isLoading: boolean;
    withdraw: (amount: number) => Promise<boolean>;
}

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export function MockFarmerProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState(FARMER_STORIES[MOCK_FARMER_ID]);
    const [balance, setBalance] = useState(15750000); // 15.75M VND mock balance
    const [totalRevenue, setTotalRevenue] = useState(48200000);
    const [pendingOrders, setPendingOrders] = useState(3);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data fetch delay
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const withdraw = async (amount: number) => {
        // Simulate API call
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                if (amount <= balance) {
                    setBalance(prev => prev - amount);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 2000);
        });
    };

    return (
        <FarmerContext.Provider value={{
            farmerId: MOCK_FARMER_ID,
            profile,
            balance,
            totalRevenue,
            pendingOrders,
            isLoading,
            withdraw
        }}>
            {children}
        </FarmerContext.Provider>
    );
}

export function useFarmer() {
    const context = useContext(FarmerContext);
    if (context === undefined) {
        throw new Error("useFarmer must be used within a MockFarmerProvider");
    }
    return context;
}

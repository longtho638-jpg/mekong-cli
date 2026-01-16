/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 📦 Service Package Builder Hook (Agency BOM)
 * 
 * Inspired by ERPNext Bill of Materials
 * Creates service packages with components, pricing, and margins
 */

export interface ServiceComponent {
    id: string;
    name: string;
    type: 'labor' | 'tool' | 'subscription' | 'deliverable';
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    margin: number;
    notes?: string;
}

export interface ServicePackage {
    id: string;
    name: string;
    description: string;
    category: string;
    components: ServiceComponent[];
    totalCost: number;
    totalPrice: number;
    marginPercent: number;
    status: 'draft' | 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
}

interface UseServicePackagesOptions {
    onSave?: (pkg: ServicePackage) => void;
    onError?: (error: Error) => void;
}

export function useServicePackages(options: UseServicePackagesOptions = {}) {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [currentPackage, setCurrentPackage] = useState<ServicePackage | null>(null);
    const [loading, setLoading] = useState(false);
    const { onSave, onError } = options;

    // Fetch all packages
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('service_packages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPackages(data || []);
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setLoading(false);
        }
    }, [onError]);

    // Create new package
    const createPackage = useCallback((name: string, category: string): ServicePackage => {
        const newPackage: ServicePackage = {
            id: crypto.randomUUID(),
            name,
            description: '',
            category,
            components: [],
            totalCost: 0,
            totalPrice: 0,
            marginPercent: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setCurrentPackage(newPackage);
        return newPackage;
    }, []);

    // Add component to package
    const addComponent = useCallback((component: Omit<ServiceComponent, 'id' | 'totalCost'>) => {
        if (!currentPackage) return;

        const newComponent: ServiceComponent = {
            ...component,
            id: crypto.randomUUID(),
            totalCost: component.quantity * component.unitCost,
        };

        const updatedComponents = [...currentPackage.components, newComponent];
        const totalCost = updatedComponents.reduce((sum, c) => sum + c.totalCost, 0);
        const avgMargin = updatedComponents.reduce((sum, c) => sum + c.margin, 0) / updatedComponents.length;
        const totalPrice = totalCost * (1 + avgMargin / 100);

        setCurrentPackage({
            ...currentPackage,
            components: updatedComponents,
            totalCost,
            totalPrice,
            marginPercent: avgMargin,
            updatedAt: new Date().toISOString(),
        });
    }, [currentPackage]);

    // Remove component
    const removeComponent = useCallback((componentId: string) => {
        if (!currentPackage) return;

        const updatedComponents = currentPackage.components.filter(c => c.id !== componentId);
        const totalCost = updatedComponents.reduce((sum, c) => sum + c.totalCost, 0);
        const avgMargin = updatedComponents.length > 0
            ? updatedComponents.reduce((sum, c) => sum + c.margin, 0) / updatedComponents.length
            : 0;
        const totalPrice = totalCost * (1 + avgMargin / 100);

        setCurrentPackage({
            ...currentPackage,
            components: updatedComponents,
            totalCost,
            totalPrice,
            marginPercent: avgMargin,
            updatedAt: new Date().toISOString(),
        });
    }, [currentPackage]);

    // Save package to database
    const savePackage = useCallback(async () => {
        if (!currentPackage) return;

        setLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('service_packages')
                .upsert({
                    id: currentPackage.id,
                    name: currentPackage.name,
                    description: currentPackage.description,
                    category: currentPackage.category,
                    components: currentPackage.components,
                    total_cost: currentPackage.totalCost,
                    total_price: currentPackage.totalPrice,
                    margin_percent: currentPackage.marginPercent,
                    status: currentPackage.status,
                });

            if (error) throw error;
            onSave?.(currentPackage);
            await fetchPackages();
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setLoading(false);
        }
    }, [currentPackage, onSave, onError, fetchPackages]);

    // Calculate pricing
    const calculatePricing = useCallback((targetMargin: number) => {
        if (!currentPackage) return;

        const totalPrice = currentPackage.totalCost * (1 + targetMargin / 100);
        setCurrentPackage({
            ...currentPackage,
            totalPrice,
            marginPercent: targetMargin,
            updatedAt: new Date().toISOString(),
        });
    }, [currentPackage]);

    // Clone package
    const clonePackage = useCallback((pkg: ServicePackage): ServicePackage => {
        const cloned: ServicePackage = {
            ...pkg,
            id: crypto.randomUUID(),
            name: `${pkg.name} (Copy)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setCurrentPackage(cloned);
        return cloned;
    }, []);

    return {
        packages,
        currentPackage,
        loading,
        fetchPackages,
        createPackage,
        addComponent,
        removeComponent,
        savePackage,
        calculatePricing,
        clonePackage,
        setCurrentPackage,
    };
}

export default useServicePackages;

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Megaphone, Save, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface MarketingConfig {
    landing_headline: string;
    banner_text: string;
    is_campaign_active: boolean;
}

export default function MarketingAdminPage() {
    const [config, setConfig] = useState<MarketingConfig>({
        landing_headline: "",
        banner_text: "",
        is_campaign_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/marketing', {
                headers: {
                    // In a real app, this would be auto-handled by middleware or session
                    // For now, assuming public or cookie-based, or we need to pass a token
                    // But since we are in (admin) layout, let's assume session is valid or we skip strict auth for this demo
                    'Authorization': 'Bearer placeholder_token'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            toast.error("Failed to load config");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/marketing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer placeholder_token'
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast.success("Marketing config updated!");
            } else {
                toast.error("Failed to save");
            }
        } catch (error) {
            toast.error("Error saving config");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Marketing Command Center
                    </h1>
                    <p className="text-stone-400 mt-2">Manage content, banners, and viral campaigns.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Config */}
                <Card className="bg-stone-900/50 border-stone-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Megaphone className="w-5 h-5 text-pink-500" />
                            Campaign Settings
                        </CardTitle>
                        <CardDescription>Control visibility of viral campaigns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-stone-900 border border-stone-800">
                            <div className="space-y-0.5">
                                <Label className="text-base text-white">Viral Campaign Active</Label>
                                <p className="text-sm text-stone-500">Enable Special Effects & Virtual Gift</p>
                            </div>
                            <Switch
                                checked={config.is_campaign_active}
                                onCheckedChange={(checked) => setConfig({ ...config, is_campaign_active: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Banner Config */}
                <Card className="bg-stone-900/50 border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-white">Content (Landing & Shop)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-white">Landing Page Headline</Label>
                            <Input
                                value={config.landing_headline}
                                onChange={(e) => setConfig({ ...config, landing_headline: e.target.value })}
                                className="bg-stone-900 border-stone-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Shop Banner Text</Label>
                            <Textarea
                                value={config.banner_text}
                                onChange={(e) => setConfig({ ...config, banner_text: e.target.value })}
                                className="bg-stone-900 border-stone-700 text-white min-h-[100px]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Preview (Mockup for now) */}
            <Card className="bg-stone-900/50 border-stone-800 opacity-50">
                <CardHeader>
                    <CardTitle className="text-white">Live Viral Metrics (Coming Soon)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-stone-900 rounded-lg">
                            <div className="text-2xl font-bold text-pink-500">1,204</div>
                            <div className="text-xs text-stone-500">Virtual Gifts Sent</div>
                        </div>
                        <div className="p-4 bg-stone-900 rounded-lg">
                            <div className="text-2xl font-bold text-blue-500">8.5%</div>
                            <div className="text-xs text-stone-500">Conversion Rate</div>
                        </div>
                        <div className="p-4 bg-stone-900 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-500">450</div>
                            <div className="text-xs text-stone-500">HeatMap Scans</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Save, Globe } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BackButton } from "../components/common/BackButton";

interface SettingsProps {
    onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
    // Map enum to display values
    const jurisdictionOptions = [
        { value: "US_CALIFORNIA", label: "United States - California (CCPA/CPRA)" },
        { value: "EU_GDPR", label: "Europe (GDPR)" },
        { value: "INDIA_IT_ACT", label: "India (IT Act 2000)" },
    ];
    
    // Map legacy values to new enum format
    const mapLegacyJurisdiction = (value: string): string => {
        const mapping: Record<string, string> = {
            "US-CA": "US_CALIFORNIA",
            "US-NY": "US_CALIFORNIA", // Default to CA for NY
            "EU-GDPR": "EU_GDPR",
            "UK": "EU_GDPR", // Default to GDPR for UK
        };
        return mapping[value] || value || "US_CALIFORNIA";
    };
    
    const [jurisdiction, setJurisdiction] = useState("US_CALIFORNIA");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("tc_jurisdiction");
        if (stored) {
            // Convert legacy format to new enum format
            const mapped = mapLegacyJurisdiction(stored);
            setJurisdiction(mapped);
            // Update localStorage with new format
            if (stored !== mapped) {
                localStorage.setItem("tc_jurisdiction", mapped);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("tc_jurisdiction", jurisdiction);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-white font-sans flex flex-col items-center">
            <header className="w-full max-w-2xl mb-6 md:mb-8">
                <BackButton onClick={onBack} label="Back to Dashboard" />
                <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
            </header>

            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-400" />
                        Analysis Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">Default Jurisdiction</label>
                        <p className="text-xs text-slate-500 mb-3">
                            The "Paranoid Lawyer" will cite laws specific to this region.
                        </p>
                        <select
                            value={jurisdiction}
                            onChange={(e) => setJurisdiction(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {jurisdictionOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={handleSave} className="w-full cursor-pointer" disabled={saved}>
                        {saved ? "Saved!" : <><Save className="mr-2 h-4 w-4" /> Save Preferences</>}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

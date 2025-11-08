import { Card } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle, Wrench } from "lucide-react";

interface MapStatsBarProps {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
}

export const MapStatsBar = ({ total, available, occupied, maintenance }: MapStatsBarProps) => {
    return (
        <Card className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-sm shadow-soft">
            <div className="flex gap-8 px-6 py-4">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Building2 className="h-5 w-5 text-foreground" />
                        <span className="text-2xl font-bold text-foreground">{total}</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total Rooms</p>
                </div>

                <div className="border-l border-border" />

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle2 className="h-5 w-5 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-500">{available}</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Available</p>
                </div>

                <div className="border-l border-border" />

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-600">{occupied}</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Occupied</p>
                </div>

                {maintenance > 0 && (
                    <>
                        <div className="border-l border-border" />
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Wrench className="h-5 w-5 text-yellow-600" />
                                <span className="text-2xl font-bold text-yellow-600">{maintenance}</span>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Maintenance</p>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

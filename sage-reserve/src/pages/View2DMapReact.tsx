import { FloorPlanWithObjects } from "@/components/FloorPlanWithObjects";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const View2DMap = () => {
    const navigate = useNavigate();

    return (
        <div className="w-screen h-screen bg-slate-900 flex flex-col">
            {/* Simple Navbar with Back Button */}
            <div className="w-full bg-background border-b border-border px-4 py-3 flex items-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            {/* Floor Plan */}
            <div className="flex-1 relative">
                <FloorPlanWithObjects
                    imageSrc="/plan_IMAGE.jpg"
                    svgObjectsSrc="/OBJECTS.svg"
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}; export default View2DMap;

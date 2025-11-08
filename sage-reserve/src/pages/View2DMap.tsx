import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { MapControls } from "@/components/MapControls";
import { MapSidebar } from "@/components/MapSidebar";
import { MapStatsBar } from "@/components/MapStatsBar";
import { Button } from "@/components/ui/button";
import { Menu, X, Loader2 } from "lucide-react";
import { mockRooms, Room } from "@/data/mockData";
import { useMapControls } from "@/hooks/useMapControls";
import { cn } from "@/lib/utils";
import { getSVGElementCenter, applyHighlight, removeHighlight, applyHoverEffect, removeHoverEffect } from "@/lib/svgUtils";

const View2DMap = () => {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [svgContent, setSvgContent] = useState<string>("");
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const {
        transform,
        isDragging,
        zoomIn,
        zoomOut,
        resetView,
        handleWheel,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        centerOnPoint,
        getTransformStyle,
        getCursorStyle,
    } = useMapControls({ minZoom: 0.5, maxZoom: 4, initialZoom: 1 });

    // Load SVG file
    useEffect(() => {
        const loadSVG = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("../../public/OBJECTS.svg");
                const text = await response.text();
                setSvgContent(text);

                // Simulate loading for smooth transition
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);
            } catch (error) {
                console.error("Error loading SVG:", error);
                setIsLoading(false);
            }
        };

        loadSVG();
    }, []);

    // Setup SVG interactions after content is loaded
    useEffect(() => {
        if (!svgContent || !svgRef.current) return;

        const svg = svgRef.current;
        const polygons = svg.querySelectorAll("polygon, path, rect, circle");
        const eventHandlers = new Map<Element, { click: EventListener; mouseenter: EventListener; mouseleave: EventListener; mousemove: EventListener }>();

        polygons.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const elementId = htmlElement.getAttribute("id");
            const room = mockRooms.find((r) => r.svgId === elementId);

            if (room) {
                // Add CSS classes
                htmlElement.classList.add("room-polygon");
                htmlElement.classList.add(room.available ? "available" : "occupied");

                // Base styles
                htmlElement.style.cursor = "pointer";
                htmlElement.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                htmlElement.style.stroke = "hsl(var(--foreground))";
                htmlElement.style.strokeWidth = "2";
                htmlElement.style.vectorEffect = "non-scaling-stroke";

                // Set fill color based on availability
                if (room.available) {
                    htmlElement.style.fill = "hsl(var(--primary))";
                    htmlElement.style.fillOpacity = "0.3";
                } else {
                    htmlElement.style.fill = "hsl(var(--destructive))";
                    htmlElement.style.fillOpacity = "0.3";
                }

                // Event handlers with optimized utility functions
                const clickHandler = (e: Event) => {
                    e.stopPropagation();
                    handleRoomClick(room, element as SVGGraphicsElement);
                };

                const mouseenterHandler = (e: Event) => {
                    if (selectedRoom?.id !== room.id) {
                        handleRoomHover(room, e as MouseEvent);
                        applyHoverEffect(htmlElement);
                    }
                };

                const mouseleaveHandler = () => {
                    if (selectedRoom?.id !== room.id) {
                        setHoveredRoom(null);
                        removeHoverEffect(htmlElement);
                    }
                };

                const mousemoveHandler = (e: Event) => {
                    updateTooltipPosition(e as MouseEvent);
                };

                // Store handlers for cleanup
                eventHandlers.set(element, {
                    click: clickHandler,
                    mouseenter: mouseenterHandler,
                    mouseleave: mouseleaveHandler,
                    mousemove: mousemoveHandler,
                });

                // Add event listeners
                htmlElement.addEventListener("click", clickHandler);
                htmlElement.addEventListener("mouseenter", mouseenterHandler);
                htmlElement.addEventListener("mouseleave", mouseleaveHandler);
                htmlElement.addEventListener("mousemove", mousemoveHandler);
            }
        });

        // Cleanup function
        return () => {
            eventHandlers.forEach((handlers, element) => {
                element.removeEventListener("click", handlers.click);
                element.removeEventListener("mouseenter", handlers.mouseenter);
                element.removeEventListener("mouseleave", handlers.mouseleave);
                element.removeEventListener("mousemove", handlers.mousemove);
            });
            eventHandlers.clear();
        };
    }, [svgContent]);

    // Separate effect for highlighting selected room with optimized rendering
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        const polygons = svg.querySelectorAll("polygon, path, rect");

        // Use requestAnimationFrame for smooth visual updates
        requestAnimationFrame(() => {
            polygons.forEach((element) => {
                const htmlElement = element as HTMLElement;
                const elementId = htmlElement.getAttribute("id");
                const room = mockRooms.find((r) => r.svgId === elementId);

                if (room) {
                    if (selectedRoom?.id === room.id) {
                        // Apply highlight to selected room
                        applyHighlight(htmlElement);
                        htmlElement.classList.add('selected');

                        // Ensure it's visible on top
                        htmlElement.style.position = 'relative';
                    } else {
                        // Remove selected class
                        htmlElement.classList.remove('selected');
                        htmlElement.style.position = '';

                        // Reset non-selected rooms
                        if (!hoveredRoom || hoveredRoom.id !== room.id) {
                            removeHighlight(htmlElement, room.available);
                        }
                    }
                }
            });
        });
    }, [selectedRoom, hoveredRoom]);

    const handleRoomClick = useCallback((room: Room, element?: SVGGraphicsElement) => {
        setSelectedRoom(room);

        // Calculate center from actual SVG element if available
        if (svgRef.current && mapContainerRef.current) {
            let centerX = room.coordinates?.x || 0;
            let centerY = room.coordinates?.y || 0;

            // If we have the SVG element, calculate its actual center
            if (element) {
                const center = getSVGElementCenter(element);
                centerX = center.x;
                centerY = center.y;
            } else if (room.svgId) {
                // Try to find the element by ID
                const svgElement = svgRef.current.querySelector(`#${room.svgId}`) as SVGGraphicsElement;
                if (svgElement) {
                    const center = getSVGElementCenter(svgElement);
                    centerX = center.x;
                    centerY = center.y;
                }
            }

            const rect = mapContainerRef.current.getBoundingClientRect();
            // Use higher zoom level for better focus
            centerOnPoint(centerX, centerY, rect.width, rect.height, 2.8);
        }
    }, [centerOnPoint, svgRef]);

    const handleRoomHover = useCallback((room: Room, event: MouseEvent) => {
        setHoveredRoom(room);
        updateTooltipPosition(event);
    }, []);

    const updateTooltipPosition = (event: MouseEvent) => {
        setTooltipPosition({
            x: event.clientX + 15,
            y: event.clientY + 15,
        });
    };

    const handleRoomSelect = useCallback((room: Room) => {
        handleRoomClick(room);
    }, [handleRoomClick]);

    const stats = {
        total: mockRooms.length,
        available: mockRooms.filter((r) => r.available).length,
        occupied: mockRooms.filter((r) => !r.available).length,
        maintenance: 0,
    };

    // Wheel event handler
    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        const wheelHandler = (e: WheelEvent) => {
            handleWheel(e);
        };

        container.addEventListener("wheel", wheelHandler, { passive: false });

        return () => {
            container.removeEventListener("wheel", wheelHandler);
        };
    }, [handleWheel]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="flex h-[calc(100vh-64px)] relative">
                {/* Sidebar */}
                <div
                    className={cn(
                        "transition-transform duration-300 ease-in-out",
                        !isSidebarOpen && "-translate-x-full"
                    )}
                >
                    <MapSidebar
                        rooms={mockRooms}
                        selectedRoomId={selectedRoom?.id || null}
                        onRoomSelect={handleRoomSelect}
                        isCollapsed={!isSidebarOpen}
                    />
                </div>

                {/* Main Map Area */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Toggle Sidebar Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute left-6 top-6 z-50 bg-card/95 backdrop-blur-sm shadow-soft hover:shadow-hover transition-all"
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    {/* Stats Bar */}
                    <MapStatsBar {...stats} />

                    {/* Map Controls */}
                    <MapControls
                        zoom={transform.zoom}
                        onZoomIn={zoomIn}
                        onZoomOut={zoomOut}
                        onReset={resetView}
                    />

                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                            <div className="text-center">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">Loading floor plan...</p>
                            </div>
                        </div>
                    )}

                    {/* Map Container */}
                    <div
                        ref={mapContainerRef}
                        className={cn(
                            "w-full h-full overflow-hidden bg-muted/30",
                            getCursorStyle()
                        )}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div
                            style={getTransformStyle()}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {svgContent && (
                                <div
                                    dangerouslySetInnerHTML={{ __html: svgContent }}
                                    ref={(el) => {
                                        if (el) {
                                            const svg = el.querySelector("svg");
                                            if (svg) {
                                                svgRef.current = svg;
                                                svg.style.maxWidth = "100%";
                                                svg.style.maxHeight = "100%";
                                                svg.style.display = "block";
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Tooltip for hovered room */}
                    {hoveredRoom && !selectedRoom && (
                        <div
                            className="fixed z-[100] pointer-events-none animate-in fade-in duration-200"
                            style={{
                                left: `${tooltipPosition.x}px`,
                                top: `${tooltipPosition.y}px`,
                            }}
                        >
                            <div className="bg-popover/95 backdrop-blur-sm text-popover-foreground rounded-lg shadow-lg p-4 max-w-xs border border-border">
                                <h4 className="font-semibold text-sm mb-2">{hoveredRoom.name}</h4>
                                <div className="text-xs space-y-1 text-muted-foreground">
                                    <p>Capacity: {hoveredRoom.capacity} people</p>
                                    <p>Price: ${hoveredRoom.price}/hour</p>
                                    <p>Status: {hoveredRoom.available ? "Available" : "Occupied"}</p>
                                </div>
                                {hoveredRoom.amenities && hoveredRoom.amenities.length > 0 && (
                                    <div className="mt-2 text-xs">
                                        <p className="font-medium mb-1">Amenities:</p>
                                        <p className="text-muted-foreground">
                                            {hoveredRoom.amenities.slice(0, 3).join(", ")}
                                            {hoveredRoom.amenities.length > 3 && "..."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Selected room info card */}
                    {selectedRoom && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
                            <div className="bg-card/95 backdrop-blur-sm text-card-foreground rounded-lg shadow-2xl p-6 max-w-md border-2 border-[#52c41a] shadow-[0_0_20px_rgba(82,196,26,0.3)]">
                                {/* Selected Badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#52c41a] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                    ✓ SELECTED
                                </div>

                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1 text-[#52c41a]">{selectedRoom.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedRoom(null)}
                                        className="h-8 w-8 hover:bg-red-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-bold">{selectedRoom.capacity}</span>
                                        </div>
                                        <span className="text-muted-foreground">people</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-bold">${selectedRoom.price}</span>
                                        </div>
                                        <span className="text-muted-foreground">/hour</span>
                                    </div>
                                </div>
                                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Amenities</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRoom.amenities.map((amenity, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button
                                    className="w-full mt-4"
                                    onClick={() => {
                                        // Navigate to booking page or handle booking
                                        window.location.href = `/booking/${selectedRoom.id}`;
                                    }}
                                >
                                    Book This Room
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced CSS for room polygons */}
            <style>{`
        .room-polygon {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          will-change: transform, filter, stroke-width, fill-opacity, fill, stroke;
          transform-box: fill-box;
        }
        
        .room-polygon:hover {
          transform: scale(1.01);
          transform-origin: center;
        }
        
        .room-polygon.available {
          fill: hsl(var(--primary));
        }
        
        .room-polygon.occupied {
          fill: hsl(var(--destructive));
        }

        /* Highlight animation for selected room */
        @keyframes pulse-highlight {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(82, 196, 26, 0.9)) drop-shadow(0 0 10px rgba(82, 196, 26, 0.9));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(82, 196, 26, 1)) drop-shadow(0 0 15px rgba(82, 196, 26, 1));
          }
        }

        /* Apply pulse to selected rooms */
        .room-polygon.selected {
          animation: pulse-highlight 2s ease-in-out infinite;
        }

        /* Performance optimizations */
        svg {
          shape-rendering: geometricPrecision;
        }

        /* Disable pointer events on non-room elements */
        svg > *:not(.room-polygon) {
          pointer-events: none;
        }

        /* Ensure selected room is always on top */
        .room-polygon.selected {
          position: relative;
          z-index: 100 !important;
        }
      `}</style>
        </div>
    );
};

export default View2DMap;

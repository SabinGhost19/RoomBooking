import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { parseSVG, groupByShape, assignColorsToGroups, SVGElement } from '@/utils/svgParser';
import { ShapeComponent } from '@/components/ShapeComponents';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ReactMapViewProps {
    svgContent: string;
    onElementClick?: (element: SVGElement) => void;
    className?: string;
}

export const ReactMapView: React.FC<ReactMapViewProps> = ({
    svgContent,
    onElementClick,
    className = ''
}) => {
    const [parsedData, setParsedData] = useState<ReturnType<typeof parseSVG> | null>(null);
    const [colorMap, setColorMap] = useState<Map<string, string>>(new Map());
    const [selectedElement, setSelectedElement] = useState<SVGElement | null>(null);
    const [scale, setScale] = useState(1);
    const [isParsing, setIsParsing] = useState(true);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    // Parse SVG content with performance tracking
    useEffect(() => {
        if (!svgContent) return;

        const parse = async () => {
            try {
                setIsParsing(true);
                const startTime = performance.now();

                // Parse in chunks to avoid blocking UI
                await new Promise(resolve => setTimeout(resolve, 50));

                const parsed = parseSVG(svgContent);
                setParsedData(parsed);

                // Group elements and assign colors
                const groups = groupByShape(parsed.elements);
                const colors = assignColorsToGroups(groups);
                setColorMap(colors);

                const parseTime = performance.now() - startTime;
                console.log(`✅ Parsed ${parsed.elements.length} elements in ${parseTime.toFixed(2)}ms`);
                console.log(`📊 Created ${groups.size} shape groups`);
                console.log(`📈 Statistics:`, parsed.statistics);
            } catch (error) {
                console.error('❌ Error parsing SVG:', error);
            } finally {
                setIsParsing(false);
            }
        };

        parse();
    }, [svgContent]);

    // Calculate scale to fit container
    useEffect(() => {
        if (!parsedData || !containerRef.current) return;

        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const svgWidth = parsedData.viewBox.width;
            const svgHeight = parsedData.viewBox.height;

            const scaleX = containerWidth / svgWidth;
            const scaleY = containerHeight / svgHeight;
            const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

            setScale(newScale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [parsedData]);

    // Handle element click
    const handleElementClick = useCallback((element: SVGElement) => {
        setSelectedElement(element);
        onElementClick?.(element);
    }, [onElementClick]);

    // Get color for element based on its group (memoized)
    const getElementColor = useCallback((element: SVGElement): string => {
        const key = element.shapeSignature || `${element.type}-unknown`;
        return colorMap.get(key) || '#94a3b8';
    }, [colorMap]);

    // Viewport culling - only render visible elements
    const visibleElements = useMemo(() => {
        if (!parsedData || !containerRef.current) return [];

        const container = containerRef.current;
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        // Calculate visible bounds with padding for smooth scrolling
        const padding = 200; // pixels
        const minX = (-pan.x - padding) / scale;
        const maxX = (-pan.x + viewportWidth + padding) / scale;
        const minY = (-pan.y - padding) / scale;
        const maxY = (-pan.y + viewportHeight + padding) / scale;

        return parsedData.elements.filter(element => {
            const { bounds } = element;
            return !(
                bounds.x + bounds.width < minX ||
                bounds.x > maxX ||
                bounds.y + bounds.height < minY ||
                bounds.y > maxY
            );
        });
    }, [parsedData, scale, pan]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev * 1.3, 10));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev / 1.3, 0.1));
    }, []);

    const handleResetView = useCallback(() => {
        if (!parsedData || !containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const svgWidth = parsedData.viewBox.width;
        const svgHeight = parsedData.viewBox.height;

        const scaleX = containerWidth / svgWidth;
        const scaleY = containerHeight / svgHeight;
        const newScale = Math.min(scaleX, scaleY) * 0.9;

        setScale(newScale);
        setPan({ x: 0, y: 0 });
    }, [parsedData]);

    // Pan/drag controls
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0 && e.target === mapRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.1, Math.min(10, prev * delta)));
    }, []);

    if (isParsing) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground">
                        Parsing floor plan...
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Processing 10,000+ elements
                    </p>
                </div>
            </div>
        );
    }

    if (!parsedData) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`}>
                <div className="text-center">
                    <p className="text-lg font-medium text-destructive">Failed to parse SVG</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Please check the SVG file format
                    </p>
                </div>
            </div>
        );
    }

    const { viewBox, elements } = parsedData;
    const mapWidth = viewBox.width * scale;
    const mapHeight = viewBox.height * scale;

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden bg-slate-100 ${className}`}
            onWheel={handleWheel}
        >
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
                <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-slate-100 rounded transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="h-5 w-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-slate-100 rounded transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="h-5 w-5" />
                </button>
                <button
                    onClick={handleResetView}
                    className="p-2 hover:bg-slate-100 rounded transition-colors"
                    title="Reset View"
                >
                    <Maximize2 className="h-5 w-5" />
                </button>
            </div>

            {/* Map container with pan support */}
            <div
                ref={mapRef}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    overflow: 'hidden'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        position: 'relative',
                        width: `${mapWidth}px`,
                        height: `${mapHeight}px`,
                        transform: `translate(${pan.x}px, ${pan.y}px)`,
                        transformOrigin: '0 0',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        margin: '50px',
                    }}
                    className="map-canvas"
                >
                    {/* Render only visible elements (viewport culling) */}
                    {visibleElements.map((element, index) => (
                        <ShapeComponent
                            key={`${element.id}-${index}`}
                            element={element}
                            color={getElementColor(element)}
                            scale={scale}
                            onClick={() => handleElementClick(element)}
                            isSelected={selectedElement?.id === element.id}
                            isVisible={true}
                        />
                    ))}
                </div>
            </div>

            {/* Selected Element Info Card */}
            {selectedElement && (
                <div className="absolute bottom-4 left-4 bg-white/98 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 max-w-sm z-40">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">Selected Element</h3>
                        <button
                            onClick={() => setSelectedElement(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">ID:</span>
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                {selectedElement.id}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Type:</span>
                            <span className="capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                {selectedElement.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Position:</span>
                            <span className="font-mono text-xs">
                                ({Math.round(selectedElement.bounds.x)}, {Math.round(selectedElement.bounds.y)})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Size:</span>
                            <span className="font-mono text-xs">
                                {Math.round(selectedElement.bounds.width)} × {Math.round(selectedElement.bounds.height)} px
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Area:</span>
                            <span className="font-mono text-xs">
                                {selectedElement.area?.toFixed(0)} px²
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Color:</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block w-6 h-6 rounded border-2 border-slate-300 shadow-sm"
                                    style={{ backgroundColor: getElementColor(selectedElement) }}
                                />
                                <span className="font-mono text-xs text-slate-500">
                                    {getElementColor(selectedElement)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats overlay */}
            <div className="absolute top-4 left-4 bg-white/98 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-200 z-40">
                <h3 className="font-bold text-sm mb-3 text-slate-700">Map Statistics</h3>
                <div className="text-xs space-y-2">
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-600">Total Elements:</span>
                        <span className="font-bold text-slate-900">{elements.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-600">Visible:</span>
                        <span className="font-bold text-amber-600">{visibleElements.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-600">Shape Groups:</span>
                        <span className="font-bold text-blue-600">{colorMap.size}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-600">Zoom:</span>
                        <span className="font-bold text-purple-600">{(scale * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                    <p>🖱️ Drag to pan</p>
                    <p>🔍 Scroll to zoom</p>
                    <p>👆 Click shapes to select</p>
                </div>
            </div>
        </div>
    );
};

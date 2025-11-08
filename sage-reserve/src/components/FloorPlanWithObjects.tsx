import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, DollarSign, Wifi, Coffee, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRooms, getRoom, getRoomBookings, type Room as RoomType, type Booking } from '@/lib/roomsApi';

interface SVGObject {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    title?: string; // Optional title from <title> element
    properties: Record<string, string>;
}

interface RoomDetailedData {
    room: RoomType;
    upcomingBookings: Booking[];
    todayBookings: Booking[];
    isAvailableNow: boolean;
    nextAvailableTime?: string;
    loadedAt: number;
}

interface FloorPlanWithObjectsProps {
    imageSrc: string;
    svgObjectsSrc: string;
    className?: string;
}

export const FloorPlanWithObjects: React.FC<FloorPlanWithObjectsProps> = ({
    imageSrc,
    svgObjectsSrc,
    className = ''
}) => {
    const navigate = useNavigate();
    const [objects, setObjects] = useState<SVGObject[]>([]);
    const [rooms, setRooms] = useState<Map<string, RoomType>>(new Map());
    const [roomDetails, setRoomDetails] = useState<Map<string, RoomDetailedData>>(new Map());
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
    const [hoveredObject, setHoveredObject] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [svgViewBox, setSvgViewBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Load rooms from API
    useEffect(() => {
        const loadRooms = async () => {
            try {
                console.log('🔄 Loading rooms from API...');
                const roomsData = await getRooms({ limit: 1000 });
                const roomsMap = new Map<string, RoomType>();

                roomsData.forEach(room => {
                    if (room.svg_id) {
                        roomsMap.set(room.svg_id, room);
                    }
                });

                console.log(`✅ Loaded ${roomsMap.size} rooms from API`);
                setRooms(roomsMap);
            } catch (error) {
                console.error('❌ Error loading rooms:', error);
            }
        };

        loadRooms();
    }, []);

    // Load detailed room data on hover
    const loadRoomDetails = async (svgId: string, roomId: number) => {
        // Check if we already have recent data (less than 30 seconds old)
        const existing = roomDetails.get(svgId);
        if (existing && Date.now() - existing.loadedAt < 30000) {
            console.log(`📦 Using cached data for room ${roomId}`);
            return;
        }

        // Check if already loading
        if (loadingDetails.has(svgId)) {
            console.log(`⏳ Already loading data for room ${roomId}`);
            return;
        }

        try {
            setLoadingDetails(prev => new Set(prev).add(svgId));
            console.log(`🔄 Loading detailed data for room ${roomId} (SVG: ${svgId})`);

            // Fetch room details and bookings in parallel
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

            const [roomData, todayBookingsData, upcomingBookingsData] = await Promise.all([
                getRoom(roomId),
                getRoomBookings(roomId, today, today, 'upcoming').catch(() => []),
                getRoomBookings(roomId, tomorrow, nextWeek, 'upcoming').catch(() => [])
            ]);

            // Calculate if available now
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            let isAvailableNow = roomData.is_available;
            let nextAvailableTime: string | undefined;

            if (todayBookingsData.length > 0) {
                const sortedBookings = [...todayBookingsData].sort((a, b) =>
                    a.start_time.localeCompare(b.start_time)
                );

                for (const booking of sortedBookings) {
                    const [startHour, startMin] = booking.start_time.split(':').map(Number);
                    const [endHour, endMin] = booking.end_time.split(':').map(Number);
                    const bookingStart = startHour * 60 + startMin;
                    const bookingEnd = endHour * 60 + endMin;

                    if (currentTime >= bookingStart && currentTime < bookingEnd) {
                        isAvailableNow = false;
                        // Find next available time
                        const nextBooking = sortedBookings.find(b => {
                            const [h, m] = b.start_time.split(':').map(Number);
                            return h * 60 + m > bookingEnd;
                        });

                        if (nextBooking) {
                            nextAvailableTime = nextBooking.start_time;
                        } else {
                            nextAvailableTime = booking.end_time;
                        }
                        break;
                    }
                }
            }

            const detailedData: RoomDetailedData = {
                room: roomData,
                upcomingBookings: upcomingBookingsData,
                todayBookings: todayBookingsData,
                isAvailableNow,
                nextAvailableTime,
                loadedAt: Date.now()
            };

            setRoomDetails(prev => {
                const newMap = new Map(prev);
                newMap.set(svgId, detailedData);
                return newMap;
            });

            console.log(`✅ Loaded detailed data for ${roomData.name}:`, {
                todayBookings: todayBookingsData.length,
                upcomingBookings: upcomingBookingsData.length,
                isAvailableNow,
                nextAvailableTime
            });

        } catch (error) {
            console.error(`❌ Error loading room details for ${svgId}:`, error);
        } finally {
            setLoadingDetails(prev => {
                const newSet = new Set(prev);
                newSet.delete(svgId);
                return newSet;
            });
        }
    };

    // Handle hover - trigger detailed data loading
    const handleObjectHover = (svgId: string) => {
        setHoveredObject(svgId);

        const room = rooms.get(svgId);
        if (room) {
            loadRoomDetails(svgId, room.id);
        }
    };

    // Parse SVG to extract objects
    useEffect(() => {
        const loadSVG = async () => {
            try {
                console.log('🔄 Loading SVG from:', svgObjectsSrc);
                const response = await fetch(svgObjectsSrc);
                const svgText = await response.text();
                console.log('📄 SVG loaded, length:', svgText.length);

                // Parse the SVG
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;

                // Get viewBox
                const viewBox = svgElement.getAttribute('viewBox');
                console.log('📐 ViewBox:', viewBox);
                if (viewBox) {
                    const [x, y, width, height] = viewBox.split(' ').map(Number);
                    setSvgViewBox({ x, y, width, height });
                    console.log('📐 ViewBox set:', { x, y, width, height });
                }

                // Check for group transforms
                let groupTransformX = 0;
                let groupTransformY = 0;
                const groups = svgDoc.querySelectorAll('g[transform]');
                if (groups.length > 0) {
                    const transformAttr = groups[0].getAttribute('transform');
                    console.log('🔄 Group transform:', transformAttr);
                    if (transformAttr) {
                        const translateMatch = transformAttr.match(/translate\(([-\d.]+),([-\d.]+)\)/);
                        if (translateMatch) {
                            groupTransformX = parseFloat(translateMatch[1]);
                            groupTransformY = parseFloat(translateMatch[2]);
                            console.log('📍 Transform offset:', { x: groupTransformX, y: groupTransformY });
                        }
                    }
                }

                // Extract all rect elements
                const rects = svgDoc.querySelectorAll('rect');
                console.log('🔢 Found rect elements:', rects.length);
                const parsedObjects: SVGObject[] = [];

                rects.forEach((rect) => {
                    const id = rect.getAttribute('id') || `rect-${parsedObjects.length}`;
                    // Get raw coordinates from rect
                    const rawX = parseFloat(rect.getAttribute('x') || '0');
                    const rawY = parseFloat(rect.getAttribute('y') || '0');
                    const width = parseFloat(rect.getAttribute('width') || '0');
                    const height = parseFloat(rect.getAttribute('height') || '0');

                    // Apply group transform - coordinates in viewBox space after transform
                    const x = rawX + groupTransformX;
                    const y = rawY + groupTransformY;

                    console.log(`📍 ${id}: raw(${rawX}, ${rawY}) -> transformed(${x}, ${y})`);
                    const fill = rect.getAttribute('style')?.match(/fill:(#[0-9a-fA-F]{6})/)?.[1]
                        || rect.getAttribute('fill')
                        || '#cccccc';

                    // Extract title element if exists
                    const titleElement = rect.querySelector('title');
                    const title = titleElement?.textContent || undefined;

                    // Get all attributes as properties
                    const properties: Record<string, string> = {};
                    Array.from(rect.attributes).forEach(attr => {
                        properties[attr.name] = attr.value;
                    });

                    parsedObjects.push({
                        id,
                        type: 'rect',
                        x,
                        y,
                        width,
                        height,
                        fill,
                        title,
                        properties
                    });
                });

                console.log(`✅ Loaded ${parsedObjects.length} objects from SVG`);
                console.log('📊 Parsed objects with coordinates:');
                parsedObjects.forEach(obj => {
                    console.log(`  - ${obj.id}: (${obj.x.toFixed(2)}, ${obj.y.toFixed(2)}) ${obj.width.toFixed(2)}x${obj.height.toFixed(2)}`);
                });
                console.log('📐 ViewBox:', svgViewBox);
                setObjects(parsedObjects);
            } catch (error) {
                console.error('❌ Error loading SVG objects:', error);
            }
        };

        loadSVG();
    }, [svgObjectsSrc]);

    // Load image to get dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;
        const displayWidth = img.clientWidth;
        const displayHeight = img.clientHeight;
        console.log('🖼️ Image loaded:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: displayWidth,
            displayHeight: displayHeight
        });
        // Use the displayed dimensions (after object-contain scaling)
        setImageDimensions({
            width: displayWidth,
            height: displayHeight
        });
        setImageLoaded(true);
    };

    // Convert SVG coordinates to percentage-based positioning relative to the current image
    const convertCoordinates = (obj: SVGObject) => {
        if (svgViewBox.width === 0 || svgViewBox.height === 0 || imageDimensions.width === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        // IMPORTANT: Considerăm că SVG ViewBox ar trebui să corespundă cu dimensiunea imaginii (2279x738)
        const TARGET_IMAGE_WIDTH = 2279;
        const TARGET_IMAGE_HEIGHT = 738;

        // Imaginea noastră actuală
        const CURRENT_IMAGE_WIDTH = imageDimensions.width;
        const CURRENT_IMAGE_HEIGHT = imageDimensions.height;

        // SVG viewBox dimensions (197.05701 x 585.7865) - rescalăm la 2279x738
        const svgWidth = svgViewBox.width;
        const svgHeight = svgViewBox.height;
        // Step 1: Scale de la SVG viewBox la imaginea TARGET (2279x738)
        const scaleToTargetX = TARGET_IMAGE_WIDTH / svgWidth;
        const scaleToTargetY = TARGET_IMAGE_HEIGHT / svgHeight;

        const pixelOnTargetX = (obj.x - svgViewBox.x) * scaleToTargetX;
        const pixelOnTargetY = (obj.y - svgViewBox.y) * scaleToTargetY;
        const pixelOnTargetWidth = obj.width * scaleToTargetX;
        const pixelOnTargetHeight = obj.height * scaleToTargetY;

        // Step 2: Scale de la imaginea TARGET la imaginea CURENTĂ (dacă e diferită)
        const scaleToCurrentX = CURRENT_IMAGE_WIDTH / TARGET_IMAGE_WIDTH;
        const scaleToCurrentY = CURRENT_IMAGE_HEIGHT / TARGET_IMAGE_HEIGHT;

        const pixelX = pixelOnTargetX * scaleToCurrentX;
        const pixelY = pixelOnTargetY * scaleToCurrentY;
        const pixelWidth = pixelOnTargetWidth * scaleToCurrentX;
        const pixelHeight = pixelOnTargetHeight * scaleToCurrentY;        // Step 3: Convertim la procente pentru CSS positioning
        const xPercent = (pixelX / CURRENT_IMAGE_WIDTH) * 100;
        const yPercent = (pixelY / CURRENT_IMAGE_HEIGHT) * 100;
        const widthPercent = (pixelWidth / CURRENT_IMAGE_WIDTH) * 100;
        const heightPercent = (pixelHeight / CURRENT_IMAGE_HEIGHT) * 100;

        // Log detailat pentru debugging
        if (obj.id === 'rect1' || obj.id === 'BILIARD') {
            console.log(`\n🎯 Converting ${obj.id}:`);
            console.log(`  📏 SVG Coords: x=${obj.x.toFixed(2)}, y=${obj.y.toFixed(2)}, w=${obj.width.toFixed(2)}, h=${obj.height.toFixed(2)}`);
            console.log(`  📐 SVG ViewBox: ${svgViewBox.x} ${svgViewBox.y} ${svgWidth.toFixed(2)} ${svgHeight.toFixed(2)}`);
            console.log(`  🎯 Step 1 - Target image (2279x738): x=${pixelOnTargetX.toFixed(1)}px, y=${pixelOnTargetY.toFixed(1)}px, w=${pixelOnTargetWidth.toFixed(1)}px, h=${pixelOnTargetHeight.toFixed(1)}px`);
            console.log(`  🖼️ Step 2 - Current image (${CURRENT_IMAGE_WIDTH}x${CURRENT_IMAGE_HEIGHT}): x=${pixelX.toFixed(1)}px, y=${pixelY.toFixed(1)}px, w=${pixelWidth.toFixed(1)}px, h=${pixelHeight.toFixed(1)}px`);
            console.log(`  📊 Final percentages: x=${xPercent.toFixed(2)}%, y=${yPercent.toFixed(2)}%, w=${widthPercent.toFixed(2)}%, h=${heightPercent.toFixed(2)}%\n`);
        }

        return {
            x: xPercent,
            y: yPercent,
            width: widthPercent,
            height: heightPercent
        };
    };

    return (
        <TooltipProvider>
            <div className={`relative w-full h-full ${className}`}>
                {/* Background Image - Hidden */}
                <img
                    src={imageSrc}
                    alt="Floor Plan"
                    className="w-full h-full object-contain opacity-0"
                    onLoad={handleImageLoad}
                    onError={(e) => {
                        console.error('❌ Error loading image:', imageSrc);
                        console.error('Error event:', e);
                    }}
                />


                {/* Overlay Container - aligned with image top-left corner */}
                {imageLoaded && objects.length > 0 && (
                    <div
                        className="absolute top-0 left-0"
                        style={{
                            pointerEvents: 'none',
                            width: `${imageDimensions.width}px`,
                            height: `${imageDimensions.height}px`,
                        }}
                    >
                        {/* React Components for each SVG object */}
                        {objects.map((obj) => {
                            const coords = convertCoordinates(obj);
                            const isWall = obj.id.toLowerCase().includes('wall');
                            const isBlueBlocked = obj.fill.toLowerCase() === '#000080';
                            const isDisabled = isWall || isBlueBlocked;
                            const isHovered = hoveredObject === obj.id && !isDisabled;

                            // Log pentru primul obiect
                            if (obj.id === 'rect1') {
                                console.log(`🎨 Rendering ${obj.id}:`, {
                                    percentages: coords,
                                    containerSize: { w: imageDimensions.width, h: imageDimensions.height },
                                    actualPixels: {
                                        x: (coords.x / 100) * imageDimensions.width,
                                        y: (coords.y / 100) * imageDimensions.height,
                                        w: (coords.width / 100) * imageDimensions.width,
                                        h: (coords.height / 100) * imageDimensions.height,
                                    }
                                });
                            }

                            return (
                                <Tooltip key={obj.id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`absolute transition-all duration-200 flex items-center justify-center ${isDisabled ? '' : 'cursor-pointer'}`}
                                            style={{
                                                left: `${coords.x}%`,
                                                top: `${coords.y}%`,
                                                width: `${coords.width}%`,
                                                height: `${coords.height}%`,
                                                backgroundColor: isHovered
                                                    ? obj.fill
                                                    : `${obj.fill}80`, // Add transparency
                                                opacity: isHovered ? 0.9 : 0.6,
                                                border: isHovered ? '3px solid white' : '2px solid rgba(255,255,255,0.5)',
                                                boxShadow: isHovered
                                                    ? '0 4px 12px rgba(0,0,0,0.4)'
                                                    : '0 2px 4px rgba(0,0,0,0.2)',
                                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                                zIndex: isHovered ? 20 : 10,
                                                pointerEvents: isDisabled ? 'none' : 'auto',
                                                borderRadius: '2px',
                                            }}
                                            onMouseEnter={() => !isDisabled && handleObjectHover(obj.id)}
                                            onMouseLeave={() => !isDisabled && setHoveredObject(null)}
                                        >
                                            {/* Display title only on hover */}
                                            {obj.title && isHovered && (
                                                <span className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none px-2 py-1 text-center">
                                                    {obj.title}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="max-w-md bg-slate-900 text-white border-slate-700 p-0"
                                    >
                                        {(() => {
                                            const roomData = rooms.get(obj.id);
                                            const detailedData = roomDetails.get(obj.id);
                                            const isLoading = loadingDetails.has(obj.id);

                                            if (roomData) {
                                                // Use detailed data if available, otherwise use basic room data
                                                const displayData = detailedData?.room || roomData;
                                                const isAvailableNow = detailedData?.isAvailableNow ?? roomData.is_available;

                                                return (
                                                    <div className="p-4 space-y-3">
                                                        {/* Room Name & Status */}
                                                        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
                                                            <div>
                                                                <div className="font-bold text-lg text-white">
                                                                    {displayData.name}
                                                                </div>
                                                                <div className="text-xs text-slate-400 mt-1">
                                                                    {displayData.description}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="flex items-center gap-1 text-xs">
                                                                    {isAvailableNow ? (
                                                                        <>
                                                                            <CheckCircle className="h-4 w-4 text-amber-400" />
                                                                            <span className="text-amber-400 font-semibold">Available Now</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="h-4 w-4 text-red-400" />
                                                                            <span className="text-red-400 font-semibold">Occupied</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {!isAvailableNow && detailedData?.nextAvailableTime && (
                                                                    <div className="text-xs text-slate-400">
                                                                        Free at {detailedData.nextAvailableTime}
                                                                    </div>
                                                                )}
                                                                {isLoading && (
                                                                    <div className="text-xs text-blue-400 animate-pulse">
                                                                        Loading...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>                                                        {/* Room Details */}
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-blue-400" />
                                                                <div>
                                                                    <div className="text-slate-400 text-xs">Capacity</div>
                                                                    <div className="text-white font-medium">{displayData.capacity} {displayData.capacity === 1 ? 'person' : 'people'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="h-4 w-4 text-amber-400" />
                                                                <div>
                                                                    <div className="text-slate-400 text-xs">Price</div>
                                                                    <div className="text-white font-medium">${displayData.price}/hr</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Today's Bookings */}
                                                        {detailedData && detailedData.todayBookings.length > 0 && (
                                                            <div className="border-t border-slate-700 pt-3">
                                                                <div className="text-xs text-slate-400 mb-2 font-semibold">Today's Schedule ({detailedData.todayBookings.length})</div>
                                                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                                                    {detailedData.todayBookings.slice(0, 3).map((booking, idx) => (
                                                                        <div key={idx} className="text-xs flex items-center gap-2 bg-slate-800/50 p-2 rounded">
                                                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                                            <span className="text-white font-medium">
                                                                                {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                                            </span>
                                                                            <span className="text-slate-400 text-[10px]">
                                                                                ({booking.status})
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {detailedData.todayBookings.length > 3 && (
                                                                        <div className="text-xs text-slate-500 text-center">
                                                                            +{detailedData.todayBookings.length - 3} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Upcoming Bookings */}
                                                        {detailedData && detailedData.upcomingBookings.length > 0 && (
                                                            <div className="border-t border-slate-700 pt-3">
                                                                <div className="text-xs text-slate-400 mb-2 font-semibold">Next 7 Days ({detailedData.upcomingBookings.length} bookings)</div>
                                                                <div className="text-xs text-slate-300">
                                                                    {detailedData.upcomingBookings.length} upcoming reservations
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Amenities */}
                                                        {displayData.amenities && displayData.amenities.length > 0 && (
                                                            <div className="border-t border-slate-700 pt-3">
                                                                <div className="text-xs text-slate-400 mb-2">Amenities</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {displayData.amenities.map((amenity, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-300"
                                                                        >
                                                                            {amenity}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* View Details Button */}
                                                        <Button
                                                            size="sm"
                                                            className="w-full mt-2 gap-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/rooms/${roomData.id}`);
                                                            }}
                                                        >
                                                            View Details & Book
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            } else {
                                                // Fallback to basic SVG info if no room data
                                                return (
                                                    <div className="p-4 space-y-2">
                                                        <div className="font-bold text-lg border-b border-slate-700 pb-2">
                                                            {obj.title || obj.id}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            No room data available for this area
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            SVG ID: {obj.id}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                )
                }

                {/* Loading indicator */}
                {
                    !imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <div className="text-slate-600">Loading floor plan...</div>
                        </div>
                    )
                }
            </div >
        </TooltipProvider >
    );
};

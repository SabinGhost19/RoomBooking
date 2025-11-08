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
    occupiedRoomIds?: Set<number>;
    onQuickBooking?: (roomId: number) => Promise<void>;
    selectedDate?: Date;
    startTime?: string;
    endTime?: string;
    isSubmitting?: boolean;
    selectedRoomId?: number | null;
}

export const FloorPlanWithObjects: React.FC<FloorPlanWithObjectsProps> = ({
    imageSrc,
    svgObjectsSrc,
    className = '',
    occupiedRoomIds,
    onQuickBooking,
    selectedDate,
    startTime,
    endTime,
    isSubmitting = false,
    selectedRoomId = null,
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
                console.log('🔗 API Config:', { limit: 500 });
                const roomsData = await getRooms({ limit: 500 });
                console.log('📦 Raw rooms data from API:', roomsData);
                console.log('📊 Number of rooms received:', roomsData?.length);
                
                if (!roomsData || roomsData.length === 0) {
                    console.warn('⚠️ No rooms data received from API!');
                    return;
                }
                
                const roomsMap = new Map<string, RoomType>();

                roomsData.forEach((room, index) => {
                    if (index < 5) { // Log first 5 rooms in detail
                        console.log(`🔍 Room ${index}:`, {
                            id: room.id,
                            name: room.name,
                            svg_id: room.svg_id,
                            has_svg_id: !!room.svg_id
                        });
                    }
                    if (room.svg_id) {
                        roomsMap.set(room.svg_id, room);
                    }
                });

                console.log(`✅ Loaded ${roomsMap.size} rooms from API (out of ${roomsData.length} total)`);
                console.log('🗺️ First 10 Rooms Map keys:', Array.from(roomsMap.keys()).slice(0, 10));
                console.log('📋 All SVG IDs in map:', Array.from(roomsMap.keys()));
                setRooms(roomsMap);
            } catch (error) {
                console.error('❌ Error loading rooms:', error);
                if (error instanceof Error) {
                    console.error('❌ Error message:', error.message);
                    console.error('❌ Error stack:', error.stack);
                }
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
                let viewBoxData = { x: 0, y: 0, width: 0, height: 0 };
                if (viewBox) {
                    const [x, y, width, height] = viewBox.split(' ').map(Number);
                    viewBoxData = { x, y, width, height };
                    setSvgViewBox(viewBoxData);
                    console.log('📐 ViewBox set:', viewBoxData);
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

                // Extract all rect and path elements
                const rects = svgDoc.querySelectorAll('rect');
                const paths = svgDoc.querySelectorAll('path');
                console.log('🔢 Found rect elements:', rects.length);
                console.log('🔢 Found path elements:', paths.length);
                const parsedObjects: SVGObject[] = [];

                // Process rect elements
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

                // Process path elements - extract bounding box from path data
                paths.forEach((path) => {
                    const id = path.getAttribute('id') || `path-${parsedObjects.length}`;
                    const pathData = path.getAttribute('d');
                    
                    if (!pathData) return;

                    // Extract bounding box from path - parse path coordinates manually
                    try {
                        // Parse path data and convert relative to absolute coordinates
                        const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
                        
                        let currentX = 0;
                        let currentY = 0;
                        const absoluteCoords: { x: number; y: number }[] = [];

                        commands.forEach(cmd => {
                            const type = cmd[0];
                            const args = cmd.slice(1).trim().match(/-?\d+\.?\d*/g)?.map(parseFloat) || [];

                            switch (type) {
                                case 'M': // Move absolute
                                    currentX = args[0];
                                    currentY = args[1];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'm': // Move relative
                                    currentX += args[0];
                                    currentY += args[1];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'L': // Line absolute
                                    currentX = args[0];
                                    currentY = args[1];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'l': // Line relative
                                    currentX += args[0];
                                    currentY += args[1];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'H': // Horizontal line absolute
                                    currentX = args[0];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'h': // Horizontal line relative
                                    currentX += args[0];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'V': // Vertical line absolute
                                    currentY = args[0];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'v': // Vertical line relative
                                    currentY += args[0];
                                    absoluteCoords.push({ x: currentX, y: currentY });
                                    break;
                                case 'Z':
                                case 'z': // Close path
                                    break;
                                default:
                                    // For other commands, extract pairs of coordinates
                                    for (let i = 0; i < args.length; i += 2) {
                                        if (type === type.toUpperCase()) {
                                            // Absolute
                                            currentX = args[i];
                                            currentY = args[i + 1];
                                        } else {
                                            // Relative
                                            currentX += args[i];
                                            currentY += args[i + 1];
                                        }
                                        absoluteCoords.push({ x: currentX, y: currentY });
                                    }
                            }
                        });

                        if (absoluteCoords.length < 2) {
                            console.warn(`⚠️ Not enough coordinates in path ${id}`);
                            return;
                        }

                        // Calculate bounding box from absolute coordinates
                        const xCoords = absoluteCoords.map(c => c.x);
                        const yCoords = absoluteCoords.map(c => c.y);

                        const rawX = Math.min(...xCoords);
                        const rawY = Math.min(...yCoords);
                        const maxX = Math.max(...xCoords);
                        const maxY = Math.max(...yCoords);
                        let width = maxX - rawX;
                        let height = maxY - rawY;

                        // Apply group transform
                        const x = rawX + groupTransformX;
                        const y = rawY + groupTransformY;

                        console.log(`📍 ${id} (path): raw(${rawX.toFixed(2)}, ${rawY.toFixed(2)}) size(${width.toFixed(2)}x${height.toFixed(2)}) -> transformed(${x.toFixed(2)}, ${y.toFixed(2)})`);

                        const styleAttr = path.getAttribute('style');
                        let fill = '#cccccc';
                        
                        // Try to extract fill from style attribute
                        if (styleAttr) {
                            const fillMatch = styleAttr.match(/fill:(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/);
                            if (fillMatch) {
                                fill = fillMatch[1];
                            } else {
                                // Check for named colors or rgb
                                const colorMatch = styleAttr.match(/fill:([^;]+)/);
                                if (colorMatch) {
                                    fill = colorMatch[1].trim();
                                }
                            }
                        }
                        
                        // Fallback to fill attribute
                        if (fill === '#cccccc') {
                            fill = path.getAttribute('fill') || '#cccccc';
                        }

                        console.log(`🎨 ${id} fill color: ${fill}`);

                        // Extract title element if exists
                        const titleElement = path.querySelector('title');
                        const title = titleElement?.textContent || undefined;

                        console.log(`📝 ${id} title: ${title || 'none'}`);

                        // Special handling for BeerPoint - extend to bottom of map
                        if (title === 'BeerPoint' || id === 'path266') {
                            console.log(`🍺 Extending BeerPoint to bottom of map`);
                            console.log(`  Original: y=${y.toFixed(2)}, height=${height.toFixed(2)}`);
                            
                            // Extend height to reach the bottom of the viewBox
                            const bottomOfMap = viewBoxData.height;
                            height = bottomOfMap - y;
                            
                            console.log(`  Extended: y=${y.toFixed(2)}, height=${height.toFixed(2)} (reaches bottom at ${bottomOfMap})`);
                        }

                        // Get all attributes as properties
                        const properties: Record<string, string> = {};
                        Array.from(path.attributes).forEach(attr => {
                            properties[attr.name] = attr.value;
                        });

                        parsedObjects.push({
                            id,
                            type: 'path',
                            x,
                            y,
                            width,
                            height,
                            fill,
                            title,
                            properties
                        });

                        console.log(`✅ Added path ${id} to objects list`);
                    } catch (error) {
                        console.error(`❌ Error parsing path ${id}:`, error);
                    }
                });

                console.log(`✅ Loaded ${parsedObjects.length} objects from SVG`);
                console.log('📊 Parsed objects with coordinates:');
                parsedObjects.forEach(obj => {
                    console.log(`  - ${obj.id} (${obj.type}): (${obj.x.toFixed(2)}, ${obj.y.toFixed(2)}) ${obj.width.toFixed(2)}x${obj.height.toFixed(2)} [${obj.fill}] title: ${obj.title || 'none'}`);
                });
                console.log('📐 ViewBox:', svgViewBox);
                
                // Log specifically about BeerPoint
                const beerPoint = parsedObjects.find(o => o.title === 'BeerPoint' || o.id.includes('path266'));
                if (beerPoint) {
                    console.log('🍺 BeerPoint found in parsed objects!', beerPoint);
                } else {
                    console.warn('⚠️ BeerPoint NOT found in parsed objects!');
                }
                
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
                        {/* SVG definitions for clip paths - hidden but used by CSS */}
                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                            <defs>
                                {objects.map((obj) => {
                                    if (obj.type === "path" && obj.properties?.pathData) {
                                        // Normalize path to fit in 0-1 coordinate system for clipPathUnits="objectBoundingBox"
                                        return (
                                            <clipPath key={`clip-${obj.id}`} id={`clip-${obj.id}`} clipPathUnits="objectBoundingBox">
                                                <path
                                                    d={obj.properties.pathData}
                                                    transform={`translate(${-obj.x} ${-obj.y}) scale(${1/obj.width} ${1/obj.height})`}
                                                />
                                            </clipPath>
                                        );
                                    }
                                    return null;
                                })}
                            </defs>
                        </svg>

                        {/* React Components for each SVG object */}
                        {objects.map((obj) => {
                            const coords = convertCoordinates(obj);
                            const isWall = obj.id.toLowerCase().includes('wall');
                            const isBlueBlocked = obj.fill.toLowerCase() === '#000080';
                            const isDisabled = isWall || isBlueBlocked;
                            const isHovered = hoveredObject === obj.id && !isDisabled;
                            
                            // Check if this object has room data
                            const hasRoomData = rooms.has(obj.id);
                            
                            // Log for debugging - only non-wall, non-disabled objects
                            if (!isDisabled && objects.indexOf(obj) < 10) {
                                console.log(`🎯 SVG Object "${obj.id}" (${obj.title || 'no title'}):`, {
                                    svg_id: obj.id,
                                    hasRoomData,
                                    roomsMapSize: rooms.size,
                                    isInMap: rooms.has(obj.id),
                                    // Show a few keys from the map for comparison
                                    sampleKeys: Array.from(rooms.keys()).slice(0, 5)
                                });
                            }

                            // Apply clip-path for path elements
                            const clipPathStyle = obj.type === "path" && obj.properties?.pathData 
                                ? { clipPath: `url(#clip-${obj.id})` }
                                : {};

                            // Special logging for BeerPoint
                            if (obj.title === 'BeerPoint' || obj.id.includes('path266')) {
                                console.log('🍺 Rendering BeerPoint:', {
                                    id: obj.id,
                                    obj: obj,
                                    coords,
                                    fill: obj.fill,
                                    isWall,
                                    isBlueBlocked,
                                    isDisabled,
                                    hasClipPath: !!clipPathStyle.clipPath,
                                    containerSize: { w: imageDimensions.width, h: imageDimensions.height },
                                    style: {
                                        left: `${coords.x}%`,
                                        top: `${coords.y}%`,
                                        width: `${coords.width}%`,
                                        height: `${coords.height}%`,
                                    }
                                });
                            }
                            
                            // Make BeerPoint more visible with higher opacity
                            const isBeerPoint = obj.title === 'BeerPoint' || obj.id.includes('path266');
                            const opacity = isBeerPoint ? 0.8 : (isHovered ? 0.9 : 0.6);

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

                            // Check if room is occupied (from parent component)
                            const roomData = rooms.get(obj.id);
                            const isOccupied = roomData && occupiedRoomIds?.has(roomData.id);

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
                                                opacity: opacity,
                                                border: isHovered ? '3px solid white' : '2px solid rgba(255,255,255,0.5)',
                                                boxShadow: isHovered
                                                    ? '0 4px 12px rgba(0,0,0,0.4)'
                                                    : '0 2px 4px rgba(0,0,0,0.2)',
                                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                                zIndex: isHovered ? 20 : 10,
                                                pointerEvents: isDisabled ? 'none' : 'auto',
                                                borderRadius: '2px',
                                                ...clipPathStyle, // Apply clip-path for path elements
                                            }}
                                            onMouseEnter={() => !isDisabled && handleObjectHover(obj.id)}
                                            onMouseLeave={() => !isDisabled && setHoveredObject(null)}
                                        >
                                            {/* Red hatching overlay for occupied rooms */}
                                            {isOccupied && (
                                                <div
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239, 68, 68, 0.5) 4px, rgba(239, 68, 68, 0.5) 8px)',
                                                        borderRadius: '2px',
                                                        zIndex: 15,
                                                    }}
                                                />
                                            )}

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
                                        className="max-w-sm bg-slate-900 text-white border-slate-700 p-0 shadow-2xl z-50"
                                        onPointerDownOutside={(e) => {
                                            // Prevent tooltip from closing when clicking inside it
                                            e.preventDefault();
                                        }}
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
                                                    <div className="overflow-hidden">
                                                        {/* Room Image Header */}
                                                        {displayData.image ? (
                                                            <div className="relative w-full h-40">
                                                                <img 
                                                                    src={displayData.image} 
                                                                    alt={displayData.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        console.error('Failed to load image:', displayData.image);
                                                                        const parent = (e.target as HTMLImageElement).parentElement;
                                                                        if (parent) parent.style.display = 'none';
                                                                    }}
                                                                />
                                                                {/* Gradient Overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                                                                
                                                                {/* Room Name on Image */}
                                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                                                                        {displayData.name}
                                                                    </h3>
                                                                </div>

                                                                {/* Status Badge */}
                                                                <div className="absolute top-3 right-3">
                                                                    {isAvailableNow ? (
                                                                        <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                                            <span className="text-xs font-semibold text-white">Available</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <XCircle className="h-3.5 w-3.5 text-white" />
                                                                            <span className="text-xs font-semibold text-white">Occupied</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Loading Indicator */}
                                                                {isLoading && (
                                                                    <div className="absolute top-3 left-3">
                                                                        <div className="bg-blue-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <span className="text-xs font-medium text-white animate-pulse">
                                                                                Loading details...
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Fallback when no image
                                                            <div className="relative w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900">
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                                    <h3 className="text-xl font-bold text-white text-center">
                                                                        {displayData.name}
                                                                    </h3>
                                                                </div>
                                                                
                                                                {/* Status Badge */}
                                                                <div className="absolute top-3 right-3">
                                                                    {isAvailableNow ? (
                                                                        <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                                            <span className="text-xs font-semibold text-white">Available</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <XCircle className="h-3.5 w-3.5 text-white" />
                                                                            <span className="text-xs font-semibold text-white">Occupied</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isLoading && (
                                                                    <div className="absolute top-3 left-3">
                                                                        <div className="bg-blue-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                            <span className="text-xs font-medium text-white animate-pulse">Loading...</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Content Section */}
                                                        <div className="p-4 space-y-3">
                                                            {/* Description */}
                                                            {displayData.description && (
                                                                <p className="text-sm text-slate-300 leading-relaxed border-b border-slate-700 pb-3">
                                                                    {displayData.description}
                                                                </p>
                                                            )}

                                                            {/* Next Available Time */}
                                                            {!isAvailableNow && detailedData?.nextAvailableTime && (
                                                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                                                                        <span className="text-xs font-medium text-orange-300">
                                                                            Next available: {detailedData.nextAvailableTime}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Key Details */}
                                                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Users className="h-4 w-4 text-blue-400" />
                                                                    <span className="text-xs text-slate-400">Capacity</span>
                                                                </div>
                                                                <div className="text-lg font-bold text-white">
                                                                    {displayData.capacity}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {displayData.capacity === 1 ? 'person' : 'people'}
                                                                </div>
                                                            </div>

                                                            {/* Amenities */}
                                                            {displayData.amenities && displayData.amenities.length > 0 && (
                                                                <div className="border-t border-slate-700 pt-3">
                                                                    <div className="text-xs font-semibold text-slate-400 mb-2">
                                                                        ✨ Amenities
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {displayData.amenities.map((amenity, idx) => (
                                                                            <span 
                                                                                key={idx} 
                                                                                className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30"
                                                                            >
                                                                                {amenity}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Today's Schedule */}
                                                            {detailedData && detailedData.todayBookings.length > 0 && (
                                                                <div className="border-t border-slate-700 pt-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-semibold text-slate-400">
                                                                            📅 Today's Schedule
                                                                        </span>
                                                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                                                                            {detailedData.todayBookings.length} booking{detailedData.todayBookings.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                                                        {detailedData.todayBookings.slice(0, 4).map((booking, idx) => (
                                                                            <div 
                                                                                key={idx} 
                                                                                className="flex items-center gap-2 bg-slate-800/70 p-2 rounded border border-slate-700/50"
                                                                            >
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                                <span className="text-xs text-white font-medium flex-1">
                                                                                    {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                                                </span>
                                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                                                    booking.status === 'upcoming' ? 'bg-green-500/20 text-green-300' :
                                                                                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                                                                                    'bg-red-500/20 text-red-300'
                                                                                }`}>
                                                                                    {booking.status}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                        {detailedData.todayBookings.length > 4 && (
                                                                            <div className="text-xs text-slate-500 text-center py-1">
                                                                                +{detailedData.todayBookings.length - 4} more booking{detailedData.todayBookings.length - 4 !== 1 ? 's' : ''}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Upcoming Bookings Summary */}
                                                            {detailedData && detailedData.upcomingBookings.length > 0 && (
                                                                <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-slate-400">📆 Next 7 days</span>
                                                                        <span className="text-xs font-semibold text-blue-300">
                                                                            {detailedData.upcomingBookings.length} reservation{detailedData.upcomingBookings.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Booking Buttons */}
                                                            <div className="space-y-2">
                                                                {/* Quick Book Button (only if booking props provided) */}
                                                                {onQuickBooking && selectedDate && startTime && endTime && (
                                                                    <Button
                                                                        size="sm"
                                                                        className={`w-full gap-2 cursor-pointer ${
                                                                            isOccupied 
                                                                                ? 'bg-red-600 hover:bg-red-700' 
                                                                                : 'bg-green-600 hover:bg-green-700'
                                                                        } text-white`}
                                                                        style={{ pointerEvents: 'auto' }}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            if (roomData && !isOccupied && onQuickBooking) {
                                                                                onQuickBooking(roomData.id);
                                                                            }
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.stopPropagation();
                                                                        }}
                                                                        disabled={isOccupied || isSubmitting}
                                                                    >
                                                                        {isSubmitting && selectedRoomId === roomData?.id ? (
                                                                            <>
                                                                                <span className="animate-spin">⏳</span>
                                                                                <span>Booking...</span>
                                                                            </>
                                                                        ) : isOccupied ? (
                                                                            <>
                                                                                <XCircle className="h-3.5 w-3.5" />
                                                                                <span>Occupied ({startTime} - {endTime})</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                                <span>Quick Book ({startTime} - {endTime})</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}

                                                                {/* View Details Button */}
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-500 cursor-pointer"
                                                                    style={{ pointerEvents: 'auto' }}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        console.log('🔘 Button clicked! Navigating to:', `/rooms/${roomData?.id || obj.id}`);
                                                                        navigate(`/rooms/${roomData?.id || obj.id}`);
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        e.stopPropagation();
                                                                    }}
                                                                >
                                                                    <span>View Full Details & Book</span>
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
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

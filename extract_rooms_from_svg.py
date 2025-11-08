"""
Script to extract room data from SVG file.
Parses OBJECTS.svg and extracts all rooms with their IDs, types, and coordinates.
"""
import xml.etree.ElementTree as ET
import json
import re
from collections import defaultdict

# Room type configurations
ROOM_CONFIGS = {
    "MeetingRoom": {
        "capacity": 4,
        "description": "Meeting room perfect for small team discussions and collaborative work",
        "amenities": ["Whiteboard", "Video Conference", "WiFi", "Projector"],
        "price": 45.0
    },
    "PhoneBoothArea": {
        "capacity": 1,
        "description": "Private phone booth for confidential calls and focused work",
        "amenities": ["Soundproof", "WiFi", "Power Outlet"],
        "price": 15.0
    },
    "DeskSeat": {
        "capacity": 1,
        "description": "Individual desk seat for focused work",
        "amenities": ["Desk", "Ergonomic Chair", "Power Outlet", "WiFi"],
        "price": 10.0
    },
    "Biliard": {
        "capacity": 5,
        "description": "Billiard room for team recreation and informal meetings",
        "amenities": ["Billiard Table", "Seating Area", "Entertainment"],
        "price": 35.0
    },
    "BeerPoint": {
        "capacity": 8,
        "description": "Social area for informal gatherings and team bonding",
        "amenities": ["Bar Area", "Seating", "Refrigerator", "WiFi"],
        "price": 40.0
    },
    "Bubble": {
        "capacity": 2,
        "description": "Small private bubble space for one-on-one discussions",
        "amenities": ["Privacy", "Seating", "WiFi"],
        "price": 25.0
    },
    "SoloDesk": {
        "capacity": 1,
        "description": "Solo desk for individual focused work",
        "amenities": ["Desk", "Chair", "Power Outlet", "WiFi"],
        "price": 12.0
    },
    "ElectricTable": {
        "capacity": 6,
        "description": "Adjustable electric table for flexible working arrangements",
        "amenities": ["Electric Adjustable Desk", "Power Outlets", "WiFi", "Seating"],
        "price": 50.0
    },
    "CoffeePoint": {
        "capacity": 4,
        "description": "Coffee area for casual meetings and breaks",
        "amenities": ["Coffee Machine", "Seating", "WiFi"],
        "price": 20.0
    },
    "Deposit": {
        "capacity": 2,
        "description": "Storage and deposit area",
        "amenities": ["Storage Space", "Shelving"],
        "price": 15.0
    },
    "ItDeposit": {
        "capacity": 2,
        "description": "IT equipment storage and maintenance area",
        "amenities": ["Storage Space", "Workbench", "Power Outlets"],
        "price": 20.0
    },
    "ServerRoom": {
        "capacity": 2,
        "description": "Server room for IT infrastructure (restricted access)",
        "amenities": ["Climate Control", "Security", "Power Backup"],
        "price": 100.0
    },
    "DiscussionZone": {
        "capacity": 6,
        "description": "Open discussion zone for brainstorming and team collaboration",
        "amenities": ["Whiteboard", "Comfortable Seating", "WiFi", "Natural Light"],
        "price": 35.0
    },
    "TrainingSeat": {
        "capacity": 1,
        "description": "Training seat for learning and development activities",
        "amenities": ["Desk", "Chair", "Power Outlet", "WiFi"],
        "price": 12.0
    },
    "ManagerDesk": {
        "capacity": 1,
        "description": "Manager desk for leadership and administrative work",
        "amenities": ["Executive Desk", "Ergonomic Chair", "Storage", "WiFi"],
        "price": 30.0
    }
}

def parse_svg_rooms(svg_file):
    """Parse SVG file and extract room information."""
    tree = ET.parse(svg_file)
    root = tree.getroot()
    
    rooms_data = []
    room_type_counter = defaultdict(int)
    
    # Extract all elements (rect, path, polygon, etc.) that have title children
    for elem in root.iter():
        # Look for elements that have coordinates (rect, path, polygon, circle, etc.)
        if elem.tag.endswith(('rect', 'path', 'polygon', 'circle', 'ellipse')):
            # Get the title child element
            title_elem = None
            for child in elem:
                if child.tag.endswith('title'):
                    title_elem = child
                    break
            
            if title_elem is not None and title_elem.text:
                room_type_text = title_elem.text.strip()
                
                # Skip DeskSeat for now - we'll process them separately
                # Match room type from title
                room_type = None
                for config_name in ROOM_CONFIGS.keys():
                    if config_name.lower() == room_type_text.lower() or \
                       config_name.lower() in room_type_text.lower():
                        room_type = config_name
                        break
                
                if room_type:
                    elem_id = elem.get('id', f'room_{len(rooms_data)}')
                    
                    # Get coordinates
                    x = elem.get('x', '0')
                    y = elem.get('y', '0')
                    width = elem.get('width', '50')
                    height = elem.get('height', '50')
                    
                    # Calculate center coordinates
                    try:
                        center_x = float(x) + float(width) / 2
                        center_y = float(y) + float(height) / 2
                    except (ValueError, ZeroDivisionError):
                        center_x = float(x) if x != '0' else 0
                        center_y = float(y) if y != '0' else 0
                    
                    # Increment counter for this room type
                    room_type_counter[room_type] += 1
                    instance_num = room_type_counter[room_type]
                    
                    config = ROOM_CONFIGS[room_type]
                    
                    # Create room data
                    room_data = {
                        'name': f"{room_type} {instance_num}",
                        'svg_id': elem_id,
                        'room_type': room_type,
                        'capacity': config['capacity'],
                        'description': config['description'],
                        'amenities': config['amenities'],
                        'price': config['price'],
                        'coordinates': {
                            'x': round(center_x, 2),
                            'y': round(center_y, 2)
                        },
                        'is_available': True
                    }
                    
                    rooms_data.append(room_data)
    
    return rooms_data

def main():
    svg_file = 'sage-reserve/public/OBJECTS.svg'
    
    print(f"Parsing SVG file: {svg_file}")
    rooms = parse_svg_rooms(svg_file)
    
    print(f"\nFound {len(rooms)} rooms:")
    print("-" * 80)
    
    # Group by type
    by_type = defaultdict(list)
    for room in rooms:
        by_type[room['room_type']].append(room)
    
    for room_type, room_list in sorted(by_type.items()):
        print(f"\n{room_type}: {len(room_list)} rooms")
        for room in room_list:
            print(f"  - {room['name']} (ID: {room['svg_id']}, "
                  f"Capacity: {room['capacity']}, "
                  f"Price: ${room['price']}/hr)")
    
    # Save to JSON file
    output_file = 'backend/rooms_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(rooms, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"Room data saved to: {output_file}")
    print(f"Total rooms: {len(rooms)}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()

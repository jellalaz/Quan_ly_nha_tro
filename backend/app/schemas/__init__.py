# Ensure forward references between schemas are resolved
from app.schemas import invoice as invoice_schema
from app.schemas import rented_room as rented_room_schema
from app.schemas import room as room_schema
from app.schemas import house as house_schema
from app.schemas import asset as asset_schema

# Build a namespace mapping for forward-ref resolution across modules
_types = {
    # Base/simple models
    'Invoice': invoice_schema.Invoice,
    'RentedRoom': rented_room_schema.RentedRoom,
    'Room': room_schema.Room,
    'House': house_schema.House,
    'Asset': asset_schema.Asset,
    # WithDetails models
    'InvoiceWithDetails': getattr(invoice_schema, 'InvoiceWithDetails', None),
    'RentedRoomWithDetails': getattr(rented_room_schema, 'RentedRoomWithDetails', None),
    'RoomWithDetails': getattr(room_schema, 'RoomWithDetails', None),
    'HouseWithRooms': getattr(house_schema, 'HouseWithRooms', None),
}

# Remove None entries to avoid issues
_types = {k: v for k, v in _types.items() if v is not None}

# Rebuild models to resolve forward refs using the explicit namespace
try:
    # Invoices
    invoice_schema.Invoice.model_rebuild(_types_namespace=_types)
    if hasattr(invoice_schema, 'InvoiceWithDetails'):
        invoice_schema.InvoiceWithDetails.model_rebuild(_types_namespace=_types)
    # Rented rooms
    rented_room_schema.RentedRoom.model_rebuild(_types_namespace=_types)
    if hasattr(rented_room_schema, 'RentedRoomWithDetails'):
        rented_room_schema.RentedRoomWithDetails.model_rebuild(_types_namespace=_types)
    # Rooms
    room_schema.Room.model_rebuild(_types_namespace=_types)
    if hasattr(room_schema, 'RoomWithDetails'):
        room_schema.RoomWithDetails.model_rebuild(_types_namespace=_types)
    # Houses
    house_schema.House.model_rebuild(_types_namespace=_types)
    if hasattr(house_schema, 'HouseWithRooms'):
        house_schema.HouseWithRooms.model_rebuild(_types_namespace=_types)
except Exception:
    # Safe fallback if pydantic version handles this automatically
    pass

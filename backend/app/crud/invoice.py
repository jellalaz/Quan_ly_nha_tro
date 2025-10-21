from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
from app.models.invoice import Invoice
from app.models.rented_room import RentedRoom
from app.models.room import Room
from app.models.house import House
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate

def create_invoice(db: Session, invoice: InvoiceCreate, owner_id: int):
    # Ensure rented room belongs to current owner
    rr = (
        db.query(RentedRoom)
        .join(Room)
        .join(House)
        .filter(RentedRoom.rr_id == invoice.rr_id, House.owner_id == owner_id)
        .first()
    )
    if not rr:
        return None
    db_invoice = Invoice(**invoice.dict())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoice_by_id(db: Session, invoice_id: int, owner_id: int):
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
        .join(RentedRoom)
        .join(Room)
        .join(House)
        .filter(Invoice.invoice_id == invoice_id, House.owner_id == owner_id)
        .first()
    )

def get_invoices_by_rented_room(db: Session, rr_id: int, owner_id: int):
    # Verify rented room belongs to owner
    owned_rr = (
        db.query(RentedRoom)
        .join(Room)
        .join(House)
        .filter(RentedRoom.rr_id == rr_id, House.owner_id == owner_id)
        .first()
    )
    if not owned_rr:
        return []
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
        .filter(Invoice.rr_id == rr_id)
        .all()
    )

def get_pending_invoices(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
        .join(RentedRoom)
        .join(Room)
        .join(House)
        .filter(Invoice.is_paid == False, House.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_all_invoices(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
        .join(RentedRoom)
        .join(Room)
        .join(House)
        .filter(House.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_invoices(
    db: Session,
    owner_id: int,
    skip: int = 0,
    limit: int = 100,
    month: Optional[str] = None,  # format: YYYY-MM
    house_id: Optional[int] = None,
    room_id: Optional[int] = None,
    is_paid: Optional[bool] = None,
):
    """Fetch invoices with optional filters.

    - month filters by Invoice.due_date within that month
    - house_id filters by the room's house
    - room_id filters by specific room
    - is_paid filters by payment status
    """
    q = (
        db.query(Invoice)
        .options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
        .join(RentedRoom)
        .join(Room)
        .join(House)
        .filter(House.owner_id == owner_id)
    )

    if is_paid is not None:
        q = q.filter(Invoice.is_paid.is_(bool(is_paid)))

    if room_id is not None:
        q = q.filter(Room.room_id == room_id)

    if house_id is not None:
        q = q.filter(House.house_id == house_id)

    if month:
        try:
            # Parse month start and compute next month start
            start = datetime.strptime(month + "-01", "%Y-%m-%d")
            if start.month == 12:
                next_month_start = start.replace(year=start.year + 1, month=1)
            else:
                next_month_start = start.replace(month=start.month + 1)
            q = q.filter(Invoice.due_date >= start, Invoice.due_date < next_month_start)
        except Exception:
            # Ignore bad month format silently
            pass

    return q.offset(skip).limit(limit).all()

def update_invoice(db: Session, invoice_id: int, invoice_update: InvoiceUpdate, owner_id: int):
    db_invoice = get_invoice_by_id(db, invoice_id, owner_id)
    if db_invoice:
        update_data = invoice_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_invoice, field, value)
        db.commit()
        db.refresh(db_invoice)
    return db_invoice

def mark_invoice_paid(db: Session, invoice_id: int, owner_id: int):
    db_invoice = get_invoice_by_id(db, invoice_id, owner_id)
    if db_invoice:
        db_invoice.is_paid = True
        if not db_invoice.payment_date:
            db_invoice.payment_date = db_invoice.created_at
        db.commit()
        db.refresh(db_invoice)
    return db_invoice

def delete_invoice(db: Session, invoice_id: int, owner_id: int) -> bool:
    invoice = get_invoice_by_id(db, invoice_id, owner_id)
    if not invoice:
        return False
    db.delete(invoice)
    db.commit()
    return True

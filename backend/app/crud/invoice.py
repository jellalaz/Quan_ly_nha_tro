from sqlalchemy.orm import Session, joinedload
from typing import List
from app.models.invoice import Invoice
from app.models.rented_room import RentedRoom
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate

def create_invoice(db: Session, invoice: InvoiceCreate):
    db_invoice = Invoice(**invoice.dict())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoice_by_id(db: Session, invoice_id: int):
    return db.query(Invoice).options(
        joinedload(Invoice.rented_room).joinedload(RentedRoom.room)
    ).filter(Invoice.invoice_id == invoice_id).first()

def get_invoices_by_rented_room(db: Session, rr_id: int):
    return db.query(Invoice).options(
        joinedload(Invoice.rented_room).joinedload(RentedRoom.room)
    ).filter(Invoice.rr_id == rr_id).all()

def get_pending_invoices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Invoice).options(
        joinedload(Invoice.rented_room).joinedload(RentedRoom.room)
    ).filter(Invoice.is_paid == False).offset(skip).limit(limit).all()

def get_all_invoices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Invoice).options(
        joinedload(Invoice.rented_room).joinedload(RentedRoom.room)
    ).offset(skip).limit(limit).all()

def update_invoice(db: Session, invoice_id: int, invoice_update: InvoiceUpdate):
    db_invoice = get_invoice_by_id(db, invoice_id)
    if db_invoice:
        update_data = invoice_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_invoice, field, value)
        db.commit()
        db.refresh(db_invoice)
    return db_invoice

def mark_invoice_paid(db: Session, invoice_id: int):
    db_invoice = get_invoice_by_id(db, invoice_id)
    if db_invoice:
        db_invoice.is_paid = True
        if not db_invoice.payment_date:
            db_invoice.payment_date = db_invoice.created_at
        db.commit()
        db.refresh(db_invoice)
    return db_invoice

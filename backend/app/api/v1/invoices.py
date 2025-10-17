from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceWithDetails
from app.crud import invoice as invoice_crud
from app.core.security import get_current_active_user
from app.schemas.user import User

router = APIRouter()

@router.post("/", response_model=InvoiceWithDetails)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    created = invoice_crud.create_invoice(db=db, invoice=invoice, owner_id=current_user.owner_id)
    if created is None:
        raise HTTPException(status_code=404, detail="Rented room not found or not owned by user")
    # Return with details
    return invoice_crud.get_invoice_by_id(db, created.invoice_id, current_user.owner_id)

@router.get("/", response_model=List[InvoiceWithDetails])
def read_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    invoices = invoice_crud.get_all_invoices(db, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return invoices

@router.get("/rented-room/{rr_id}", response_model=List[InvoiceWithDetails])
def read_invoices_by_rented_room(rr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    invoices = invoice_crud.get_invoices_by_rented_room(db, rr_id=rr_id, owner_id=current_user.owner_id)
    return invoices

@router.get("/pending", response_model=List[InvoiceWithDetails])
def read_pending_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    invoices = invoice_crud.get_pending_invoices(db, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceWithDetails)
def read_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_invoice = invoice_crud.get_invoice_by_id(db, invoice_id=invoice_id, owner_id=current_user.owner_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice

@router.put("/{invoice_id}", response_model=InvoiceWithDetails)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_invoice = invoice_crud.update_invoice(db, invoice_id=invoice_id, invoice_update=invoice_update, owner_id=current_user.owner_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice

@router.post("/{invoice_id}/pay")
def pay_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_invoice = invoice_crud.mark_invoice_paid(db, invoice_id=invoice_id, owner_id=current_user.owner_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice paid successfully"}

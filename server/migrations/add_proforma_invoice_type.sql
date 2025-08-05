-- Add 'proforma' to invoice_type enum
ALTER TABLE invoice MODIFY COLUMN invoice_type ENUM('regular', 'e-invoice', 'lotus', 'proforma') NOT NULL DEFAULT 'regular'; 
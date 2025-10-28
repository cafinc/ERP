"""
PDF Generation Utilities for Estimates and Invoices
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime

def generate_estimate_pdf(estimate_data: dict) -> BytesIO:
    """Generate a professional PDF for an estimate"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Container for elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=12,
    )
    
    # Title
    elements.append(Paragraph("ESTIMATE", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Header Information
    header_data = [
        ['Estimate #:', estimate_data.get('estimate_number', 'N/A')],
        ['Date:', estimate_data.get('created_at', datetime.utcnow().isoformat())[:10]],
        ['Valid Until:', estimate_data.get('valid_until', 'N/A')],
        ['Status:', estimate_data.get('status', 'draft').upper()],
    ]
    
    header_table = Table(header_data, colWidths=[2*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Customer Information
    elements.append(Paragraph("Bill To:", heading_style))
    customer_name = estimate_data.get('customer_name', 'N/A')
    customer_info = f"""
    <b>{customer_name}</b><br/>
    {estimate_data.get('customer_email', '')}<br/>
    {estimate_data.get('customer_phone', '')}
    """
    elements.append(Paragraph(customer_info, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Line Items
    elements.append(Paragraph("Items:", heading_style))
    
    # Table headers
    line_items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
    
    # Add line items
    items = estimate_data.get('items', [])
    for item in items:
        line_items_data.append([
            item.get('description', 'N/A'),
            str(item.get('quantity', 0)),
            f"${item.get('unit_price', 0):.2f}",
            f"${item.get('total', 0):.2f}"
        ])
    
    # Create table
    items_table = Table(line_items_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Totals
    subtotal = estimate_data.get('subtotal', 0)
    tax_rate = estimate_data.get('tax_rate', 0)
    tax_amount = estimate_data.get('tax_amount', 0)
    total_amount = estimate_data.get('total_amount', 0)
    
    totals_data = [
        ['', '', 'Subtotal:', f"${subtotal:.2f}"],
        ['', '', f'Tax ({tax_rate}%):', f"${tax_amount:.2f}"],
        ['', '', 'Total:', f"${total_amount:.2f}"],
    ]
    
    totals_table = Table(totals_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica'),
        ('FONTSIZE', (2, 0), (-1, -1), 11),
        ('LINEABOVE', (2, -1), (-1, -1), 2, colors.black),
        ('FONTSIZE', (2, -1), (-1, -1), 13),
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Notes
    if estimate_data.get('notes'):
        elements.append(Paragraph("Notes:", heading_style))
        elements.append(Paragraph(estimate_data.get('notes', ''), styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
    
    # Terms
    if estimate_data.get('terms'):
        elements.append(Paragraph("Terms & Conditions:", heading_style))
        elements.append(Paragraph(estimate_data.get('terms', ''), styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_invoice_pdf(invoice_data: dict) -> BytesIO:
    """Generate a professional PDF for an invoice"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#dc2626'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=12,
    )
    
    # Title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Header Information
    header_data = [
        ['Invoice #:', invoice_data.get('invoice_number', 'N/A')],
        ['Date:', invoice_data.get('created_at', datetime.utcnow().isoformat())[:10]],
        ['Due Date:', invoice_data.get('due_date', 'N/A')],
        ['Status:', invoice_data.get('status', 'draft').upper()],
    ]
    
    header_table = Table(header_data, colWidths=[2*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Customer Information
    elements.append(Paragraph("Bill To:", heading_style))
    customer_name = invoice_data.get('customer_name', 'N/A')
    customer_info = f"""
    <b>{customer_name}</b><br/>
    {invoice_data.get('customer_email', '')}<br/>
    {invoice_data.get('customer_phone', '')}
    """
    elements.append(Paragraph(customer_info, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Line Items
    elements.append(Paragraph("Items:", heading_style))
    line_items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
    
    items = invoice_data.get('items', [])
    for item in items:
        line_items_data.append([
            item.get('description', 'N/A'),
            str(item.get('quantity', 0)),
            f"${item.get('unit_price', 0):.2f}",
            f"${item.get('total', 0):.2f}"
        ])
    
    items_table = Table(line_items_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Totals
    subtotal = invoice_data.get('subtotal', 0)
    tax_amount = invoice_data.get('tax_amount', 0)
    total_amount = invoice_data.get('total_amount', 0)
    amount_paid = invoice_data.get('amount_paid', 0)
    amount_due = total_amount - amount_paid
    
    totals_data = [
        ['', '', 'Subtotal:', f"${subtotal:.2f}"],
        ['', '', 'Tax:', f"${tax_amount:.2f}"],
        ['', '', 'Total:', f"${total_amount:.2f}"],
        ['', '', 'Amount Paid:', f"${amount_paid:.2f}"],
        ['', '', 'Balance Due:', f"${amount_due:.2f}"],
    ]
    
    totals_table = Table(totals_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (2, 0), (-1, -1), 11),
        ('LINEABOVE', (2, -1), (-1, -1), 2, colors.black),
        ('FONTSIZE', (2, -1), (-1, -1), 13),
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.HexColor('#dc2626')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Payment Instructions
    elements.append(Paragraph("Payment Instructions:", heading_style))
    payment_info = invoice_data.get('payment_instructions', 'Please remit payment within 30 days.')
    elements.append(Paragraph(payment_info, styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

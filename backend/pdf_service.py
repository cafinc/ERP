import io
import base64
from datetime import datetime
from typing import Dict, List, Any
import logging
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        # Custom styles for our PDF
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Title'],
            fontSize=20,
            spaceAfter=20,
            textColor=colors.Color(70/255, 130/255, 180/255),  # Steel Blue
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.Color(70/255, 130/255, 180/255),
        )
    
    def generate_form_response_pdf(self, form_response: Dict[str, Any], form_template: Dict[str, Any]) -> bytes:
        """Generate a PDF for a form response and return as bytes"""
        try:
            pdf_buffer = io.BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
            
            # Build content
            story = []
            
            # Header
            story.append(Paragraph("CAF Property Services", self.title_style))
            story.append(Paragraph("Snow Removal & Property Management", self.styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Form title
            form_name = form_template.get('name', 'Form Response')
            story.append(Paragraph(form_name, self.heading_style))
            
            form_type = form_template.get('form_type', '').replace('_', ' ').title()
            story.append(Paragraph(f"Type: {form_type}", self.styles['Normal']))
            story.append(Spacer(1, 16))
            
            # Metadata table
            submitted_at = form_response.get('submitted_at', datetime.now())
            if isinstance(submitted_at, str):
                try:
                    submitted_at = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
                except:
                    submitted_at = datetime.now()
            
            formatted_date = submitted_at.strftime('%B %d, %Y at %I:%M %p')
            
            metadata = [
                ['Submitted By:', form_response.get('crew_name', 'Unknown')],
                ['Date:', formatted_date],
            ]
            
            if form_response.get('site_id'):
                metadata.append(['Site ID:', form_response.get('site_id')])
            if form_response.get('dispatch_id'):
                metadata.append(['Dispatch ID:', form_response.get('dispatch_id')])
            
            metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
            metadata_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.Color(248/255, 249/255, 250/255)),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('GRID', (0, 0), (-1, -1), 1, colors.Color(225/255, 229/255, 233/255)),
            ]))
            
            story.append(metadata_table)
            story.append(Spacer(1, 20))
            
            # Form description
            if form_template.get('description'):
                story.append(Paragraph("Description:", self.heading_style))
                story.append(Paragraph(form_template.get('description'), self.styles['Normal']))
                story.append(Spacer(1, 16))
            
            # Responses
            story.append(Paragraph("Response Details:", self.heading_style))
            
            form_fields = {field.get('field_id', ''): field for field in form_template.get('fields', [])}
            responses = form_response.get('responses', {})
            
            for field_id, value in responses.items():
                if field_id.startswith('_'):  # Skip internal metadata fields
                    continue
                
                field_info = form_fields.get(field_id, {})
                field_label = field_info.get('label', field_id.replace('_', ' ').title())
                field_type = field_info.get('field_type', 'text')
                
                # Format value based on field type
                if field_type == 'checkbox':
                    formatted_value = 'Yes' if value else 'No'
                elif field_type == 'photo' and value:
                    formatted_value = f'[Photo attached: {len(value)} images]' if isinstance(value, list) else '[Photo attached]'
                elif isinstance(value, list):
                    formatted_value = ', '.join(str(v) for v in value)
                else:
                    formatted_value = str(value) if value else 'Not provided'
                
                # Add field to story
                story.append(Paragraph(f"<b>{field_label}:</b>", self.styles['Normal']))
                story.append(Paragraph(formatted_value, self.styles['Normal']))
                story.append(Spacer(1, 8))
            
            # Footer
            story.append(Spacer(1, 30))
            footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>CAF Property Services - Professional Snow Removal"
            story.append(Paragraph(footer_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            pdf_buffer.seek(0)
            
            return pdf_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise
    
    # Removed old WeasyPrint HTML/CSS methods - now using ReportLab
    
    def _format_date(self, date_str: str) -> str:
        """Format date string for display"""
        if not date_str:
            return 'Unknown Date'
        
        try:
            if isinstance(date_str, str):
                # Try to parse ISO format
                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                date_obj = date_str
            return date_obj.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return str(date_str)
    
    def generate_message_correspondence_pdf(self, message: Dict[str, Any]) -> str:
        """Generate PDF for message correspondence"""
        try:
            content = f"""
CAF PROPERTY SERVICES
CUSTOMER CORRESPONDENCE

==================================================

MESSAGE: {message.get('title', 'Customer Communication')}
STATUS: {message.get('status', 'Unknown').upper()}
PRIORITY: {message.get('priority', 'Normal').upper()}

FROM: {message.get('from_user_name', 'Unknown User')}
DATE: {self._format_date(message.get('created_at'))}

==================================================

ORIGINAL MESSAGE:
{message.get('content', 'No content available')}

"""
            
            # Add admin response if available
            if message.get('admin_response'):
                content += f"""
ADMIN RESPONSE:
{message.get('admin_response')}
Response Date: {self._format_date(message.get('admin_responded_at'))}

"""
            
            # Add crew feedback if available
            if message.get('crew_feedback'):
                content += f"""
CREW FEEDBACK:
{message.get('crew_feedback')}
Acknowledged Date: {self._format_date(message.get('crew_acknowledged_at'))}

"""
            
            # Add resolution notes if available
            if message.get('resolution_notes'):
                content += f"""
RESOLUTION NOTES:
{message.get('resolution_notes')}
Resolved Date: {self._format_date(message.get('resolved_at'))}

"""
            
            content += f"""
==================================================

CORRESPONDENCE DETAILS:
- Message ID: {message.get('id', 'Unknown')}
- Source Type: {message.get('source_type', 'Unknown')}
- Response Time: {message.get('response_time_hours', 'N/A')} hours
- Acknowledgment Time: {message.get('acknowledgment_time_hours', 'N/A')} hours

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This document contains the complete correspondence record for this customer interaction.
"""
            
            pdf_bytes = content.encode('utf-8')
            return base64.b64encode(pdf_bytes).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error generating correspondence PDF: {str(e)}")
            return None

# Global PDF service instance
pdf_service = PDFService()
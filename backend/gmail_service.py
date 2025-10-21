import os
import base64
from datetime import datetime, timezone
from typing import Optional, List, Dict
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class GmailService:
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        
        # Gmail API scopes
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
        
        self.enabled = bool(self.client_id and self.client_secret and self.redirect_uri)
        
        if not self.enabled:
            logger.warning("Gmail service not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI")
    
    def create_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL for user to connect Gmail"""
        if not self.enabled:
            raise Exception("Gmail service not configured")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent to get refresh token
        )
        
        return authorization_url
    
    def exchange_code_for_tokens(self, code: str, state: str) -> Dict:
        """Exchange authorization code for access and refresh tokens"""
        if not self.enabled:
            raise Exception("Gmail service not configured")
        
        import requests
        
        # Manually exchange code for tokens to avoid scope validation issues
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()
        
        return {
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "token_uri": token_url,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scopes": token_data.get("scope", "").split(),
            "expiry": None  # Will be set on first use
        }
    
    def get_credentials_from_token(self, token_data: Dict) -> Credentials:
        """Create Credentials object from stored token data"""
        expiry = None
        if token_data.get('expiry'):
            try:
                expiry = datetime.fromisoformat(token_data['expiry'])
            except:
                pass
        
        return Credentials(
            token=token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri'),
            client_id=token_data.get('client_id'),
            client_secret=token_data.get('client_secret'),
            scopes=token_data.get('scopes'),
            expiry=expiry
        )
    
    def get_user_email(self, credentials: Credentials) -> str:
        """Get the user's email address from their Gmail account"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            profile = service.users().getProfile(userId='me').execute()
            return profile['emailAddress']
        except HttpError as error:
            logger.error(f"Error getting user email: {error}")
            raise
    
    def get_gmail_signature(self, credentials: Credentials) -> Optional[str]:
        """Get the user's Gmail signature"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            # Get primary send-as (default identity)
            send_as = service.users().settings().sendAs().list(userId='me').execute()
            send_as_list = send_as.get('sendAs', [])
            
            # Find primary send-as
            for identity in send_as_list:
                if identity.get('isPrimary', False):
                    signature = identity.get('signature', '')
                    return signature if signature else None
            
            # If no primary found, return first signature
            if send_as_list:
                signature = send_as_list[0].get('signature', '')
                return signature if signature else None
            
            return None
        except HttpError as error:
            logger.error(f"Error getting Gmail signature: {error}")
            return None
    
    def fetch_emails(self, credentials: Credentials, max_results: int = 50, page_token: Optional[str] = None) -> Dict:
        """Fetch emails from user's inbox"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            # Get list of message IDs
            results = service.users().messages().list(
                userId='me',
                maxResults=max_results,
                pageToken=page_token
            ).execute()
            
            messages = results.get('messages', [])
            next_page_token = results.get('nextPageToken')
            
            # Fetch full message details
            email_list = []
            for msg in messages:
                try:
                    message = service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='full'
                    ).execute()
                    
                    email_data = self._parse_email_message(message)
                    if email_data:
                        email_list.append(email_data)
                except HttpError as e:
                    logger.error(f"Error fetching message {msg['id']}: {e}")
                    continue
            
            return {
                "emails": email_list,
                "next_page_token": next_page_token
            }
            
        except HttpError as error:
            logger.error(f"Error fetching emails: {error}")
            raise
    
    def _parse_email_message(self, message: Dict) -> Optional[Dict]:
        """Parse Gmail API message into simplified format"""
        try:
            headers = message['payload'].get('headers', [])
            
            # Extract headers
            subject = self._get_header_value(headers, 'Subject')
            from_email = self._get_header_value(headers, 'From')
            to_email = self._get_header_value(headers, 'To')
            date_str = self._get_header_value(headers, 'Date')
            
            # Parse email body
            body = self._get_email_body(message['payload'])
            
            # Parse attachments
            attachments = self._parse_attachments(message['payload'])
            
            # Check if unread
            labels = message.get('labelIds', [])
            is_unread = 'UNREAD' in labels
            is_starred = 'STARRED' in labels
            
            # Get internal date (timestamp in milliseconds)
            internal_date = int(message['internalDate']) / 1000
            
            return {
                "id": message['id'],
                "thread_id": message['threadId'],
                "subject": subject or "(No Subject)",
                "from": from_email,
                "to": to_email,
                "snippet": message.get('snippet', ''),
                "body": body,
                "is_unread": is_unread,
                "is_starred": is_starred,
                "labels": labels,
                "date": datetime.fromtimestamp(internal_date, tz=timezone.utc).isoformat(),
                "internal_date": message['internalDate'],
                "attachments": attachments,
                "has_attachments": len(attachments) > 0
            }
        except Exception as e:
            logger.error(f"Error parsing email: {e}")
            return None
    
    def _get_header_value(self, headers: List[Dict], name: str) -> Optional[str]:
        """Extract header value by name"""
        for header in headers:
            if header['name'].lower() == name.lower():
                return header['value']
        return None
    
    def _get_email_body(self, payload: Dict) -> str:
        """Extract email body from payload"""
        try:
            # Check if body is in payload directly
            if 'body' in payload and payload['body'].get('data'):
                return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
            
            # Check multipart message
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain' and part['body'].get('data'):
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    elif part['mimeType'] == 'text/html' and part['body'].get('data'):
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    elif 'parts' in part:
                        # Nested multipart
                        body = self._get_email_body(part)
                        if body:
                            return body
            
            return ""
        except Exception as e:
            logger.error(f"Error extracting body: {e}")
            return ""
    
    def mark_as_read(self, credentials: Credentials, message_id: str) -> bool:
        """Mark an email as read"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error marking as read: {error}")
            return False
    
    def mark_as_unread(self, credentials: Credentials, message_id: str) -> bool:
        """Mark an email as unread"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': ['UNREAD']}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error marking as unread: {error}")
            return False
    
    def send_email(self, credentials: Credentials, to: str, subject: str, body: str, reply_to_message_id: Optional[str] = None) -> bool:
        """Send an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            message = MIMEText(body, 'html')
            message['to'] = to
            message['subject'] = subject
            
            if reply_to_message_id:
                # Get original message to set threading headers
                original = service.users().messages().get(
                    userId='me',
                    id=reply_to_message_id,
                    format='metadata',
                    metadataHeaders=['Message-ID', 'References']
                ).execute()
                
                headers = original['payload'].get('headers', [])
                message_id = self._get_header_value(headers, 'Message-ID')
                references = self._get_header_value(headers, 'References')
                
                if message_id:
                    message['In-Reply-To'] = message_id
                    message['References'] = f"{references} {message_id}" if references else message_id
            
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            send_message = service.users().messages().send(
                userId='me',
                body={'raw': raw, 'threadId': reply_to_message_id} if reply_to_message_id else {'raw': raw}
            ).execute()
            
            logger.info(f"Email sent successfully: {send_message['id']}")
            return True
            
        except HttpError as error:
            logger.error(f"Error sending email: {error}")
            return False
    
    def archive_email(self, credentials: Credentials, message_id: str) -> bool:
        """Archive an email (remove INBOX label)"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['INBOX']}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error archiving email: {error}")
            return False
    
    def delete_email(self, credentials: Credentials, message_id: str) -> bool:
        """Move email to trash"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().trash(
                userId='me',
                id=message_id
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error deleting email: {error}")
            return False
    
    def delete_label(self, credentials: Credentials, label_id: str) -> bool:
        """Delete a Gmail label"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().labels().delete(userId='me', id=label_id).execute()
            return True
        except HttpError as error:
            logger.error(f"Error deleting label: {error}")
            return False
    
    def get_labels(self, credentials: Credentials) -> List[Dict]:
        """Get all Gmail labels for the user"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            results = service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            # Format labels for frontend
            formatted_labels = []
            for label in labels:
                formatted_labels.append({
                    'id': label['id'],
                    'name': label['name'],
                    'type': label.get('type', 'user'),  # system or user
                    'message_list_visibility': label.get('messageListVisibility', 'show'),
                    'label_list_visibility': label.get('labelListVisibility', 'labelShow'),
                    'color': label.get('color', {}),
                })
            
            return formatted_labels
        except HttpError as error:
            logger.error(f"Error fetching labels: {error}")
            return []
    
    def create_label(self, credentials: Credentials, name: str, color: Optional[Dict] = None) -> Optional[Dict]:
        """Create a new Gmail label"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            label_object = {
                'name': name,
                'messageListVisibility': 'show',
                'labelListVisibility': 'labelShow'
            }
            
            if color:
                label_object['color'] = color
            
            result = service.users().labels().create(userId='me', body=label_object).execute()
            return {
                'id': result['id'],
                'name': result['name'],
                'type': result.get('type', 'user'),
                'color': result.get('color', {}),
            }
        except HttpError as error:
            logger.error(f"Error creating label: {error}")
            return None
    
    def add_label_to_email(self, credentials: Credentials, message_id: str, label_ids: List[str]) -> bool:
        """Add labels to an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': label_ids}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error adding labels: {error}")
            return False
    
    def remove_label_from_email(self, credentials: Credentials, message_id: str, label_ids: List[str]) -> bool:
        """Remove labels from an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': label_ids}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error removing labels: {error}")
            return False
    
    def get_emails_by_label(self, credentials: Credentials, label_id: str, max_results: int = 50) -> List[Dict]:
        """Get emails filtered by label"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            # Search for emails with this label
            results = service.users().messages().list(
                userId='me',
                labelIds=[label_id],
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for msg in messages:
                try:
                    # Fetch full message details
                    message = service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='full'
                    ).execute()
                    
                    email_data = self._parse_email_message(message)
                    if email_data:
                        emails.append(email_data)
                except HttpError as e:
                    logger.error(f"Error fetching message {msg['id']}: {e}")
                    continue
            
            return emails
        except HttpError as error:
            logger.error(f"Error fetching emails by label: {error}")
            return []
    
    def _parse_attachments(self, payload: Dict) -> List[Dict]:
        """Parse attachments from email payload"""
        attachments = []
        
        def extract_attachments(part):
            """Recursively extract attachments from message parts"""
            if 'parts' in part:
                for subpart in part['parts']:
                    extract_attachments(subpart)
            
            # Check if this part is an attachment
            if part.get('filename') and part.get('body', {}).get('attachmentId'):
                attachments.append({
                    'id': part['body']['attachmentId'],
                    'filename': part['filename'],
                    'mimeType': part.get('mimeType', 'application/octet-stream'),
                    'size': part['body'].get('size', 0)
                })
        
        extract_attachments(payload)
        return attachments
    
    def get_attachment(self, credentials: Credentials, message_id: str, attachment_id: str) -> Optional[Dict]:
        """Download an attachment from an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            
            attachment = service.users().messages().attachments().get(
                userId='me',
                messageId=message_id,
                id=attachment_id
            ).execute()
            
            # Return base64-encoded data
            return {
                'data': attachment['data'],
                'size': attachment.get('size', 0)
            }
        except HttpError as error:
            logger.error(f"Error downloading attachment: {error}")
            return None
    
    def star_email(self, credentials: Credentials, message_id: str) -> bool:
        """Star an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': ['STARRED']}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error starring email: {error}")
            return False
    
    def unstar_email(self, credentials: Credentials, message_id: str) -> bool:
        """Unstar an email"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['STARRED']}
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error unstarring email: {error}")
            return False

# Global instance
gmail_service = GmailService()

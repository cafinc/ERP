import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()
logger = logging.getLogger(__name__)

class GoogleTasksService:
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        
        # Google Tasks API scopes
        self.scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
        
        self.enabled = bool(self.client_id and self.client_secret and self.redirect_uri)
        
        if not self.enabled:
            logger.warning("Google Tasks service not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI")
    
    def create_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL for user to connect Google Tasks"""
        if not self.enabled:
            raise Exception("Google Tasks service not configured")
        
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
            prompt='consent'
        )
        
        return authorization_url
    
    def exchange_code_for_tokens(self, code: str) -> Dict:
        """Exchange authorization code for access and refresh tokens"""
        if not self.enabled:
            raise Exception("Google Tasks service not configured")
        
        import requests
        
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
            "expiry": None
        }
    
    def get_credentials_from_token(self, token_data: Dict) -> Credentials:
        """Create Credentials object from stored token data"""
        expiry = None
        if token_data.get('expiry'):
            try:
                expiry = datetime.fromisoformat(token_data['expiry'])
            except:
                expiry = None
        
        creds = Credentials(
            token=token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri'),
            client_id=token_data.get('client_id'),
            client_secret=token_data.get('client_secret'),
            scopes=token_data.get('scopes', []),
            expiry=expiry
        )
        
        return creds
    
    def build_service(self, credentials: Credentials):
        """Build Google Tasks API service"""
        try:
            service = build('tasks', 'v1', credentials=credentials)
            return service
        except Exception as e:
            logger.error(f"Failed to build Google Tasks service: {str(e)}")
            raise
    
    # ==================== TASK LISTS ====================
    
    def get_task_lists(self, credentials: Credentials) -> List[Dict]:
        """Get all task lists for the user"""
        try:
            service = self.build_service(credentials)
            results = service.tasklists().list(maxResults=100).execute()
            task_lists = results.get('items', [])
            
            return [{
                'id': tl.get('id'),
                'title': tl.get('title'),
                'updated': tl.get('updated')
            } for tl in task_lists]
        except HttpError as e:
            logger.error(f"Error fetching task lists: {str(e)}")
            raise
    
    def create_task_list(self, credentials: Credentials, title: str) -> Dict:
        """Create a new task list"""
        try:
            service = self.build_service(credentials)
            task_list = {
                'title': title
            }
            result = service.tasklists().insert(body=task_list).execute()
            
            return {
                'id': result.get('id'),
                'title': result.get('title'),
                'updated': result.get('updated')
            }
        except HttpError as e:
            logger.error(f"Error creating task list: {str(e)}")
            raise
    
    def delete_task_list(self, credentials: Credentials, task_list_id: str):
        """Delete a task list"""
        try:
            service = self.build_service(credentials)
            service.tasklists().delete(tasklist=task_list_id).execute()
        except HttpError as e:
            logger.error(f"Error deleting task list: {str(e)}")
            raise
    
    # ==================== TASKS ====================
    
    def get_tasks(self, credentials: Credentials, task_list_id: str, show_completed: bool = True) -> List[Dict]:
        """Get all tasks from a task list"""
        try:
            service = self.build_service(credentials)
            results = service.tasks().list(
                tasklist=task_list_id,
                maxResults=100,
                showCompleted=show_completed,
                showHidden=True
            ).execute()
            
            tasks = results.get('items', [])
            
            return [{
                'id': task.get('id'),
                'title': task.get('title'),
                'notes': task.get('notes'),
                'status': task.get('status'),  # 'needsAction' or 'completed'
                'due': task.get('due'),
                'completed': task.get('completed'),
                'updated': task.get('updated'),
                'parent': task.get('parent'),  # For subtasks
                'position': task.get('position')
            } for task in tasks]
        except HttpError as e:
            logger.error(f"Error fetching tasks: {str(e)}")
            raise
    
    def create_task(
        self,
        credentials: Credentials,
        task_list_id: str,
        title: str,
        notes: Optional[str] = None,
        due: Optional[str] = None,
        parent: Optional[str] = None
    ) -> Dict:
        """Create a new task in a task list"""
        try:
            service = self.build_service(credentials)
            task = {
                'title': title,
            }
            
            if notes:
                task['notes'] = notes
            if due:
                task['due'] = due  # RFC 3339 timestamp
            if parent:
                task['parent'] = parent
            
            result = service.tasks().insert(
                tasklist=task_list_id,
                body=task,
                parent=parent
            ).execute()
            
            return {
                'id': result.get('id'),
                'title': result.get('title'),
                'notes': result.get('notes'),
                'status': result.get('status'),
                'due': result.get('due'),
                'updated': result.get('updated')
            }
        except HttpError as e:
            logger.error(f"Error creating task: {str(e)}")
            raise
    
    def update_task(
        self,
        credentials: Credentials,
        task_list_id: str,
        task_id: str,
        title: Optional[str] = None,
        notes: Optional[str] = None,
        status: Optional[str] = None,
        due: Optional[str] = None
    ) -> Dict:
        """Update an existing task"""
        try:
            service = self.build_service(credentials)
            
            # Get current task
            task = service.tasks().get(tasklist=task_list_id, task=task_id).execute()
            
            # Update fields
            if title is not None:
                task['title'] = title
            if notes is not None:
                task['notes'] = notes
            if status is not None:
                task['status'] = status  # 'needsAction' or 'completed'
            if due is not None:
                task['due'] = due
            
            result = service.tasks().update(
                tasklist=task_list_id,
                task=task_id,
                body=task
            ).execute()
            
            return {
                'id': result.get('id'),
                'title': result.get('title'),
                'notes': result.get('notes'),
                'status': result.get('status'),
                'due': result.get('due'),
                'completed': result.get('completed'),
                'updated': result.get('updated')
            }
        except HttpError as e:
            logger.error(f"Error updating task: {str(e)}")
            raise
    
    def complete_task(self, credentials: Credentials, task_list_id: str, task_id: str) -> Dict:
        """Mark a task as completed"""
        return self.update_task(credentials, task_list_id, task_id, status='completed')
    
    def delete_task(self, credentials: Credentials, task_list_id: str, task_id: str):
        """Delete a task"""
        try:
            service = self.build_service(credentials)
            service.tasks().delete(tasklist=task_list_id, task=task_id).execute()
        except HttpError as e:
            logger.error(f"Error deleting task: {str(e)}")
            raise
    
    # ==================== SYNC LOGIC ====================
    
    def sync_all_tasks(self, credentials: Credentials) -> Dict:
        """Sync all tasks from all task lists"""
        try:
            task_lists = self.get_task_lists(credentials)
            all_tasks = {}
            
            for task_list in task_lists:
                list_id = task_list['id']
                tasks = self.get_tasks(credentials, list_id)
                all_tasks[list_id] = {
                    'list_info': task_list,
                    'tasks': tasks
                }
            
            return all_tasks
        except Exception as e:
            logger.error(f"Error syncing all tasks: {str(e)}")
            raise

# Create singleton instance
google_tasks_service = GoogleTasksService()

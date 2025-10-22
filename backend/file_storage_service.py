"""
File Storage Service
Handles file uploads, downloads, and storage (local + AWS S3 ready)
"""

import os
import uuid
import hashlib
from datetime import datetime
from typing import Optional, BinaryIO, Tuple
from pathlib import Path
import mimetypes
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 50 * 1024 * 1024))  # 50MB default
ALLOWED_EXTENSIONS = {
    'images': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'},
    'documents': {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'},
    'videos': {'.mp4', '.mov', '.avi', '.mkv', '.webm'},
    'audio': {'.mp3', '.wav', '.ogg', '.m4a'}
}
THUMBNAIL_SIZE = (300, 300)

# Ensure upload directory exists
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(f"{UPLOAD_DIR}/thumbnails").mkdir(parents=True, exist_ok=True)


class FileStorageService:
    """
    File storage service supporting local filesystem and AWS S3
    """
    
    def __init__(self):
        self.upload_dir = UPLOAD_DIR
        self.use_s3 = os.getenv("USE_S3", "false").lower() == "true"
        
        if self.use_s3:
            # AWS S3 configuration (optional)
            self.s3_bucket = os.getenv("S3_BUCKET")
            self.s3_region = os.getenv("S3_REGION", "us-east-1")
            # Initialize S3 client if credentials provided
            try:
                import boto3
                self.s3_client = boto3.client('s3', region_name=self.s3_region)
                logger.info(f"S3 storage enabled: {self.s3_bucket}")
            except Exception as e:
                logger.warning(f"S3 initialization failed, falling back to local storage: {e}")
                self.use_s3 = False
    
    def get_file_category(self, filename: str) -> str:
        """Determine file category from extension"""
        ext = Path(filename).suffix.lower()
        for category, extensions in ALLOWED_EXTENSIONS.items():
            if ext in extensions:
                return category
        return 'other'
    
    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, str]:
        """Validate file type and size"""
        # Check size
        if file_size > MAX_FILE_SIZE:
            return False, f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB"
        
        # Check extension
        ext = Path(filename).suffix.lower()
        all_extensions = set()
        for exts in ALLOWED_EXTENSIONS.values():
            all_extensions.update(exts)
        
        if ext not in all_extensions:
            return False, f"File type {ext} not allowed"
        
        return True, "Valid"
    
    def generate_unique_filename(self, original_filename: str) -> str:
        """Generate unique filename while preserving extension"""
        ext = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"{timestamp}_{unique_id}{ext}"
    
    def calculate_file_hash(self, file_data: bytes) -> str:
        """Calculate SHA256 hash of file"""
        return hashlib.sha256(file_data).hexdigest()
    
    def create_thumbnail(self, file_path: str, original_filename: str) -> Optional[str]:
        """Create thumbnail for image files"""
        try:
            ext = Path(original_filename).suffix.lower()
            if ext not in ALLOWED_EXTENSIONS['images']:
                return None
            
            # Open and resize image
            with Image.open(file_path) as img:
                # Convert RGBA to RGB if needed
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                
                # Save thumbnail
                thumbnail_filename = f"thumb_{Path(file_path).name}"
                thumbnail_path = f"{self.upload_dir}/thumbnails/{thumbnail_filename}"
                img.save(thumbnail_path, 'JPEG', quality=85)
                
                return thumbnail_path
        
        except Exception as e:
            logger.error(f"Error creating thumbnail: {e}")
            return None
    
    def save_file_local(self, file_data: bytes, filename: str) -> Tuple[str, str]:
        """Save file to local filesystem"""
        unique_filename = self.generate_unique_filename(filename)
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Create thumbnail if image
        thumbnail_path = self.create_thumbnail(file_path, filename)
        
        return file_path, thumbnail_path
    
    def save_file_s3(self, file_data: bytes, filename: str) -> Tuple[str, Optional[str]]:
        """Save file to AWS S3"""
        unique_filename = self.generate_unique_filename(filename)
        
        try:
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=unique_filename,
                Body=file_data,
                ContentType=mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            )
            
            # Generate URL
            file_url = f"https://{self.s3_bucket}.s3.{self.s3_region}.amazonaws.com/{unique_filename}"
            
            # Create and upload thumbnail if image
            thumbnail_url = None
            category = self.get_file_category(filename)
            if category == 'images':
                # Save temp file for thumbnail generation
                temp_path = f"/tmp/{unique_filename}"
                with open(temp_path, 'wb') as f:
                    f.write(file_data)
                
                thumbnail_path = self.create_thumbnail(temp_path, filename)
                if thumbnail_path:
                    with open(thumbnail_path, 'rb') as thumb_file:
                        thumb_filename = f"thumb_{unique_filename}"
                        self.s3_client.put_object(
                            Bucket=self.s3_bucket,
                            Key=f"thumbnails/{thumb_filename}",
                            Body=thumb_file,
                            ContentType='image/jpeg'
                        )
                        thumbnail_url = f"https://{self.s3_bucket}.s3.{self.s3_region}.amazonaws.com/thumbnails/{thumb_filename}"
                    
                    # Cleanup temp files
                    os.remove(temp_path)
                    os.remove(thumbnail_path)
            
            return file_url, thumbnail_url
        
        except Exception as e:
            logger.error(f"Error uploading to S3: {e}")
            # Fallback to local storage
            return self.save_file_local(file_data, filename)
    
    def save_file(self, file_data: bytes, filename: str) -> dict:
        """
        Save file to storage (S3 or local)
        Returns file metadata dict
        """
        # Validate file
        is_valid, message = self.validate_file(filename, len(file_data))
        if not is_valid:
            raise ValueError(message)
        
        # Save file
        if self.use_s3:
            file_url, thumbnail_url = self.save_file_s3(file_data, filename)
        else:
            file_path, thumbnail_path = self.save_file_local(file_data, filename)
            # Convert local paths to URLs
            file_url = f"/api/communications/file/{Path(file_path).name}"
            thumbnail_url = f"/api/communications/file/thumbnails/{Path(thumbnail_path).name}" if thumbnail_path else None
        
        # Calculate file hash
        file_hash = self.calculate_file_hash(file_data)
        
        # Get file info
        category = self.get_file_category(filename)
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        return {
            'file_id': str(uuid.uuid4()),
            'filename': filename,
            'unique_filename': Path(file_url).name if not self.use_s3 else file_url.split('/')[-1],
            'file_type': mime_type,
            'file_category': category,
            'file_size': len(file_data),
            'file_hash': file_hash,
            'url': file_url,
            'thumbnail_url': thumbnail_url,
            'storage_type': 's3' if self.use_s3 else 'local',
            'uploaded_at': datetime.utcnow()
        }
    
    def get_file_path(self, filename: str) -> str:
        """Get local file path"""
        return os.path.join(self.upload_dir, filename)
    
    def file_exists(self, filename: str) -> bool:
        """Check if file exists"""
        if self.use_s3:
            try:
                self.s3_client.head_object(Bucket=self.s3_bucket, Key=filename)
                return True
            except:
                return False
        else:
            return os.path.exists(self.get_file_path(filename))
    
    def delete_file(self, filename: str) -> bool:
        """Delete file from storage"""
        try:
            if self.use_s3:
                self.s3_client.delete_object(Bucket=self.s3_bucket, Key=filename)
            else:
                file_path = self.get_file_path(filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False


# Singleton instance
file_storage_service = FileStorageService()

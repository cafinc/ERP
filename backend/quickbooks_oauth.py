from intuitlib.client import AuthClient
from intuitlib.enums import Scopes
from intuitlib.exceptions import AuthClientError
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class QuickBooksAuthClient:
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str, environment: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.environment = environment
        self.auth_client = AuthClient(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            environment=environment
        )
    
    def get_authorization_url(self, user_id: Optional[str] = None) -> tuple[str, str]:
        """Generate QuickBooks authorization URL
        
        Returns:
            tuple: (authorization_url, state_token) where state_token can be used to lookup user_id
        """
        try:
            import secrets
            import urllib.parse
            
            scopes = [Scopes.ACCOUNTING]
            
            # Generate a unique state token
            state_token = secrets.token_urlsafe(32)
            
            # Get auth URL - the library will add its own state parameter
            base_auth_url = self.auth_client.get_authorization_url(scopes)
            
            # Parse the URL to replace the state parameter
            parsed_url = urllib.parse.urlparse(base_auth_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Replace the state parameter with our token
            query_params['state'] = [state_token]
            
            # Rebuild the URL
            new_query = urllib.parse.urlencode(query_params, doseq=True)
            auth_url = urllib.parse.urlunparse((
                parsed_url.scheme,
                parsed_url.netloc,
                parsed_url.path,
                parsed_url.params,
                new_query,
                parsed_url.fragment
            ))
            
            logger.info(f"Generated authorization URL with state token for user: {user_id}")
            return auth_url, state_token
            
        except AuthClientError as e:
            logger.error(f"Error generating auth URL: {e}")
            raise
    
    def exchange_code_for_tokens(self, auth_code: str, realm_id: str) -> dict:
        """Exchange authorization code for access and refresh tokens"""
        try:
            self.auth_client.get_bearer_token(auth_code, realm_id=realm_id)
            
            tokens = {
                "access_token": self.auth_client.access_token,
                "refresh_token": self.auth_client.refresh_token,
                "expires_in": self.auth_client.expires_in,
                "refresh_token_expires_in": self.auth_client.x_refresh_token_expires_in,
                "realm_id": realm_id,
                "token_created_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Successfully exchanged code for tokens for realm: {realm_id}")
            return tokens
            
        except AuthClientError as e:
            logger.error(f"Error exchanging auth code: {e.status_code} - {e.content}")
            raise
    
    def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh expired access token using refresh token"""
        try:
            self.auth_client.refresh(refresh_token=refresh_token)
            
            tokens = {
                "access_token": self.auth_client.access_token,
                "refresh_token": self.auth_client.refresh_token,
                "expires_in": self.auth_client.expires_in,
                "refresh_token_expires_in": self.auth_client.x_refresh_token_expires_in,
                "token_refreshed_at": datetime.utcnow().isoformat()
            }
            
            logger.info("Successfully refreshed access token")
            return tokens
            
        except AuthClientError as e:
            logger.error(f"Error refreshing token: {e.status_code} - {e.content}")
            raise
    
    def revoke_token(self, token: str) -> bool:
        """Revoke access or refresh token"""
        try:
            result = self.auth_client.revoke(token=token)
            logger.info("Successfully revoked token")
            return result
        except AuthClientError as e:
            logger.error(f"Error revoking token: {e}")
            raise

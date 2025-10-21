import requests
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class QuickBooksAPIError(Exception):
    """Custom exception for QuickBooks API errors"""
    def __init__(self, status_code: int, message: str, details: Optional[str] = None):
        self.status_code = status_code
        self.message = message
        self.details = details
        super().__init__(f"QuickBooks API Error {status_code}: {message}")

class QuickBooksClient:
    def __init__(self, access_token: str, realm_id: str, environment: str = "sandbox"):
        self.access_token = access_token
        self.realm_id = realm_id
        self.base_url = (
            "https://sandbox-quickbooks.api.intuit.com"
            if environment == "sandbox"
            else "https://quickbooks.api.intuit.com"
        )
        self.api_version = "v3"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    def _build_url(self, endpoint: str) -> str:
        """Build full API URL"""
        return f"{self.base_url}/{self.api_version}/company/{self.realm_id}/{endpoint}"
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to QuickBooks API with retry logic"""
        url = self._build_url(endpoint)
        headers = self._get_headers()
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=30
            )
            
            # Capture intuit_tid for troubleshooting
            intuit_tid = response.headers.get('intuit_tid', 'N/A')
            
            if response.status_code == 401:
                logger.error(f"Unauthorized error - intuit_tid: {intuit_tid}")
                raise QuickBooksAPIError(401, "Unauthorized - Token may be expired", f"intuit_tid: {intuit_tid}")
            
            if response.status_code >= 400:
                error_data = response.json() if response.content else {}
                error_message = error_data.get("Fault", {}).get("Error", [{}])[0].get("Message", "Unknown error")
                logger.error(f"QuickBooks API error - intuit_tid: {intuit_tid}, status: {response.status_code}, message: {error_message}")
                raise QuickBooksAPIError(
                    response.status_code, 
                    error_message, 
                    f"intuit_tid: {intuit_tid}, details: {str(error_data)}"
                )
            
            logger.debug(f"QuickBooks API success - intuit_tid: {intuit_tid}, endpoint: {endpoint}")
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise QuickBooksAPIError(500, "Request failed", str(e))
    
    def get_company_info(self) -> Dict[str, Any]:
        """Get company information"""
        endpoint = f"companyinfo/{self.realm_id}"
        return self._make_request("GET", endpoint)
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new customer in QuickBooks"""
        logger.info(f"Creating customer: {customer_data.get('DisplayName')}")
        return self._make_request("POST", "customer", data=customer_data)
    
    def update_customer(self, customer_id: str, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing customer using sparse update"""
        customer_data["Id"] = customer_id
        customer_data["sparse"] = True
        logger.info(f"Updating customer ID: {customer_id}")
        return self._make_request("POST", "customer", data=customer_data)
    
    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get customer by ID"""
        endpoint = f"customer/{customer_id}"
        return self._make_request("GET", endpoint)
    
    def query_customers(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query customers with optional filter"""
        if not query:
            query = "SELECT * FROM Customer MAXRESULTS 1000"
        
        params = {"query": query}
        response = self._make_request("GET", "query", params=params)
        return response.get("QueryResponse", {}).get("Customer", [])
    
    def create_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new invoice in QuickBooks"""
        logger.info(f"Creating invoice for customer: {invoice_data.get('CustomerRef', {}).get('value')}")
        return self._make_request("POST", "invoice", data=invoice_data)
    
    def update_invoice(self, invoice_id: str, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing invoice using sparse update"""
        invoice_data["Id"] = invoice_id
        invoice_data["sparse"] = True
        logger.info(f"Updating invoice ID: {invoice_id}")
        return self._make_request("POST", "invoice", data=invoice_data)
    
    def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Get invoice by ID"""
        endpoint = f"invoice/{invoice_id}"
        return self._make_request("GET", endpoint)
    
    def query_invoices(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query invoices with optional filter"""
        if not query:
            query = "SELECT * FROM Invoice MAXRESULTS 1000"
        
        params = {"query": query}
        response = self._make_request("GET", "query", params=params)
        return response.get("QueryResponse", {}).get("Invoice", [])
    
    def create_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a payment record in QuickBooks"""
        logger.info(f"Creating payment for customer: {payment_data.get('CustomerRef', {}).get('value')}")
        return self._make_request("POST", "payment", data=payment_data)
    
    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """Get payment by ID"""
        endpoint = f"payment/{payment_id}"
        return self._make_request("GET", endpoint)
    
    def query_payments(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query payments with optional filter"""
        if not query:
            query = "SELECT * FROM Payment MAXRESULTS 1000"
        
        params = {"query": query}
        response = self._make_request("GET", "query", params=params)
        return response.get("QueryResponse", {}).get("Payment", [])
    
    def create_estimate(self, estimate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an estimate in QuickBooks"""
        logger.info(f"Creating estimate for customer: {estimate_data.get('CustomerRef', {}).get('value')}")
        return self._make_request("POST", "estimate", data=estimate_data)
    
    def update_estimate(self, estimate_id: str, estimate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing estimate using sparse update"""
        estimate_data["Id"] = estimate_id
        estimate_data["sparse"] = True
        logger.info(f"Updating estimate ID: {estimate_id}")
        return self._make_request("POST", "estimate", data=estimate_data)
    
    def get_estimate(self, estimate_id: str) -> Dict[str, Any]:
        """Get estimate by ID"""
        endpoint = f"estimate/{estimate_id}"
        return self._make_request("GET", endpoint)
    
    def query_estimates(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query estimates with optional filter"""
        if not query:
            query = "SELECT * FROM Estimate MAXRESULTS 1000"
        
        params = {"query": query}
        response = self._make_request("GET", "query", params=params)
        return response.get("QueryResponse", {}).get("Estimate", [])

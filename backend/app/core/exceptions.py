from fastapi import HTTPException, status


class TCGuardianException(HTTPException):
    """Base exception for T&C Guardian application."""
    pass


class AnalysisException(TCGuardianException):
    """Exception raised during document analysis."""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {detail}"
        )


class IngestionException(TCGuardianException):
    """Exception raised during document ingestion."""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=f"Ingestion failed: {detail}")


class CacheException(TCGuardianException):
    """Exception raised during cache operations."""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cache operation failed: {detail}"
        )


class ConfigurationException(TCGuardianException):
    """Exception raised for configuration errors."""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration error: {detail}"
        )

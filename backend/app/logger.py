import os
import sys
from loguru import logger

def configure_logging():
    """Configures the logger based on the environment."""
    # Remove the default standard error logger
    logger.remove()
    
    # Check if we are in production
    env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        # Vo jo production me use hoti hai: Structured JSON logging
        logger.add(
            sys.stdout, 
            serialize=True, 
            level="INFO",
            enqueue=True # Thread-safe async logging
        )
    else:
        # Beautiful, colorful console logs for local vibe coding
        logger.add(
            sys.stdout, 
            colorize=True, 
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>", 
            level="DEBUG",
            enqueue=True
        )

# Initialize it immediately when imported
configure_logging()
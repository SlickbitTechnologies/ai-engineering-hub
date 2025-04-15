from sqlalchemy.ext.declarative import declarative_base

# Create a base class for declarative models
Base = declarative_base()

# The models will be imported in __all_models.py to avoid circular imports 
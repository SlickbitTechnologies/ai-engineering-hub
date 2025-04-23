import json
import os
import logging
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TemplateContext:
    def __init__(self):
        # Get the backend directory path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Set the templates directory path
        self.templates_dir = os.path.join(backend_dir, "templates")
        
        # Create templates directory if it doesn't exist
        os.makedirs(self.templates_dir, exist_ok=True)
        
        # Initialize templates dictionary
        self.templates = {}
        
        # Load all templates
        self._load_templates()
        
    def _load_templates(self):
        """Load all templates from the templates directory."""
        try:
            # Clear existing templates
            self.templates.clear()
            
            # Load each template file
            for filename in os.listdir(self.templates_dir):
                if filename.endswith('.json'):
                    template_id = filename.replace('.json', '')
                    template_path = os.path.join(self.templates_dir, filename)
                    
                    try:
                        with open(template_path, 'r') as f:
                            template_data = json.load(f)
                            self.templates[template_id] = template_data
                    except Exception as e:
                        logger.error(f"Error loading template {template_id}: {str(e)}")
                        continue
            
            logger.info(f"Loaded {len(self.templates)} templates")
            
        except Exception as e:
            logger.error(f"Error loading templates: {str(e)}")
            self.templates = {}
    
    def get_template(self, template_id: str) -> Optional[Dict]:
        """
        Get a template by its ID.
        
        Args:
            template_id (str): The ID of the template to retrieve
            
        Returns:
            Optional[Dict]: The template data if found, None otherwise
        """
        # Reload templates to ensure we have the latest data
        self._load_templates()
        
        if template_id in self.templates:
            return self.templates[template_id]
        
        logger.error(f"Template with ID {template_id} not found")
        return None
    
    def get_template_fields(self, template_id: str) -> List[Dict]:
        """
        Get the fields for a specific template.
        
        Args:
            template_id (str): The ID of the template
            
        Returns:
            List[Dict]: List of field dictionaries
        """
        template = self.get_template(template_id)
        if not template:
            return []
            
        return template.get('metadataFields', [])
    
    def save_template(self, template_data: Dict) -> bool:
        """
        Save a template to a file.
        
        Args:
            template_data (Dict): The template data to save
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            template_id = template_data.get('id')
            if not template_id:
                logger.error("Template ID is required")
                return False
                
            template_path = os.path.join(self.templates_dir, f"{template_id}.json")
            
            with open(template_path, 'w') as f:
                json.dump(template_data, f, indent=2)
                
            # Update the in-memory templates
            self.templates[template_id] = template_data
            
            logger.info(f"Saved template with ID: {template_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving template: {str(e)}")
            return False
    
    def delete_template(self, template_id: str) -> bool:
        """
        Delete a template.
        
        Args:
            template_id (str): The ID of the template to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            template_path = os.path.join(self.templates_dir, f"{template_id}.json")
            
            if os.path.exists(template_path):
                os.remove(template_path)
                if template_id in self.templates:
                    del self.templates[template_id]
                    
                logger.info(f"Deleted template with ID: {template_id}")
                return True
                
            logger.error(f"Template with ID {template_id} not found")
            return False
            
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            return False

    def get_all_templates(self) -> List[Dict]:
        """Get all templates."""
        return list(self.templates.values()) 
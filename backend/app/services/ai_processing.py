import google.generativeai as genai
from typing import Dict, List, Optional
import json
import re
from app.core.config import settings

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

class GeminiProcessor:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
        self.vision_model = genai.GenerativeModel('gemini-pro-vision')
    
    async def extract_recipe_from_text(self, text: str) -> Dict:
        """Extract structured recipe data from text using Gemini"""
        
        prompt = f"""
        Extract recipe information from the following text and return a JSON object with this exact structure:
        {{
            "title": "Recipe title",
            "description": "Brief description",
            "prep_time_minutes": number or null,
            "cook_time_minutes": number or null,
            "servings": number or null,
            "difficulty_level": "easy" | "medium" | "hard",
            "cuisine_type": "string or null",
            "ingredients": [
                {{
                    "name": "ingredient name",
                    "quantity": number or null,
                    "unit": "measurement unit",
                    "preparation_notes": "optional preparation instructions"
                }}
            ],
            "instructions": "Step by step cooking instructions as a single string",
            "tags": ["tag1", "tag2"],
            "confidence_score": 0.0 to 1.0
        }}
        
        Text to analyze:
        {text}
        
        If the text doesn't contain a recipe, set confidence_score to 0.0 and return minimal structure.
        Only return the JSON object, no other text.
        """
        
        try:
            response = await self._generate_content(prompt)
            
            # Clean and parse JSON response
            cleaned_response = self._clean_json_response(response)
            recipe_data = json.loads(cleaned_response)
            
            # Validate and sanitize the response
            return self._validate_recipe_data(recipe_data)
            
        except Exception as e:
            # Return minimal structure on error
            return {
                "title": "Error extracting recipe",
                "description": "",
                "prep_time_minutes": None,
                "cook_time_minutes": None,
                "servings": None,
                "difficulty_level": "medium",
                "cuisine_type": None,
                "ingredients": [],
                "instructions": "",
                "tags": [],
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    async def extract_recipe_from_image(self, image_path: str) -> Dict:
        """Extract recipe from image using Gemini Vision"""
        
        prompt = """
        Analyze this image and extract any recipe information visible. Look for:
        - Recipe title
        - Ingredients list with quantities
        - Cooking instructions
        - Cooking times and servings
        
        Return the information in the same JSON format as specified for text extraction.
        If no recipe is visible, set confidence_score to 0.0.
        """
        
        try:
            # Load image
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            response = await self._generate_content_with_image(prompt, image_data)
            
            # Clean and parse JSON response
            cleaned_response = self._clean_json_response(response)
            recipe_data = json.loads(cleaned_response)
            
            return self._validate_recipe_data(recipe_data)
            
        except Exception as e:
            return {
                "title": "Error extracting from image",
                "description": "",
                "prep_time_minutes": None,
                "cook_time_minutes": None,
                "servings": None,
                "difficulty_level": "medium",
                "cuisine_type": None,
                "ingredients": [],
                "instructions": "",
                "tags": [],
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    async def enhance_recipe_description(self, partial_recipe: Dict) -> Dict:
        """Enhance partial recipe data with AI suggestions"""
        
        prompt = f"""
        Enhance this partial recipe data by filling in missing information and improving descriptions:
        
        Current recipe data:
        {json.dumps(partial_recipe, indent=2)}
        
        Please:
        1. Improve the title if it's generic
        2. Add a better description if missing
        3. Estimate cooking times if missing
        4. Suggest difficulty level if not set
        5. Add relevant tags
        6. Improve ingredient descriptions
        
        Return the enhanced recipe in the same JSON format, keeping all existing data intact.
        """
        
        try:
            response = await self._generate_content(prompt)
            cleaned_response = self._clean_json_response(response)
            enhanced_recipe = json.loads(cleaned_response)
            
            return self._validate_recipe_data(enhanced_recipe)
            
        except Exception as e:
            # Return original recipe if enhancement fails
            partial_recipe["enhancement_error"] = str(e)
            return partial_recipe
    
    async def _generate_content(self, prompt: str) -> str:
        """Generate content using Gemini"""
        response = self.model.generate_content(prompt)
        return response.text
    
    async def _generate_content_with_image(self, prompt: str, image_data: bytes) -> str:
        """Generate content with image using Gemini Vision"""
        response = self.vision_model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_data}])
        return response.text
    
    def _clean_json_response(self, response: str) -> str:
        """Clean and extract JSON from Gemini response"""
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*$', '', response)
        
        # Find JSON object in response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return response.strip()
    
    def _validate_recipe_data(self, data: Dict) -> Dict:
        """Validate and sanitize recipe data"""
        # Ensure required fields exist
        required_fields = {
            "title": "",
            "description": "",
            "prep_time_minutes": None,
            "cook_time_minutes": None,
            "servings": None,
            "difficulty_level": "medium",
            "cuisine_type": None,
            "ingredients": [],
            "instructions": "",
            "tags": [],
            "confidence_score": 0.0
        }
        
        for field, default in required_fields.items():
            if field not in data:
                data[field] = default
        
        # Validate specific fields
        if data["difficulty_level"] not in ["easy", "medium", "hard"]:
            data["difficulty_level"] = "medium"
        
        if not isinstance(data["ingredients"], list):
            data["ingredients"] = []
        
        if not isinstance(data["tags"], list):
            data["tags"] = []
        
        # Ensure confidence score is between 0 and 1
        try:
            confidence = float(data["confidence_score"])
            data["confidence_score"] = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            data["confidence_score"] = 0.0
        
        return data

gemini_processor = GeminiProcessor()
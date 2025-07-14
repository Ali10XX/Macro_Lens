import easyocr
import cv2
import numpy as np
from typing import List, Dict, Tuple
import os

class OCRProcessor:
    def __init__(self):
        # Initialize EasyOCR reader with English support
        # Add more languages as needed: ['en', 'es', 'fr', etc.]
        self.reader = easyocr.Reader(['en'])
    
    async def extract_text_from_image(self, image_path: str) -> Dict:
        """Extract text from image using EasyOCR"""
        try:
            # Read and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise Exception(f"Could not load image: {image_path}")
            
            # Preprocess image for better OCR results
            processed_image = self._preprocess_image(image)
            
            # Extract text using EasyOCR
            results = self.reader.readtext(processed_image)
            
            # Process and structure the results
            extracted_data = self._process_ocr_results(results)
            
            return {
                "text": extracted_data["full_text"],
                "structured_text": extracted_data["lines"],
                "confidence": extracted_data["avg_confidence"],
                "bounding_boxes": extracted_data["bounding_boxes"],
                "word_count": len(extracted_data["full_text"].split()),
                "success": True
            }
            
        except Exception as e:
            return {
                "text": "",
                "structured_text": [],
                "confidence": 0.0,
                "bounding_boxes": [],
                "word_count": 0,
                "success": False,
                "error": str(e)
            }
    
    async def extract_text_from_multiple_images(self, image_paths: List[str]) -> Dict:
        """Extract text from multiple images (e.g., video frames)"""
        all_results = []
        total_confidence = 0
        total_text = ""
        
        for image_path in image_paths:
            result = await self.extract_text_from_image(image_path)
            if result["success"]:
                all_results.append(result)
                total_confidence += result["confidence"]
                if result["text"].strip():
                    total_text += result["text"] + "\n"
        
        if not all_results:
            return {
                "combined_text": "",
                "individual_results": [],
                "average_confidence": 0.0,
                "success": False
            }
        
        return {
            "combined_text": total_text.strip(),
            "individual_results": all_results,
            "average_confidence": total_confidence / len(all_results),
            "success": True,
            "processed_images": len(all_results)
        }
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image to improve OCR accuracy"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding to handle different lighting conditions
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Apply morphological operations to clean up the image
        kernel = np.ones((1, 1), np.uint8)
        processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
        
        return processed
    
    def _process_ocr_results(self, results: List) -> Dict:
        """Process raw EasyOCR results into structured format"""
        lines = []
        full_text = ""
        confidences = []
        bounding_boxes = []
        
        for (bbox, text, confidence) in results:
            # Clean the extracted text
            cleaned_text = text.strip()
            if cleaned_text:
                lines.append({
                    "text": cleaned_text,
                    "confidence": confidence,
                    "bbox": bbox
                })
                full_text += cleaned_text + " "
                confidences.append(confidence)
                bounding_boxes.append(bbox)
        
        # Calculate average confidence
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            "full_text": full_text.strip(),
            "lines": lines,
            "avg_confidence": avg_confidence,
            "bounding_boxes": bounding_boxes
        }
    
    async def detect_recipe_elements(self, image_path: str) -> Dict:
        """Detect specific recipe elements in image text"""
        ocr_result = await self.extract_text_from_image(image_path)
        
        if not ocr_result["success"]:
            return ocr_result
        
        text = ocr_result["text"].lower()
        
        # Look for recipe-specific patterns
        recipe_indicators = {
            "has_ingredients": any(word in text for word in [
                "ingredients", "cups", "tbsp", "tsp", "tablespoon", "teaspoon",
                "ounce", "pound", "gram", "ml", "liter"
            ]),
            "has_instructions": any(word in text for word in [
                "instructions", "directions", "steps", "cook", "bake", "mix",
                "heat", "add", "combine", "stir"
            ]),
            "has_timing": any(word in text for word in [
                "minutes", "hours", "mins", "prep time", "cook time", "bake for"
            ]),
            "has_servings": any(word in text for word in [
                "serves", "servings", "portions", "yield"
            ])
        }
        
        # Calculate recipe confidence based on detected elements
        recipe_score = sum(recipe_indicators.values()) / len(recipe_indicators)
        
        return {
            **ocr_result,
            "recipe_indicators": recipe_indicators,
            "recipe_confidence": recipe_score,
            "likely_recipe": recipe_score > 0.5
        }

ocr_processor = OCRProcessor()
import os
import tempfile
from typing import Dict, Optional
from moviepy.editor import VideoFileClip
import ffmpeg
from app.core.config import settings

class VideoProcessor:
    def __init__(self):
        self.max_video_size = settings.MAX_VIDEO_SIZE
        self.supported_formats = settings.SUPPORTED_VIDEO_FORMATS

    async def extract_video_metadata(self, video_path: str) -> Dict:
        """Extract metadata and description from video file"""
        try:
            # Use ffmpeg to extract metadata
            probe = ffmpeg.probe(video_path)
            
            metadata = {
                'duration': float(probe['format'].get('duration', 0)),
                'size': int(probe['format'].get('size', 0)),
                'format': probe['format'].get('format_name', ''),
                'title': '',
                'description': '',
                'tags': []
            }
            
            # Extract title and description from metadata
            format_tags = probe['format'].get('tags', {})
            if format_tags:
                metadata['title'] = format_tags.get('title', '')
                metadata['description'] = format_tags.get('comment', '') or format_tags.get('description', '')
                
                # Extract keywords/tags if available
                keywords = format_tags.get('keywords', '')
                if keywords:
                    metadata['tags'] = [tag.strip() for tag in keywords.split(',')]
            
            return metadata
            
        except Exception as e:
            raise Exception(f"Error extracting video metadata: {str(e)}")

    async def validate_video_file(self, file_path: str, file_size: int) -> bool:
        """Validate video file format and size"""
        if file_size > self.max_video_size:
            return False
            
        file_extension = os.path.splitext(file_path)[1].lower()
        return file_extension in self.supported_formats

    async def extract_frames(self, video_path: str, num_frames: int = 5) -> list:
        """Extract frames from video for potential OCR processing"""
        try:
            with VideoFileClip(video_path) as clip:
                duration = clip.duration
                frame_times = [i * duration / (num_frames - 1) for i in range(num_frames)]
                
                frames = []
                for i, time in enumerate(frame_times):
                    frame_path = f"/tmp/frame_{i}_{os.getpid()}.jpg"
                    clip.save_frame(frame_path, t=time)
                    frames.append(frame_path)
                    
                return frames
                
        except Exception as e:
            raise Exception(f"Error extracting frames: {str(e)}")

    async def cleanup_temp_files(self, file_paths: list):
        """Clean up temporary files"""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass  # Ignore cleanup errors

video_processor = VideoProcessor()
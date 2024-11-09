from PIL import Image, ImageEnhance, ImageFilter

import numpy as np

from typing import Dict, Any, Tuple, Optional

import io



class ImageProcessor:

    @staticmethod

    def validate_image(image: Image.Image) -> Dict[str, Any]:

        return {

            "format": image.format,

            "size": image.size,

            "mode": image.mode,

            "info": image.info

        }



    @staticmethod

    def preprocess(image: Image.Image, 

                   resize: Optional[Tuple[int, int]] = None,

                   grayscale: bool = False,

                   normalize: bool = False) -> Dict[str, Any]:

        """

        Preprocess the image with various options

        Args:

            image: Input PIL Image

            resize: Optional tuple of (width, height) for resizing

            grayscale: Convert to grayscale if True

            normalize: Normalize pixel values if True

        """

        try:

            # Make a copy of the image

            processed_image = image.copy()

            steps = []



            # Convert to RGB if needed

            if processed_image.mode != 'RGB':

                processed_image = processed_image.convert('RGB')

                steps.append("Converted to RGB")



            # Apply noise reduction

            processed_image = processed_image.filter(ImageFilter.MedianFilter(size=3))

            steps.append("Applied noise reduction")



            # Enhance sharpness

            enhancer = ImageEnhance.Sharpness(processed_image)

            processed_image = enhancer.enhance(1.5)

            steps.append("Enhanced sharpness")



            # Enhance contrast

            enhancer = ImageEnhance.Contrast(processed_image)

            processed_image = enhancer.enhance(1.2)

            steps.append("Enhanced contrast")



            # Convert to grayscale if specified

            if grayscale:

                processed_image = processed_image.convert('L')

                processed_image = processed_image.convert('RGB')  # Convert back to RGB for consistency

                steps.append("Converted to grayscale")



            # Normalize pixel values if specified

            if normalize:

                img_array = np.array(processed_image)

                # Normalize each channel separately

                for channel in range(3):

                    channel_data = img_array[:,:,channel]

                    min_val = np.min(channel_data)

                    max_val = np.max(channel_data)

                    if max_val > min_val:

                        img_array[:,:,channel] = ((channel_data - min_val) * 255 / (max_val - min_val)).astype(np.uint8)

                processed_image = Image.fromarray(img_array)

                steps.append("Normalized pixel values")



            # Resize if specified (do this last to preserve quality)

            if resize and all(resize):

                original_size = processed_image.size

                processed_image = processed_image.resize(resize, Image.Resampling.LANCZOS)

                steps.append(f"Resized from {original_size[0]}×{original_size[1]} to {resize[0]}×{resize[1]}")



            # Auto-adjust color balance

            processed_image = ImageEnhance.Color(processed_image).enhance(1.2)

            steps.append("Adjusted color balance")



            # Auto-adjust brightness

            processed_image = ImageEnhance.Brightness(processed_image).enhance(1.1)

            steps.append("Optimized brightness")



            return {

                "processed_image": processed_image,

                "steps": steps

            }



        except Exception as e:

            raise ValueError(f"Error preprocessing image: {str(e)}")



    @staticmethod

    def augment(image: Image.Image) -> Dict[str, Any]:

        """

        Apply various augmentations to the image

        """

        try:

            # Make sure we're working with RGB image

            if image.mode != 'RGB':

                image = image.convert('RGB')

            

            augmented_images = {

                "rotated": image.rotate(90, expand=True),

                "flipped": image.transpose(Image.FLIP_LEFT_RIGHT),

                "brightened": ImageProcessor._adjust_brightness(image, 1.3),

                "darkened": ImageProcessor._adjust_brightness(image, 0.7),

                "high_contrast": ImageEnhance.Contrast(image).enhance(1.5),

                "saturated": ImageEnhance.Color(image).enhance(1.5),

                "blurred": image.filter(ImageFilter.GaussianBlur(radius=2)),

                "sharpened": image.filter(ImageFilter.SHARPEN)

            }

            

            return {

                "augmented_images": augmented_images,

                "steps": [

                    "90-degree rotation",

                    "Horizontal flip",

                    "Brightness increase (1.3x)",

                    "Brightness decrease (0.7x)",

                    "High contrast (1.5x)",

                    "Increased saturation (1.5x)",

                    "Gaussian blur",

                    "Sharpening filter"

                ]

            }

        except Exception as e:

            raise ValueError(f"Error augmenting image: {str(e)}")



    @staticmethod

    def _adjust_brightness(image: Image.Image, factor: float) -> Image.Image:

        """Helper method to adjust image brightness"""

        enhancer = ImageEnhance.Brightness(image)

        return enhancer.enhance(factor)

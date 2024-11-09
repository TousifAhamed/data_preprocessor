import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re
import random
from typing import Dict, Any
from app.core.logger import logger

def download_nltk_data():
    """Download required NLTK data with error handling"""
    required_packages = [
        'punkt',           # Changed from punkt_tab to punkt
        'stopwords',
        'wordnet',
        'averaged_perceptron_tagger'
    ]
    
    try:
        for package in required_packages:
            try:
                nltk.data.find(f'tokenizers/{package}')
                logger.info(f"NLTK package '{package}' already downloaded")
            except LookupError:
                nltk.download(package)
                logger.info(f"Downloaded NLTK package '{package}'")
    except Exception as e:
        logger.error(f"Error downloading NLTK data: {str(e)}")
        raise

# Download NLTK data when module is imported
download_nltk_data()

class TextProcessor:
    def __init__(self):
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
            logger.info("TextProcessor initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing TextProcessor: {str(e)}")
            raise

    def validate_text(self, text: str) -> Dict[str, Any]:
        try:
            # Basic text validation
            if not text or not isinstance(text, str):
                raise ValueError("Invalid text input")

            return {
                "length": len(text),
                "word_count": len(text.split()),
                "line_count": len(text.splitlines()),
                "has_special_chars": bool(re.search(r'[^a-zA-Z0-9\s]', text)),
                "is_valid": True
            }
        except Exception as e:
            logger.error(f"Error validating text: {str(e)}")
            return {"is_valid": False, "error": str(e)}

    def preprocess(self, text: str) -> Dict[str, Any]:
        try:
            # Store original text
            original_text = text
            
            # Basic preprocessing
            text = text.strip()  # Remove leading/trailing whitespace
            text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
            text = text.lower()  # Convert to lowercase
            
            # Remove special characters and digits, but keep sentence structure
            text = re.sub(r'[^a-zA-Z\s\.]', '', text)
            
            # Split into sentences and tokenize each sentence
            sentences = sent_tokenize(text)
            processed_sentences = []
            
            for sentence in sentences:
                # Tokenize words
                tokens = word_tokenize(sentence)
                
                # Remove stop words and lemmatize
                processed_tokens = []
                for token in tokens:
                    if token.lower() not in self.stop_words:
                        processed_tokens.append(self.lemmatizer.lemmatize(token))
                
                # Rejoin tokens into sentence
                if processed_tokens:
                    processed_sentences.append(' '.join(processed_tokens))
            
            # Join sentences back together
            processed_text = '. '.join(processed_sentences)
            
            logger.info("Text preprocessing completed successfully")
            
            return {
                "original_text": original_text,
                "processed_text": processed_text,
                "steps": [
                    "Removed leading/trailing whitespace",
                    "Normalized whitespace",
                    "Converted to lowercase",
                    "Removed special characters and digits",
                    "Split into sentences",
                    "Tokenized words",
                    "Removed stop words",
                    "Lemmatized tokens",
                    "Reconstructed sentences"
                ]
            }
        except Exception as e:
            logger.error(f"Error preprocessing text: {str(e)}")
            raise

    def augment(self, text: str) -> Dict[str, Any]:
        try:
            # Split text into sentences
            sentences = sent_tokenize(text)
            
            augmented_texts = {
                "reversed": self._reverse_text(text),
                "shuffled": self._shuffle_sentences(sentences),
                "simplified": self._simplify_text(text),
                "expanded": self._expand_text(text)
            }
            
            logger.info("Text augmentation completed successfully")
            
            return {
                "original_text": text,
                "augmented_texts": augmented_texts,
                "steps": [
                    "Reversed text",
                    "Shuffled sentences",
                    "Simplified text",
                    "Expanded text"
                ]
            }
        except Exception as e:
            logger.error(f"Error augmenting text: {str(e)}")
            raise

    def _reverse_text(self, text: str) -> str:
        """Reverse the words in the text while maintaining sentence structure"""
        try:
            sentences = sent_tokenize(text)
            reversed_sentences = []
            for sentence in sentences:
                words = sentence.split()
                reversed_words = words[::-1]
                reversed_sentences.append(' '.join(reversed_words))
            return '. '.join(reversed_sentences)
        except Exception as e:
            logger.error(f"Error reversing text: {str(e)}")
            raise

    def _shuffle_sentences(self, sentences: list) -> str:
        """Shuffle sentences while maintaining some coherence"""
        try:
            if len(sentences) > 1:
                random.shuffle(sentences)
            return '. '.join(sentences)
        except Exception as e:
            logger.error(f"Error shuffling sentences: {str(e)}")
            raise

    def _simplify_text(self, text: str) -> str:
        """Simplify text by removing complex structures"""
        try:
            # Remove all punctuation except periods
            simplified = re.sub(r'[^\w\s\.]', '', text)
            return simplified.lower()
        except Exception as e:
            logger.error(f"Error simplifying text: {str(e)}")
            raise

    def _expand_text(self, text: str) -> str:
        """Create an expanded version of the text"""
        try:
            return f"{text}\n\nExpanded version:\n{text}"
        except Exception as e:
            logger.error(f"Error expanding text: {str(e)}")
            raise
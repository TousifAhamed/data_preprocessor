import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Any
import io
from app.core.logger import logger

class AudioProcessor:
    @staticmethod
    def validate_audio(y: np.ndarray, sr: int) -> Dict[str, Any]:
        try:
            return {
                "duration": librosa.get_duration(y=y, sr=sr),
                "sample_rate": sr,
                "num_channels": 1 if len(y.shape) == 1 else y.shape[0],
                "max_amplitude": float(np.max(np.abs(y))),
                "is_mono": len(y.shape) == 1
            }
        except Exception as e:
            logger.error(f"Error validating audio: {str(e)}")
            raise

    @staticmethod
    def preprocess(y: np.ndarray, sr: int, normalize: bool = True, 
                  remove_silence: bool = True, reduce_noise: bool = True) -> Dict[str, Any]:
        try:
            steps = []
            # Convert to mono if stereo
            if len(y.shape) > 1:
                y = librosa.to_mono(y)
                steps.append("Converted to mono")

            # Store original length
            original_length = len(y)

            # Normalize audio
            if normalize:
                y = librosa.util.normalize(y)
                steps.append("Normalized audio")

            # Remove silence
            if remove_silence:
                y_trimmed, _ = librosa.effects.trim(y, top_db=20)
                if len(y_trimmed) < len(y):
                    y = y_trimmed
                    steps.append("Removed silence")

            # Noise reduction
            if reduce_noise:
                try:
                    # Simple noise reduction using spectral gating
                    D = librosa.stft(y)
                    D_mag = np.abs(D)
                    D_phase = np.angle(D)
                    
                    # Estimate noise floor
                    noise_floor = np.mean(D_mag) * 0.1
                    
                    # Apply soft thresholding
                    D_mag = np.maximum(D_mag - noise_floor, 0)
                    
                    # Reconstruct signal
                    D_denoised = D_mag * np.exp(1j * D_phase)
                    y = librosa.istft(D_denoised, length=original_length)
                    
                    steps.append("Reduced noise")
                except Exception as e:
                    logger.warning(f"Noise reduction failed, skipping: {str(e)}")

            # Ensure the audio is real-valued
            if np.iscomplexobj(y):
                y = np.abs(y)

            # Ensure consistent length
            if len(y) < original_length:
                y = librosa.util.fix_length(y, original_length)
            elif len(y) > original_length:
                y = y[:original_length]

            # Final normalization to prevent clipping
            y = librosa.util.normalize(y)
            
            # Convert to float32 for better compatibility
            y = y.astype(np.float32)

            return {
                "processed_audio": y,
                "sample_rate": sr,
                "steps": steps
            }

        except Exception as e:
            logger.error(f"Error preprocessing audio: {str(e)}")
            raise

    @staticmethod
    def save_audio(y: np.ndarray, sr: int) -> bytes:
        """Convert numpy array to audio bytes"""
        try:
            # Ensure the array is real-valued
            if np.iscomplexobj(y):
                y = np.abs(y)
            
            # Normalize if needed
            if np.max(np.abs(y)) > 1.0:
                y = librosa.util.normalize(y)
            
            # Convert to float32
            y = y.astype(np.float32)
            
            # Save to buffer
            buffer = io.BytesIO()
            sf.write(buffer, y, sr, format='WAV', subtype='PCM_16')
            buffer.seek(0)
            return buffer.read()
        except Exception as e:
            logger.error(f"Error saving audio: {str(e)}")
            raise

    @staticmethod
    def augment(y: np.ndarray, sr: int) -> Dict[str, Any]:
        try:
            augmented_audio = {}
            steps = []

            # Time stretching
            augmented_audio["time_stretched"] = librosa.effects.time_stretch(y, rate=1.5)
            steps.append("Time stretched (1.5x)")

            # Pitch shifting
            augmented_audio["pitch_shifted"] = librosa.effects.pitch_shift(y, sr=sr, n_steps=4)
            steps.append("Pitch shifted (+4 semitones)")

            # Volume adjustment
            augmented_audio["volume_increased"] = y * 1.5
            augmented_audio["volume_increased"] = librosa.util.normalize(augmented_audio["volume_increased"])
            steps.append("Volume increased")

            # Reverse
            augmented_audio["reversed"] = y[::-1]
            steps.append("Reversed")

            return {
                "augmented_audio": augmented_audio,
                "sample_rate": sr,
                "steps": steps
            }
        except Exception as e:
            logger.error(f"Error augmenting audio: {str(e)}")
            raise
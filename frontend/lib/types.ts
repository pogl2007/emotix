export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceResult {
  face_id: number;
  emotion: string;
  confidence: number;
  detection_confidence: number;
  probabilities: Record<string, number>;
  bbox: BBox;
}

export interface ImageAnalysis {
  image_size: { width: number; height: number };
  faces_detected: number;
  results: FaceResult[];
  dominant_emotion: string | null;
  detector: string;
  processing_ms: number;
}

export interface TimelinePoint {
  time: number;
  frame: number;
  emotion: string;
  confidence: number;
  faces: number;
  probabilities: Record<string, number>;
  bbox: BBox;
}

export interface TopMoment {
  time: number;
  timecode: string;
  emotion: string;
  confidence: number;
}

export interface DistributionItem {
  emotion: string;
  frames: number;
  share: number;
  mean_probability: number;
}

export interface VideoAnalysis {
  duration_seconds: number;
  fps: number;
  frame_step: number;
  frames_analyzed: number;
  emotion_timeline: TimelinePoint[];
  dominant_emotions: TopMoment[];
  emotion_distribution: DistributionItem[];
  dominant_emotion: string | null;
  processing_ms: number;
}

export interface ModelInfo {
  architecture: string;
  dataset: string;
  classes: number;
  emotions: string[];
  val_accuracy: number | null;
  device: string;
  detector: string;
  model_loaded: boolean;
}

export type AnalysisKind = "image" | "video";

export interface HistoryEntry {
  id: string;
  createdAt: string;
  kind: AnalysisKind;
  fileName: string;
  facesDetected: number;
  dominantEmotion: string | null;
  confidence: number;
  payload: ImageAnalysis | VideoAnalysis;
}

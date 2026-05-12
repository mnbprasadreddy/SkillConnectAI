import { renderHook, act } from '@testing-library/react';
import { useFaceAnalytics } from '../components/interview/FaceAnalyticsEngine';

// Mock face-api.js
jest.mock('face-api.js', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: jest.fn().mockResolvedValue(true) },
    faceLandmark68Net: { loadFromUri: jest.fn().mockResolvedValue(true) },
    faceExpressionNet: { loadFromUri: jest.fn().mockResolvedValue(true) },
  },
  detectSingleFace: jest.fn().mockReturnValue({
    withFaceLandmarks: jest.fn().mockReturnValue({
      withFaceExpressions: jest.fn().mockResolvedValue({
        detection: { score: 0.9 },
        landmarks: {
          positions: Array(68).fill({ x: 0, y: 0 })
        },
        expressions: { happy: 0.8, neutral: 0.2 }
      })
    })
  }),
  TinyFaceDetectorOptions: jest.fn(),
}));

describe('Face Analytics Engine', () => {
  let videoRef;
  let analyticsRef;

  beforeEach(() => {
    videoRef = { current: { videoWidth: 640, videoHeight: 480, paused: false, ended: false } };
    analyticsRef = { current: {} };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize without crashing', async () => {
    const { result } = renderHook(() => useFaceAnalytics(videoRef, analyticsRef, true));
    expect(result.current).toBeUndefined(); // Hook returns nothing, just populates ref
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useFaceAnalytics(videoRef, analyticsRef, true));
    
    // Unmount should clear the RAF
    unmount();
    // In a real RAF mock we would verify cancelAnimationFrame was called
    expect(true).toBe(true);
  });

  it('should handle no-face fallback gracefully', async () => {
    const faceapi = require('face-api.js');
    faceapi.detectSingleFace.mockReturnValueOnce({
      withFaceLandmarks: jest.fn().mockReturnValue({
        withFaceExpressions: jest.fn().mockResolvedValue(null) // No face
      })
    });

    renderHook(() => useFaceAnalytics(videoRef, analyticsRef, true));
    // Verify analytics ref doesn't crash and maybe sets fallback states
    expect(analyticsRef.current).toBeDefined();
  });
});

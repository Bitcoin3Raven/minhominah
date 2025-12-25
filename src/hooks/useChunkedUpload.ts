import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadOptions {
  bucketName?: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  isPaused: boolean;
  progress: number;
  bytesUploaded: number;
  bytesTotal: number;
  uploadSpeed: number;
  estimatedTime: number;
  error: string | null;
}

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB
const RETRY_DELAYS = [0, 3000, 5000, 10000, 20000];

export const useChunkedUpload = () => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isPaused: false,
    progress: 0,
    bytesUploaded: 0,
    bytesTotal: 0,
    uploadSpeed: 0,
    estimatedTime: 0,
    error: null,
  });

  const uploadRef = useRef<tus.Upload | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{ bytes: number; time: number }>({ bytes: 0, time: 0 });

  const resetState = useCallback(() => {
    setUploadState({
      isUploading: false,
      isPaused: false,
      progress: 0,
      bytesUploaded: 0,
      bytesTotal: 0,
      uploadSpeed: 0,
      estimatedTime: 0,
      error: null,
    });
    uploadRef.current = null;
    startTimeRef.current = 0;
    lastProgressRef.current = { bytes: 0, time: 0 };
  }, []);

  const calculateSpeed = useCallback((bytesUploaded: number, bytesTotal: number) => {
    const now = Date.now();

    if (lastProgressRef.current.time === 0) {
      lastProgressRef.current = { bytes: bytesUploaded, time: now };
      return 0;
    }

    const timeDiff = (now - lastProgressRef.current.time) / 1000; // seconds
    const bytesDiff = bytesUploaded - lastProgressRef.current.bytes;

    if (timeDiff > 1) { // Update speed every second
      const speed = bytesDiff / timeDiff; // bytes per second
      const remainingBytes = bytesTotal - bytesUploaded;
      const estimatedTime = speed > 0 ? remainingBytes / speed : 0;

      lastProgressRef.current = { bytes: bytesUploaded, time: now };

      return { speed, estimatedTime };
    }

    return null;
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    fileName: string,
    options: UploadOptions = {}
  ) => {
    if (!user) {
      throw new Error('사용자가 인증되지 않았습니다.');
    }

    const {
      bucketName = 'media',
      onProgress,
      onSuccess,
      onError
    } = options;

    resetState();
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      bytesTotal: file.size
    }));

    startTimeRef.current = Date.now();

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('인증 토큰을 가져올 수 없습니다.');
      }

      // Supabase URL에서 프로젝트 ID 안전하게 추출 (fallback 포함)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://illwscrdeyncckltjrmr.supabase.co';
      console.log('사용 중인 Supabase URL:', supabaseUrl); // 디버깅용

      let projectId: string;
      try {
        const urlParts = supabaseUrl.split('://');
        if (urlParts.length !== 2) {
          throw new Error(`잘못된 URL 형식: ${supabaseUrl}`);
        }

        const domainParts = urlParts[1].split('.');
        if (domainParts.length < 2) {
          throw new Error(`잘못된 도메인 형식: ${urlParts[1]}`);
        }

        projectId = domainParts[0];
        if (!projectId || projectId.length === 0) {
          throw new Error('프로젝트 ID가 비어있습니다');
        }

        console.log('추출된 프로젝트 ID:', projectId); // 디버깅용

      } catch (urlParseError) {
        console.error('URL 파싱 중 오류:', urlParseError);

        // fallback: 직접 프로젝트 ID 사용
        projectId = 'illwscrdeyncckltjrmr';
        console.log('fallback 프로젝트 ID 사용:', projectId);
      }

      const upload = new tus.Upload(file, {
        endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
        retryDelays: RETRY_DELAYS,
        chunkSize: CHUNK_SIZE,
        headers: {
          authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'x-upsert': 'true'
        },
        metadata: {
          bucketName,
          objectName: fileName,
          contentType: file.type,
          cacheControl: '3600'
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: error.message || '업로드에 실패했습니다.'
          }));
          onError?.(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);

          const speedData = calculateSpeed(bytesUploaded, bytesTotal);

          setUploadState(prev => ({
            ...prev,
            progress,
            bytesUploaded,
            bytesTotal,
            uploadSpeed: (typeof speedData === 'object' && speedData?.speed) || prev.uploadSpeed,
            estimatedTime: (typeof speedData === 'object' && speedData?.estimatedTime) || prev.estimatedTime,
          }));

          onProgress?.(bytesUploaded, bytesTotal);
        },
        onSuccess: () => {
          console.log('Upload completed successfully');
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;

          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            progress: 100
          }));

          onSuccess?.(fileUrl);
        }
      });

      uploadRef.current = upload;
      upload.start();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [user, resetState, calculateSpeed]);

  const pauseUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploadState(prev => ({ ...prev, isPaused: true, isUploading: false }));
    }
  }, []);

  const resumeUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.start();
      setUploadState(prev => ({ ...prev, isPaused: false, isUploading: true }));
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort(true); // true = delete partial upload
    }
    resetState();
  }, [resetState]);

  return {
    uploadState,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    resetState
  };
};
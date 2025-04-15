import React, { useState, useEffect, useRef } from 'react';
import { withErrorHandling, createTimeoutController, ApiError, isLargeDocument } from '@/utils/apiErrorHandler';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, XCircle, Check, AlertTriangle, LoaderCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RedactionTemplate } from '@/types/redaction';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number; // 0-100
  stage: 'idle' | 'analyzing' | 'extracting' | 'redacting' | 'saving' | 'complete' | 'error';
  entitiesFound?: number;
  message?: string;
  error?: string;
}

export interface ProcessingStats {
  totalEntitiesFound: number;
  processingTimeMs: number;
}

export interface DocumentProcessorProps {
  documentId: string;
  documentSize: number;
  selectedTemplate?: RedactionTemplate | null;
  onComplete: (stats: ProcessingStats) => void;
  onCancel: () => void;
  processDocument: (documentId: string, templateId: string | undefined, abortSignal: AbortSignal) => Promise<ProcessingStats>;
}

export function DocumentProcessor({
  documentId,
  documentSize,
  selectedTemplate,
  onComplete,
  onCancel,
  processDocument
}: DocumentProcessorProps) {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    stage: 'idle',
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const clearTimeoutRef = useRef<(() => void) | null>(null);
  const isLarge = isLargeDocument(documentSize);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (clearTimeoutRef.current) {
        clearTimeoutRef.current();
      }
    };
  }, []);

  const startProcessing = async () => {
    // Validate template requirement
    if (!selectedTemplate) {
      setStatus({
        ...status,
        error: 'Please select a redaction template before processing',
        stage: 'error'
      });
      return;
    }

    // Set higher timeout for large documents
    const timeoutDuration = isLarge ? 180000 : 60000; // 3 minutes for large docs, 1 minute for regular
    const [controller, clearTimeout] = createTimeoutController(timeoutDuration);
    abortControllerRef.current = controller;
    clearTimeoutRef.current = clearTimeout;

    setStatus({
      isProcessing: true,
      progress: 0,
      stage: 'analyzing',
      message: 'Analyzing document content...'
    });

    // Simulate gradual progress while waiting for actual completion
    const simulateProgress = () => {
      setStatus(prev => {
        if (prev.progress >= 95) return prev; // Don't exceed 95% in simulation
        if (prev.progress < 20) {
          return { ...prev, progress: prev.progress + 5, stage: 'analyzing' };
        } else if (prev.progress < 40) {
          return { ...prev, progress: prev.progress + 3, stage: 'extracting', message: 'Extracting text and content...' };
        } else if (prev.progress < 70) {
          return { ...prev, progress: prev.progress + 2, stage: 'redacting', message: 'Applying redaction rules...' };
        } else {
          return { ...prev, progress: prev.progress + 1, stage: 'saving', message: 'Finalizing document...' };
        }
      });
    };

    const progressInterval = setInterval(simulateProgress, isLarge ? 500 : 300);

    // Process the document with error handling
    const [result, error] = await withErrorHandling(() => 
      processDocument(documentId, selectedTemplate.id, controller.signal)
    );

    // Clear the progress simulation
    clearInterval(progressInterval);

    if (error) {
      if (error.isAborted) {
        setStatus({
          isProcessing: false,
          progress: 0,
          stage: 'idle',
          message: undefined
        });
      } else {
        setStatus({
          isProcessing: false,
          progress: 0,
          stage: 'error',
          error: error.message || 'Document processing failed. Please try again.'
        });
      }
    } else if (result) {
      setStatus({
        isProcessing: false,
        progress: 100,
        stage: 'complete',
        entitiesFound: result.totalEntitiesFound,
        message: `Successfully processed with ${result.totalEntitiesFound} entities redacted`
      });
      onComplete(result);
    }

    // Clean up
    if (clearTimeoutRef.current) {
      clearTimeoutRef.current();
      clearTimeoutRef.current = null;
    }
    abortControllerRef.current = null;
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus({
      isProcessing: false,
      progress: 0,
      stage: 'idle'
    });
    onCancel();
  };

  return (
    <div className="space-y-4 w-full">
      <AnimatePresence mode="wait">
        {status.stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {status.stage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="bg-primary-50 border-primary-100 text-primary-800">
              <Check className="h-4 w-4 text-primary-500" />
              <AlertTitle>Processing Complete</AlertTitle>
              <AlertDescription>
                {status.entitiesFound !== undefined && (
                  <span>
                    {status.entitiesFound} {status.entitiesFound === 1 ? 'entity was' : 'entities were'} found and redacted.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {status.isProcessing && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{status.message || 'Processing document...'}</span>
            <span className="text-sm text-muted-foreground">{Math.floor(status.progress)}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </motion.div>
      )}

      <div className="flex gap-3">
        {!status.isProcessing && status.stage !== 'complete' && (
          <motion.div
            className="w-full"
            initial={false}
            animate={{ 
              opacity: selectedTemplate ? 1 : 0.7,
              scale: selectedTemplate ? 1 : 0.98
            }}
            whileHover={{ scale: selectedTemplate ? 1.02 : 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={startProcessing} 
              className="w-full relative overflow-hidden"
              disabled={!selectedTemplate}
            >
              {!selectedTemplate && (
                <span className="absolute inset-0 bg-gray-300 animate-pulse opacity-10"></span>
              )}
              {selectedTemplate ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4 mr-1" /> Ready to Process
                </motion.span>
              ) : "Select Template First"}
            </Button>
          </motion.div>
        )}

        {status.isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2" 
              onClick={cancelProcessing}
            >
              <XCircle className="h-4 w-4" />
              Cancel Processing
            </Button>
          </motion.div>
        )}

        {status.isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <Button 
              disabled 
              className="w-full flex items-center gap-2"
            >
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processing...
            </Button>
          </motion.div>
        )}
      </div>

      {isLarge && !status.isProcessing && status.stage !== 'complete' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-amber-600 flex items-center gap-1.5"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>This is a large document and may take longer to process</span>
        </motion.div>
      )}
    </div>
  );
} 
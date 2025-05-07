import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { fetchUserQuota } from './quotaSlice';
import { authFetch } from '@/app/lib/authFetch';

interface TranscriptSegment {
    startTime: number;
    endTime: number;
    text: string;
}

interface VideoDetails {
    title: string;
    channel: string;
    duration: string;
    subscribers: string;
}

interface YoutubeState {
    url: string;
    transcript: TranscriptSegment[];
    summary: string;
    highlights: string[];
    keypoints: string[];
    isLoading: boolean;
    progress: number;
    processingStage: string;
    videoDetails: VideoDetails | null;
    error: string | null;
    validationError: string | null;
}

const initialState: YoutubeState = {
    url: '',
    transcript: [],
    summary: '',
    highlights: [],
    keypoints: [],
    isLoading: false,
    progress: 0,
    processingStage: '',
    videoDetails: null,
    error: null,
    validationError: null
};

// Validate a YouTube URL
export const validateYoutubeUrl = createAsyncThunk(
    'youtube/validateYoutubeUrl',
    async (url: string, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/youtube/validate?url=${encodeURIComponent(url)}`);

            const validationData = await response.json();

            if (!validationData.valid) {
                return rejectWithValue(validationData.error || 'Invalid YouTube URL');
            }

            return {
                url,
                videoDetails: validationData.details
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to validate URL');
        }
    }
);

// Fetch transcript and generate summary in a single thunk
export const fetchTranscript = createAsyncThunk(
    'youtube/fetchTranscript',
    async (url: string, { dispatch, getState, rejectWithValue }) => {
        try {
            // First, validate the URL
            const validateAction = await dispatch(validateYoutubeUrl(url));

            // If validation failed, don't proceed
            if (validateYoutubeUrl.rejected.match(validateAction)) {
                return rejectWithValue(validateAction.payload || 'Validation failed');
            }

            // Unwrap the validated data
            const validateResult = validateAction.payload;

            // Update progress stage
            dispatch(setProgress({ progress: 5, stage: 'Fetching transcript...' }));

            // Step 1: Get the transcript
            const transcriptResponse = await fetch(`/api/youtube/transcript?url=${encodeURIComponent(url)}`);

            if (!transcriptResponse.ok) {
                const errorData = await transcriptResponse.json();
                return rejectWithValue(errorData.error || 'Failed to fetch transcript');
            }

            const transcriptData = await transcriptResponse.json();
            const { transcript } = transcriptData;

            // Update progress stage
            dispatch(setProgress({ progress: 40, stage: 'Generating summary...' }));

            // Step 2: Generate the summary
            const summaryResponse = await fetch('/api/youtube/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcript }),
            });

            if (!summaryResponse.ok) {
                const errorData = await summaryResponse.json();
                return rejectWithValue(errorData.error || 'Failed to generate summary');
            }

            // Update progress stage
            dispatch(setProgress({ progress: 90, stage: 'Finalizing results...' }));

            const summaryData = await summaryResponse.json();

            // Increment the quota after successful summary generation
            try {
                // Get the current user from Firebase Auth using authFetch
                const authResp = await authFetch('/api/current-user');
                if (authResp.ok) {
                    const { uid } = await authResp.json();

                    if (uid) {
                        // Call the increment-quota API directly
                        const quotaResponse = await authFetch('/api/increment-quota', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userId: uid,
                                feature: 'youtubeSummarize'
                            }),
                        });

                        if (quotaResponse.ok) {
                            // Refresh the quota in redux store
                            await dispatch(fetchUserQuota(uid));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to increment quota:', error);
                // Continue anyway, don't block the summary
            }

            // Complete progress
            dispatch(setProgress({ progress: 100, stage: 'Complete!' }));

            // Short delay before showing results
            await new Promise(resolve => setTimeout(resolve, 500));

            return {
                url,
                transcript,
                summary: summaryData.summary,
                highlights: summaryData.highlights,
                keypoints: summaryData.keypoints,
                videoDetails: validateResult.videoDetails
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'An unknown error occurred');
        }
    }
);

const youtubeSlice = createSlice({
    name: 'youtube',
    initialState,
    reducers: {
        clearYoutubeState: (state) => {
            return initialState;
        },
        setCurrentTimestamp: (state, action: PayloadAction<number>) => {
            // This could be used to sync transcript with video playback
        },
        setProgress: (state, action: PayloadAction<{ progress: number, stage: string }>) => {
            state.progress = action.payload.progress;
            state.processingStage = action.payload.stage;
        }
    },
    extraReducers: (builder) => {
        builder
            // Validation handlers
            .addCase(validateYoutubeUrl.pending, (state) => {
                state.isLoading = true;
                state.validationError = null;
                state.error = null;
                state.progress = 0;
                state.processingStage = 'Validating URL...';
            })
            .addCase(validateYoutubeUrl.fulfilled, (state, action: PayloadAction<any>) => {
                state.url = action.payload.url;
                state.videoDetails = action.payload.videoDetails;
                state.validationError = null;
            })
            .addCase(validateYoutubeUrl.rejected, (state, action) => {
                state.isLoading = false;
                state.progress = 0;
                state.processingStage = 'Validation Error';
                state.validationError = action.payload as string || 'Failed to validate URL';
                // Clear any previous errors
                state.error = null;
            })
            // Transcript and summary handlers
            .addCase(fetchTranscript.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTranscript.fulfilled, (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.progress = 100;
                state.processingStage = 'Complete!';
                state.url = action.payload.url;
                state.transcript = action.payload.transcript;
                state.summary = action.payload.summary;
                state.highlights = action.payload.highlights;
                state.keypoints = action.payload.keypoints;
                state.videoDetails = action.payload.videoDetails;
                // Clear any previous validation errors
                state.validationError = null;
            })
            .addCase(fetchTranscript.rejected, (state, action) => {
                state.isLoading = false;
                state.progress = 0;
                state.processingStage = 'Error';
                // Only set error if it's not a validation error that's already handled
                if (!state.validationError) {
                    state.error = action.payload as string || 'An error occurred';
                }
            });
    },
});

export const { clearYoutubeState, setCurrentTimestamp, setProgress } = youtubeSlice.actions;
export default youtubeSlice.reducer; 
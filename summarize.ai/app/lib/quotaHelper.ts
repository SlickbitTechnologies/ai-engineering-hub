import { store } from '@/app/redux/store';
import { setQuota } from '@/app/redux/features/quotaSlice';
import { showQuotaExceededToast } from '@/app/components/QuotaExceededToast';

/**
 * Updates the quota state in Redux based on API response
 * @param response The API response containing quota information
 * @param onQuotaExceeded Optional callback to handle quota exceeded situation
 * @returns True if quota is available, false if exceeded
 */
export const updateQuotaFromResponse = (response: any, onQuotaExceeded?: () => void): boolean => {
    if (!response || typeof response !== 'object') {
        console.log('Invalid response object passed to updateQuotaFromResponse', response);
        return true;
    }

    console.log('Processing quota response:', response);

    // Handle error responses for quota exceeded (HTTP 429)
    if (response.status === 429 && response.quota) {
        console.log('429 Quota exceeded:', response.quota);
        store.dispatch(setQuota({
            used: response.quota.used,
            limit: response.quota.limit
        }));
        showQuotaExceededToast();
        if (onQuotaExceeded) onQuotaExceeded();
        return false;
    }

    // Handle different quota info structures
    let quotaInfo = null;

    // Structure 1: Direct quota object in response
    if (response.quota) {
        quotaInfo = response.quota;
    }
    // Structure 2: QuotaInfo object from middleware
    else if (response.quotaInfo) {
        quotaInfo = response.quotaInfo;
    }
    // Structure 3: Nested in data.quota
    else if (response.data && response.data.quota) {
        quotaInfo = response.data.quota;
    }

    // If we found quota info in any structure, update Redux
    if (quotaInfo) {
        // Log quota update
        console.log('Updating quota from response:', quotaInfo);
        store.dispatch(setQuota({
            used: quotaInfo.used,
            limit: quotaInfo.limit
        }));

        // Check if quota is exceeded 
        if (quotaInfo.used >= quotaInfo.limit) {
            showQuotaExceededToast();
            if (onQuotaExceeded) onQuotaExceeded();
            return false;
        }

        // Quota updated successfully
        console.log('Quota updated to:', quotaInfo.used, '/', quotaInfo.limit);
        return true;
    } else {
        console.log('No quota information found in response:', response);
    }

    return true;
};

/**
 * Wraps a fetch API call to handle quota updates automatically
 * @param url The API endpoint URL
 * @param options Fetch options
 * @param onQuotaExceeded Optional callback for quota exceeded
 * @returns The fetch response
 */
export const quotaAwareFetch = async (
    url: string,
    options: RequestInit = {},
    onQuotaExceeded?: () => void
): Promise<Response> => {
    console.log(`Making quota-aware fetch to ${url}`);
    const response = await fetch(url, options);

    try {
        const responseClone = response.clone();
        const data = await responseClone.json();

        console.log(`Response from ${url}:`, data);

        if (response.status === 429) {
            // Handle quota exceeded
            console.log('429 response:', data);
            updateQuotaFromResponse({ status: 429, quota: data.quota }, onQuotaExceeded);
        } else if (response.ok) {
            // Check for quota info in the response
            if (data.quota) {
                console.log('Quota info in response:', data.quota);
                updateQuotaFromResponse({ quota: data.quota });
            } else if (data.quotaInfo) {
                console.log('QuotaInfo in response:', data.quotaInfo);
                updateQuotaFromResponse({ quotaInfo: data.quotaInfo });
            } else {
                console.log('No quota info in response, trying to refresh quota...');
                // Try to refresh quota from the quota status endpoint
                try {
                    const quotaResponse = await fetch('/api/quota-status');
                    if (quotaResponse.ok) {
                        const quotaData = await quotaResponse.json();
                        if (quotaData.quota) {
                            console.log('Refreshed quota from status endpoint:', quotaData.quota);
                            updateQuotaFromResponse({ quota: quotaData.quota });
                        }
                    }
                } catch (error) {
                    console.error('Failed to refresh quota status:', error);
                }
            }
        } else {
            console.log('Response not OK:', response.status, data);
        }
    } catch (error) {
        console.error('Error processing quota information:', error);
    }

    return response;
}; 
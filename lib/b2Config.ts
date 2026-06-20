// These should come from your environment variables
const B2_APPLICATION_KEY_ID = process.env.EXPO_PUBLIC_BLACK_BLAZE_APP_KEY_ID || '';
const B2_APPLICATION_KEY = process.env.EXPO_PUBLIC_BLACK_BLAZE_API_KEY || '';
const B2_BUCKET_NAME = 'mageni';

interface B2AuthResponse {
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
    allowed: {
        bucketId: string;
        bucketName: string;
    };
}

interface B2UploadUrlResponse {
    uploadUrl: string;
    authorizationToken: string;
}

// Add a cache for authorization
let authCache: {
    timestamp: number;
    data: B2AuthResponse;
} | null = null;

// Cache duration (24 hours in milliseconds)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Get B2 authorization with caching
const getB2Auth = async (): Promise<B2AuthResponse> => {
    // Check if cached auth is still valid
    if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
        return authCache.data;
    }

    try {
        const credentials = `${B2_APPLICATION_KEY_ID}:${B2_APPLICATION_KEY}`;
        const encodedCredentials = btoa(credentials);

        const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            headers: {
                'Authorization': `Basic ${encodedCredentials}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`B2 authorization failed: ${response.status} ${errorText}`);
        }

        const authData = await response.json();

        // Cache the authorization data
        authCache = {
            timestamp: Date.now(),
            data: authData
        };

        return authData;
    } catch (error) {
        console.error('B2 Auth Error:', error);
        throw error;
    }
};

// Get upload URL
const getUploadUrl = async (authToken: string, apiUrl: string, bucketId: string): Promise<B2UploadUrlResponse> => {
    try {
        const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucketId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Get Upload URL Error:', error);
        throw error;
    }
};

// Upload file helper
export const uploadFileToB2 = async (fileData: Blob, fileName: string): Promise<string> => {
    try {
        // First get authorization
        const auth = await getB2Auth();

        // Get bucket ID from auth response

        if (!auth.allowed) {
            throw new Error(`Bucket ${B2_BUCKET_NAME} not found in authorized buckets`);
        }

        const bucket = auth.allowed;

        // Get upload URL
        const uploadData = await getUploadUrl(auth.authorizationToken, auth.apiUrl, bucket.bucketId);

        // Calculate SHA1 of file content (optional, using 'do_not_verify' for now)
        const sha1 = 'do_not_verify';

        // Upload file
        const response = await fetch(uploadData.uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': uploadData.authorizationToken,
                'X-Bz-File-Name': encodeURIComponent(fileName),
                'Content-Type': 'b2/x-auto',
                'X-Bz-Content-Sha1': sha1
            },
            body: fileData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return `${auth.downloadUrl}/file/${B2_BUCKET_NAME}/${fileName}`;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
};

// Get file URL helper with authorization
export const getFileFromB2 = async (fileName: string): Promise<string> => {
    try {
        // Get authorization first
        const auth = await getB2Auth();

        // Return the authenticated URL with token
        return `${fileName}?Authorization=${auth.authorizationToken}`;
    } catch (error) {
        console.error('Get File URL Error:', error);
        throw error;
    }
};

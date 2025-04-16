import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/firebase/auth';
import { TemplateRepository } from '@/db/templateRepository';

// Verify authentication helper
const verifyAuth = async (req: NextRequest) => {
    try {
        // Log all auth related headers
        console.log('Auth headers:', {
            hasAuthHeader: !!req.headers.get('Authorization'),
            hasUserIdHeader: !!req.headers.get('x-user-id') || !!req.headers.get('user-id'),
            isDev: process.env.NODE_ENV === 'development'
        });

        // Get token from authorization header
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];

        if (!token) {
            // For development mode, allow getting user ID from headers
            if (process.env.NODE_ENV === 'development') {
                // For development, if no token is provided, use a default test user ID
                const devUserId = req.headers.get('x-user-id') ||
                    req.headers.get('user-id') ||
                    'test-user-123';

                if (devUserId) {
                    console.log('[DEV] Using user ID from headers or default:', devUserId);
                    return { userId: devUserId };
                }
            }

            console.log('No authentication token provided');
            return null;
        }

        // Verify token with Firebase
        try {
            const decodedToken = await auth.verifyIdToken(token);
            if (decodedToken && decodedToken.uid) {
                console.log(`Token verified successfully for user: ${decodedToken.uid}`);
                return { userId: decodedToken.uid };
            }
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError);

            // In development mode, if token verification fails, use a test user
            if (process.env.NODE_ENV === 'development') {
                const devUserId = 'test-user-123';
                console.log(`[DEV] Using fallback test user ID: ${devUserId}`);
                return { userId: devUserId };
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }

    return null;
};

// GET all templates for a user
export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get user ID from auth result
        const { userId } = authResult;

        // Get templates from repository
        const templates = await TemplateRepository.getTemplatesByUser(userId);

        // Return templates as JSON
        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error getting templates:', error);
        return new NextResponse('Error getting templates', { status: 500 });
    }
}

// POST - Create a new template
export async function POST(req: NextRequest) {
    try {
        // Initialize templates table to ensure it exists
        try {
            TemplateRepository.initializeTable();
        } catch (initError) {
            console.error('Error initializing templates table:', initError);
            // Continue anyway, as the table might already exist
        }

        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult) {
            console.error('Authentication failed');
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get user ID from auth result
        const { userId } = authResult;
        console.log(`Authorized user: ${userId}`);

        try {
            // Parse request body
            const body = await req.json();
            console.log('Received template data:', body);

            const { name, description, categories } = body;

            // Validate required fields
            if (!name) {
                return new NextResponse(JSON.stringify({ error: 'Template name is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!categories || !Array.isArray(categories) || categories.length === 0) {
                return new NextResponse(JSON.stringify({ error: 'At least one category is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Create template
            console.log(`Creating template "${name}" for user "${userId}"`);
            const template = await TemplateRepository.createTemplate(
                userId,
                name,
                description || '',
                categories
            );

            console.log('Template created successfully:', template.id);

            // Return created template
            return NextResponse.json(template, { status: 201 });
        } catch (bodyError) {
            console.error('Error processing request body:', bodyError);
            return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error creating template:', error);
        return new NextResponse(JSON.stringify({
            error: 'Error creating template',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 
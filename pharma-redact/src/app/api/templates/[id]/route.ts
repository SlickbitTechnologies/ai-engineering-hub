import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/firebase/auth';
import { TemplateRepository } from '@/db/templateRepository';

// Verify authentication helper
const verifyAuth = async (req: NextRequest) => {
    try {
        // Get token from authorization header
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];

        if (!token) {
            // For development mode, allow getting user ID from headers
            if (process.env.NODE_ENV === 'development') {
                const devUserId = req.headers.get('x-user-id') || req.headers.get('user-id');
                if (devUserId) {
                    console.log('[DEV] Using user ID from headers:', devUserId);
                    return { userId: devUserId };
                }
            }

            return null;
        }

        // Verify token with Firebase
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken && decodedToken.uid) {
            return { userId: decodedToken.uid };
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }

    return null;
};

// GET a specific template by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get user ID from auth result
        const { userId } = authResult;

        // Get template ID from params
        const templateId = params.id;

        // Get template from repository
        const template = await TemplateRepository.getTemplateById(templateId, userId);

        // Check if template exists
        if (!template) {
            return new NextResponse('Template not found', { status: 404 });
        }

        // Return template as JSON
        return NextResponse.json(template);
    } catch (error) {
        console.error('Error getting template:', error);
        return new NextResponse('Error getting template', { status: 500 });
    }
}

// PUT - Update a template
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get user ID from auth result
        const { userId } = authResult;

        // Get template ID from params
        const templateId = params.id;

        // Parse request body
        const body = await req.json();
        const { name, description, categories } = body;

        // Validate required fields
        if (!name || !categories) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Check if template exists
        const existingTemplate = await TemplateRepository.getTemplateById(templateId, userId);
        if (!existingTemplate) {
            return new NextResponse('Template not found', { status: 404 });
        }

        // Update template
        const success = await TemplateRepository.updateTemplate(
            templateId,
            userId,
            name,
            description || '',
            categories
        );

        if (!success) {
            return new NextResponse('Failed to update template', { status: 500 });
        }

        // Get updated template
        const updatedTemplate = await TemplateRepository.getTemplateById(templateId, userId);

        // Return updated template
        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        return new NextResponse('Error updating template', { status: 500 });
    }
}

// DELETE - Delete a template
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get user ID from auth result
        const { userId } = authResult;

        // Get template ID from params
        const templateId = params.id;

        // Check if template exists
        const existingTemplate = await TemplateRepository.getTemplateById(templateId, userId);
        if (!existingTemplate) {
            return new NextResponse('Template not found', { status: 404 });
        }

        // Delete template
        const success = await TemplateRepository.deleteTemplate(templateId, userId);

        if (!success) {
            return new NextResponse('Failed to delete template', { status: 500 });
        }

        // Return success response
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting template:', error);
        return new NextResponse('Error deleting template', { status: 500 });
    }
} 
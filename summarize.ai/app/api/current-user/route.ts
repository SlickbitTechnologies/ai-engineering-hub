import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/app/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        // Get the Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Authentication failed: No valid authorization header found');
            return NextResponse.json(
                {
                    error: 'User not authenticated',
                    message: 'No valid authorization header found',
                    code: 'auth/missing-token'
                },
                { status: 401 }
            );
        }

        // Extract and verify the token
        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await verifyIdToken(token);

            if (!decodedToken) {
                console.log('Authentication failed: Token verification failed');
                return NextResponse.json(
                    {
                        error: 'Invalid authentication token',
                        message: 'Token could not be verified',
                        code: 'auth/invalid-token'
                    },
                    { status: 401 }
                );
            }

            // Return the user ID and email
            return NextResponse.json({
                uid: decodedToken.uid,
                email: decodedToken.email || null,
                authenticated: true
            });
        } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            return NextResponse.json(
                {
                    error: 'Invalid authentication token',
                    message: 'Token verification failed',
                    code: 'auth/invalid-token'
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return NextResponse.json(
            {
                error: 'Failed to get current user',
                message: 'Internal server error',
                code: 'server/internal-error'
            },
            { status: 500 }
        );
    }
} 
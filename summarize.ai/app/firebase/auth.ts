import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    User,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';
import { store } from '../redux/store';
import { setUser, signOut } from '../redux/features/userSlice';

interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

// Helper function to set authentication cookie
const setAuthCookie = (user: User | null) => {
    if (user) {
        // Set a cookie for server-side auth checking with middleware
        document.cookie = `auth_session=${user.uid}; path=/; max-age=2592000; SameSite=Strict`; // 30 days
    } else {
        // Remove the cookie when signing out
        document.cookie = 'auth_session=; path=/; max-age=0';
    }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<AuthUser> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's profile with the provided display name
        await updateProfile(user, { displayName });

        // Set authentication cookie
        setAuthCookie(user);

        // Update Redux store
        store.dispatch(setUser({
            email: user.email || '',
            displayName: displayName
        }));

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    } catch (error: any) {
        console.error('Error signing up with email:', error);

        // Provide more specific error messages for common error codes
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Email address is already in use. Please use a different email or sign in.');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. Please use a stronger password.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Email address is invalid. Please check and try again.');
        } else {
            throw new Error(error.message || 'Failed to sign up. Please try again.');
        }
    }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Set authentication cookie
        setAuthCookie(user);

        // Update Redux store
        store.dispatch(setUser({
            email: user.email || '',
            displayName: user.displayName || 'User'
        }));

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    } catch (error: any) {
        console.error('Error signing in with email:', error);

        // Provide more specific error messages for common error codes
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.code === 'auth/user-disabled') {
            throw new Error('This account has been disabled. Please contact support.');
        } else if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many unsuccessful login attempts. Please try again later or reset your password.');
        } else {
            throw new Error(error.message || 'Failed to sign in. Please try again.');
        }
    }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Set authentication cookie
        setAuthCookie(user);

        // Update Redux store
        store.dispatch(setUser({
            email: user.email || '',
            displayName: user.displayName || 'User'
        }));

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    } catch (error: any) {
        console.error('Error signing in with Google:', error);

        // Handle specific Google auth errors
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in popup was closed before completing the sign-in process.');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Sign-in popup was blocked by the browser. Please allow popups for this site.');
        } else {
            throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
        }
    }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);

        // Remove authentication cookie
        setAuthCookie(null);

        // Update Redux store
        store.dispatch(signOut());
    } catch (error: any) {
        console.error('Error signing out:', error);
        throw new Error(error.message || 'Failed to sign out. Please try again.');
    }
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

/**
 * Get the ID token for the current user
 * @param forceRefresh Whether to force a token refresh
 * @returns The ID token string or null if not authenticated
 */
export const getIdToken = async (forceRefresh: boolean = true): Promise<string | null> => {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.error('Cannot get ID token - user is not authenticated');
            return null;
        }

        console.log('Getting ID token for user:', user.uid);

        // Always force refresh to ensure token is fresh
        const token = await user.getIdToken(true);

        if (!token) {
            console.error('Failed to get ID token - returned empty');
            return null;
        }

        // Validate token format
        if (token.length < 50) {
            console.error('ID token appears invalid - too short:', token.length);
            return null;
        }

        console.log('Successfully retrieved ID token:');
        console.log('- Length:', token.length);
        console.log('- First 10 chars:', token.substring(0, 10) + '...');
        console.log('- Last 10 chars:', '...' + token.substring(token.length - 10));

        return token;
    } catch (error) {
        console.error('Error getting ID token:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        return null;
    }
};

// Listen for auth state changes
export const listenToAuthChanges = (callback: (user: AuthUser | null) => void): (() => void) => {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            callback({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            });

            // Set authentication cookie
            setAuthCookie(user);

            // Update Redux store
            store.dispatch(setUser({
                email: user.email || '',
                displayName: user.displayName || 'User'
            }));
        } else {
            callback(null);

            // Remove authentication cookie
            setAuthCookie(null);

            // User is signed out
            store.dispatch(signOut());
        }
    });
}; 
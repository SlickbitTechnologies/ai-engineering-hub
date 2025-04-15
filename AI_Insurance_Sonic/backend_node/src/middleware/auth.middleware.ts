import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { DatabaseConnection } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  isAdmin: boolean;
  lastLogin: string;
  createdAt: string;
}

const db = DatabaseConnection.getInstance();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Authenticating request...');
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No bearer token found');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log('Token verified for user:', decodedToken.uid);

    // Find user in database
    let user = await db.get<User>(
      'SELECT * FROM users WHERE firebaseUid = ?',
      [decodedToken.uid]
    );

    if (!user) {
      // Create new user
      user = {
        id: uuidv4(),
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        isAdmin: false,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await db.run(
        'INSERT INTO users (id, firebaseUid, email, name, isAdmin, lastLogin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.firebaseUid, user.email, user.name, user.isAdmin, user.lastLogin, user.createdAt]
      );
    } else {
      // Update last login
      await db.run(
        'UPDATE users SET lastLogin = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Checking admin privileges...');
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ error: 'Unauthorized - Authentication required' });
  }

  if (!req.user.isAdmin) {
    console.log('User is not an admin');
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  console.log('Admin access granted');
  next();
}; 
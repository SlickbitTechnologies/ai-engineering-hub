import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

const serviceAccount = {
  type: "service_account",
  project_id: "translitechat",
  private_key_id: "92150f62991e1e1b77b5450bf5551dcfe2054e41",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCYmFBbRFbZF/vX\nAmcJ0vpWf5CIUeRRoAr9BCJ2MJ07xmoi7w1GcYkqNObKwI9vAfR0+ktXNjj/PZhE\nXnPNtfHhqnHEayUnXEKmZoaBLoKEljB3jNz6yG96mAp1zKlTo27pA8XZnl2dgjlF\nLJRNxygLLz9K+fzj+EZfT9i4vV1FFfwMzpbtdCmAxEBCJlARfV7to1aiElHbWsDc\nL1cnj3sx4ElB3/Ge7UuL7SISpg5kr4GUSx+gMhUu+IXYNvJWis7i12ZN2dMdzoCN\nK0CpaGRbeEPw6kJGSSEXxKjX8rRB7RhPFcEwwTOVauu0md4FoFi03nn3PoiXWXAV\nJEfFqT/RAgMBAAECgf9ayQi3HI8FN452NbyhpYFyQ63hHetWVgjRHQcU+2EuB6L2\nYMznklYI7b8mksxNF6GUHmlSFz80TSJKT8Af3kcd1CLHzPc6JOTk4BqIcg+q+bAD\nl8r0y62HadnjAMzQpzBo+19/o1Y2X5J4C3AwX9aG0PfDVPe9vYJIHsL4/uu53uV+\no/I+PIFATZLDk1ar5Psiv/GLlxNFni5PpA1bdpVGwurpbIYX1sUINJ8yNt6cBhHJ\nuEPpD/3PdY9zxNmsqyND+uK1/+i75laDIJAFAWjRSc8c2QV8sN0nZifIyiRjwlJj\nMpo8EQk+/YOlxU83IuiluZUqyPR6lhVBC1ygZvECgYEAyKc5q16fOv+D1xgCIg+4\nH3uE+QtmwPaHuv5DcD0adSjJjlSV4OcOnAMOosVG7Mb2uTzaTTJ3BQstFtknrtHO\nCSXMIdMybuLc9Ky+5QbpLzuWqrgheqbV62G9YGACX3wkrFujMmayrV3/2GmCe+C5\nUgmB1l4LTMnOg4yz9PHbzfsCgYEAwq+KOTM+eGqwi1CMvBKTJi7SVl6QqhRF+pvD\nulAewY9cvUlJ+sZCFYFIUsv3U/LYvYn153p/PHFCaAi4YznH0b6G4EeEeX5/QoWG\nOFmGocT6qZ1N/BH4Tw4F2677DoYUBpj5bVn/t7o34+8zxVXNN6WkZdk6hv7tiPy3\nsT9A+6MCgYBUHQ3m0d6sK8rH00+pma9Uu0Ht6KKlh3M0pzv8BBFgRb3ghYLi6dlM\n+1caUtq9jVaGJoVY0SvlmF7JcjTZaygU25xsHY3JwB5iDzxi4/fCjhdF77RRJzkL\n2Eg762NzRaZV/oA2M6j5VitXPDuv1G+7fTLJe1j/UqXYrZYOu4iqGwKBgHS+FLHW\nM7i7qV/xDmNc9BYqb4DRNgh3Hbt4mjboAnlpQWBUSWNybYA9xSO5IXeaoTOPPgDv\nqMqS1BJUYFVH+bWhfXmSCTNdkmxOazzxGlV5LCJ3rKLiF7c4HnUsiWmdJvcJ1lAn\nbrs6lHc/IhlMKUIcNufICluXFNNXT8OevZXnAoGAWiXgOrzoiBpk74lNkvVMvLqt\nhP0uwMZNNJW0rBy9xDoy6Q3YOJaPYqJc+wlKDZQvEFvH+DHquQTnvlgFckgXytm+\nhTpVd3iZm7wRJYWdGbZn6fTswxkztBHzpEa9twb5CpCzEclEsarxA8F58Mtk3tBN\n+B8DmzLIEtNJApXsMeI=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@translitechat.iam.gserviceaccount.com",
  client_id: "109518990443148983842",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40translitechat.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: "translitechat.firebasestorage.app"
});

// Get bucket instance
const bucket = admin.storage().bucket();

export const uploadToStorage = async (
  buffer: Buffer,
  destination: string,
  mimeType: string
): Promise<string> => {
  try {
    const file = bucket.file(destination);
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType
      },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    console.log("✅ File uploaded to:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
};

export const deleteFromStorage = async (filePath: string): Promise<void> => {
  try {
    await bucket.file(filePath).delete();
    console.log("✅ File deleted:", filePath);
  } catch (error) {
    console.error("❌ Delete failed:", error);
    throw error;
  }
}; 
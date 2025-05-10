
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Ensure storage is exported from firebase.ts
import type { FirebaseError } from 'firebase/app';

/**
 * Uploads an avatar image to Firebase Storage and returns the download URL.
 * @param userId The UID of the user whose avatar is being uploaded.
 * @param file The image file to upload.
 * @returns A promise that resolves with the download URL of the uploaded image.
 * @throws If the upload fails or Firebase Storage is not initialized.
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  if (!storage) {
    console.error("Firebase Storage not initialized in uploadAvatar");
    throw new Error("Firebase Storage not initialized. Cannot upload avatar.");
  }
  if (!userId) {
    throw new Error("User ID is required to upload an avatar.");
  }
  if (!file) {
    throw new Error("File is required to upload an avatar.");
  }

  // Create a storage reference (e.g., avatars/userId/profileImage.jpg)
  // Using a consistent file name like 'profile.jpg' or a unique ID for the file can simplify management.
  // For simplicity, using the original file name, but consider sanitizing or using a fixed name + extension.
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile.${fileExtension}`; // Or use a UUID for the filename
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    const firebaseError = error as FirebaseError;
    console.error("Error uploading avatar to Firebase Storage:", firebaseError);
    
    let userFriendlyMessage = "Failed to upload avatar. Please try again.";
    if (firebaseError.code === 'storage/unauthorized') {
      userFriendlyMessage = "You do not have permission to upload this file. Check storage rules.";
    } else if (firebaseError.code === 'storage/canceled') {
      userFriendlyMessage = "Avatar upload was canceled.";
    } else if (firebaseError.code === 'storage/object-not-found' && firebaseError.message.includes("storageBucket")) {
        userFriendlyMessage = "Firebase Storage bucket not configured or not found. Please check your Firebase project setup (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).";
    }
    // Consider more specific error handling based on firebaseError.code
    throw new Error(userFriendlyMessage);
  }
};

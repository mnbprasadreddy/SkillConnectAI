/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export const mapAuthError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
};

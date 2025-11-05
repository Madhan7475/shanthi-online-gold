import React, { useState } from "react";
import { FiX, FiAlertTriangle, FiTrash2, FiLoader } from "react-icons/fi";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { auth, googleProvider } from "../../firebase/firebaseConfig";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";

const DeleteAccountModal = ({ onClose, onSuccess }) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1); // 1: warning, 2: confirmation
  const [error, setError] = useState("");

  const requiredText = "permanently delete my account";

  const handleFirstStep = () => {
    setStep(2);
  };

  const handleDeleteAccount = async () => {
    if (confirmationText.toLowerCase().trim() !== requiredText) {
      setError("Please type the confirmation text exactly as shown");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      // 1. Revoke Google Sign-In access first
      try {
        const user = auth.currentUser;

        if (user) {

          const result = await reauthenticateWithPopup(user, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const accessToken = credential.accessToken;
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
            {
              method: "POST",
              headers: { "Content-type": "application/x-www-form-urlencoded" },
            }
          );
        }
      } catch (googleError) {
        console.warn("Google Sign-In revocation failed:", googleError);
        // Continue with deletion even if Google revocation fails
      }

      // 3. Call backend API to delete user data and Firebase auth
      await axiosInstance.delete("/users/account", {
        data: { confirmationText: confirmationText.trim() },
      });

      // 5. Clear any cached data

      // 6. Success callback
      toast.success("Your account has been permanently deleted");
      onSuccess();
    } catch (error) {
      console.error("Account deletion error:", error);

      let errorMessage = "Failed to delete account. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data.error || "Invalid confirmation text";
      } else if (error.response?.status === 403) {
        errorMessage = "Account deletion not allowed";
      } else if (error.response?.status === 404) {
        errorMessage = "Account not found";
      }

      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {step === 1 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-red-800">
                  Delete Account
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                disabled={isDeleting}
              >
                <FiX className="h-5 w-5 text-red-600" />
              </button>
            </div>

            {/* Warning Content */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Are you absolutely sure?
                </h3>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data.
                </p>
              </div>

              {/* Horizontal layout for deletion info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-semibold text-red-800 mb-2 text-sm">
                    What will be deleted:
                  </h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Profile information and personal data</li>
                    <li>• Wishlist and saved items</li>
                    <li>• Cart contents</li>
                    <li>• Account access and login credentials</li>
                    <li>• All notification preferences</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-semibold text-yellow-800 mb-2 text-sm">
                    What will be kept:
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Order history (anonymized for legal compliance)</li>
                    <li>• Transaction records (for tax and legal purposes)</li>
                  </ul>
                </div>
              </div>

              {/* Full-width Important Notice */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-5xl mx-auto">
                <h4 className="font-semibold text-gray-800 mb-2 text-center text-sm">
                  Important Notice:
                </h4>
                <p className="text-xs text-gray-600 text-center">
                  Your account data will be <strong>permanently removed</strong>
                  . You can create a fresh account later using the same
                  email/phone if you wish to use our services again.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstStep}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-red-50 border-b border-red-100">
              <h2 className="text-lg font-semibold text-red-800">
                Confirm Account Deletion
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                disabled={isDeleting}
              >
                <FiX className="h-5 w-5 text-red-600" />
              </button>
            </div>

            {/* Confirmation Content */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Final Confirmation
                </h3>
                <p className="text-sm text-gray-600">
                  To confirm account deletion, please type the following text
                  exactly:
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-2">
                  <code className="text-sm font-mono text-gray-800">
                    {requiredText}
                  </code>
                </div>

                <div>
                  <label
                    htmlFor="confirmation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type confirmation text:
                  </label>
                  <input
                    id="confirmation"
                    type="text"
                    value={confirmationText}
                    onChange={(e) => {
                      setConfirmationText(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={requiredText}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${error ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    disabled={isDeleting}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-700 font-medium text-center">
                    ⚠️ This action is permanent and cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                disabled={isDeleting}
              >
                Back
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  isDeleting ||
                  confirmationText.toLowerCase().trim() !== requiredText
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="h-3 w-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-3 w-3" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountModal;

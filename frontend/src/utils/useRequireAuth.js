// src/utils/useRequireAuth.js
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

export const useRequireAuth = () => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    // For wrapping auth checks around actions (like "Add to Cart")
    const runWithAuth = (callback) => {
        if (loading) return;

        if (isAuthenticated) {
            callback(); // 🔒 Proceed if logged in
        } else {
            toast.dismiss();
            toast.info("Please sign in before adding to cart.", {
                position: "top-center",
                autoClose: 1500,
            });

            // ⏳ Navigate after delay (guaranteed even if toast is dismissed manually)
            setTimeout(() => {
                navigate("/signin");
            }, 1600);
        }
    };



    // For protecting whole pages (like CartPage)
    const checkPageAccess = () => {
        useEffect(() => {
            if (!loading && !isAuthenticated) {
                toast.dismiss(); // 🧼 Clear any previous toasts
                toast.info("Please sign in to continue.");
                navigate("/signin");
            }
        }, [loading, isAuthenticated]);
    };

    return { runWithAuth, checkPageAccess, isAuthenticated, loading };
};

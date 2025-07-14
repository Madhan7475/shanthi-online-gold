// src/utils/RequireAuthPage.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const RequireAuthPage = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            toast.info("Please sign in to access this page.");
            navigate("/signin");
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading || !isAuthenticated) {
        return <div className="text-center mt-20 text-gray-500">Checking authentication...</div>;
    }

    return children;
};

export default RequireAuthPage;

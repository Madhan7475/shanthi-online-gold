// src/utils/RequireAuthPage.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RequireAuthPage = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // ✅ The toast has been removed from here to prevent race conditions on logout.
            // The navigation is the only action needed.
            navigate("/signin");
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading || !isAuthenticated) {
        // This will show a loading message while the auth state is being checked
        // and before the redirect happens.
        return <div className="text-center mt-20 text-gray-500">Checking authentication...</div>;
    }

    return children;
};

export default RequireAuthPage;

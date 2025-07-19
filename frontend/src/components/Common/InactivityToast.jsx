import React from 'react';

/**
 * A custom component to be displayed inside the inactivity warning toast.
 * @param {object} props - Component props.
 * @param {function} props.onStayLoggedIn - The function to call when the button is clicked.
 */
const InactivityToast = ({ onStayLoggedIn }) => {
    return (
        <div className="flex flex-col items-center justify-center p-2">
            <p className="text-center mb-3 text-sm font-medium">You will be logged out soon due to inactivity.</p>
            <button
                onClick={onStayLoggedIn}
                className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-green-600 transition-colors shadow-md"
            >
                Stay Logged In
            </button>
        </div>
    );
};

export default InactivityToast;
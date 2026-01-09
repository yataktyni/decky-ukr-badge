// decky-ukr-badge/src/components/Spinner.tsx
import React from "react";

const Spinner: React.FC = () => {
    return (
        <div
            style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                border: "3px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "50%",
                borderTopColor: "#fff",
                animation: "spin 1s ease-in-out infinite",
            }}
        >
            <style>
                {`
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default Spinner;

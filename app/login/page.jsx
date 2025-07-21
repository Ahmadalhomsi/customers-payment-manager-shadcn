"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { BeatLoader } from "react-spinners"; // Import BeatLoader
import { authManager } from "@/lib/auth";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const usernameInputRef = useRef(null);

    useEffect(() => {
        // Auto-focus the username input when component mounts
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
        
        // Clear any existing tokens when on login page
        authManager.clearTokens();
    }, []);

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Reset any previous errors
        setIsLoading(true); // Start loading

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Store token in both localStorage and cookie for consistency
                localStorage.setItem("token", result.token);
                document.cookie = `token=${result.token}; path=/; max-age=86400; samesite=strict; secure`;
                
                // Reset the auth manager's redirection flag
                authManager.isRedirecting = false;
                
                router.push("/");
            } else {
                setIsLoading(false); // Stop loading
                if (response.status === 429) {
                    setError("Too many failed attempts. Try again later.");
                } else {
                    setError(result.message || "Invalid username or password");
                }
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setIsLoading(false); // Stop loading
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Giriş
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                ref={usernameInputRef}
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <Input
                                type={isVisible ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="button"
                                onClick={toggleVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label="toggle password visibility"
                            >
                                {isVisible ? (
                                    <EyeOff className="h-4 w-4 mb-3.5" />
                                ) : (
                                    <Eye className="h-4 w-4 mb-3.5" />
                                )}
                            </button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <BeatLoader color="#ffffff" size={10} /> // Use BeatLoader
                            ) : (
                                "Giriş Yap"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
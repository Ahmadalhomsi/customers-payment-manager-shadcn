"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Reset any previous errors

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
                localStorage.setItem("token", result.token);
                document.cookie = `token=${result.token}; path=/; max-age=86400; samesite=strict; secure`;
                router.push("/");
            } else {
                if (response.status === 429) {
                    setError("Too many failed attempts. Try again later.");
                } else {
                    setError(result.message || "Invalid username or password");
                }
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2 relative">
                            <Input
                                type={isVisible ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={toggleVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label="toggle password visibility"
                            >
                                {isVisible ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
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
                            className="w-full bg-[#f26000] hover:bg-[#d95600]"
                        >
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
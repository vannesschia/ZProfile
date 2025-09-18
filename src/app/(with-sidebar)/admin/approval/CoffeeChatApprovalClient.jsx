"use client";

import { useState } from "react";
import { Check, X, Calendar, User, Users } from "lucide-react";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CoffeeChatApprovalClient({ initialData }) {
    const [coffeeChatData, setCoffeeChatData] = useState(initialData);
    const [loading, setLoading] = useState({});
    const supabase = getBrowserClient();

    const handleApproval = async (id, newStatus) => {
        setLoading(prev => ({ ...prev, [id]: true }));

        try {
            const { error } = await supabase
                .from("coffee_chats")
                .update({ approval: newStatus })
                .eq("id", id);

            if (error) {
                throw error;
            }

            // Remove the approved/rejected item from the list
            setCoffeeChatData(prev => prev.filter(item => item.id !== id));

            toast.success(`Coffee chat ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
        } catch (error) {
            console.error("Error updating approval status:", error);
            toast.error(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} coffee chat: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (coffeeChatData.length === 0) {
        return (
            <Card className="max-w-4xl">
                <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                        <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                        <p>No pending coffee chats to review at this time.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {coffeeChatData.map((chat) => (
                <Card key={chat.id} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Info & Actions */}
                            <div className="flex flex-col gap-6 justify-between">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(chat.chat_date)}
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">Pending</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium text-sm">Pledge:</span>
                                        <span className="text-sm">{chat.pledge_member?.name || chat.pledge}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-sm">Brother:</span>
                                        <span className="text-sm">{chat.brother_member?.name || chat.brother}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mt-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                        onClick={() => handleApproval(chat.id, 'denied')}
                                        disabled={loading[chat.id]}
                                    >
                                        <X className="h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApproval(chat.id, 'approved')}
                                        disabled={loading[chat.id]}
                                    >
                                        <Check className="h-4 w-4" />
                                        Approve
                                    </Button>
                                </div>
                            </div>
                            {/* Right Column: Image Proof */}
                            <div className="flex flex-col items-center justify-center">
                                <span className="font-medium text-sm mb-2">Proof Image:</span>
                                {chat.image_proof ? (
                                    <div className="relative w-full max-w-lg">
                                        <img
                                            src={chat.image_proof}
                                            alt="Coffee chat proof"
                                            className="w-full h-72 object-contain rounded-lg border border-gray-200 bg-white"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div
                                            className="hidden w-full h-72 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500"
                                        >
                                            Failed to load image
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-72 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                                        No image provided
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

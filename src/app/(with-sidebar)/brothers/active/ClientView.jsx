"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import MemberCard from "../../../components/MemberCard";

export default function ClientMembersView({ members }) {
    const [search, setSearch] = useState("");

    const safeMembers = Array.isArray(members) ? members : [];

    const grouped = safeMembers.reduce((acc, member) => {
        const className = member.current_class_number || "Unsorted";
        if (!acc[className]) acc[className] = [];
        acc[className].push(member);
        return acc;
    }, {});

    return (
        <div>
            <Input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md mb-8"
            />

            {Object.entries(grouped)
                .sort(([a], [b]) => {
                    // try to parse class numbers, fallback to string compare
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
                    if (isNaN(numA)) return 1; // puts non-numeric at the end
                    if (isNaN(numB)) return -1;
                    return numA - numB; // ascending order (oldest at bottom)
                })
                .reverse()
                .map(([className, classMembers]) => {
                    const filtered = classMembers.filter((m) =>
                        m.name.toLowerCase().includes(search.toLowerCase())
                    );

                    if (filtered.length === 0) return null;

                    return (
                        <section key={className} className="mb-10">
                            <h2 className="text-xl font-semibold mb-4">{className}</h2>
                            <div className="flex flex-wrap gap-4 justify-start">
                                {filtered.map((member) => (
                                    <MemberCard key={member.uniqname} member={member} />
                                ))}
                            </div>
                        </section>
                    );
                })}
        </div>
    );
}

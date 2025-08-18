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

            {Object.entries(grouped).map(([className, classMembers]) => {
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

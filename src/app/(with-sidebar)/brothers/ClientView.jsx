"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import MemberCard from "@/app/components/MemberCard";
import HorizontalMemberCard from "@/app/components/HorizontalMemberCard";

const GREEK_ORDER = [ //will need to be changed years later 
//                     when class names are "alpha beta", etc 
    "alpha", "beta", "gamma", "delta", "epsilon",
    "zeta", "eta", "theta", "iota", "kappa",
    "lambda", "mu", "nu", "xi", "omicron",
    "pi", "rho", "sigma", "tau", "upsilon",
    "phi", "chi", "psi", "omega",
];

const greekIndex = Object.fromEntries(
    GREEK_ORDER.map((g, i) => [g, i]) // alpha=0, beta=1, ...
);

function sectionComparator([aKey], [bKey]) {
    const a = String(aKey ?? "").trim().toLowerCase();
    const b = String(bKey ?? "").trim().toLowerCase();
    return (greekIndex[b] ?? Infinity) - (greekIndex[a] ?? Infinity);
}

export default function ClientMembersView({ members }) {
    const [search, setSearch] = useState("");
    const safeMembers = Array.isArray(members) ? members : [];

    const grouped = safeMembers.reduce((acc, member) => {
        const className = (member.current_class_number || "").trim();
        if (!className) return acc; // skip empty labels; they won't be shown
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
                .sort(sectionComparator) // α → β → γ → …
                .map(([className, classMembers]) => {
                    const filtered = classMembers.filter((m) =>
                        m.name.toLowerCase().includes(search.toLowerCase())
                    );
                    if (filtered.length === 0) return null;

                    return (
                        <section key={className} className="mb-10">
                            <h2 className="text-xl font-semibold mb-4">
                                {className}
                            </h2>
                            <div className="flex flex-wrap gap-4 justify-start items-start">
                                {filtered.map((member) => (
                                    <HorizontalMemberCard key={member.uniqname} member={member} />
                                ))}
                            </div>
                        </section>
                    );
                })}
        </div>
    );
}

// src/app/profile/ProfileForm.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supbaseClient";

export default function ProfileForm({ initialData, userEmail }) {
  const supabase = getBrowserClient();
  const router = useRouter();

  const [formValues, setFormValues] = useState({
    uniqname: initialData.uniqname, // already set
    name: initialData.name,         // already set, but let ’em edit
    major: initialData.major || [],
    minor: initialData.minor || [],
    grade: initialData.grade || "",
    graduation_year: initialData.graduation_year || "",
    phone_number: initialData.phone_number || "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    // make sure we’re authed and get the owner key RLS expects
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      setErrorMsg("Not authenticated.");
      setSubmitting(false);
      return;
    }

    const update = {
      // profile fields
      name: formValues.name,
      major: formValues.major,
      minor: formValues.minor,
      grade: Number(formValues.grade) || null,
      graduation_year: Number(formValues.graduation_year) || null,
      phone_number: formValues.phone_number,
      email_address: userEmail,
      onboarding_completed: Boolean(true),
    };

    const { data, error } = await supabase
      .from("members")
      .update(update)
      .eq("user_id", user.id)                 // <-- matches common RLS
      .select("uniqname, onboarding_completed") // RETURNING to confirm
      .maybeSingle();
    
    console.log(data);

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
      return;
    }
    if (!data) {
      setErrorMsg("No rows updated (RLS blocked or row not found).");
      setSubmitting(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    router.push(next);
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}

      <div>
        <label className="block text-sm font-medium">uniqname</label>
        <input
          type="text"
          value={formValues.uniqname}
          disabled
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={formValues.name}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Major (comma-separated)</label>
        <input
          type="text"
          value={formValues.major.join(",")}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              major: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s),
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Minor (comma-separated)</label>
        <input
          type="text"
          value={formValues.minor.join(",")}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              minor: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s),
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Grade</label>
        <input
          type="number"
          min="1"
          max="5"
          value={formValues.grade}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, grade: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Graduation Year (YYYY)</label>
        <input
          type="number"
          value={formValues.graduation_year}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              graduation_year: e.target.value,
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Phone Number</label>
        <input
          type="tel"
          value={formValues.phone_number}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, phone_number: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email Address</label>
        <input
          type="email"
          value={userEmail}
          disabled
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white"
      >
        {submitting ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}

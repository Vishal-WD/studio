// This file is intentionally left blank. The new create user page is at /src/app/(auth)/create-user/page.tsx
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is deprecated and will be removed.
// For now, it just redirects to the new public creation page.
export default function DeprecatedCreateUserPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/create-user');
    }, [router]);

    return null;
}

"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback {...props} />;
}

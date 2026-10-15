import { redirect } from "next/navigation";

type LoginSearchParams = Record<string, string | string[] | undefined>;

export default function LoginRedirectPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(queryString ? `/ovj?${queryString}` : "/ovj");
}
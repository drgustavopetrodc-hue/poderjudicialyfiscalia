import PortalHome from "@/components/PortalHome";

type OVJSearchParams = {
  callbackUrl?: string;
  error?: string;
};

export default function OVJPage({ searchParams }: { searchParams: OVJSearchParams }) {
  return <PortalHome callbackUrl={searchParams.callbackUrl} authError={searchParams.error} />;
}

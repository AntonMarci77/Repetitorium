import { TezaDetail } from "@/components/teza-detail";
export default function Page({ params }: { params: { id: string } }) {
  return <TezaDetail id={params.id} />;
}

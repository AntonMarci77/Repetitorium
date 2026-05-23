import { Sebatestovanie } from "@/components/sebatestovanie";
export default function Page({ params }: { params: { id: string } }) {
  return <Sebatestovanie tezaId={params.id} />;
}

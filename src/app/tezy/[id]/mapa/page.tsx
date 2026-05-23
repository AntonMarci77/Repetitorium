import { MentalnaMapaView } from "@/components/mentalna-mapa";
export default function Page({ params }: { params: { id: string } }) {
  return <MentalnaMapaView id={params.id} />;
}

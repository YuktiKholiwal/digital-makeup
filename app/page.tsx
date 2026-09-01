import CollectionView from "@/components/CollectionView";
import { listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await listItems();
  return <CollectionView items={items} />;
}

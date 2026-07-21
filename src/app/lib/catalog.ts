export type CatalogBusiness = {
  nama_usaha: string;
  kategori: string;
  alamat: string;
};

export type CatalogProduct = {
  name: string;
  description: string;
  umkm: { nama_usaha: string; kategori: string } | null;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase("id-ID");
const matchesCategory = (itemCategory: string | undefined, category: string) => category === "Semua" || Boolean(itemCategory?.startsWith(category));

export function filterBusinesses<T extends CatalogBusiness>(items: T[], query: string, category: string): T[] {
  const normalizedQuery = normalize(query);
  return items.filter((item) => matchesCategory(item.kategori, category)
    && (!normalizedQuery || normalize(`${item.nama_usaha} ${item.kategori} ${item.alamat}`).includes(normalizedQuery)));
}

export function filterProducts<T extends CatalogProduct>(items: T[], query: string, category: string): T[] {
  const normalizedQuery = normalize(query);
  return items.filter((item) => matchesCategory(item.umkm?.kategori, category)
    && (!normalizedQuery || normalize(`${item.name} ${item.description} ${item.umkm?.nama_usaha ?? ""}`).includes(normalizedQuery)));
}

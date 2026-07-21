import { describe, expect, it } from "vitest";
import { filterBusinesses, filterProducts } from "./catalog";

const businesses = [
  { nama_usaha: "Warung Ibu", kategori: "Makanan & Minuman", alamat: "Karangwuni RT 01" },
  { nama_usaha: "Batik Lestari", kategori: "Fashion", alamat: "Karangwuni RT 02" },
];

describe("filterBusinesses", () => {
  it("mencari tanpa membedakan huruf besar", () => {
    expect(filterBusinesses(businesses, "BATIK", "Semua")).toHaveLength(1);
  });

  it("mencocokkan chip Makanan dengan kategori database", () => {
    expect(filterBusinesses(businesses, "", "Makanan")[0]?.nama_usaha).toBe("Warung Ibu");
  });
});

describe("filterProducts", () => {
  it("mencari produk berdasarkan nama UMKM", () => {
    const products = [{ name: "Kemeja", description: "Katun", umkm: { nama_usaha: "Batik Lestari", kategori: "Fashion" } }];
    expect(filterProducts(products, "lestari", "Fashion")).toHaveLength(1);
  });

  it("tidak menampilkan produk tanpa UMKM pada filter kategori", () => {
    const products = [{ name: "Produk", description: "", umkm: null }];
    expect(filterProducts(products, "", "Jasa")).toHaveLength(0);
  });
});

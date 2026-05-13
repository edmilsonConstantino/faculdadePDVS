import { useMemo } from 'react';
import { Product } from '@/lib/api';

function normalizeForSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

export function useProductSearch(
  products: Product[],
  selectedCategory: string,
  productSearch: string,
) {
  return useMemo(() => {
    const baseByCategory =
      selectedCategory === '0'
        ? products
        : products.filter((p) => p.categoryId === selectedCategory);

    const searchNorm = normalizeForSearch(productSearch);

    const directMatches = !searchNorm
      ? baseByCategory
      : baseByCategory.filter((p) => {
          const nameN = normalizeForSearch(p.name);
          const skuN = normalizeForSearch(p.sku);
          return nameN.includes(searchNorm) || skuN.includes(searchNorm);
        });

    const fuzzySuggestions = (() => {
      if (!searchNorm || directMatches.length > 0) return [];
      const scored = baseByCategory
        .map((p) => {
          const nameN = normalizeForSearch(p.name);
          const dist = levenshtein(searchNorm, nameN.slice(0, Math.max(searchNorm.length, 12)));
          return { p, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 6);
      const best = scored[0]?.dist ?? 999;
      const threshold = Math.min(3, Math.max(1, Math.floor(searchNorm.length / 3)));
      if (best > threshold) return [];
      return scored.filter((x) => x.dist <= best + 1).map((x) => x.p);
    })();

    const filteredProducts = directMatches.length > 0 ? directMatches : fuzzySuggestions;

    return { filteredProducts, directMatches, fuzzySuggestions };
  }, [products, selectedCategory, productSearch]);
}

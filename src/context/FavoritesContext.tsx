import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserFavoriteIds, toggleFavorite as dbToggleFavorite } from '@/services/db';

interface FavoritesContextType {
  favoriteIds: Set<number>;
  isFavorite: (productId: number) => boolean;
  toggleFav: (productId: number) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const ids = await getUserFavoriteIds(user.id);
      setFavoriteIds(new Set(ids));
    } catch (err) {
      console.error('Lỗi khi tải danh sách ID yêu thích:', err);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const syncFavorites = async () => {
      if (!user) {
        if (isMounted) setFavoriteIds(new Set());
        return;
      }
      try {
        const ids = await getUserFavoriteIds(user.id);
        if (isMounted) {
          setFavoriteIds(new Set(ids));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách ID yêu thích:', err);
      }
    };

    syncFavorites();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isFavorite = useCallback(
    (productId: number): boolean => {
      return favoriteIds.has(productId);
    },
    [favoriteIds]
  );

  const toggleFav = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!user) return false;

      let willBeFav = false;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
          willBeFav = false;
        } else {
          next.add(productId);
          willBeFav = true;
        }
        return next;
      });

      // 2. Đồng bộ bền vững xuống SQLite
      try {
        const res = await dbToggleFavorite(user.id, productId);
        return res;
      } catch (err) {
        // Rollback nếu có lỗi DB
        console.error('Lỗi khi cập nhật yêu thích xuống SQLite:', err);
        await refreshFavorites();
        return !willBeFav;
      }
    },
    [user, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFav, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

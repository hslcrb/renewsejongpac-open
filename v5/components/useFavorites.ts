"use client";
import { useSyncExternalStore } from "react";
import { getFavoriteIds, serverFavorites, subscribeFavorites } from "../src/lib/favorites";
export default function useFavorites() {
    return useSyncExternalStore(subscribeFavorites, getFavoriteIds, serverFavorites);
}

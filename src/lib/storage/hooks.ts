"use client";

import { useSyncExternalStore } from "react";
import type { CollectionRepository, ValueRepository } from "./repositories";

const EMPTY: never[] = [];
const getEmpty = () => EMPTY;
const getNull = () => null;

/** Коллекцияны React-ке жазылыммен береді (серверде — бос тізім). */
export function useCollection<T extends { id: string }>(repo: CollectionRepository<T>): T[] {
  return useSyncExternalStore(repo.subscribe, repo.list, getEmpty as () => T[]);
}

export function useValue<T>(repo: ValueRepository<T>): T | null {
  return useSyncExternalStore(repo.subscribe, repo.get, getNull);
}

const noopSubscribe = () => () => {};
/** Клиентте гидратациядан кейін true. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

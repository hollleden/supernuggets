'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type VaultStatsContextType = {
  totalNuggets: number
  filteredNuggets: number
  folderCounts: Record<string, number>
  setVaultStats: (total: number, filtered: number, counts: Record<string, number>) => void
}

const VaultStatsContext = createContext<VaultStatsContextType>({
  totalNuggets: 0,
  filteredNuggets: 0,
  folderCounts: {},
  setVaultStats: () => {},
})

export function VaultStatsProvider({ children }: { children: ReactNode }) {
  const [totalNuggets, setTotalNuggets] = useState(0)
  const [filteredNuggets, setFilteredNuggets] = useState(0)
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({})

  const setVaultStats = useCallback(
    (total: number, filtered: number, counts: Record<string, number>) => {
      setTotalNuggets(total)
      setFilteredNuggets(filtered)
      setFolderCounts(counts)
    },
    []
  )

  return (
    <VaultStatsContext.Provider value={{ totalNuggets, filteredNuggets, folderCounts, setVaultStats }}>
      {children}
    </VaultStatsContext.Provider>
  )
}

export const useVaultStats = () => useContext(VaultStatsContext)

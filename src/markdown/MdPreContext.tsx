import { createContext, useContext, type ReactNode } from 'react'

const MdInsidePreContext = createContext(false)

interface MdInsidePreProviderProps {
  children: ReactNode
}

export function MdInsidePreProvider(props: MdInsidePreProviderProps) {
  const { children } = props
  return <MdInsidePreContext.Provider value={true}>{children}</MdInsidePreContext.Provider>
}

export function useMdInsidePre() {
  return useContext(MdInsidePreContext)
}

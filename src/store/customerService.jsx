import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../api/client.js'
import { openExternal } from '../constants.js'

const CustomerServiceContext = createContext(null)

export function CustomerServiceProvider({ children }) {
  const [url, setUrl] = useState(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.customerService.get()
      setUrl(res && res.url ? res.url : null)
    } catch {
      // silent — a failed fetch must never block the app; support UI just stays hidden
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const open = useCallback(() => {
    if (url) {
      openExternal(url)
    }
  }, [url])

  const available = !!url

  return (
    <CustomerServiceContext.Provider value={{ url, available, open }}>
      {children}
    </CustomerServiceContext.Provider>
  )
}

export const useCustomerService = () => useContext(CustomerServiceContext)

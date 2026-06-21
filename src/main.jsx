import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import App from './App.jsx'
import { AuthProvider } from './store/auth.jsx'
import { VideosProvider } from './store/videos.jsx'
import { DeployHistoryProvider } from './store/deploys.jsx'
import './i18n/index.js'
import './index.css'

// Ant Design theme tokens — keeps antd components in sync with our cyan design.
const theme = {
  token: {
    colorPrimary: '#06b6d4',
    colorLink: '#0891b2',
    borderRadius: 12,
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <VideosProvider>
              <DeployHistoryProvider>
                <App />
              </DeployHistoryProvider>
            </VideosProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
)

import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from 'antd'
import Navbar from './components/Navbar.jsx'
import BottomNav from './components/BottomNav.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import FloatingChat from './components/FloatingChat.jsx'
// Entry pages are eager (instant first paint); everything else is code-split.
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

// One import() per page — reused both for lazy() and for background prefetch,
// so each chunk is fetched once and cached. After the first paint we warm them
// all during idle time, so navigating to a page is instant (no per-click wait).
const loaders = {
  About: () => import('./pages/About.jsx'),
  Promotion: () => import('./pages/Promotion.jsx'),
  Videos: () => import('./pages/Videos.jsx'),
  Dashboard: () => import('./pages/Dashboard.jsx'),
  OrderDetail: () => import('./pages/OrderDetail.jsx'),
  Account: () => import('./pages/Account.jsx'),
  ProductAds: () => import('./pages/ProductAds.jsx'),
  Settings: () => import('./pages/Settings.jsx'),
  Withdrawal: () => import('./pages/Withdrawal.jsx'),
  Deposit: () => import('./pages/Deposit.jsx'),
  OnlinePayment: () => import('./pages/OnlinePayment.jsx'),
  CryptoDeposit: () => import('./pages/CryptoDeposit.jsx'),
  TransactionHistory: () => import('./pages/TransactionHistory.jsx'),
  ChangeRecords: () => import('./pages/ChangeRecords.jsx'),
  KycStatus: () => import('./pages/KycStatus.jsx'),
  Notifications: () => import('./pages/Notifications.jsx'),
  DeployHistory: () => import('./pages/DeployHistory.jsx'),
  ReviewContent: () => import('./pages/ReviewContent.jsx'),
  SelectVideo: () => import('./pages/SelectVideo.jsx'),
  Placeholder: () => import('./pages/Placeholder.jsx'),
}

const About = lazy(loaders.About)
const Promotion = lazy(loaders.Promotion)
const Videos = lazy(loaders.Videos)
const Dashboard = lazy(loaders.Dashboard)
const OrderDetail = lazy(loaders.OrderDetail)
const Account = lazy(loaders.Account)
const ProductAds = lazy(loaders.ProductAds)
const Settings = lazy(loaders.Settings)
const Withdrawal = lazy(loaders.Withdrawal)
const Deposit = lazy(loaders.Deposit)
const OnlinePayment = lazy(loaders.OnlinePayment)
const CryptoDeposit = lazy(loaders.CryptoDeposit)
const TransactionHistory = lazy(loaders.TransactionHistory)
const ChangeRecords = lazy(loaders.ChangeRecords)
const KycStatus = lazy(loaders.KycStatus)
const Notifications = lazy(loaders.Notifications)
const DeployHistory = lazy(loaders.DeployHistory)
const ReviewContent = lazy(loaders.ReviewContent)
const SelectVideo = lazy(loaders.SelectVideo)
const Placeholder = lazy(loaders.Placeholder)

function RouteFallback() {
  return <div className="route-fallback"><span className="route-spinner" /></div>
}

export default function App() {
  const { pathname } = useLocation()
  // After first paint, warm all route chunks during idle so navigation is instant.
  useEffect(() => {
    let cancelled = false
    const prefetch = () => { if (!cancelled) Object.values(loaders).forEach((fn) => fn().catch(() => {})) }
    const ric = window.requestIdleCallback
    const id = ric ? ric(prefetch, { timeout: 2500 }) : setTimeout(prefetch, 1200)
    return () => {
      cancelled = true
      if (ric && window.cancelIdleCallback) window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])

  // Standalone full-screen pages render their own header (no global navbar / tab bar)
  const bare = pathname === '/deploy-history' || pathname === '/review-content' || pathname === '/select-video' || pathname === '/notifications' || pathname === '/product-ads' || pathname === '/settings' || pathname === '/withdrawal' || pathname === '/deposit' || pathname === '/online-payment' || pathname === '/crypto-deposit' || pathname === '/transaction-history' || pathname === '/revenue-history' || pathname === '/kyc'
  return (
    <Layout className="app" style={{ background: 'var(--shell)' }}>
      {!bare && <Navbar />}
      <Layout.Content className={bare ? 'main main-bare' : 'main'}>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/announcement" element={<Placeholder titleKey="menu.announcement" />} />

          {/* Authenticated app pages — require login */}
          <Route path="/promotion" element={<ProtectedRoute><Promotion /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/product-ads" element={<ProtectedRoute><ProductAds /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/withdrawal" element={<ProtectedRoute><Withdrawal /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path="/online-payment" element={<ProtectedRoute><OnlinePayment /></ProtectedRoute>} />
          <Route path="/crypto-deposit" element={<ProtectedRoute><CryptoDeposit /></ProtectedRoute>} />
          <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
          <Route path="/revenue-history" element={<ProtectedRoute><ChangeRecords /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycStatus /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/video-management" element={<ProtectedRoute><Placeholder titleKey="menu.videoManagement" /></ProtectedRoute>} />
          <Route path="/deploy-history" element={<ProtectedRoute><DeployHistory /></ProtectedRoute>} />
          <Route path="/review-content" element={<ProtectedRoute><ReviewContent /></ProtectedRoute>} />
          <Route path="/select-video" element={<ProtectedRoute><SelectVideo /></ProtectedRoute>} />
          <Route path="/product-management" element={<ProtectedRoute><Placeholder titleKey="menu.productManagement" /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute><Placeholder titleKey="menu.pendingPurchaseOrders" /></ProtectedRoute>} />
          <Route path="/dispute-orders" element={<ProtectedRoute><Placeholder titleKey="menu.disputeOrders" /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Layout.Content>
      {!bare && <BottomNav />}
      <FloatingChat />
    </Layout>
  )
}

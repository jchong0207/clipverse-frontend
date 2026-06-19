import { useNavigate } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'

// Standalone sub-page header: back arrow + centered title. Reused across pages.
export default function SubPageHeader({ title }) {
  const navigate = useNavigate()
  return (
    <header className="dh-bar">
      <button className="dh-back" onClick={() => navigate(-1)} aria-label="Back"><LeftOutlined /></button>
      <span className="dh-bar-title">{title}</span>
    </header>
  )
}

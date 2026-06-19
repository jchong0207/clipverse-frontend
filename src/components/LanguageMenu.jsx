import { useTranslation } from 'react-i18next'
import { Dropdown, Button } from 'antd'
import { GlobalOutlined, DownOutlined } from '@ant-design/icons'
import { LANGUAGES } from '../i18n/index.js'

export default function LanguageMenu() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage || 'en').split('-')[0]
  const currentLabel = LANGUAGES.find((l) => l.code === current || l.code.split('-')[0] === current)?.label || 'Language'

  const items = LANGUAGES.map((l) => ({ key: l.code, label: l.label }))

  return (
    <Dropdown
      trigger={['click']}
      menu={{ items, selectable: true, selectedKeys: [i18n.resolvedLanguage], onClick: ({ key }) => i18n.changeLanguage(key) }}
    >
      <Button type="text" icon={<GlobalOutlined />} size="small">
        {currentLabel} <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// 報告書用フォント（同梱するので、印刷時にネット接続がなくても崩れない）
import '@fontsource/noto-serif-jp/400.css'
import '@fontsource/noto-serif-jp/600.css'
import '@fontsource/noto-serif-jp/700.css'
import '@fontsource/noto-sans-jp/400.css'
import '@fontsource/noto-sans-jp/500.css'
import '@fontsource/noto-sans-jp/700.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

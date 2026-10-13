// main.tsx
// 애플리케이션 진입점. HashRouter로 라우팅을 감싸고 App 컴포넌트를 렌더링한다.
// HashRouter를 사용하는 이유: GitHub Pages 정적 호스팅에서 새로고침 시 404를 방지하기 위함.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

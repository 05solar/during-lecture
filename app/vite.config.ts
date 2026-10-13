import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages(프로젝트 페이지) 배포를 고려해 상대 경로(base: './')를 사용한다.
// 라우팅은 HashRouter를 쓰므로 새로고침 시 404가 발생하지 않는다.
export default defineConfig({
  plugins: [react()],
  base: './',
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GluestackUIProvider mode="dark">
      <App />
    </GluestackUIProvider>
  </React.StrictMode>
)

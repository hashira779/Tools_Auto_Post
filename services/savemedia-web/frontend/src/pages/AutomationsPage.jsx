import React from 'react'

export default function AutomationsPage() {
  return (
    <div className="w-full flex-1 flex flex-col absolute inset-0 pt-[70px]">
      <iframe 
        src="/n8n/" 
        className="w-full h-full border-0" 
        title="CamTech Automations Builder" 
        allow="clipboard-write; clipboard-read"
      />
    </div>
  )
}

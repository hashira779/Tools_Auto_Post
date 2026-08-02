import { useState } from 'react'
import CvHero from './CvHero'
import CvTemplateGrid from './CvTemplateGrid'
import CvPhotoEditor from './CvPhotoEditor'

export default function CvStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <CvHero />

      {selectedTemplate ? (
        <CvPhotoEditor
          selectedTemplate={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
        />
      ) : (
        <CvTemplateGrid onSelectTemplate={setSelectedTemplate} />
      )}
    </div>
  )
}

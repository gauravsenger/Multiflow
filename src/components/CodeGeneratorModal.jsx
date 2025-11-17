import React, { useState, useEffect } from 'react'
import { generateCode } from '../utils/codeGenerator'

const CodeGeneratorModal = ({ isOpen, onClose, flow, formData, paymentType = 'onetime' }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('java')
  const [generatedCode, setGeneratedCode] = useState('')

  useEffect(() => {
    if (isOpen && flow && formData) {
      const code = generateCode(flow, formData, paymentType, selectedLanguage)
      setGeneratedCode(code)
    }
  }, [isOpen, flow, formData, paymentType, selectedLanguage])

  if (!isOpen) return null

  const flowNames = {
    'nonseamless': 'Non-Seamless',
    'crossborder': 'Cross Border',
    'subscription': 'Subscription',
    'tpv': 'TPV',
    'upiotm': 'UPI OTM',
    'preauth': 'PreAuth',
    'checkoutplus': 'Checkout Plus',
    'split': 'Split Payment',
    'bankoffer': 'Bank Offers'
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      alert('Code copied to clipboard successfully!')
    }).catch(err => {
      console.error('Failed to copy code:', err)
      alert('Failed to copy code. Please copy manually.')
    })
  }

  const handleDownload = () => {
    const extensions = {
      'java': 'java',
      'php': 'php',
      'python': 'py',
      'nodejs': 'js'
    }
    const extension = extensions[selectedLanguage] || 'txt'
    const filename = `payu_${flow}_integration.${extension}`
    
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="code-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="code-modal-content">
        <div className="code-modal-header">
          <h2>&#128187; Generate Integration Code - <span>{flowNames[flow] || flow}</span></h2>
          <button className="code-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="code-tabs">
          <button 
            className={`code-tab ${selectedLanguage === 'java' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('java')}
          >
            Java
          </button>
          <button 
            className={`code-tab ${selectedLanguage === 'php' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('php')}
          >
            PHP
          </button>
          <button 
            className={`code-tab ${selectedLanguage === 'python' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('python')}
          >
            Python
          </button>
          <button 
            className={`code-tab ${selectedLanguage === 'nodejs' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('nodejs')}
          >
            Node.js
          </button>
        </div>
        
        <div className="code-actions">
          <button className="button" onClick={handleCopyCode} style={{ background: 'var(--success-color)', marginRight: '10px' }}>
            Copy Code
          </button>
          <button className="button" onClick={handleDownload} style={{ background: 'var(--accent-primary)' }}>
            Download
          </button>
        </div>
        
        <div className="code-preview-container">
          <pre className="code-preview">{generatedCode}</pre>
        </div>
        
        <div className="code-instructions">
          <h4>Instructions:</h4>
          <ol>
            <li>Replace <code>YOUR_MERCHANT_KEY</code> with your actual PayU merchant key</li>
            <li>Replace <code>YOUR_MERCHANT_SALT</code> with your actual PayU merchant salt</li>
            <li>Update redirect URLs (SURL/FURL) as needed for your application</li>
            <li>Test in PayU test environment before going live</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default CodeGeneratorModal


import React, { useState, useEffect } from 'react'
import BackButton from '../BackButton'
import CodeGeneratorModal from '../CodeGeneratorModal'
import { generateTransactionId, getFlowPrefix, getCredentials, validatePhone, validateEmail, generateHash } from '../../utils/helpers'
import { PAYU_URL } from '../../utils/constants'
import { generateDebugInfo, generateCurlCommand, copyToClipboard } from '../../utils/debugUtils'

const UPIOTM = () => {
  const flow = 'upiotm'
  const prefix = getFlowPrefix(flow)
  
  const [formData, setFormData] = useState({
    useCustomKeys: false,
    customKey: '',
    customSalt: '',
    showSalt: false,
    paymentStartDate: '',
    paymentEndDate: '',
    amount: '17000',
    productinfo: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    zipcode: '',
    udf1: '',
    udf2: '',
    udf3: '',
    udf4: '',
    udf5: '',
    surl: 'https://test.payu.in/admin/test_response',
    furl: 'https://test.payu.in/admin/test_response',
    siDetails: ''
  })

  const [errors, setErrors] = useState({ email: '', phone: '', dates: '' })
  const [txnId, setTxnId] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [debugContent, setDebugContent] = useState('')
  const [curlContent, setCurlContent] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)

  useEffect(() => {
    setTxnId(generateTransactionId(flow))
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, paymentStartDate: today }))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'phone') {
      const phoneValidation = validatePhone(value)
      setErrors(prev => ({ ...prev, phone: phoneValidation.error }))
    } else if (name === 'email') {
      const emailValidation = validateEmail(value)
      setErrors(prev => ({ ...prev, email: emailValidation.error }))
    } else if (name === 'paymentStartDate' || name === 'paymentEndDate') {
      validateDates()
    }
  }

  const validateDates = () => {
    if (!formData.paymentStartDate || !formData.paymentEndDate) return
    
    const start = new Date(formData.paymentStartDate)
    const end = new Date(formData.paymentEndDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start < today) {
      setErrors(prev => ({ ...prev, dates: 'Start date cannot be in the past' }))
      return false
    }
    
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 14) {
      setErrors(prev => ({ ...prev, dates: 'Date range cannot exceed 14 days' }))
      return false
    }
    
    if (end < start) {
      setErrors(prev => ({ ...prev, dates: 'End date must be after start date' }))
      return false
    }
    
    setErrors(prev => ({ ...prev, dates: '' }))
    return true
  }

  const validateForm = () => {
    if (!formData.amount || !formData.productinfo || !formData.firstname || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return false
    }
    if (parseFloat(formData.amount) < 17000) {
      alert('Amount must be at least Rs. 17,000 for UPI OTM')
      return false
    }
    if (!validateDates()) return false
    return true
  }

  const handleShowDebug = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    const updatedFormData = { ...formData, txnid: newTxnId }
    const debugHtml = generateDebugInfo(flow, updatedFormData)
    setDebugContent(debugHtml)
    setShowDebug(true)
    setShowCurl(false)
    setTimeout(() => {
      const debugSection = document.getElementById(`${prefix}-debugSection`)
      if (debugSection) debugSection.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleGenerateCurl = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    const updatedFormData = { ...formData, txnid: newTxnId }
    const curlCommand = generateCurlCommand(flow, updatedFormData)
    setCurlContent(curlCommand)
    setShowCurl(true)
    setShowDebug(false)
    setTimeout(() => {
      const curlSection = document.getElementById(`${prefix}-curlSection`)
      if (curlSection) curlSection.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleGenerateCode = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    setShowCodeModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return

    const credentials = getCredentials(flow, formData.useCustomKeys, formData.customKey, formData.customSalt)
    const params = {
      key: credentials.key,
      txnid: newTxnId,
      amount: formData.amount,
      productinfo: formData.productinfo,
      firstname: formData.firstname,
      email: formData.email,
      udf1: formData.udf1 || '',
      udf2: formData.udf2 || '',
      udf3: formData.udf3 || '',
      udf4: formData.udf4 || '',
      udf5: formData.udf5 || ''
    }

    const hash = generateHash(params, credentials.salt)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = PAYU_URL
    form.style.display = 'none'

    const fields = [
      { name: 'key', value: credentials.key },
      { name: 'txnid', value: newTxnId },
      { name: 'amount', value: formData.amount },
      { name: 'productinfo', value: formData.productinfo },
      { name: 'firstname', value: formData.firstname },
      { name: 'email', value: formData.email },
      { name: 'phone', value: formData.phone },
      { name: 'surl', value: formData.surl },
      { name: 'furl', value: formData.furl },
      { name: 'hash', value: hash },
      { name: 'api_version', value: '7' },
      { name: 'pre_authorize', value: '1' }
    ]

    if (formData.lastname) fields.push({ name: 'lastname', value: formData.lastname })
    if (formData.address1) fields.push({ name: 'address1', value: formData.address1 })
    if (formData.address2) fields.push({ name: 'address2', value: formData.address2 })
    if (formData.city) fields.push({ name: 'city', value: formData.city })
    if (formData.state) fields.push({ name: 'state', value: formData.state })
    if (formData.country) fields.push({ name: 'country', value: formData.country })
    if (formData.zipcode) fields.push({ name: 'zipcode', value: formData.zipcode })
    if (formData.udf1) fields.push({ name: 'udf1', value: formData.udf1 })
    if (formData.udf2) fields.push({ name: 'udf2', value: formData.udf2 })
    if (formData.udf3) fields.push({ name: 'udf3', value: formData.udf3 })
    if (formData.udf4) fields.push({ name: 'udf4', value: formData.udf4 })
    if (formData.udf5) fields.push({ name: 'udf5', value: formData.udf5 })
    if (formData.siDetails) fields.push({ name: 'si_details', value: formData.siDetails })

    fields.forEach(field => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = field.name
      input.value = field.value
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  }

  return (
    <>
      <BackButton />
      <div className="main-content">
        <div className="section">
          <h2 className="section-title">Configuration Settings</h2>
          <div className="alert alert-info">
            <strong>UPI One Time Mandate:</strong> Create a one-time pre-authorization for UPI payments. The mandate is valid for the specified date range (max 14 days).
          </div>
          
          <div className="custom-key-toggle">
            <label>
              <input type="checkbox" checked={formData.useCustomKeys} onChange={(e) => setFormData(prev => ({ ...prev, useCustomKeys: e.target.checked, customKey: '', customSalt: '' }))} />
              Use Custom Merchant Key & Salt
            </label>
            <div className={`custom-key-fields ${formData.useCustomKeys ? 'active' : ''}`}>
              <div className="form-group">
                <label>Custom Merchant Key <span className="required">*</span></label>
                <input type="text" name="customKey" value={formData.customKey} onChange={handleChange} placeholder="Enter your PayU Merchant Key" />
              </div>
              <div className="form-group">
                <label>Custom Merchant Salt <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={formData.showSalt ? 'text' : 'password'} name="customSalt" value={formData.customSalt} onChange={handleChange} placeholder="Enter your PayU Merchant Salt" style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, showSalt: !prev.showSalt }))} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                    {formData.showSalt ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Mandate Date Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Start Date <span className="required">*</span></label>
                <input type="date" name="paymentStartDate" value={formData.paymentStartDate} onChange={handleChange} required />
                <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Select current or future date only</small>
              </div>
              <div className="form-group">
                <label>Payment End Date <span className="required">*</span></label>
                <input type="date" name="paymentEndDate" value={formData.paymentEndDate} onChange={handleChange} required />
                <small style={{ color: 'var(--text-tertiary)' }}>Max 14 days from start date</small>
              </div>
            </div>
            {errors.dates && <div className="error-message">{errors.dates}</div>}
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>API Version <span className="required">*</span></label>
              <input type="text" value="7" readOnly style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Mandatory for UPI OTM (always 7)</small>
            </div>
            <div className="form-group">
              <label>Pre-Authorize <span className="required">*</span></label>
              <input type="text" value="1" readOnly style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Mandatory for UPI OTM (always 1)</small>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Payment Details</h2>
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <strong>Amount Condition:</strong> For Success Amount &gt;= Rs. 17,000
          </div>
          <div className="form-group">
            <label>Transaction ID <span style={{ color: '#48bb78' }}>(Auto-Generated)</span></label>
            <input type="text" value={txnId} readOnly style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontFamily: 'monospace' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount <span className="required">*</span></label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" placeholder="17000" required />
            </div>
            <div className="form-group">
              <label>Product Info <span className="required">*</span></label>
              <input type="text" name="productinfo" value={formData.productinfo} onChange={handleChange} placeholder="Product description" required />
            </div>
          </div>
          <h3 style={{ color: 'var(--accent-primary)', margin: '2rem 0 1rem 0' }}>Customer Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} placeholder="John" required />
            </div>
            <div className="form-group">
              <label>Last Name <span className="optional">(Optional)</span></label>
              <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Doe" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" required className={errors.email ? 'error' : ''} />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone (10 digits) <span className="required">*</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required maxLength="10" className={errors.phone ? 'error' : ''} />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
          </div>
          <h3 style={{ color: 'var(--accent-primary)', margin: '2rem 0 1rem 0' }}>Address Details <span className="optional">(Optional)</span></h3>
          <div className="form-group">
            <label>Address Line 1</label>
            <input type="text" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street address" />
          </div>
          <div className="form-group">
            <label>Address Line 2</label>
            <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, etc." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="India" />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="400001" />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">UDF Parameters</h2>
          <div className="form-row">
            <div className="form-group">
              <label>UDF1 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf1" value={formData.udf1} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>UDF2 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf2" value={formData.udf2} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>UDF3 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf3" value={formData.udf3} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>UDF4 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf4" value={formData.udf4} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>UDF5 <span className="optional">(Optional)</span></label>
            <input type="text" name="udf5" value={formData.udf5} onChange={handleChange} />
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Redirect URLs</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Success URL <span className="required">*</span></label>
              <input type="url" name="surl" value={formData.surl} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Failure URL <span className="required">*</span></label>
              <input type="url" name="furl" value={formData.furl} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="pay-button-wrapper">
          <button type="button" className="button debug-button" onClick={handleShowDebug}>Show Debug Info</button>
          <button type="button" className="button debug-button" onClick={handleGenerateCurl}>Generate CURL</button>
          <button type="button" className="button code-gen-button" onClick={handleGenerateCode}>
            <span style={{ marginRight: '5px' }}>&#128187;</span> Generate Code
          </button>
          <button type="button" className="button" onClick={handleSubmit}>Pay Now</button>
        </div>

        {showDebug && (
          <div className="debug-section" id={`${prefix}-debugSection`}>
            <h3 className="debug-title">Debug Information</h3>
            <div id={`${prefix}-debugContent`} dangerouslySetInnerHTML={{ __html: debugContent }}></div>
          </div>
        )}

        {showCurl && (
          <div className="curl-section" id={`${prefix}-curlSection`}>
            <h3>CURL Command</h3>
            <button className="copy-button" onClick={() => copyToClipboard(curlContent)}>Copy to Clipboard</button>
            <div className="curl-content" id={`${prefix}-curlContent`}>{curlContent}</div>
          </div>
        )}

        <CodeGeneratorModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          flow={flow}
          formData={{ ...formData, txnid: txnId }}
        />
      </div>
    </>
  )
}

export default UPIOTM

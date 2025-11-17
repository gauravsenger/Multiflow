import React, { useState, useEffect, useRef } from 'react'
import BackButton from '../BackButton'
import CodeGeneratorModal from '../CodeGeneratorModal'
import { generateTransactionId, getFlowPrefix, getCredentials, validatePhone, validateEmail, generateHash } from '../../utils/helpers'
import { PAYU_URL } from '../../utils/constants'
import { generateDebugInfo, generateCurlCommand, copyToClipboard } from '../../utils/debugUtils'

const NonSeamless = () => {
  const flow = 'nonseamless'
  const prefix = getFlowPrefix(flow)
  
  // State for form fields
  const [formData, setFormData] = useState({
    useCustomKeys: false,
    customKey: '',
    customSalt: '',
    showSalt: false,
    amount: '',
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
    paymentMethods: {
      cc: false,
      dc: false,
      nb: false,
      upi: false
    }
  })

  // State for validation errors
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  })

  // State for transaction ID
  const [txnId, setTxnId] = useState('')

  // State for debug and CURL sections
  const [showDebug, setShowDebug] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [debugContent, setDebugContent] = useState('')
  const [curlContent, setCurlContent] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)
  const formRef = useRef(null)

  // Generate transaction ID on mount
  useEffect(() => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
  }, [])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox' && name.startsWith('paymentMethod_')) {
      const method = name.replace('paymentMethod_', '')
      setFormData(prev => ({
        ...prev,
        paymentMethods: {
          ...prev.paymentMethods,
          [method]: checked
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Validate on change
    if (name === 'phone') {
      const phoneValidation = validatePhone(value)
      setErrors(prev => ({
        ...prev,
        phone: phoneValidation.error
      }))
      if (phoneValidation.value !== value) {
        e.target.value = phoneValidation.value
      }
    } else if (name === 'email') {
      const emailValidation = validateEmail(value)
      setErrors(prev => ({
        ...prev,
        email: emailValidation.error
      }))
    }
  }

  // Toggle custom keys
  const toggleCustomKeys = () => {
    setFormData(prev => ({
      ...prev,
      useCustomKeys: !prev.useCustomKeys,
      customKey: '',
      customSalt: ''
    }))
  }

  // Toggle salt visibility
  const toggleSaltVisibility = () => {
    setFormData(prev => ({
      ...prev,
      showSalt: !prev.showSalt
    }))
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {
      email: '',
      phone: ''
    }

    // Validate required fields
    if (!formData.amount) {
      alert('Please enter amount')
      return false
    }
    if (!formData.productinfo) {
      alert('Please enter product info')
      return false
    }
    if (!formData.firstname) {
      alert('Please enter first name')
      return false
    }
    if (!formData.email) {
      alert('Please enter email')
      return false
    }
    if (!formData.phone) {
      alert('Please enter phone number')
      return false
    }

    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error
      setErrors(newErrors)
      return false
    }

    // Validate phone
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error
      setErrors(newErrors)
      return false
    }

    // Validate custom keys if enabled
    if (formData.useCustomKeys) {
      if (!formData.customKey || !formData.customSalt) {
        alert('Please enter both custom merchant key and salt')
        return false
      }
    }

    setErrors(newErrors)
    return true
  }

  // Handle debug info
  const handleShowDebug = () => {
    // Regenerate transaction ID
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    
    if (!validateForm()) return
    
    const updatedFormData = { ...formData, txnid: newTxnId }
    const debugHtml = generateDebugInfo(flow, updatedFormData)
    setDebugContent(debugHtml)
    setShowDebug(true)
    setShowCurl(false)
    
    // Scroll to debug section
    setTimeout(() => {
      const debugSection = document.getElementById(`${prefix}-debugSection`)
      if (debugSection) {
        debugSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // Handle CURL generation
  const handleGenerateCurl = () => {
    // Regenerate transaction ID
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    
    if (!validateForm()) return
    
    const updatedFormData = { ...formData, txnid: newTxnId }
    const curlCommand = generateCurlCommand(flow, updatedFormData)
    setCurlContent(curlCommand)
    setShowCurl(true)
    setShowDebug(false)
    
    // Scroll to CURL section
    setTimeout(() => {
      const curlSection = document.getElementById(`${prefix}-curlSection`)
      if (curlSection) {
        curlSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // Handle code generation
  const handleGenerateCode = () => {
    // Regenerate transaction ID
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    
    if (!validateForm()) return
    
    setShowCodeModal(true)
  }

  // Submit payment
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Regenerate transaction ID
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)

    if (!validateForm()) return

    // Get credentials
    const credentials = getCredentials(
      flow,
      formData.useCustomKeys,
      formData.customKey,
      formData.customSalt
    )

    // Build params for hash
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

    // Generate hash
    const hash = generateHash(params, credentials.salt)

    // Build payment methods string
    const selectedMethods = []
    if (formData.paymentMethods.cc) selectedMethods.push('creditcard')
    if (formData.paymentMethods.dc) selectedMethods.push('debitcard')
    if (formData.paymentMethods.nb) selectedMethods.push('netbanking')
    if (formData.paymentMethods.upi) selectedMethods.push('upi')

    // Create form and submit
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
      { name: 'hash', value: hash }
    ]

    // Add optional fields
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
    if (selectedMethods.length > 0) {
      fields.push({ name: 'enforce_paymethod', value: selectedMethods.join('|') })
    }

    // Create hidden inputs
    fields.forEach(field => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = field.name
      input.value = field.value
      form.appendChild(input)
    })

    // Submit form
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <>
      <BackButton />
      <div className="main-content">
        {/* Configuration Settings */}
        <div className="section">
          <h2 className="section-title">Configuration Settings</h2>
          
          <div className="alert alert-info">
            <strong>PreBuilt Checkout:</strong> PayU's standard checkout page with built-in payment UI.
          </div>
          
          {/* Custom Key/Salt Toggle */}
          <div className="custom-key-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={formData.useCustomKeys}
                onChange={toggleCustomKeys}
              />
              Use Custom Merchant Key & Salt (for testing with your own credentials)
            </label>
            <div className={`custom-key-fields ${formData.useCustomKeys ? 'active' : ''}`}>
              <div className="form-group">
                <label htmlFor="ns_custom_key">Custom Merchant Key <span className="required">*</span></label>
                <input 
                  type="text" 
                  id="ns_custom_key" 
                  name="customKey"
                  value={formData.customKey}
                  onChange={handleChange}
                  placeholder="Enter your PayU Merchant Key"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ns_custom_salt">Custom Merchant Salt <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={formData.showSalt ? 'text' : 'password'} 
                    id="ns_custom_salt" 
                    name="customSalt"
                    value={formData.customSalt}
                    onChange={handleChange}
                    placeholder="Enter your PayU Merchant Salt" 
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={toggleSaltVisibility}
                    style={{ 
                      position: 'absolute', 
                      right: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '12px', 
                      color: '#666' 
                    }}
                    title="Show/Hide Salt"
                  >
                    {formData.showSalt ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label>Enforce Payment Methods <span className="optional">(Optional)</span></label>
            <div className="payment-methods">
              <div className="payment-method">
                <input 
                  type="checkbox" 
                  id="ns_cc" 
                  name="paymentMethod_cc"
                  checked={formData.paymentMethods.cc}
                  onChange={handleChange}
                />
                <label htmlFor="ns_cc">Credit Cards</label>
              </div>
              <div className="payment-method">
                <input 
                  type="checkbox" 
                  id="ns_dc" 
                  name="paymentMethod_dc"
                  checked={formData.paymentMethods.dc}
                  onChange={handleChange}
                />
                <label htmlFor="ns_dc">Debit Cards</label>
              </div>
              <div className="payment-method">
                <input 
                  type="checkbox" 
                  id="ns_nb" 
                  name="paymentMethod_nb"
                  checked={formData.paymentMethods.nb}
                  onChange={handleChange}
                />
                <label htmlFor="ns_nb">Net Banking</label>
              </div>
              <div className="payment-method">
                <input 
                  type="checkbox" 
                  id="ns_upi" 
                  name="paymentMethod_upi"
                  checked={formData.paymentMethods.upi}
                  onChange={handleChange}
                />
                <label htmlFor="ns_upi">UPI</label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Details */}
        <div className="section">
          <h2 className="section-title">Payment Details</h2>
          
          {/* Transaction ID Display */}
          <div className="form-group">
            <label htmlFor="ns_txnid_display">Transaction ID <span style={{ color: '#48bb78' }}>(Auto-Generated from Back-end)</span></label>
            <input 
              type="text" 
              id="ns_txnid_display" 
              value={txnId}
              readOnly 
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontFamily: 'monospace' }}
            />
            <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>
              Unique identifier auto-generated for this transaction - Non-editable
            </small>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_amount">Amount <span className="required">*</span></label>
              <input 
                type="number" 
                id="ns_amount" 
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01" 
                placeholder="100.00" 
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_productinfo">Product Info <span className="required">*</span></label>
              <input 
                type="text" 
                id="ns_productinfo" 
                name="productinfo"
                value={formData.productinfo}
                onChange={handleChange}
                placeholder="Product or service description" 
                required
              />
            </div>
          </div>
          
          <h3 style={{ color: 'var(--accent-primary)', margin: '2rem 0 1rem 0' }}>Customer Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_firstname">First Name <span className="required">*</span></label>
              <input 
                type="text" 
                id="ns_firstname" 
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                placeholder="John" 
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_lastname">Last Name <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_lastname" 
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_email">Email <span className="required">*</span></label>
              <input 
                type="email" 
                id="ns_email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com" 
                required
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="ns_phone">Phone (10 digits) <span className="required">*</span></label>
              <input 
                type="text" 
                id="ns_phone" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210" 
                required 
                maxLength="10" 
                pattern="[0-9]{10}"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
          </div>
          
          <h3 style={{ color: 'var(--accent-primary)', margin: '2rem 0 1rem 0' }}>
            Address Details <span className="optional">(Optional)</span>
          </h3>
          
          <div className="form-group">
            <label htmlFor="ns_address1">Address Line 1 <span className="optional">(Optional)</span></label>
            <input 
              type="text" 
              id="ns_address1" 
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ns_address2">Address Line 2 <span className="optional">(Optional)</span></label>
            <input 
              type="text" 
              id="ns_address2" 
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_city">City <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_city" 
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_state">State <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_state" 
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_country">Country <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_country" 
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_zipcode">ZIP Code <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_zipcode" 
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
                placeholder="400001"
              />
            </div>
          </div>
        </div>
        
        {/* UDF Parameters */}
        <div className="section">
          <h2 className="section-title">UDF Parameters (Optional)</h2>
          
          <div className="alert alert-info">
            <strong>UDF Information:</strong> User Defined Fields for custom data - all optional.
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_udf1">UDF1 <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_udf1" 
                name="udf1"
                value={formData.udf1}
                onChange={handleChange}
                placeholder="User defined field 1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_udf2">UDF2 <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_udf2" 
                name="udf2"
                value={formData.udf2}
                onChange={handleChange}
                placeholder="User defined field 2"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_udf3">UDF3 <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_udf3" 
                name="udf3"
                value={formData.udf3}
                onChange={handleChange}
                placeholder="User defined field 3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_udf4">UDF4 <span className="optional">(Optional)</span></label>
              <input 
                type="text" 
                id="ns_udf4" 
                name="udf4"
                value={formData.udf4}
                onChange={handleChange}
                placeholder="User defined field 4"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="ns_udf5">UDF5 <span className="optional">(Optional)</span></label>
            <input 
              type="text" 
              id="ns_udf5" 
              name="udf5"
              value={formData.udf5}
              onChange={handleChange}
              placeholder="User defined field 5"
            />
          </div>
        </div>
        
        {/* Redirect URLs */}
        <div className="section">
          <h2 className="section-title">Redirect URLs</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ns_surl">Success URL <span className="required">*</span></label>
              <input 
                type="url" 
                id="ns_surl" 
                name="surl"
                value={formData.surl}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ns_furl">Failure URL <span className="required">*</span></label>
              <input 
                type="url" 
                id="ns_furl" 
                name="furl"
                value={formData.furl}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="pay-button-wrapper">
          <button type="button" className="button debug-button" onClick={handleShowDebug}>Show Debug Info</button>
          <button type="button" className="button debug-button" onClick={handleGenerateCurl}>Generate CURL</button>
          <button type="button" className="button code-gen-button" onClick={handleGenerateCode}>
            <span style={{ marginRight: '5px' }}>&#128187;</span> Generate Code
          </button>
          <button type="button" className="button" onClick={handleSubmit}>Pay Now</button>
        </div>

        {/* Debug Section */}
        {showDebug && (
          <div className="debug-section" id={`${prefix}-debugSection`}>
            <h3 className="debug-title">Debug Information</h3>
            <div id={`${prefix}-debugContent`} dangerouslySetInnerHTML={{ __html: debugContent }}></div>
          </div>
        )}

        {/* CURL Section */}
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
          formData={{ ...formData, txnid: txnId, selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key]) }}
        />
      </div>
    </>
  )
}

export default NonSeamless

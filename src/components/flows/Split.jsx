import React, { useState, useEffect } from 'react'
import BackButton from '../BackButton'
import CodeGeneratorModal from '../CodeGeneratorModal'
import { generateTransactionId, getFlowPrefix, getCredentials, validatePhone, validateEmail, generateHash } from '../../utils/helpers'
import { PAYU_URL } from '../../utils/constants'
import { generateDebugInfo, generateCurlCommand, copyToClipboard } from '../../utils/debugUtils'

const Split = () => {
  const flow = 'split'
  const prefix = getFlowPrefix(flow)
  
  const [formData, setFormData] = useState({
    useCustomKeys: false,
    customKey: '',
    customSalt: '',
    showSalt: false,
    splitType: 'absolute',
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
    paymentMethods: { cc: false, dc: false, nb: false, upi: false },
    splitRows: []
  })

  const [errors, setErrors] = useState({ email: '', phone: '' })
  const [txnId, setTxnId] = useState('')
  const [splitRowCounter, setSplitRowCounter] = useState(0)
  const [showDebug, setShowDebug] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [debugContent, setDebugContent] = useState('')
  const [curlContent, setCurlContent] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)

  useEffect(() => {
    setTxnId(generateTransactionId(flow))
    // Add first default split row
    addSplitRow()
  }, [])

  const addSplitRow = () => {
    const newRowId = splitRowCounter + 1
    setSplitRowCounter(newRowId)
    
    const timestamp = Date.now()
    const randomSuffix = Math.floor(Math.random() * 10000)
    const childTxnId = `child_${timestamp}_${randomSuffix}`
    
    let defaultMerchantKey = ''
    if (!formData.useCustomKeys) {
      if (formData.splitRows.length === 0) {
        defaultMerchantKey = 'gYoEaY'
      } else if (formData.splitRows.length === 1) {
        defaultMerchantKey = '5rgA73'
      }
    }
    
    const newRow = {
      id: newRowId,
      merchantKey: defaultMerchantKey,
      txnId: childTxnId,
      amount: '',
      charges: '0.00'
    }
    
    setFormData(prev => ({
      ...prev,
      splitRows: [...prev.splitRows, newRow]
    }))
  }

  const removeSplitRow = (rowId) => {
    setFormData(prev => ({
      ...prev,
      splitRows: prev.splitRows.filter(row => row.id !== rowId)
    }))
  }

  const updateSplitRow = (rowId, field, value) => {
    setFormData(prev => ({
      ...prev,
      splitRows: prev.splitRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    }))
  }

  const buildSplitRequestJson = () => {
    if (formData.splitRows.length === 0) {
      alert('Please add at least one split merchant configuration')
      return null
    }

    const splitInfo = {}
    let validCount = 0

    formData.splitRows.forEach(row => {
      if (!row.merchantKey || !row.txnId || !row.amount) {
        return
      }

      splitInfo[row.merchantKey] = {
        aggregatorSubTxnId: row.txnId,
        aggregatorSubAmt: row.amount,
        aggregatorCharges: row.charges || '0.00'
      }
      validCount++
    })

    if (validCount === 0) {
      alert('Please fill in all required fields for split merchants')
      return null
    }

    return JSON.stringify({
      type: formData.splitType,
      splitInfo: splitInfo
    })
  }

  const validateSplitAmounts = () => {
    if (formData.splitRows.length === 0) {
      alert('Please add at least one split merchant configuration')
      return false
    }

    if (formData.splitType === 'percentage') {
      const total = formData.splitRows.reduce((sum, row) => {
        return sum + (parseFloat(row.amount) || 0)
      }, 0)
      
      if (total > 100) {
        alert(`Split percentages cannot exceed 100%. Current total: ${total}%`)
        return false
      }
    }

    return true
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox' && name.startsWith('paymentMethod_')) {
      const method = name.replace('paymentMethod_', '')
      setFormData(prev => ({
        ...prev,
        paymentMethods: { ...prev.paymentMethods, [method]: checked }
      }))
    } else if (name === 'splitType') {
      setFormData(prev => ({ ...prev, splitType: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (name === 'phone') {
      const phoneValidation = validatePhone(value)
      setErrors(prev => ({ ...prev, phone: phoneValidation.error }))
    } else if (name === 'email') {
      const emailValidation = validateEmail(value)
      setErrors(prev => ({ ...prev, email: emailValidation.error }))
    }
  }

  const validateForm = () => {
    if (!formData.amount || !formData.productinfo || !formData.firstname || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return false
    }
    if (!validateSplitAmounts()) return false
    return true
  }

  const handleShowDebug = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    // Build splitRequest for debug
    const splitRequest = buildSplitRequestJson()
    const updatedFormData = { ...formData, txnid: newTxnId, splitRequest, selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key]) }
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
    // Build splitRequest for CURL
    const splitRequest = buildSplitRequestJson()
    const updatedFormData = { ...formData, txnid: newTxnId, splitRequest, selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key]) }
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

    const splitRequest = buildSplitRequestJson()
    if (!splitRequest) return

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
      { name: 'splitRequest', value: splitRequest }
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

    const selectedMethods = []
    if (formData.paymentMethods.cc) selectedMethods.push('creditcard')
    if (formData.paymentMethods.dc) selectedMethods.push('debitcard')
    if (formData.paymentMethods.nb) selectedMethods.push('netbanking')
    if (formData.paymentMethods.upi) selectedMethods.push('upi')
    if (selectedMethods.length > 0) {
      fields.push({ name: 'enforce_paymethod', value: selectedMethods.join('|') })
    }

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

  const placeholderText = formData.splitType === 'absolute' ? '500.00' : '50'
  const amountLabel = formData.splitType === 'absolute' ? 'Amount (INR)' : 'Percentage'

  return (
    <>
      <BackButton />
      <div className="main-content">
        <div className="section">
          <h2 className="section-title">Configuration Settings</h2>
          <div className="alert alert-info">
            <strong>About Split Payment:</strong> Distribute a single transaction amount across multiple merchant accounts. Supports both absolute amount and percentage-based splitting.
            <br /><strong>Use Cases:</strong> Marketplace platforms, commission-based transactions, aggregator models.
          </div>
          
          <div className="custom-key-toggle">
            <label>
              <input type="checkbox" checked={formData.useCustomKeys} onChange={(e) => {
                setFormData(prev => ({ ...prev, useCustomKeys: e.target.checked, customKey: '', customSalt: '' }))
                // Update split rows when toggle changes
                if (!e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    splitRows: prev.splitRows.map((row, idx) => ({
                      ...row,
                      merchantKey: idx === 0 ? 'gYoEaY' : idx === 1 ? '5rgA73' : ''
                    }))
                  }))
                } else {
                  setFormData(prev => ({
                    ...prev,
                    splitRows: prev.splitRows.map(row => ({ ...row, merchantKey: '' }))
                  }))
                }
              }} />
              Use Custom Merchant Key & Salt
            </label>
            <div className={`custom-key-fields ${formData.useCustomKeys ? 'active' : ''}`}>
              <div className="form-row">
                <div className="form-group">
                  <label>Merchant Key <span className="required">*</span></label>
                  <input type="text" name="customKey" value={formData.customKey} onChange={handleChange} placeholder="Enter your merchant key" />
                </div>
                <div className="form-group">
                  <label>Merchant Salt <span className="required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={formData.showSalt ? 'text' : 'password'} name="customSalt" value={formData.customSalt} onChange={handleChange} placeholder="Enter your merchant salt" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, showSalt: !prev.showSalt }))} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                      {formData.showSalt ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Payment Details</h2>
          <div className="form-group">
            <label>Transaction ID <span style={{ color: '#48bb78' }}>(Auto-Generated)</span></label>
            <input type="text" value={txnId} readOnly style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontFamily: 'monospace' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (INR) <span className="required">*</span></label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" min="1" placeholder="100.00" required />
              <small style={{ color: 'var(--text-tertiary)' }}>Total transaction amount</small>
            </div>
            <div className="form-group">
              <label>Product Info <span className="required">*</span></label>
              <input type="text" name="productinfo" value={formData.productinfo} onChange={handleChange} placeholder="Product description" required />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Customer Information</h2>
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
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="test@example.com" required className={errors.email ? 'error' : ''} />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone <span className="required">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required className={errors.phone ? 'error' : ''} />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Address Information <span className="optional">(Optional)</span></h2>
          <div className="form-row">
            <div className="form-group">
              <label>Address Line 1</label>
              <input type="text" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street address" />
            </div>
            <div className="form-group">
              <label>Address Line 2</label>
              <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, etc." />
            </div>
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
              <label>Zip Code</label>
              <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="400001" />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">UDF Parameters (Optional)</h2>
          <div className="alert alert-info">
            <strong>UDF Information:</strong> User Defined Fields for custom data - all optional.
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>UDF1 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf1" value={formData.udf1} onChange={handleChange} placeholder="User defined field 1" />
            </div>
            <div className="form-group">
              <label>UDF2 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf2" value={formData.udf2} onChange={handleChange} placeholder="User defined field 2" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>UDF3 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf3" value={formData.udf3} onChange={handleChange} placeholder="User defined field 3" />
            </div>
            <div className="form-group">
              <label>UDF4 <span className="optional">(Optional)</span></label>
              <input type="text" name="udf4" value={formData.udf4} onChange={handleChange} placeholder="User defined field 4" />
            </div>
          </div>
          <div className="form-group">
            <label>UDF5 <span className="optional">(Optional)</span></label>
            <input type="text" name="udf5" value={formData.udf5} onChange={handleChange} placeholder="User defined field 5" />
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Split Payment Configuration <span className="required">*</span></h2>
          <div className="alert alert-warning">
            <strong>Important:</strong> Split merchant keys must be pre-configured and linked to your parent merchant account. Contact PayU support for split setup.
          </div>
          
          <div className="form-group">
            <label>Split Type <span className="required">*</span></label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="splitType" value="absolute" checked={formData.splitType === 'absolute'} onChange={handleChange} />
                <span>Amount Based (Absolute)</span>
                <small>Specify exact amounts in INR</small>
              </label>
              <label className="radio-label">
                <input type="radio" name="splitType" value="percentage" checked={formData.splitType === 'percentage'} onChange={handleChange} />
                <span>Percentage Based</span>
                <small>Specify percentage of total amount</small>
              </label>
            </div>
          </div>

          <div>
            <h4>Split Details (Child Merchants)</h4>
            {formData.splitRows.map((row) => (
              <div key={row.id} className="split-row">
                <div className="form-group">
                  <label>Child Merchant Key <span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={row.merchantKey} 
                    onChange={(e) => updateSplitRow(row.id, 'merchantKey', e.target.value)}
                    placeholder="e.g., gYoEaY" 
                    required 
                  />
                  <small style={{ color: 'var(--text-tertiary)' }}>Must be pre-configured with PayU</small>
                </div>
                <div className="form-group">
                  <label>Child Transaction ID <span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={row.txnId} 
                    readOnly 
                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--text-tertiary)' }}>Auto-generated unique ID</small>
                </div>
                <div className="form-group">
                  <label>{amountLabel} <span className="required">*</span></label>
                  <input 
                    type="number" 
                    value={row.amount} 
                    onChange={(e) => updateSplitRow(row.id, 'amount', e.target.value)}
                    placeholder={placeholderText}
                    step="0.01"
                    min="0"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Charges <span className="optional">(Optional)</span></label>
                  <input 
                    type="number" 
                    value={row.charges} 
                    onChange={(e) => updateSplitRow(row.id, 'charges', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <button 
                  type="button" 
                  className="remove-split-btn" 
                  onClick={() => removeSplitRow(row.id)}
                  title="Remove this child"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="button" onClick={addSplitRow} style={{ background: 'var(--success-color)', marginTop: '10px' }}>
              + Add Another Split Merchant
            </button>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Enforce Payment Methods <span className="optional">(Optional)</span></h2>
          <div className="payment-methods">
            <label className="payment-method">
              <input type="checkbox" id="split_cc" name="paymentMethod_cc" checked={formData.paymentMethods.cc} onChange={handleChange} />
              <span>Credit Card</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="split_dc" name="paymentMethod_dc" checked={formData.paymentMethods.dc} onChange={handleChange} />
              <span>Debit Card</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="split_nb" name="paymentMethod_nb" checked={formData.paymentMethods.nb} onChange={handleChange} />
              <span>Net Banking</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="split_upi" name="paymentMethod_upi" checked={formData.paymentMethods.upi} onChange={handleChange} />
              <span>UPI</span>
            </label>
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
          formData={{
            ...formData,
            txnid: txnId,
            splitRequest: buildSplitRequestJson(),
            selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key])
          }}
        />
      </div>
    </>
  )
}

export default Split

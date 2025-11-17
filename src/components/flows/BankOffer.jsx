import React, { useState, useEffect } from 'react'
import BackButton from '../BackButton'
import CodeGeneratorModal from '../CodeGeneratorModal'
import { generateTransactionId, getFlowPrefix, getCredentials, validatePhone, validateEmail, generateHash } from '../../utils/helpers'
import { PAYU_URL } from '../../utils/constants'
import { generateDebugInfo, generateCurlCommand, copyToClipboard } from '../../utils/debugUtils'

const BankOffer = () => {
  const flow = 'bankoffer'
  const prefix = getFlowPrefix(flow)
  
  const [formData, setFormData] = useState({
    useCustomKeys: false,
    customKey: '',
    customSalt: '',
    showSalt: false,
    enableSku: false,
    amount: '20000',
    productinfo: '',
    offerKey: '',
    surcharges: '',
    preDiscount: '0',
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
    paymentMethods: { cc: false, dc: false, nb: false, upi: false, emi: false },
    skuRows: []
  })

  const [errors, setErrors] = useState({ email: '', phone: '' })
  const [txnId, setTxnId] = useState('')
  const [skuRowCounter, setSkuRowCounter] = useState(0)
  const [showDebug, setShowDebug] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [debugContent, setDebugContent] = useState('')
  const [curlContent, setCurlContent] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)

  useEffect(() => {
    setTxnId(generateTransactionId(flow))
  }, [])

  const addSkuRow = () => {
    if (formData.skuRows.length >= 5) {
      alert('Maximum 5 SKUs allowed')
      return
    }

    const newRowId = skuRowCounter + 1
    setSkuRowCounter(newRowId)

    let skuId = ''
    let skuName = ''
    if (!formData.useCustomKeys) {
      if (formData.skuRows.length === 0) {
        skuId = 'testProduct11'
        skuName = 'SkuTest11'
      } else if (formData.skuRows.length === 1) {
        skuId = 'testProduct12'
        skuName = 'SkuTest12'
      }
    }

    const newRow = {
      id: newRowId,
      skuId: skuId,
      skuName: skuName,
      amount: '',
      quantity: '1'
    }

    setFormData(prev => ({
      ...prev,
      skuRows: [...prev.skuRows, newRow]
    }))
  }

  const removeSkuRow = (rowId) => {
    setFormData(prev => ({
      ...prev,
      skuRows: prev.skuRows.filter(row => row.id !== rowId)
    }))
  }

  const updateSkuRow = (rowId, field, value) => {
    setFormData(prev => ({
      ...prev,
      skuRows: prev.skuRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    }))
  }

  const buildCartDetails = () => {
    if (!formData.enableSku || formData.skuRows.length === 0) {
      return null
    }

    const items = formData.skuRows
      .filter(row => row.skuId && row.skuName && row.amount && row.quantity)
      .map(row => ({
        sku_id: row.skuId,
        sku_name: row.skuName,
        amount: parseFloat(row.amount) || 0,
        quantity: parseInt(row.quantity) || 1
      }))

    if (items.length === 0) return null

    const cartDetails = {
      items: items
    }

    if (formData.surcharges) {
      cartDetails.surcharges = parseFloat(formData.surcharges) || 0
    }

    if (formData.preDiscount && parseFloat(formData.preDiscount) > 0) {
      cartDetails.pre_discount = parseFloat(formData.preDiscount)
    }

    return JSON.stringify(cartDetails)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox' && name.startsWith('paymentMethod_')) {
      const method = name.replace('paymentMethod_', '')
      setFormData(prev => ({
        ...prev,
        paymentMethods: { ...prev.paymentMethods, [method]: checked }
      }))
    } else if (name === 'enableSku') {
      setFormData(prev => ({ ...prev, enableSku: checked }))
      if (!checked) {
        setFormData(prev => ({ ...prev, skuRows: [] }))
      } else if (prev.skuRows.length === 0) {
        addSkuRow()
      }
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
    if (parseFloat(formData.amount) < 20000 && !formData.useCustomKeys) {
      alert('Minimum amount ₹20,000 required for Bank Offers (For Predefined Credentials)')
      return false
    }
    if (formData.enableSku && formData.skuRows.length === 0) {
      alert('Please add at least one SKU item when SKU is enabled')
      return false
    }
    return true
  }

  const handleShowDebug = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    // Build cartDetails for debug
    const cartDetails = buildCartDetails()
    const updatedFormData = { ...formData, txnid: newTxnId, cartDetails, selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key]) }
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
    // Build cartDetails for CURL
    const cartDetails = buildCartDetails()
    const updatedFormData = { ...formData, txnid: newTxnId, cartDetails, selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key]) }
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
      { name: 'hash', value: hash }
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
    if (formData.offerKey) fields.push({ name: 'offer_key', value: formData.offerKey })

    const selectedMethods = []
    if (formData.paymentMethods.cc) selectedMethods.push('creditcard')
    if (formData.paymentMethods.dc) selectedMethods.push('debitcard')
    if (formData.paymentMethods.nb) selectedMethods.push('netbanking')
    if (formData.paymentMethods.upi) selectedMethods.push('upi')
    if (formData.paymentMethods.emi) selectedMethods.push('emi')
    if (selectedMethods.length > 0) {
      fields.push({ name: 'enforce_paymethod', value: selectedMethods.join('|') })
    }

    const cartDetails = buildCartDetails()
    if (cartDetails) {
      fields.push({ name: 'cart_details', value: cartDetails })
      fields.push({ name: 'api_version', value: '19' })
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

  const calculatedAmount = formData.skuRows.reduce((sum, row) => {
    return sum + ((parseFloat(row.amount) || 0) * (parseInt(row.quantity) || 1))
  }, 0) + (parseFloat(formData.surcharges) || 0) - (parseFloat(formData.preDiscount) || 0)

  return (
    <>
      <BackButton />
      <div className="main-content">
        <div className="section">
          <h2 className="section-title">Configuration Settings</h2>
          <div className="alert alert-info">
            <strong>About Bank Offers:</strong> Test instant discount and cashback offers with SKU/item-based cart details.
            <br /><strong>Note:</strong> Minimum transaction amount ₹20,000 required for bank offers (For Predefined Credentials).
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
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" min="20000" placeholder="20000.00" required />
              <small style={{ color: 'var(--warning-color)', fontWeight: 600 }}>⚠ Minimum amount ₹20,000 required for Bank Offers (For Predefined Credentials)</small>
            </div>
            <div className="form-group">
              <label>Product Info <span className="required">*</span></label>
              <input type="text" name="productinfo" value={formData.productinfo} onChange={handleChange} placeholder="Product description" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Offer Key <span className="optional">(Optional)</span></label>
              <input type="text" name="offerKey" value={formData.offerKey} onChange={handleChange} placeholder="e.g., TestInstantDiscount@BVfeXGNr2FKy" />
              <small style={{ color: 'var(--text-tertiary)' }}>For non-SKU based offers. Leave blank if using SKU details.</small>
            </div>
          </div>
          {formData.enableSku && (
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>API Version <span className="required">*</span> <span style={{ color: '#48bb78' }}>(Auto-set for SKU)</span></label>
                <input type="text" value="19" readOnly style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontWeight: 600 }} />
                <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>ⓘ API Version 19 is required for SKU-based cart details</small>
              </div>
            </div>
          )}
        </div>

        <div className="section">
          <h2 className="section-title">SKU/Item Based Offers</h2>
          <div className="alert alert-info">
            <strong>Enable SKU Details:</strong> Add cart details with item-level information to test bank offers.
          </div>
          
          <div className="custom-key-toggle" style={{ marginBottom: '1.5rem' }}>
            <label>
              <input type="checkbox" name="enableSku" checked={formData.enableSku} onChange={handleChange} />
              Enable SKU/Item Based Offers
            </label>
          </div>

          {formData.enableSku && (
            <div>
              <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                <strong>Note:</strong> For predefined credentials, SKU 1 and 2 will have prefilled IDs/names. Maximum 5 SKUs allowed.
              </div>
              
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Cart Configuration</h3>
              <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Surcharges <span className="optional">(Optional)</span></label>
                  <input type="text" name="surcharges" value={formData.surcharges} onChange={handleChange} placeholder="e.g., 50.00" />
                  <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Additional charges applied to the cart</small>
                </div>
                <div className="form-group">
                  <label>Pre-Discount Amount <span className="optional">(Optional)</span></label>
                  <input type="number" name="preDiscount" value={formData.preDiscount} onChange={handleChange} placeholder="0" step="0.01" min="0" />
                  <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Discount amount before applying bank offers</small>
                </div>
              </div>

              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>SKU Items</h3>
              {formData.skuRows.map((row) => (
                <div key={row.id} className="sku-row">
                  <h4>SKU Item #{row.id}</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>SKU ID <span className="required">*</span></label>
                      <input type="text" value={row.skuId} onChange={(e) => updateSkuRow(row.id, 'skuId', e.target.value)} placeholder="e.g., testProduct11" required />
                    </div>
                    <div className="form-group">
                      <label>SKU Name <span className="required">*</span></label>
                      <input type="text" value={row.skuName} onChange={(e) => updateSkuRow(row.id, 'skuName', e.target.value)} placeholder="e.g., SkuTest11" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount per SKU (INR) <span className="required">*</span></label>
                      <input type="number" value={row.amount} onChange={(e) => updateSkuRow(row.id, 'amount', e.target.value)} placeholder="20000" step="0.01" min="0" required />
                    </div>
                    <div className="form-group">
                      <label>Quantity <span className="required">*</span></label>
                      <input type="number" value={row.quantity} onChange={(e) => updateSkuRow(row.id, 'quantity', e.target.value)} placeholder="1" min="1" required />
                    </div>
                  </div>
                  <button type="button" className="remove-split-btn" onClick={() => removeSkuRow(row.id)} title="Remove this SKU">×</button>
                </div>
              ))}
              <button type="button" className="button" onClick={addSkuRow} style={{ background: 'var(--success-color)', marginTop: '1rem' }} disabled={formData.skuRows.length >= 5}>
                + Add SKU Item {formData.skuRows.length >= 5 && '(Max 5)'}
              </button>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--info-bg)', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--accent-primary)' }}>Cart Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <p style={{ margin: 0 }}><strong>Total Items:</strong> <span style={{ color: 'var(--accent-primary)' }}>{formData.skuRows.length}</span></p>
                  <p style={{ margin: 0 }}><strong>Calculated Amount:</strong> <span style={{ color: 'var(--accent-primary)' }}>₹{calculatedAmount.toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          )}
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
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" required className={errors.email ? 'error' : ''} />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone (10 digits) <span className="required">*</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required maxLength="10" className={errors.phone ? 'error' : ''} />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Address Information <span className="optional">(Optional)</span></h2>
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
          <h2 className="section-title">UDF Parameters (Optional)</h2>
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
          <h2 className="section-title">Enforce Payment Methods <span className="optional">(Optional)</span></h2>
          <div className="payment-methods">
            <label className="payment-method">
              <input type="checkbox" id="bo_cc" name="paymentMethod_cc" checked={formData.paymentMethods.cc} onChange={handleChange} />
              <span>Credit Card</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="bo_dc" name="paymentMethod_dc" checked={formData.paymentMethods.dc} onChange={handleChange} />
              <span>Debit Card</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="bo_nb" name="paymentMethod_nb" checked={formData.paymentMethods.nb} onChange={handleChange} />
              <span>Net Banking</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="bo_upi" name="paymentMethod_upi" checked={formData.paymentMethods.upi} onChange={handleChange} />
              <span>UPI</span>
            </label>
            <label className="payment-method">
              <input type="checkbox" id="bo_emi" name="paymentMethod_emi" checked={formData.paymentMethods.emi} onChange={handleChange} />
              <span>EMI</span>
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
            cartDetails: buildCartDetails(),
            selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key])
          }}
        />
      </div>
    </>
  )
}

export default BankOffer

import React, { useState, useEffect } from 'react'
import BackButton from '../BackButton'
import CodeGeneratorModal from '../CodeGeneratorModal'
import { generateTransactionId, getFlowPrefix, getCredentials, validatePhone, validateEmail, generateHash } from '../../utils/helpers'
import { PAYU_URL } from '../../utils/constants'
import { generateDebugInfo, generateCurlCommand, copyToClipboard } from '../../utils/debugUtils'

const CrossBorder = () => {
  const flow = 'crossborder'
  const prefix = getFlowPrefix(flow)
  
  const [formData, setFormData] = useState({
    useCustomKeys: false,
    customKey: '',
    customSalt: '',
    showSalt: false,
    paymentType: 'onetime',
    billingCycle: 'MONTHLY',
    billingInterval: '1',
    paymentStartDate: '',
    paymentEndDate: '',
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
    country: 'India',
    zipcode: '',
    buyerType: '0',
    udf1: '',
    udf2: '',
    udf3: '',
    udf4: '',
    udf5: '',
    subUdf1: '',
    subUdf2: '',
    subUdf3: '',
    subUdf4: '',
    subUdf5: '',
    surl: 'https://test.payu.in/admin/test_response',
    furl: 'https://test.payu.in/admin/test_response',
    paymentMethods: { cc: false, dc: false, nb: false, upi: false }
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
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox' && name.startsWith('paymentMethod_')) {
      const method = name.replace('paymentMethod_', '')
      setFormData(prev => ({
        ...prev,
        paymentMethods: { ...prev.paymentMethods, [method]: checked }
      }))
    } else if (name === 'paymentType') {
      setFormData(prev => ({ ...prev, paymentType: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (name === 'phone') {
      const phoneValidation = validatePhone(value)
      setErrors(prev => ({ ...prev, phone: phoneValidation.error }))
    } else if (name === 'email') {
      const emailValidation = validateEmail(value)
      setErrors(prev => ({ ...prev, email: emailValidation.error }))
    } else if (name === 'paymentStartDate') {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        alert('Payment Start Date cannot be in the past')
        const todayStr = new Date().toISOString().split('T')[0]
        setFormData(prev => ({ ...prev, paymentStartDate: todayStr }))
      }
    }
  }

  const validateForm = () => {
    if (!formData.amount || !formData.productinfo || !formData.firstname || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return false
    }
    if (!formData.lastname || !formData.address1 || !formData.city || !formData.state || !formData.country || !formData.zipcode) {
      alert('Billing address is mandatory for cross-border payments')
      return false
    }
    if (formData.paymentType === 'onetime' && !formData.udf5) {
      alert('UDF5 (Invoice ID) is required for cross-border one-time payments')
      return false
    }
    if (formData.paymentType === 'subscription') {
      if (!formData.paymentStartDate || !formData.paymentEndDate) {
        alert('Please select payment start and end dates')
        return false
      }
      const selectedMethods = Object.values(formData.paymentMethods).filter(Boolean)
      if (selectedMethods.length > 0) {
        if (formData.paymentMethods.upi && !formData.subUdf3) {
          alert('UDF3 is mandatory when UPI payment method is enforced for subscription')
          return false
        }
        if (!formData.paymentMethods.upi && !formData.subUdf5) {
          alert('UDF5 is mandatory when non-UPI payment methods are enforced for subscription')
          return false
        }
      }
    }
    return true
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
      udf1: formData.paymentType === 'onetime' ? formData.udf1 : formData.subUdf1 || '',
      udf2: formData.paymentType === 'onetime' ? formData.udf2 : formData.subUdf2 || '',
      udf3: formData.paymentType === 'onetime' ? formData.udf3 : formData.subUdf3 || '',
      udf4: formData.paymentType === 'onetime' ? formData.udf4 : formData.subUdf4 || '',
      udf5: formData.paymentType === 'onetime' ? formData.udf5 : formData.subUdf5 || ''
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
      { name: 'lastname', value: formData.lastname },
      { name: 'email', value: formData.email },
      { name: 'phone', value: formData.phone },
      { name: 'address1', value: formData.address1 },
      { name: 'city', value: formData.city },
      { name: 'state', value: formData.state },
      { name: 'country', value: formData.country },
      { name: 'zipcode', value: formData.zipcode },
      { name: 'surl', value: formData.surl },
      { name: 'furl', value: formData.furl },
      { name: 'hash', value: hash },
      { name: 'buyer_type_business', value: formData.buyerType }
    ]

    if (formData.address2) fields.push({ name: 'address2', value: formData.address2 })
    if (formData.udf1) fields.push({ name: 'udf1', value: formData.paymentType === 'onetime' ? formData.udf1 : formData.subUdf1 })
    if (formData.udf2) fields.push({ name: 'udf2', value: formData.paymentType === 'onetime' ? formData.udf2 : formData.subUdf2 })
    if (formData.udf3) fields.push({ name: 'udf3', value: formData.paymentType === 'onetime' ? formData.udf3 : formData.subUdf3 })
    if (formData.udf4) fields.push({ name: 'udf4', value: formData.paymentType === 'onetime' ? formData.udf4 : formData.subUdf4 })
    if (formData.udf5) fields.push({ name: 'udf5', value: formData.paymentType === 'onetime' ? formData.udf5 : formData.subUdf5 })

    if (formData.paymentType === 'subscription') {
      fields.push({ name: 'si', value: '1' })
      fields.push({ name: 'api_version', value: '7' })
      
      const siDetails = {
        billingCycle: formData.billingCycle,
        billingInterval: formData.billingInterval,
        paymentStartDate: formData.paymentStartDate,
        paymentEndDate: formData.paymentEndDate
      }
      fields.push({ name: 'si_details', value: JSON.stringify(siDetails) })
    }

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

  const showDebugInfo = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return

    // Prepare formData with correct UDF fields based on payment type
    const updatedFormData = {
      ...formData,
      txnid: newTxnId,
      udf1: formData.paymentType === 'onetime' ? formData.udf1 : formData.subUdf1 || '',
      udf2: formData.paymentType === 'onetime' ? formData.udf2 : formData.subUdf2 || '',
      udf3: formData.paymentType === 'onetime' ? formData.udf3 : formData.subUdf3 || '',
      udf4: formData.paymentType === 'onetime' ? formData.udf4 : formData.subUdf4 || '',
      udf5: formData.paymentType === 'onetime' ? formData.udf5 : formData.subUdf5 || '',
      selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key])
    }

    const debugHtml = generateDebugInfo(flow, updatedFormData, formData.paymentType)
    setDebugContent(debugHtml)
    setShowDebug(true)
    setShowCurl(false)

    setTimeout(() => {
      const debugSection = document.getElementById(`${prefix}-debugSection`)
      if (debugSection) {
        debugSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const showCurlCommand = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return

    // Prepare formData with correct UDF fields based on payment type
    const updatedFormData = {
      ...formData,
      txnid: newTxnId,
      udf1: formData.paymentType === 'onetime' ? formData.udf1 : formData.subUdf1 || '',
      udf2: formData.paymentType === 'onetime' ? formData.udf2 : formData.subUdf2 || '',
      udf3: formData.paymentType === 'onetime' ? formData.udf3 : formData.subUdf3 || '',
      udf4: formData.paymentType === 'onetime' ? formData.udf4 : formData.subUdf4 || '',
      udf5: formData.paymentType === 'onetime' ? formData.udf5 : formData.subUdf5 || '',
      selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key])
    }

    const curlCommand = generateCurlCommand(flow, updatedFormData, formData.paymentType)
    setCurlContent(curlCommand)
    setShowCurl(true)
    setShowDebug(false)

    setTimeout(() => {
      const curlSection = document.getElementById(`${prefix}-curlSection`)
      if (curlSection) {
        curlSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const copyCurlToClipboard = () => {
    copyToClipboard(curlContent)
  }

  const showCodeGeneratorModal = () => {
    const newTxnId = generateTransactionId(flow)
    setTxnId(newTxnId)
    if (!validateForm()) return
    setShowCodeModal(true)
  }

  return (
    <>
      <BackButton />
      <div className="main-content">
        <div className="section">
          <h2 className="section-title">Configuration Settings</h2>
          <div className="alert alert-info">
            <strong>Cross-Border Payment Alert:</strong> Ensure your PayU account is enabled for international transactions and comply with RBI guidelines for cross-border payments.
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

          <div className="payment-type-selection">
            <label>Payment Type <span className="required">*</span></label>
            <div className="payment-type-buttons">
              <div className={`payment-type-btn ${formData.paymentType === 'onetime' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, paymentType: 'onetime' }))}>
                <h3>One-Time Payment</h3>
                <p>Single transaction payment</p>
              </div>
              <div className={`payment-type-btn ${formData.paymentType === 'subscription' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, paymentType: 'subscription' }))}>
                <h3>Subscription Payment</h3>
                <p>Recurring payment setup</p>
              </div>
            </div>
          </div>

          {formData.paymentType === 'subscription' && (
            <div className="subscription-section active">
              <h3>Subscription Configuration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Billing Cycle <span className="required">*</span></label>
                  <select name="billingCycle" value={formData.billingCycle} onChange={handleChange}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="ADHOC">Ad-hoc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Billing Interval <span className="required">*</span></label>
                  <input type="number" name="billingInterval" value={formData.billingInterval} onChange={handleChange} min="1" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Start Date <span className="required">*</span></label>
                  <input type="date" name="paymentStartDate" value={formData.paymentStartDate} onChange={handleChange} required />
                  <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Select current or future date only</small>
                </div>
                <div className="form-group">
                  <label>Payment End Date <span className="required">*</span></label>
                  <input type="date" name="paymentEndDate" value={formData.paymentEndDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>SI (Stored Instrument) <span style={{ color: '#48bb78' }}>(Pre-filled)</span></label>
                  <input type="text" value="1" readOnly style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                  <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Mandatory for subscription payments (always 1)</small>
                </div>
                <div className="form-group">
                  <label>API Version <span style={{ color: '#48bb78' }}>(Pre-filled)</span></label>
                  <input type="text" value="7" readOnly style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                  <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.25rem' }}>Mandatory for subscription payments (always 7)</small>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Enforce Payment Methods <span className="optional">(Optional)</span></label>
            <div className="payment-methods">
              <div className="payment-method">
                <input type="checkbox" id="cb_cc" name="paymentMethod_cc" checked={formData.paymentMethods.cc} onChange={handleChange} />
                <label htmlFor="cb_cc">Credit Cards</label>
              </div>
              <div className="payment-method">
                <input type="checkbox" id="cb_dc" name="paymentMethod_dc" checked={formData.paymentMethods.dc} onChange={handleChange} />
                <label htmlFor="cb_dc">Debit Cards</label>
              </div>
              <div className="payment-method">
                <input type="checkbox" id="cb_nb" name="paymentMethod_nb" checked={formData.paymentMethods.nb} onChange={handleChange} />
                <label htmlFor="cb_nb">Net Banking</label>
              </div>
              <div className="payment-method">
                <input type="checkbox" id="cb_upi" name="paymentMethod_upi" checked={formData.paymentMethods.upi} onChange={handleChange} />
                <label htmlFor="cb_upi">UPI</label>
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
              <label>Amount <span className="required">*</span></label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" placeholder="100.00" required />
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
              <label>Last Name <span className="required">*</span></label>
              <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Doe" required />
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
          <h3 style={{ color: 'var(--accent-primary)', margin: '2rem 0 1rem 0' }}>Billing Address</h3>
          <div className="alert alert-info">
            <strong>PACB Requirement:</strong> Billing address is mandatory for cross-border payments.
          </div>
          <div className="form-group">
            <label>Address Line 1 <span className="required">*</span></label>
            <input type="text" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street address" required />
          </div>
          <div className="form-group">
            <label>Address Line 2 <span className="optional">(Optional)</span></label>
            <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, etc." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" required />
            </div>
            <div className="form-group">
              <label>State <span className="required">*</span></label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Country <span className="required">*</span></label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="India" required />
            </div>
            <div className="form-group">
              <label>ZIP Code <span className="required">*</span></label>
              <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="400001" required />
            </div>
          </div>
          <div className="form-group">
            <label>Buyer Type <span className="optional">(Optional)</span></label>
            <select name="buyerType" value={formData.buyerType} onChange={handleChange}>
              <option value="0">Individual</option>
              <option value="1">Business</option>
            </select>
          </div>
        </div>

        {formData.paymentType === 'onetime' ? (
          <div className="section">
            <h2 className="section-title">UDF Parameters (User Defined Fields)</h2>
            <div className="alert alert-info">
              <strong>UDF Information:</strong> These fields provide additional transaction details required for compliance and processing.
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>UDF1 - PAN Number <span className="optional">(Optional)</span></label>
                <input type="text" name="udf1" value={formData.udf1} onChange={handleChange} placeholder="AAAPZ1234C" />
              </div>
              <div className="form-group">
                <label>UDF2 - Additional Info <span className="optional">(Optional)</span></label>
                <input type="text" name="udf2" value={formData.udf2} onChange={handleChange} placeholder="Any additional information" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>UDF3 - Buyer's DOB <span className="optional">(Recommended)</span></label>
                <input type="text" name="udf3" value={formData.udf3} onChange={handleChange} placeholder="YYYY-MM-DD" />
              </div>
              <div className="form-group">
                <label>UDF4 - Seller Name <span className="optional">(Optional)</span></label>
                <input type="text" name="udf4" value={formData.udf4} onChange={handleChange} placeholder="Required for PA2PA PACB" />
              </div>
            </div>
            <div className="form-group">
              <label>UDF5 - Invoice ID <span className="required">*</span></label>
              <input type="text" name="udf5" value={formData.udf5} onChange={handleChange} placeholder="Required for PACB" required />
            </div>
          </div>
        ) : (
          <div className="section">
            <h2 className="section-title">UDF Parameters (Subscription)</h2>
            <div className="alert alert-info">
              <strong>Subscription UDF Requirements:</strong> These fields are specifically required for subscription payments.
              <br /><br />
              <strong>Conditional Validation:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                <li>If <strong>UPI</strong> payment method is enforced: <strong>UDF3 is mandatory</strong></li>
                <li>If <strong>other payment methods</strong> (not UPI) are enforced: <strong>UDF5 is mandatory</strong></li>
              </ul>
            </div>
            <div className="form-group">
              <label>UDF1 - PAN & DOB <span className="optional">(Required if AD bank requests)</span></label>
              <input type="text" name="subUdf1" value={formData.subUdf1} onChange={handleChange} placeholder="AAAPZ1234C||22/08/1972" />
              <small style={{ color: 'var(--text-tertiary)' }}>Format: PAN||DOB (DD/MM/YYYY)</small>
            </div>
            <div className="form-group">
              <label>UDF2 - Additional Info <span className="optional">(Optional)</span></label>
              <input type="text" name="subUdf2" value={formData.subUdf2} onChange={handleChange} placeholder="Any additional information" />
            </div>
            <div className="form-group">
              <label>UDF3 - Invoice ID & Merchant Name <span className="optional">(Required if UPI enforced)</span></label>
              <input type="text" name="subUdf3" value={formData.subUdf3} onChange={handleChange} placeholder="INV-123_1231||MerchantName" />
              <small style={{ color: 'var(--text-tertiary)' }}>Format: InvoiceID||MerchantName (Mandatory when UPI is enforced)</small>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>UDF4 - Additional Field <span className="optional">(Optional)</span></label>
                <input type="text" name="subUdf4" value={formData.subUdf4} onChange={handleChange} placeholder="Additional field" />
              </div>
              <div className="form-group">
                <label>UDF5 - Additional Field <span className="optional">(Required if non-UPI payment enforced)</span></label>
                <input type="text" name="subUdf5" value={formData.subUdf5} onChange={handleChange} placeholder="Additional field" />
              </div>
            </div>
          </div>
        )}

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
          <button type="button" className="button debug-button" onClick={showDebugInfo}>Show Debug Info</button>
          <button type="button" className="button debug-button" onClick={showCurlCommand}>Generate CURL</button>
          <button type="button" className="button code-gen-button" onClick={showCodeGeneratorModal}>
            <span style={{ marginRight: '5px' }}>&#128187;</span> Generate Code
          </button>
          <button type="button" className="button" onClick={handleSubmit}>Pay Now</button>
        </div>
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
          <button className="copy-button" onClick={copyCurlToClipboard}>Copy to Clipboard</button>
          <div className="curl-content" id={`${prefix}-curlContent`}>{curlContent}</div>
        </div>
      )}

      <CodeGeneratorModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        flow={flow}
        paymentType={formData.paymentType}
        formData={{
          ...formData,
          txnid: txnId,
          udf1: formData.paymentType === 'onetime' ? formData.udf1 : formData.subUdf1 || '',
          udf2: formData.paymentType === 'onetime' ? formData.udf2 : formData.subUdf2 || '',
          udf3: formData.paymentType === 'onetime' ? formData.udf3 : formData.subUdf3 || '',
          udf4: formData.paymentType === 'onetime' ? formData.udf4 : formData.subUdf4 || '',
          udf5: formData.paymentType === 'onetime' ? formData.udf5 : formData.subUdf5 || '',
          selectedPaymethods: Object.keys(formData.paymentMethods).filter(key => formData.paymentMethods[key])
        }}
      />
    </>
  )
}

export default CrossBorder


import { generateHashData, getFlowPrefix } from './helpers'
import { PAYU_URL } from './constants'

// Get field type (mandatory/optional) for display
export const getFieldType = (fieldName, flow, paymentType = 'onetime') => {
  const mandatoryFields = ['key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone', 'surl', 'furl', 'hash']
  const optionalFields = ['lastname', 'address1', 'address2', 'city', 'state', 'country', 'zipcode', 'udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'buyer_type_business', 'offer_key']
  
  if (mandatoryFields.includes(fieldName)) return 'mandatory'
  if (optionalFields.includes(fieldName)) return 'optional'
  
  // Flow-specific mandatory fields
  if (flow === 'crossborder') {
    if (['lastname', 'address1', 'city', 'state', 'country', 'zipcode'].includes(fieldName)) {
      return 'mandatory'
    }
    if (fieldName === 'udf5' && paymentType === 'onetime') {
      return 'mandatory'
    }
    if (paymentType === 'subscription') {
      if (['si', 'api_version', 'si_details'].includes(fieldName)) return 'mandatory'
    }
  }
  
  if (flow === 'subscription') {
    if (['si', 'api_version', 'si_details'].includes(fieldName)) return 'mandatory'
  }
  
  if (flow === 'tpv') {
    if (['api_version', 'beneficiarydetail'].includes(fieldName)) return 'mandatory'
  }
  
  if (flow === 'upiotm') {
    if (['api_version', 'si_details', 'pre_authorize'].includes(fieldName)) return 'mandatory'
  }
  
  if (flow === 'preauth') {
    if (['pre_authorize'].includes(fieldName)) return 'mandatory'
    if (fieldName === 'enforce_paymethod') return 'mandatory'
  }
  
  if (flow === 'split') {
    if (['splitRequest'].includes(fieldName)) return 'mandatory'
  }
  
  if (flow === 'bankoffer') {
    if (['api_version', 'cart_details'].includes(fieldName)) return 'mandatory'
  }
  
  return 'optional'
}

// Generate debug info HTML
export const generateDebugInfo = (flow, formData, paymentType = 'onetime') => {
  const prefix = getFlowPrefix(flow)
  const hashData = generateHashData(flow, formData, paymentType)
  
  const addFieldLabel = (fieldName) => {
    const fieldType = getFieldType(fieldName, flow, paymentType)
    return fieldType ? ` <span style="color: ${fieldType === 'mandatory' ? '#d32f2f' : '#1976d2'}; font-size: 0.85em;">(${fieldType})</span>` : ''
  }
  
  let debugHtml = '<table class="debug-table">'
  debugHtml += '<tr><th>Parameter</th><th>Value</th></tr>'
  debugHtml += `<tr><td>Flow</td><td>${flow.toUpperCase()}</td></tr>`
  
  if (flow === 'crossborder') {
    debugHtml += `<tr><td>Payment Type</td><td>${paymentType}</td></tr>`
  }
  
  debugHtml += `<tr><td>Endpoint</td><td>${PAYU_URL}</td></tr>`
  debugHtml += '<tr style="background: #e6f7ff;"><td colspan="2"><strong>REQUEST BODY PARAMETERS</strong></td></tr>'
  
  debugHtml += `<tr><td>key${addFieldLabel('key')}</td><td>${hashData.credentials.key}</td></tr>`
  debugHtml += `<tr><td>txnid${addFieldLabel('txnid')}</td><td>${formData.txnid || ''}</td></tr>`
  debugHtml += `<tr><td>amount${addFieldLabel('amount')}</td><td>${formData.amount || ''}</td></tr>`
  debugHtml += `<tr><td>productinfo${addFieldLabel('productinfo')}</td><td>${formData.productinfo || ''}</td></tr>`
  debugHtml += `<tr><td>firstname${addFieldLabel('firstname')}</td><td>${formData.firstname || ''}</td></tr>`
  
  if (formData.lastname) {
    debugHtml += `<tr><td>lastname${addFieldLabel('lastname')}</td><td>${formData.lastname}</td></tr>`
  }
  
  debugHtml += `<tr><td>email${addFieldLabel('email')}</td><td>${formData.email || ''}</td></tr>`
  debugHtml += `<tr><td>phone${addFieldLabel('phone')}</td><td>${formData.phone || ''}</td></tr>`
  
  const addressFields = ['address1', 'address2', 'city', 'state', 'country', 'zipcode']
  addressFields.forEach(fieldName => {
    if (formData[fieldName]) {
      debugHtml += `<tr><td>${fieldName}${addFieldLabel(fieldName)}</td><td>${formData[fieldName]}</td></tr>`
    }
  })
  
  if (hashData.udf1) debugHtml += `<tr><td>udf1${addFieldLabel('udf1')}</td><td>${hashData.udf1}</td></tr>`
  if (hashData.udf2) debugHtml += `<tr><td>udf2${addFieldLabel('udf2')}</td><td>${hashData.udf2}</td></tr>`
  if (hashData.udf3) debugHtml += `<tr><td>udf3${addFieldLabel('udf3')}</td><td>${hashData.udf3}</td></tr>`
  if (hashData.udf4) debugHtml += `<tr><td>udf4${addFieldLabel('udf4')}</td><td>${hashData.udf4}</td></tr>`
  if (hashData.udf5) debugHtml += `<tr><td>udf5${addFieldLabel('udf5')}</td><td>${hashData.udf5}</td></tr>`
  
  // Flow-specific fields
  if (flow === 'crossborder' && paymentType === 'subscription') {
    debugHtml += `<tr><td>si${addFieldLabel('si')}</td><td>1</td></tr>`
    debugHtml += `<tr><td>api_version${addFieldLabel('api_version')}</td><td>7</td></tr>`
    debugHtml += `<tr><td>si_details${addFieldLabel('si_details')}</td><td>${hashData.siDetails || ''}</td></tr>`
    if (formData.buyerType) {
      debugHtml += `<tr><td>buyer_type_business${addFieldLabel('buyer_type_business')}</td><td>${formData.buyerType}</td></tr>`
    }
  } else if (flow === 'crossborder' && paymentType === 'onetime') {
    if (formData.buyerType) {
      debugHtml += `<tr><td>buyer_type_business${addFieldLabel('buyer_type_business')}</td><td>${formData.buyerType}</td></tr>`
    }
  } else if (flow === 'subscription') {
    debugHtml += `<tr><td>si${addFieldLabel('si')}</td><td>1</td></tr>`
    debugHtml += `<tr><td>api_version${addFieldLabel('api_version')}</td><td>7</td></tr>`
    debugHtml += `<tr><td>si_details${addFieldLabel('si_details')}</td><td>${hashData.siDetails || ''}</td></tr>`
  } else if (flow === 'tpv') {
    debugHtml += `<tr><td>api_version${addFieldLabel('api_version')}</td><td>6</td></tr>`
    const beneficiaryDetail = {
      beneficiaryAccountNumber: formData.beneficiaryAccount || '',
      ifscCode: formData.ifscCode || ''
    }
    debugHtml += `<tr><td>beneficiarydetail${addFieldLabel('beneficiarydetail')}</td><td>${JSON.stringify(beneficiaryDetail)}</td></tr>`
  } else if (flow === 'upiotm') {
    debugHtml += `<tr><td>api_version${addFieldLabel('api_version')}</td><td>7</td></tr>`
    debugHtml += `<tr><td>si_details${addFieldLabel('si_details')}</td><td>${hashData.siDetails || ''}</td></tr>`
    debugHtml += `<tr><td>pre_authorize${addFieldLabel('pre_authorize')}</td><td>1</td></tr>`
  } else if (flow === 'preauth') {
    debugHtml += `<tr><td>pre_authorize${addFieldLabel('pre_authorize')}</td><td>1</td></tr>`
  } else if (flow === 'split') {
    if (hashData.splitRequest) {
      debugHtml += `<tr><td>splitRequest${addFieldLabel('splitRequest')}</td><td><pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(JSON.parse(hashData.splitRequest), null, 2)}</pre></td></tr>`
    }
  } else if (flow === 'bankoffer') {
    if (formData.cartDetails) {
      debugHtml += `<tr><td>api_version${addFieldLabel('api_version')}</td><td>19</td></tr>`
      debugHtml += `<tr><td>cart_details${addFieldLabel('cart_details')}</td><td><pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(JSON.parse(formData.cartDetails), null, 2)}</pre></td></tr>`
    }
    if (formData.offerKey) {
      debugHtml += `<tr><td>offer_key${addFieldLabel('offer_key')}</td><td>${formData.offerKey}</td></tr>`
    }
  }
  
  debugHtml += `<tr><td>surl${addFieldLabel('surl')}</td><td>${formData.surl || ''}</td></tr>`
  debugHtml += `<tr><td>furl${addFieldLabel('furl')}</td><td>${formData.furl || ''}</td></tr>`
  
  // Add enforce_paymethod if payment methods are selected
  if (formData.selectedPaymethods && formData.selectedPaymethods.length > 0) {
    const paymethodMap = {
      'nb': paymentType === 'subscription' || (flow === 'crossborder' && paymentType === 'subscription') ? 'enach' : 'netbanking',
      'cc': 'creditcard',
      'dc': 'debitcard',
      'upi': 'upi'
    }
    const selectedPaymethods = formData.selectedPaymethods.map(pm => paymethodMap[pm] || pm.toLowerCase()).join('|')
    debugHtml += `<tr><td>enforce_paymethod${addFieldLabel('enforce_paymethod')}</td><td>${selectedPaymethods}</td></tr>`
  }
  
  debugHtml += `<tr><td>hash${addFieldLabel('hash')}</td><td>${hashData.hash ? hashData.hash.substring(0, 20) + '... (truncated)' : ''}</td></tr>`
  
  const saltDisplay = '***' + hashData.credentials.salt.slice(-4)
  debugHtml += '<tr style="background: #f0f0f0;"><td colspan="2"><strong>HASH CALCULATION INFO</strong></td></tr>'
  debugHtml += `<tr><td>Salt (masked)</td><td>${saltDisplay}</td></tr>`
  debugHtml += '</table>'
  
  // Show hash formula
  debugHtml += '<h4>Hash Formula:</h4>'
  debugHtml += `<div class="hash-string-display" style="background: #fff3cd; border-color: #ffc107; color: #856404; font-weight: 600;">${hashData.hashFormula}</div>`
  
  debugHtml += '<h4>Hash String:</h4>'
  debugHtml += `<div class="hash-string-display">${hashData.hashString.replace(hashData.credentials.salt, saltDisplay)}</div>`
  
  debugHtml += '<h4>Generated Hash:</h4>'
  debugHtml += `<div class="hash-output">${hashData.hash}</div>`
  debugHtml += `<div class="hash-output">Hash Length: ${hashData.hash.length} characters</div>`
  
  return debugHtml
}

// Generate CURL command
export const generateCurlCommand = (flow, formData, paymentType = 'onetime') => {
  const prefix = getFlowPrefix(flow)
  const hashData = generateHashData(flow, formData, paymentType)
  
  let curlCommand = `curl -X POST "${PAYU_URL}" \\\n`
  curlCommand += '  -H "Content-Type: application/x-www-form-urlencoded" \\\n'
  
  curlCommand += `  -d "key=${hashData.credentials.key}" \\\n`
  curlCommand += `  -d "txnid=${formData.txnid || ''}" \\\n`
  curlCommand += `  -d "amount=${formData.amount || ''}" \\\n`
  curlCommand += `  -d "productinfo=${formData.productinfo || ''}" \\\n`
  curlCommand += `  -d "firstname=${formData.firstname || ''}" \\\n`
  
  if (formData.lastname) {
    curlCommand += `  -d "lastname=${formData.lastname}" \\\n`
  }
  
  curlCommand += `  -d "email=${formData.email || ''}" \\\n`
  curlCommand += `  -d "phone=${formData.phone || ''}" \\\n`
  
  const addressFields = ['address1', 'address2', 'city', 'state', 'country', 'zipcode']
  addressFields.forEach(fieldName => {
    if (formData[fieldName]) {
      curlCommand += `  -d "${fieldName}=${formData[fieldName]}" \\\n`
    }
  })
  
  if (hashData.udf1) curlCommand += `  -d "udf1=${hashData.udf1}" \\\n`
  if (hashData.udf2) curlCommand += `  -d "udf2=${hashData.udf2}" \\\n`
  if (hashData.udf3) curlCommand += `  -d "udf3=${hashData.udf3}" \\\n`
  if (hashData.udf4) curlCommand += `  -d "udf4=${hashData.udf4}" \\\n`
  if (hashData.udf5) curlCommand += `  -d "udf5=${hashData.udf5}" \\\n`
  
  // Flow-specific fields
  if (flow === 'crossborder' && paymentType === 'subscription') {
    curlCommand += '  -d "si=1" \\\n'
    curlCommand += '  -d "api_version=7" \\\n'
    curlCommand += `  -d 'si_details=${hashData.siDetails || ''}' \\\n`
    if (formData.buyerType) {
      curlCommand += `  -d "buyer_type_business=${formData.buyerType}" \\\n`
    }
  } else if (flow === 'crossborder' && paymentType === 'onetime') {
    if (formData.buyerType) {
      curlCommand += `  -d "buyer_type_business=${formData.buyerType}" \\\n`
    }
  } else if (flow === 'subscription') {
    curlCommand += '  -d "si=1" \\\n'
    curlCommand += '  -d "api_version=7" \\\n'
    curlCommand += `  -d 'si_details=${hashData.siDetails || ''}' \\\n`
  } else if (flow === 'tpv') {
    curlCommand += '  -d "api_version=6" \\\n'
    const beneficiaryDetail = {
      beneficiaryAccountNumber: formData.beneficiaryAccount || '',
      ifscCode: formData.ifscCode || ''
    }
    curlCommand += `  -d 'beneficiarydetail=${JSON.stringify(beneficiaryDetail)}' \\\n`
  } else if (flow === 'upiotm') {
    curlCommand += '  -d "api_version=7" \\\n'
    curlCommand += `  -d 'si_details=${hashData.siDetails || ''}' \\\n`
    curlCommand += '  -d "pre_authorize=1" \\\n'
  } else if (flow === 'preauth') {
    curlCommand += '  -d "pre_authorize=1" \\\n'
  } else if (flow === 'split') {
    if (hashData.splitRequest) {
      curlCommand += `  --data-urlencode 'splitRequest=${hashData.splitRequest}' \\\n`
    }
  } else if (flow === 'bankoffer') {
    if (formData.cartDetails) {
      curlCommand += '  -d "api_version=19" \\\n'
      curlCommand += `  --data-urlencode 'cart_details=${formData.cartDetails}' \\\n`
    }
    if (formData.offerKey) {
      curlCommand += `  -d "offer_key=${formData.offerKey}" \\\n`
    }
  }
  
  curlCommand += `  -d "surl=${formData.surl || ''}" \\\n`
  curlCommand += `  -d "furl=${formData.furl || ''}" \\\n`
  
  // Add enforce paymethod
  if (formData.selectedPaymethods && formData.selectedPaymethods.length > 0) {
    const paymethodMap = {
      'nb': paymentType === 'subscription' || (flow === 'crossborder' && paymentType === 'subscription') ? 'enach' : 'netbanking',
      'cc': 'creditcard',
      'dc': 'debitcard',
      'upi': 'upi'
    }
    const selectedPaymethods = formData.selectedPaymethods.map(pm => paymethodMap[pm] || pm.toLowerCase()).join('|')
    curlCommand += `  -d "enforce_paymethod=${selectedPaymethods}" \\\n`
  }
  
  curlCommand += `  -d "hash=${hashData.hash}"`
  
  return curlCommand
}

// Copy to clipboard helper
export const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy:', err)
      alert('Failed to copy. Please copy manually.')
    })
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy. Please copy manually.')
    }
    document.body.removeChild(textArea)
  }
}


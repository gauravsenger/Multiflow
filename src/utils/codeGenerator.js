import { generateHashData, getFlowPrefix } from './helpers'
import { DEFAULT_KEY, DEFAULT_SALT, PAYU_URL } from './constants'

// Extract flow parameters for code generation
export const extractFlowParameters = (flow, formData, paymentType = 'onetime') => {
  const params = {
    txnid: formData.txnid || '',
    amount: formData.amount || '',
    productinfo: formData.productinfo || '',
    firstname: formData.firstname || '',
    email: formData.email || '',
    phone: formData.phone || '',
    surl: formData.surl || 'https://test.payu.in/admin/test_response',
    furl: formData.furl || 'https://test.payu.in/admin/test_response'
  }

  // Optional common fields
  if (formData.lastname) params.lastname = formData.lastname
  if (formData.address1) params.address1 = formData.address1
  if (formData.address2) params.address2 = formData.address2
  if (formData.city) params.city = formData.city
  if (formData.state) params.state = formData.state
  if (formData.country) params.country = formData.country
  if (formData.zipcode) params.zipcode = formData.zipcode

  // UDF fields
  for (let i = 1; i <= 5; i++) {
    if (formData[`udf${i}`]) {
      params[`udf${i}`] = formData[`udf${i}`]
    }
  }

  // Flow-specific parameters
  const flowSpecific = {}

  // Subscription flows
  if (flow === 'subscription' || (flow === 'crossborder' && paymentType === 'subscription')) {
    flowSpecific.hasSubscription = true
    flowSpecific.billingCycle = formData.billingCycle || 'MONTHLY'
    flowSpecific.billingInterval = formData.billingInterval || '1'
    flowSpecific.paymentStartDate = formData.paymentStartDate || ''
    flowSpecific.paymentEndDate = formData.paymentEndDate || ''
    
    // Generate si_details
    const siDetails = {
      billingAmount: params.amount,
      billingCurrency: 'INR',
      billingCycle: flowSpecific.billingCycle,
      billingInterval: parseInt(flowSpecific.billingInterval),
      paymentStartDate: flowSpecific.paymentStartDate
    }
    if (flowSpecific.paymentEndDate) {
      siDetails.paymentEndDate = flowSpecific.paymentEndDate
    }
    params.si_details = JSON.stringify(siDetails)
    params.si = '1'
    params.api_version = '7'
  }

  // TPV flow
  if (flow === 'tpv') {
    flowSpecific.hasBeneficiary = true
    flowSpecific.beneficiaryAccount = formData.beneficiaryAccount || ''
    flowSpecific.ifscCode = formData.ifscCode || ''
    
    const beneficiaryDetail = {
      beneficiaryAccountNumber: flowSpecific.beneficiaryAccount,
      ifscCode: flowSpecific.ifscCode
    }
    params.beneficiarydetail = JSON.stringify(beneficiaryDetail)
    params.api_version = '6'
  }

  // UPI OTM flow
  if (flow === 'upiotm') {
    flowSpecific.hasUPIOTM = true
    flowSpecific.paymentStartDate = formData.paymentStartDate || ''
    flowSpecific.paymentEndDate = formData.paymentEndDate || ''
    
    const siDetails = {
      paymentStartDate: flowSpecific.paymentStartDate,
      paymentEndDate: flowSpecific.paymentEndDate
    }
    params.si_details = JSON.stringify(siDetails)
    params.api_version = '7'
    params.pre_authorize = '1'
  }

  // PreAuth flow
  if (flow === 'preauth') {
    flowSpecific.isPreauth = true
    params.pre_authorize = '1'
    if (formData.selectedPaymethods && formData.selectedPaymethods.length > 0) {
      const paymethodMap = {
        'cc': 'creditcard',
        'dc': 'debitcard',
        'nb': 'netbanking',
        'upi': 'upi'
      }
      params.enforce_paymethod = formData.selectedPaymethods.map(pm => paymethodMap[pm] || pm).join('|')
    }
  }

  // Split Payment flow
  if (flow === 'split') {
    flowSpecific.hasSplit = true
    flowSpecific.splitType = formData.splitType || 'absolute'
    flowSpecific.splitRequest = formData.splitRequest || ''
    if (formData.splitRequest) {
      params.splitRequest = formData.splitRequest
    }
  }

  // Bank Offer flow
  if (flow === 'bankoffer') {
    flowSpecific.hasBankOffer = true
    if (formData.offerKey) {
      params.offer_key = formData.offerKey
    }
    if (formData.cartDetails) {
      flowSpecific.hasCartDetails = true
      params.cart_details = formData.cartDetails
      params.api_version = '19'
    }
  }

  // Cross Border flow
  if (flow === 'crossborder') {
    if (formData.buyerType) {
      params.buyer_type_business = formData.buyerType
    }
  }

  // Add enforce_paymethod if payment methods are selected
  if (formData.selectedPaymethods && formData.selectedPaymethods.length > 0 && flow !== 'preauth') {
    const paymethodMap = {
      'nb': paymentType === 'subscription' || (flow === 'crossborder' && paymentType === 'subscription') ? 'enach' : 'netbanking',
      'cc': 'creditcard',
      'dc': 'debitcard',
      'upi': 'upi'
    }
    params.enforce_paymethod = formData.selectedPaymethods.map(pm => paymethodMap[pm] || pm.toLowerCase()).join('|')
  }

  params._flowSpecific = flowSpecific
  return params
}

// Generate code for different languages
export const generateCode = (flow, formData, paymentType = 'onetime', language = 'java') => {
  const params = extractFlowParameters(flow, formData, paymentType)
  const flowSpec = params._flowSpecific || {}
  const hashData = generateHashData(flow, formData, paymentType)

  switch (language) {
    case 'java':
      return generateJavaCode(flow, params, flowSpec, hashData)
    case 'php':
      return generatePHPCode(flow, params, flowSpec, hashData)
    case 'python':
      return generatePythonCode(flow, params, flowSpec, hashData)
    case 'nodejs':
      return generateNodeJSCode(flow, params, flowSpec, hashData)
    default:
      return generateJavaCode(flow, params, flowSpec, hashData)
  }
}

// Generate Java code
const generateJavaCode = (flow, params, flowSpec, hashData) => {
  const jsonFieldsToSkip = ['si_details', 'beneficiarydetail', 'cart_details', 'splitRequest']
  const paramsStr = Object.entries(params)
    .filter(([key]) => !key.startsWith('_') && key !== 'txnid' && !jsonFieldsToSkip.includes(key))
    .map(([key, value]) => {
      const escapedValue = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
      return `        params.put("${key}", "${escapedValue}");`
    })
    .join('\n')
  
  // Add key parameter
  const keyParam = `        params.put("key", MERCHANT_KEY);`
  const txnidParam = `        params.put("txnid", txnid);`

  let jsonCode = ''
  if (flowSpec.hasSubscription) {
    jsonCode = `
        // Generate SI Details JSON
        String siDetails = "{\\"billingAmount\\":\\"" + params.get("amount") + "\\",\\"billingCurrency\\":\\"INR\\",\\"billingCycle\\":\\"${flowSpec.billingCycle}\\",\\"billingInterval\\":${flowSpec.billingInterval},\\"paymentStartDate\\":\\"${flowSpec.paymentStartDate}\\"";
        if ("${flowSpec.paymentEndDate}" != null && !"${flowSpec.paymentEndDate}".isEmpty()) {
            siDetails += ",\\"paymentEndDate\\":\\"${flowSpec.paymentEndDate}\\"";
        }
        siDetails += "}";
        params.put("si_details", siDetails);
        params.put("si", "1");
        params.put("api_version", "7");`
  } else if (flowSpec.hasBeneficiary) {
    jsonCode = `
        // Generate Beneficiary Detail JSON
        String beneficiaryDetail = "{\\"beneficiaryAccountNumber\\":\\"${flowSpec.beneficiaryAccount}\\",\\"ifscCode\\":\\"${flowSpec.ifscCode}\\"}";
        params.put("beneficiarydetail", beneficiaryDetail);
        params.put("api_version", "6");`
  } else if (flowSpec.hasUPIOTM) {
    jsonCode = `
        // Generate SI Details JSON for UPI OTM
        String siDetails = "{\\"paymentStartDate\\":\\"${flowSpec.paymentStartDate}\\",\\"paymentEndDate\\":\\"${flowSpec.paymentEndDate}\\"}";
        params.put("si_details", siDetails);
        params.put("api_version", "7");
        params.put("pre_authorize", "1");`
  } else if (flowSpec.hasSplit && params.splitRequest) {
    jsonCode = `
        // Split Payment - Add splitRequest JSON
        params.put("splitRequest", "${params.splitRequest.replace(/"/g, '\\"')}");`
  } else if (flowSpec.hasCartDetails && params.cart_details) {
    jsonCode = `
        // Bank Offer with SKU - Add cart_details JSON
        params.put("cart_details", "${params.cart_details.replace(/"/g, '\\"')}");
        params.put("api_version", "19");`
  }

  const hashString = hashData.hashString
    .replace(hashData.credentials.salt, 'YOUR_MERCHANT_SALT')
    .replace(hashData.credentials.key, 'YOUR_MERCHANT_KEY')

  return `import java.util.HashMap;
import java.util.Map;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class PayUIntegration {
    private static final String MERCHANT_KEY = "YOUR_MERCHANT_KEY";
    private static final String MERCHANT_SALT = "YOUR_MERCHANT_SALT";
    private static final String PAYU_URL = "${PAYU_URL}";

    public static void main(String[] args) {
        // Generate unique transaction ID
        String txnid = "txn_" + System.currentTimeMillis();
        
        // Payment parameters
        Map<String, String> params = new HashMap<>();
${keyParam}
${txnidParam}
${paramsStr}${jsonCode}
        
        // Generate hash
        String hash = generateHash(params);
        params.put("hash", hash);
        
        // Submit payment (redirect to PayU)
        // In a web application, you would create a form and submit it
        System.out.println("Payment parameters: " + params);
    }
    
    public static String generateHash(Map<String, String> params) {
        // Build hash string: ${hashString}
        String hashString = MERCHANT_KEY + "|" + params.get("txnid") + "|" + params.get("amount") + 
                           "|" + params.get("productinfo") + "|" + params.get("firstname") + 
                           "|" + params.get("email") + "|" + (params.get("udf1") != null ? params.get("udf1") : "") + 
                           "|" + (params.get("udf2") != null ? params.get("udf2") : "") + 
                           "|" + (params.get("udf3") != null ? params.get("udf3") : "") + 
                           "|" + (params.get("udf4") != null ? params.get("udf4") : "") + 
                           "|" + (params.get("udf5") != null ? params.get("udf5") : "") + 
                           "||||||" + MERCHANT_SALT;
        
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] hashBytes = md.digest(hashString.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating hash", e);
        }
    }
}`
}

// Generate PHP code
const generatePHPCode = (flow, params, flowSpec, hashData) => {
  const jsonFieldsToSkip = ['si_details', 'beneficiarydetail', 'cart_details', 'splitRequest']
  const paramsArray = Object.entries(params)
    .filter(([key]) => !key.startsWith('_') && key !== 'txnid' && key !== 'key' && !jsonFieldsToSkip.includes(key))
    .map(([key, value]) => {
      const escapedValue = addslashes(String(value))
      return `    '${key}' => '${escapedValue}',`
    })
    .join('\n')

  let jsonCode = ''
  if (flowSpec.hasSubscription) {
    jsonCode = `
    // Generate SI Details JSON
    $siDetails = json_encode([
        'billingAmount' => $params['amount'],
        'billingCurrency' => 'INR',
        'billingCycle' => '${flowSpec.billingCycle}',
        'billingInterval' => ${flowSpec.billingInterval},
        'paymentStartDate' => '${flowSpec.paymentStartDate}'${flowSpec.paymentEndDate ? `,\n        'paymentEndDate' => '${flowSpec.paymentEndDate}'` : ''}
    ]);
    $params['si_details'] = $siDetails;
    $params['si'] = '1';
    $params['api_version'] = '7';`
  } else if (flowSpec.hasBeneficiary) {
    jsonCode = `
    // Generate Beneficiary Detail JSON
    $beneficiaryDetail = json_encode([
        'beneficiaryAccountNumber' => '${flowSpec.beneficiaryAccount}',
        'ifscCode' => '${flowSpec.ifscCode}'
    ]);
    $params['beneficiarydetail'] = $beneficiaryDetail;
    $params['api_version'] = '6';`
  } else if (flowSpec.hasUPIOTM) {
    jsonCode = `
    // Generate SI Details JSON for UPI OTM
    $siDetails = json_encode([
        'paymentStartDate' => '${flowSpec.paymentStartDate}',
        'paymentEndDate' => '${flowSpec.paymentEndDate}'
    ]);
    $params['si_details'] = $siDetails;
    $params['api_version'] = '7';
    $params['pre_authorize'] = '1';`
  }

  const hashString = hashData.hashString
    .replace(hashData.credentials.salt, 'YOUR_MERCHANT_SALT')
    .replace(hashData.credentials.key, 'YOUR_MERCHANT_KEY')

  return `<?php
define('MERCHANT_KEY', 'YOUR_MERCHANT_KEY');
define('MERCHANT_SALT', 'YOUR_MERCHANT_SALT');
define('PAYU_URL', '${PAYU_URL}');

function generateTransactionId() {
    return 'txn_' . time();
}

function generateHash($params) {
    // Build hash string: ${hashString}
    $hashString = MERCHANT_KEY . '|' . $params['txnid'] . '|' . $params['amount'] . 
                  '|' . $params['productinfo'] . '|' . $params['firstname'] . 
                  '|' . $params['email'] . '|' . ($params['udf1'] ?? '') . 
                  '|' . ($params['udf2'] ?? '') . 
                  '|' . ($params['udf3'] ?? '') . 
                  '|' . ($params['udf4'] ?? '') . 
                  '|' . ($params['udf5'] ?? '') . 
                  '||||||' . MERCHANT_SALT;
    
    return hash('sha512', $hashString);
}

// Generate unique transaction ID
$txnid = generateTransactionId();

// Payment parameters
$params = [
    'key' => MERCHANT_KEY,
    'txnid' => $txnid,
${paramsArray}${jsonCode}
];

// Generate hash
$params['hash'] = generateHash($params);

// Submit payment (redirect to PayU)
// In a web application, you would create a form and submit it
echo "Payment parameters: ";
print_r($params);
?>`
}

// Generate Python code
const generatePythonCode = (flow, params, flowSpec, hashData) => {
  const jsonFieldsToSkip = ['si_details', 'beneficiarydetail', 'cart_details', 'splitRequest']
  const paramsDict = Object.entries(params)
    .filter(([key]) => !key.startsWith('_') && key !== 'txnid' && key !== 'key' && !jsonFieldsToSkip.includes(key))
    .map(([key, value]) => {
      const escapedValue = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `    '${key}': '${escapedValue}',`
    })
    .join('\n')

  let jsonCode = ''
  if (flowSpec.hasSubscription) {
    jsonCode = `
    # Generate SI Details JSON
    import json
    si_details = {
        'billingAmount': params['amount'],
        'billingCurrency': 'INR',
        'billingCycle': '${flowSpec.billingCycle}',
        'billingInterval': ${flowSpec.billingInterval},
        'paymentStartDate': '${flowSpec.paymentStartDate}'${flowSpec.paymentEndDate ? `,\n        'paymentEndDate': '${flowSpec.paymentEndDate}'` : ''}
    }
    params['si_details'] = json.dumps(si_details)
    params['si'] = '1'
    params['api_version'] = '7'`
  } else if (flowSpec.hasBeneficiary) {
    jsonCode = `
    # Generate Beneficiary Detail JSON
    import json
    beneficiary_detail = {
        'beneficiaryAccountNumber': '${flowSpec.beneficiaryAccount}',
        'ifscCode': '${flowSpec.ifscCode}'
    }
    params['beneficiarydetail'] = json.dumps(beneficiary_detail)
    params['api_version'] = '6'`
  } else if (flowSpec.hasUPIOTM) {
    jsonCode = `
    # Generate SI Details JSON for UPI OTM
    import json
    si_details = {
        'paymentStartDate': '${flowSpec.paymentStartDate}',
        'paymentEndDate': '${flowSpec.paymentEndDate}'
    }
    params['si_details'] = json.dumps(si_details)
    params['api_version'] = '7'
    params['pre_authorize'] = '1'`
  }

  const hashString = hashData.hashString
    .replace(hashData.credentials.salt, 'YOUR_MERCHANT_SALT')
    .replace(hashData.credentials.key, 'YOUR_MERCHANT_KEY')

  return `import hashlib
import time
import json

MERCHANT_KEY = 'YOUR_MERCHANT_KEY'
MERCHANT_SALT = 'YOUR_MERCHANT_SALT'
PAYU_URL = '${PAYU_URL}'

def generate_transaction_id():
    return f'txn_{int(time.time())}'

def generate_hash(params):
    # Build hash string: ${hashString}
    hash_string = f"{MERCHANT_KEY}|{params['txnid']}|{params['amount']}|{params['productinfo']}|{params['firstname']}|{params['email']}|{params.get('udf1', '')}|{params.get('udf2', '')}|{params.get('udf3', '')}|{params.get('udf4', '')}|{params.get('udf5', '')}||||||{MERCHANT_SALT}"
    return hashlib.sha512(hash_string.encode()).hexdigest()

# Generate unique transaction ID
txnid = generate_transaction_id()

# Payment parameters
params = {
    'key': MERCHANT_KEY,
    'txnid': txnid,
${paramsDict}${jsonCode}
}

# Generate hash
params['hash'] = generate_hash(params)

# Submit payment (redirect to PayU)
# In a web application, you would create a form and submit it
print("Payment parameters:", params)`
}

// Generate Node.js code
const generateNodeJSCode = (flow, params, flowSpec, hashData) => {
  const jsonFieldsToSkip = ['si_details', 'beneficiarydetail', 'cart_details', 'splitRequest']
  const paramsObj = Object.entries(params)
    .filter(([key]) => !key.startsWith('_') && key !== 'txnid' && key !== 'key' && !jsonFieldsToSkip.includes(key))
    .map(([key, value]) => {
      const escapedValue = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
      return `    ${key}: '${escapedValue}',`
    })
    .join('\n')

  let jsonCode = ''
  if (flowSpec.hasSubscription) {
    jsonCode = `
    // Generate SI Details JSON
    const siDetails = {
        billingAmount: params.amount,
        billingCurrency: 'INR',
        billingCycle: '${flowSpec.billingCycle}',
        billingInterval: ${flowSpec.billingInterval},
        paymentStartDate: '${flowSpec.paymentStartDate}'${flowSpec.paymentEndDate ? `,\n        paymentEndDate: '${flowSpec.paymentEndDate}'` : ''}
    };
    params.si_details = JSON.stringify(siDetails);
    params.si = '1';
    params.api_version = '7';`
  } else if (flowSpec.hasBeneficiary) {
    jsonCode = `
    // Generate Beneficiary Detail JSON
    const beneficiaryDetail = {
        beneficiaryAccountNumber: '${flowSpec.beneficiaryAccount}',
        ifscCode: '${flowSpec.ifscCode}'
    };
    params.beneficiarydetail = JSON.stringify(beneficiaryDetail);
    params.api_version = '6';`
  } else if (flowSpec.hasUPIOTM) {
    jsonCode = `
    // Generate SI Details JSON for UPI OTM
    const siDetails = {
        paymentStartDate: '${flowSpec.paymentStartDate}',
        paymentEndDate: '${flowSpec.paymentEndDate}'
    };
    params.si_details = JSON.stringify(siDetails);
    params.api_version = '7';
    params.pre_authorize = '1';`
  }

  const hashString = hashData.hashString
    .replace(hashData.credentials.salt, 'YOUR_MERCHANT_SALT')
    .replace(hashData.credentials.key, 'YOUR_MERCHANT_KEY')

  return `const crypto = require('crypto');

const MERCHANT_KEY = 'YOUR_MERCHANT_KEY';
const MERCHANT_SALT = 'YOUR_MERCHANT_SALT';
const PAYU_URL = '${PAYU_URL}';

function generateTransactionId() {
    return 'txn_' + Date.now();
}

function generateHash(params) {
    // Build hash string: ${hashString}
    const hashString = MERCHANT_KEY + '|' + params.txnid + '|' + params.amount + 
                      '|' + params.productinfo + '|' + params.firstname + 
                      '|' + params.email + '|' + (params.udf1 || '') + 
                      '|' + (params.udf2 || '') + 
                      '|' + (params.udf3 || '') + 
                      '|' + (params.udf4 || '') + 
                      '|' + (params.udf5 || '') + 
                      '||||||' + MERCHANT_SALT;
    
    return crypto.createHash('sha512').update(hashString).digest('hex');
}

// Generate unique transaction ID
const txnid = generateTransactionId();

// Payment parameters
const params = {
    key: MERCHANT_KEY,
    txnid: txnid,
${paramsObj}${jsonCode}
};

// Generate hash
params.hash = generateHash(params);

// Submit payment (redirect to PayU)
// In a web application, you would create a form and submit it
console.log('Payment parameters:', params);`
}

// Helper function for PHP addslashes
function addslashes(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\0/g, '\\0')
}


/**
 * Input validation utilities for DeFiFlow agent
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Ethereum address
 */
export function validateEthereumAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address) {
    errors.push('Address is required');
    return { isValid: false, errors };
  }

  // Check if it's a valid hex string with 0x prefix and 40 characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    errors.push('Invalid Ethereum address format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate NEAR address
 */
export function validateNearAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!address) {
    errors.push('Address is required');
    return { isValid: false, errors };
  }

  // NEAR addresses can be account names (ending with .near) or implicit addresses (64 hex chars)
  const nearAccountRegex = /^[a-z0-9_-]+\.near$/;
  const nearImplicitRegex = /^[a-f0-9]{64}$/;

  if (!nearAccountRegex.test(address) && !nearImplicitRegex.test(address)) {
    errors.push('Invalid NEAR address format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate wallet address for any supported chain
 */
export function validateWalletAddress(address: string, chain?: string): ValidationResult {
  if (!chain) {
    // Try to auto-detect chain
    if (address.startsWith('0x') && address.length === 42) {
      return validateEthereumAddress(address);
    } else if (address.includes('.near') || address.length === 64) {
      return validateNearAddress(address);
    } else {
      return { isValid: false, errors: ['Unable to determine address format'] };
    }
  }

  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return validateEthereumAddress(address);
    case 'near':
      return validateNearAddress(address);
    default:
      return { isValid: false, errors: [`Unsupported chain: ${chain}`] };
  }
}

/**
 * Validate amount/value inputs
 */
export function validateAmount(
  amount: number | string,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
    decimals?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];

  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a valid number
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    errors.push('Amount must be a valid number');
    return { isValid: false, errors };
  }

  // Check if negative (unless zero is explicitly allowed)
  if (numAmount < 0) {
    errors.push('Amount cannot be negative');
  }

  // Check if zero (unless explicitly allowed)
  if (numAmount === 0 && !options.allowZero) {
    errors.push('Amount must be greater than zero');
  }

  // Check minimum value
  if (options.min !== undefined && numAmount < options.min) {
    errors.push(`Amount must be at least ${options.min}`);
  }

  // Check maximum value
  if (options.max !== undefined && numAmount > options.max) {
    errors.push(`Amount must not exceed ${options.max}`);
  }

  // Check decimal places
  if (options.decimals !== undefined) {
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > options.decimals) {
      errors.push(`Amount can have at most ${options.decimals} decimal places`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate APY percentage
 */
export function validateAPY(apy: number | string): ValidationResult {
  return validateAmount(apy, {
    min: 0,
    max: 1000, // 1000% max APY (reasonable upper bound)
    allowZero: true,
    decimals: 4
  });
}

/**
 * Validate slippage percentage
 */
export function validateSlippage(slippage: number | string): ValidationResult {
  return validateAmount(slippage, {
    min: 0,
    max: 50, // 50% max slippage
    allowZero: true,
    decimals: 2
  });
}

/**
 * Validate risk score
 */
export function validateRiskScore(riskScore: number | string): ValidationResult {
  const numScore = typeof riskScore === 'string' ? parseFloat(riskScore) : riskScore;
  
  if (isNaN(numScore) || !Number.isInteger(numScore)) {
    return { isValid: false, errors: ['Risk score must be an integer'] };
  }

  return validateAmount(numScore, {
    min: 1,
    max: 10,
    allowZero: false
  });
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  limit?: number | string,
  offset?: number | string
): ValidationResult {
  const errors: string[] = [];

  if (limit !== undefined) {
    const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
    const limitValidation = validateAmount(numLimit, { min: 1, max: 1000, allowZero: false });
    if (!limitValidation.isValid) {
      errors.push(...limitValidation.errors.map(e => `Limit: ${e}`));
    }
  }

  if (offset !== undefined) {
    const numOffset = typeof offset === 'string' ? parseInt(offset) : offset;
    const offsetValidation = validateAmount(numOffset, { min: 0, allowZero: true });
    if (!offsetValidation.isValid) {
      errors.push(...offsetValidation.errors.map(e => `Offset: ${e}`));
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate time period in days
 */
export function validateDays(days: number | string): ValidationResult {
  const numDays = typeof days === 'string' ? parseInt(days) : days;
  
  if (isNaN(numDays) || !Number.isInteger(numDays)) {
    return { isValid: false, errors: ['Days must be an integer'] };
  }

  return validateAmount(numDays, {
    min: 1,
    max: 365, // Max 1 year of history
    allowZero: false
  });
}

/**
 * Validate protocol name
 */
export function validateProtocol(protocol: string): ValidationResult {
  const errors: string[] = [];

  if (!protocol) {
    errors.push('Protocol name is required');
    return { isValid: false, errors };
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  const protocolRegex = /^[a-zA-Z0-9_-]+$/;
  if (!protocolRegex.test(protocol)) {
    errors.push('Protocol name contains invalid characters');
  }

  // Check length
  if (protocol.length < 2 || protocol.length > 50) {
    errors.push('Protocol name must be between 2 and 50 characters');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate chain name
 */
export function validateChain(chain: string): ValidationResult {
  const errors: string[] = [];
  const supportedChains = ['ethereum', 'near', 'eth'];

  if (!chain) {
    errors.push('Chain is required');
    return { isValid: false, errors };
  }

  if (!supportedChains.includes(chain.toLowerCase())) {
    errors.push(`Unsupported chain: ${chain}. Supported chains: ${supportedChains.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate rebalance strategy
 */
export function validateRebalanceStrategy(strategy: string): ValidationResult {
  const errors: string[] = [];
  const supportedStrategies = [
    'yield_optimization',
    'risk_reduction',
    'diversification',
    'gas_optimization',
    'arbitrage'
  ];

  if (!strategy) {
    errors.push('Strategy is required');
    return { isValid: false, errors };
  }

  if (!supportedStrategies.includes(strategy.toLowerCase())) {
    errors.push(`Unsupported strategy: ${strategy}. Supported strategies: ${supportedStrategies.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate URL
 */
export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url) {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate transaction hash
 */
export function validateTxHash(txHash: string, chain?: string): ValidationResult {
  const errors: string[] = [];

  if (!txHash) {
    errors.push('Transaction hash is required');
    return { isValid: false, errors };
  }

  // Ethereum transaction hash (0x + 64 hex characters)
  const ethTxRegex = /^0x[a-fA-F0-9]{64}$/;
  
  // NEAR transaction hash (base58 encoded, typically 44 characters)
  const nearTxRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (chain) {
    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'eth':
        if (!ethTxRegex.test(txHash)) {
          errors.push('Invalid Ethereum transaction hash format');
        }
        break;
      case 'near':
        if (!nearTxRegex.test(txHash)) {
          errors.push('Invalid NEAR transaction hash format');
        }
        break;
      default:
        errors.push(`Unsupported chain for transaction validation: ${chain}`);
    }
  } else {
    // Auto-detect format
    if (!ethTxRegex.test(txHash) && !nearTxRegex.test(txHash)) {
      errors.push('Invalid transaction hash format');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate alert methods
 */
export function validateAlertMethods(methods: string[]): ValidationResult {
  const errors: string[] = [];
  const supportedMethods = ['email', 'webhook', 'push'];

  if (!methods || methods.length === 0) {
    errors.push('At least one alert method is required');
    return { isValid: false, errors };
  }

  const invalidMethods = methods.filter(method => !supportedMethods.includes(method));
  if (invalidMethods.length > 0) {
    errors.push(`Unsupported alert methods: ${invalidMethods.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML-unsafe characters
    .replace(/[^\w\s.-]/g, '') // Keep only alphanumeric, spaces, dots, and hyphens
    .trim();
}

/**
 * Validate and sanitize user input object
 */
export function validateAndSanitizeInput(
  input: any,
  schema: Record<string, {
    required?: boolean;
    type: 'string' | 'number' | 'boolean' | 'array';
    validator?: (value: any) => ValidationResult;
    sanitizer?: (value: any) => any;
  }>
): { isValid: boolean; errors: string[]; sanitizedInput: any } {
  const errors: string[] = [];
  const sanitizedInput: any = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip validation for optional undefined fields
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    let typedValue = value;
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
          continue;
        }
        typedValue = rules.sanitizer ? rules.sanitizer(value) : sanitizeString(value);
        break;
      case 'number':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof numValue !== 'number' || isNaN(numValue)) {
          errors.push(`${key} must be a number`);
          continue;
        }
        typedValue = numValue;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
          continue;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${key} must be an array`);
          continue;
        }
        break;
    }

    // Custom validator
    if (rules.validator) {
      const validationResult = rules.validator(typedValue);
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors.map(error => `${key}: ${error}`));
        continue;
      }
    }

    sanitizedInput[key] = typedValue;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedInput
  };
}
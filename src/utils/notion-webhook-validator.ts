import crypto from 'crypto';

/**
 * Validates Notion webhook signatures using HMAC-SHA256
 * @param signature - The signature from x-notion-signature header
 * @param body - The raw request body
 * @param secret - The webhook secret from Notion
 * @returns boolean indicating if the signature is valid
 */
export function validateNotionWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace('sha256=', '');
  
  // Create HMAC using the webhook secret
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Checks if the request appears to come from Notion based on headers
 * @param userAgent - The user-agent header
 * @param hasSignature - Whether the request has a notion signature
 * @returns boolean indicating if it looks like a Notion webhook
 */
export function isValidNotionWebhook(
  userAgent: string | null,
  hasSignature: boolean
): boolean {
  return userAgent === 'notion-api' || hasSignature;
}

/**
 * Determines if an event type should trigger task creation
 * @param eventType - The type of Notion event
 * @returns boolean indicating if the event should be processed
 */
export function shouldProcessEvent(eventType: string | undefined): boolean {
  const relevantEvents = [
    'page.created',
    'page.content_updated', 
    'page.property_updated'
  ];
  
  return relevantEvents.includes(eventType || '');
}

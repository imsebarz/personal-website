import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Valida la firma de un webhook de Notion usando HMAC-SHA256
 * @param payload - El cuerpo del webhook como string
 * @param signature - La firma del header X-Notion-Signature
 * @param verificationToken - El token de verificación recibido inicialmente
 * @returns boolean - true si la firma es válida
 */
export function validateNotionSignature(
  payload: string,
  signature: string,
  verificationToken: string
): boolean {
  try {
    // Calcular la firma esperada
    const calculatedSignature = `sha256=${createHmac('sha256', verificationToken)
      .update(payload)
      .digest('hex')}`;

    // Comparar de forma segura para evitar ataques de timing
    return timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error validando firma de Notion:', error);
    return false;
  }
}

/**
 * Middleware para validar webhooks de Notion
 * @param request - Request de Next.js
 * @param rawBody - Cuerpo crudo del request
 * @returns boolean - true si es válido o si la validación está deshabilitada
 */
export function validateNotionWebhook(request: Request, rawBody: string): boolean {
  // Si no hay token de verificación configurado, saltamos la validación
  const verificationToken = process.env.NOTION_VERIFICATION_TOKEN;
  if (!verificationToken) {
    console.log('⚠️ Token de verificación no configurado - saltando validación de firma');
    return true;
  }

  // Obtener la firma del header
  const signature = request.headers.get('X-Notion-Signature');
  if (!signature) {
    console.log('⚠️ Falta header X-Notion-Signature');
    return false;
  }

  // Validar la firma
  const isValid = validateNotionSignature(rawBody, signature, verificationToken);
  
  if (!isValid) {
    console.log('❌ Firma de Notion inválida');
  } else {
    console.log('✅ Firma de Notion válida');
  }

  return isValid;
}

/**
 * validators.js
 * funções auxiliares de validação e formatação para documentos brasileiros.
 */

'use strict';

/**
 * calcula dígitos verificadores de um cpf (11 dígitos).
 */
function calcDigitosCpf(cpf) {
  let sum = 0;
  let rest;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  const dig1 = rest;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  const dig2 = rest;

  return `${dig1}${dig2}`;
}

/**
 * calcula dígitos verificadores de um cnpj (14 dígitos).
 */
function calcDigitosCnpj(cnpj) {
  const peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * peso1[i];
  }
  let dig1 = 11 - (sum % 11);
  if (dig1 >= 10) dig1 = 0;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i), 10) * peso2[i];
  }
  let dig2 = 11 - (sum % 11);
  if (dig2 >= 10) dig2 = 0;

  return `${dig1}${dig2}`;
}

module.exports = { calcDigitosCpf, calcDigitosCnpj };

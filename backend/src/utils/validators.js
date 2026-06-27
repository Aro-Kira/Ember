export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validateRegistration = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (!data.name || !validateName(data.name)) {
    errors.push('Name must be at least 2 characters');
  }

  if (data.role && !['youth', 'leader'].includes(data.role)) {
    errors.push('Role must be either youth or leader');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLogin = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateRegistration,
  validateLogin
};

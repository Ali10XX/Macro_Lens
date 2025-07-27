import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const checkNetworkConnectivity = async (): Promise<{
  isConnected: boolean;
  backendReachable: boolean;
  latency?: number;
  error?: string;
}> => {
  try {
    console.log('🌐 NETWORK: Testing connectivity to backend...');
    
    const startTime = Date.now();
    
    // Test basic connectivity with a simple health check
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 10000, // 10 second timeout for network test
    });
    
    const latency = Date.now() - startTime;
    
    console.log('✅ NETWORK: Backend reachable!');
    console.log(`- Status: ${response.status}`);
    console.log(`- Latency: ${latency}ms`);
    console.log('- Response:', response.data);
    
    return {
      isConnected: true,
      backendReachable: true,
      latency,
    };
    
  } catch (error: any) {
    console.error('❌ NETWORK: Connection test failed');
    console.error('- Error code:', error.code);
    console.error('- Error message:', error.message);
    
    let errorMessage = 'Unknown network error';
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'Connection timeout - backend may be slow or unreachable';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS resolution failed - check API URL';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - backend server not running';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error - check internet connection';
    }
    
    return {
      isConnected: false,
      backendReachable: false,
      error: errorMessage,
    };
  }
};

export const testAuthEndpoints = async (): Promise<{
  loginEndpoint: boolean;
  registerEndpoint: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  let loginEndpoint = false;
  let registerEndpoint = false;
  
  // Test login endpoint with invalid credentials
  try {
    await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: 'test@example.com',
      password: 'wrongpassword',
    }, { timeout: 5000 });
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Expected behavior - endpoint exists but credentials are wrong
      loginEndpoint = true;
      console.log('✅ Login endpoint responding correctly (401 for invalid creds)');
    } else if (error.response?.status === 404) {
      errors.push('Login endpoint not found (404)');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errors.push('Cannot reach login endpoint - connection error');
    } else {
      errors.push(`Login endpoint error: ${error.message}`);
    }
  }
  
  // Test register endpoint with invalid data
  try {
    await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
      email: 'invalid-email',
      username: '',
      password: '',
    }, { timeout: 5000 });
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 422) {
      // Expected behavior - endpoint exists but data is invalid
      registerEndpoint = true;
      console.log('✅ Register endpoint responding correctly (400/422 for invalid data)');
    } else if (error.response?.status === 404) {
      errors.push('Register endpoint not found (404)');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errors.push('Cannot reach register endpoint - connection error');
    } else {
      errors.push(`Register endpoint error: ${error.message}`);
    }
  }
  
  return {
    loginEndpoint,
    registerEndpoint,
    errors,
  };
};

export const runFullNetworkDiagnostic = async (): Promise<void> => {
  console.log('🔍 DIAGNOSTIC: Running full network diagnostic...');
  
  // Basic connectivity test
  const connectivity = await checkNetworkConnectivity();
  
  if (!connectivity.backendReachable) {
    console.error('❌ DIAGNOSTIC: Backend not reachable, skipping endpoint tests');
    console.error('- Error:', connectivity.error);
    return;
  }
  
  // Test auth endpoints
  const endpoints = await testAuthEndpoints();
  
  console.log('📊 DIAGNOSTIC: Results summary:');
  console.log(`- Backend reachable: ${connectivity.backendReachable ? '✅' : '❌'}`);
  console.log(`- Login endpoint: ${endpoints.loginEndpoint ? '✅' : '❌'}`);
  console.log(`- Register endpoint: ${endpoints.registerEndpoint ? '✅' : '❌'}`);
  
  if (endpoints.errors.length > 0) {
    console.error('❌ DIAGNOSTIC: Endpoint errors:');
    endpoints.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (connectivity.latency) {
    if (connectivity.latency > 5000) {
      console.warn('⚠️ DIAGNOSTIC: High latency detected, consider increasing timeouts');
    }
  }
};
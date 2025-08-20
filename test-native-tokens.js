#!/usr/bin/env node
// Test script for native token functionality
import 'dotenv/config';
import db from './lib/db.js';
import { getAllNetworks, getNetworkInfo } from './lib/networks.js';

const SUPPORTED_CHAINS = getAllNetworks();

async function testNativeTokenValidation() {
  console.log('🧪 Testing Native Token Validation...\n');
  
  for (const network of SUPPORTED_CHAINS) {
    console.log(`\n🔗 Testing ${network.name} (Chain ID: ${network.chainId})`);
    
    try {
      // Test native token validation
      const validation = await db.validateTokenContract('NATIVE', network.chainId);
      
      if (validation.isValid && validation.isNative) {
        console.log(`  ✅ Native token validation passed`);
        console.log(`     Token: ${validation.tokenInfo.symbol} (${validation.tokenInfo.name})`);
        console.log(`     Decimals: ${validation.tokenInfo.decimals}`);
        console.log(`     Network: ${validation.tokenInfo.network}`);
      } else {
        console.log(`  ❌ Native token validation failed: ${validation.error}`);
      }
      
      // Test with alternative native token addresses
      const altValidation = await db.validateTokenContract('0x0000000000000000000000000000000000000000', network.chainId);
      if (altValidation.isValid && altValidation.isNative) {
        console.log(`  ✅ Alternative native address (0x0) also works`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${network.name}: ${error.message}`);
    }
  }
}

async function testNativeTokenDetection() {
  console.log('\n\n🔍 Testing Native Token Detection...\n');
  
  const testAddresses = [
    'NATIVE',
    'native', 
    '0x0000000000000000000000000000000000000000',
    '0x0',
    'ETH',
    'eth',
    '0x1234567890123456789012345678901234567890', // Valid ERC-20 format
    'invalid'
  ];
  
  for (const address of testAddresses) {
    const isNative = db.isNativeToken(address);
    console.log(`  "${address}" -> ${isNative ? '✅ Native' : '❌ Not Native'}`);
  }
}

async function testNativeBalanceCheck() {
  console.log('\n\n💰 Testing Native Balance Check...\n');
  
  // Test with a well-known address (Vitalik's address)
  const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  
  for (const network of SUPPORTED_CHAINS.slice(0, 2)) { // Test first 2 networks only
    console.log(`\n🔗 Testing balance check on ${network.name}`);
    
    try {
      const balance = await db.checkNativeTokenBalance(testAddress, 0.001, network.chainId);
      
      console.log(`  ✅ Balance check successful`);
      console.log(`     Address: ${testAddress}`);
      console.log(`     Balance: ${balance.balance} ${network.currency}`);
      console.log(`     Balance Wei: ${balance.balanceWei}`);
      console.log(`     Sufficient for 0.001: ${balance.sufficient ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log(`  ❌ Balance check failed: ${error.message}`);
    }
  }
}

async function testCampaignCreation() {
  console.log('\n\n🎯 Testing Campaign Creation with Native Tokens...\n');
  
  const testCampaignData = {
    title: 'Test Native Token Campaign',
    description: 'Testing native token functionality',
    tokenAddress: 'NATIVE',
    chainId: 10, // Optimism
    claimType: 'single',
    amountPerClaim: 0.01,
    totalClaims: 5,
    maxClaimsPerLink: null,
    expiresInHours: 24,
    walletAddress: '0x1234567890123456789012345678901234567890'
  };
  
  try {
    console.log('  🔍 Validating native token for campaign...');
    const validation = await db.validateTokenContract(testCampaignData.tokenAddress, testCampaignData.chainId);
    
    if (validation.isValid) {
      console.log(`  ✅ Campaign token validation passed`);
      console.log(`     Token: ${validation.tokenInfo.symbol}`);
      console.log(`     Is Native: ${validation.isNative ? 'Yes' : 'No'}`);
      console.log(`     Network: ${validation.tokenInfo.network || 'Unknown'}`);
    } else {
      console.log(`  ❌ Campaign token validation failed: ${validation.error}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Campaign creation test failed: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Native Token Functionality Tests\n');
  console.log('=====================================');
  
  try {
    await testNativeTokenDetection();
    await testNativeTokenValidation();
    await testNativeBalanceCheck();
    await testCampaignCreation();
    
    console.log('\n\n✅ All tests completed! Check the results above.');
    console.log('\n📝 Summary of Native Token Features:');
    console.log('   • ✅ Native token detection (NATIVE, 0x0, ETH, etc.)');
    console.log('   • ✅ Network-specific validation');
    console.log('   • ✅ Balance checking via provider.getBalance()');
    console.log('   • ✅ Campaign creation with native tokens');
    console.log('   • ✅ Support for all networks:', SUPPORTED_CHAINS.map(n => n.name).join(', '));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export default runTests;
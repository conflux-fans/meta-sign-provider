const DEFAULT_GAS_PRICE = '0x1';

function isMetaMaskConnected() {
  return typeof ethereum !== 'undefined' && ethereum.isMetaMask;
}

function parseSignature(sig) {
  return {
    r: sig.slice(0, 66),
    s: '0x' + sig.slice(66, 66 + 64),
    v: Number('0x' + sig.slice(66 + 64, 66 + 66)) - 27,
  };
}

function convertEthAddressToCfx(address) {
  address = address.toLowerCase();
  return `0x1${address.slice(3)}`;
}

async function prepareTx(txInfo, callRPC) {
  if (!txInfo.gas || !txInfo.storageLimit) {
    let estimateGas = await callRPC({
      method:'eth_estimateGas', 
      params: [txInfo]
    });
    if (!txInfo.gas) {
      txInfo.gas = estimateGas;
    }
    // txInfo.storageLimit = '0x1000';  // TODO: need an rpc method to estimate storage limit
    // if (!txInfo.storageLimit) {
    //   txInfo.storageLimit = estimate.storageCollateralized;
    // }
  }
  if (!txInfo.gasPrice) {
    txInfo.gasPrice = DEFAULT_GAS_PRICE;
  }
  if (!txInfo.nonce) {
    let nonce = await callRPC({
      method: 'eth_getTransactionCount',
      params: [txInfo.from]
    });
    txInfo.nonce = nonce;
  }
  if (!txInfo.epochHeight) {
    let epochNumber = await callRPC({
      method: 'eth_blockNumber',
      params: []
    });
    txInfo.epochHeight = epochNumber;
  }
  if (!txInfo.chainId) {
    let chainId = await callRPC({method: 'eth_chainId'});
    txInfo.chainId = chainId;
  }
}

module.exports = {
  isMetaMaskConnected,
  parseSignature,
  convertEthAddressToCfx,
  prepareTx,
};
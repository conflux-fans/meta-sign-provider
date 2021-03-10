const { Transaction, sign, format } = require('js-conflux-sdk');
const { prepareTx, parseSignature } = require('./util');

const ETH_SEND_TRANSACTION = 'eth_sendTransaction';

function wrapMetaMaskEthereum() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed!');
  }
  let originRequest = ethereum.request;

  async function request(payload) {
    let {method, params} = payload;
    if (method != ETH_SEND_TRANSACTION) {
      return await originRequest(payload);
    }
    let txInfo = params[0];
    if (!txInfo.gas || !txInfo.storageLimit) {
      throw new Error("'gas' and 'storageLimit' field is needed");
    }
    await prepareTx(txInfo, originRequest);
    let tx = new Transaction(txInfo);
    let unsignedHash = format.hex(sign.keccak256(tx.encode(false)));
    let signature = await originRequest({
      method: 'eth_sign',
      params: [ethereum.selectedAddress, unsignedHash]
    });
    let sigInfo = parseSignature(signature);
    tx.r = sigInfo.r;
    tx.s = sigInfo.s;
    tx.v = sigInfo.v;
    let rawTx = tx.serialize();
    return await originRequest({
      method: 'eth_sendRawTransaction',
      params: [rawTx],
    });
  }

  ethereum.request = request.bind(ethereum);
}

module.exports = wrapMetaMaskEthereum;
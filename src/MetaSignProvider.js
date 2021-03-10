const BaseProvider = require('js-conflux-sdk/src/provider/BaseProvider');
const { Transaction, sign, format } = require('js-conflux-sdk');
const axios = require('axios').default;
const { convertEthAddressToCfx, parseSignature, isMetaMaskConnected } = require('./util');

const CFX_SEND_TX_METHOD_NAME = 'cfx_sendTransaction';
const CFX_SEND_RAW_TX = 'cfx_sendRawTransaction';
const DEFAULT_GAS_PRICE = '0x1';
const ETH_SIGN = 'eth_sign';

/**
 * Metamask sign json rpc provider.
 */
class MetaSignProvider extends BaseProvider {
  async call(method, ...params) {
    if (method === CFX_SEND_TX_METHOD_NAME && isMetaMaskConnected()) {
      method = CFX_SEND_RAW_TX;
      let rawTx = await this.signTransaction(params[0]);
      params = [rawTx];
    }

    const startTime = Date.now();
    const data = { jsonrpc: '2.0', id: this.requestId(), method, params };

    const { result, error } = await this.request(data);

    if (error) {
      this.logger.error({ data, error, duration: Date.now() - startTime });
      throw new BaseProvider.RPCError(error);
    } else {
      this.logger.info({ data, result, duration: Date.now() - startTime });
    }

    return result;
  }

  /**
   * 1. build transaction and get tx hash
   * 2. request metamask to sign it
   * 3. assemble rawTx with tx info and signature
   * 4. sendRawTransaction
   */
  async signTransaction(txInfo) {
    if (format.hexAddress(txInfo.from) !== convertEthAddressToCfx(ethereum.selectedAddress)) {
      throw new Error('Only can use metamask\'s current account to send transaction');
    }
    txInfo = await this.prepareTx(txInfo);
    let tx = new Transaction(txInfo);
    let unsignedHash = format.hex(sign.keccak256(tx.encode(false)));
    let signature = await ethereum.request({
      method: ETH_SIGN,
      params: [ethereum.selectedAddress, unsignedHash]
    });
    let sigInfo = parseSignature(signature);
    tx.r = sigInfo.r;
    tx.s = sigInfo.s;
    tx.v = sigInfo.v;
    return tx.serialize();
  }

  async prepareTx(txInfo) {
    if (!txInfo.chainId) {
      let { chainId } = await this.call('cfx_getStatus');
      txInfo.chainId = chainId;
    }
    if (!txInfo.gas || !txInfo.storageLimit) {
      txInfo = format.callTxAdvance(txInfo.chainId)(txInfo);
      let estimate = await this.call('cfx_estimateGasAndCollateral', txInfo);
      if (!txInfo.gas) {
        txInfo.gas = estimate.gasLimit;
      }
      if (!txInfo.storageLimit) {
        txInfo.storageLimit = estimate.storageCollateralized;
      }
    }
    if (!txInfo.gasPrice) {
      txInfo.gasPrice = DEFAULT_GAS_PRICE;
    }
    if (!txInfo.nonce) {
      let nonce = await this.call('cfx_getNextNonce', format.address(txInfo.from, txInfo.chainId));
      txInfo.nonce = nonce;
    }
    if (!txInfo.epochHeight) {
      let epochNumber = await this.call('cfx_epochNumber');
      txInfo.epochHeight = epochNumber;
    }
    return txInfo;
  }

  async request(data) {
    let { data: body } = await axios.post(this.url, data);
    return body || {};
  }

  async requestBatch(dataArray) {
    const { data } = await axios.post(this.url, dataArray);
    return data || [];
  }
}

module.exports = MetaSignProvider;
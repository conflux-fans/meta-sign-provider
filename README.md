# meta-sign-provider
An SDK RPC provider that can use Metamask to sign a conflux transaction

## How to install

```sh
$ npm install meta-sign-provider
```

## `MetaSignProvider`
`MetaSignProvider` is a rpc provider that can work with `MetaMask` and `js-conflux-sdk`.
You can use it as `js-conflux-sdk`'s provider, and when you invoke `sendTransaction` it will 
use MetaMask sign an transaction, then send the raw transaction through `cfx_sendRawTransaction`.

```html
<script src='./node_modules/js-conflux-sdk/dist/js-conflux-sdk.umd.min.js'></script>
<script src='./node_modules/meta-sign-provider/dist/MetaSignProvider.min.js'></script>
<script>
  let url = 'https://test.confluxrpc.org/v2';

  let cfx = new Conflux.Conflux({
    url,
    networkId: 1,
  });

  let provider = new MetaSignProvider({
    url,
  });
  cfx.provider = provider;  // replace cfx.provider with meta-sign-provider

  button.addEventListener('click', async () => {
    await cfx.sendTransaction({
      from: convertEthAddressToCfx(ethereum.selectedAddress), // NOTE: convert metamask's current address to a valid conflux address
      to: '0x0000000000000000000000000000000000000000',
      value: '0x01',
    });
  });

  function convertEthAddressToCfx(address) {
    address = address.toLowerCase();
    return `0x1${address.slice(3)}`;
  }
</script>
```

## `wrapMetaMaskEthereum`
`wrapMetaMaskEthereum` can adapt metamask's ethereum.request method, enable it to sign an `Conflux's transaction`.


```html
<script src='./node_modules/meta-sign-provider/dist/wrapEthereumRequest.min.js'></script>
<script>
  // adapt the request method
  wrapEthereumRequest();
  // then you can send a conflux transaction
  button.addEventListener('click', () => {
    ethereum.request({
      method: 'eth_sendTransaction', 
      params: [{
        from: ethereum.selectedAddress,
        to: '0x0000000000000000000000000000000000000000',
        value: '0x01',
        gas: '0x100',  // NOTE: gas is an required field
        storageLimit: '0x100' // NOTE: storageLimit is an required field
      }]
    });
  });
</script>
```
const MetaSignProvider = require('../src/');

const msProvider = new MetaSignProvider({
  url: 'https://testnet-rpc.conflux-chain.org.cn/v2'
});


async function main() {
  let result = await msProvider.call('cfx_sendTransaction', {
    from: 'cfxtest:aak7fsws4u4yf38fk870218p1h3gxut3ku00u1k1da',
    to: 'cfxtest:aak7fsws4u4yf38fk870218p1h3gxut3ku00u1k1da',
    value: 1
  });
  console.log(result);
}

main().catch(console.log);

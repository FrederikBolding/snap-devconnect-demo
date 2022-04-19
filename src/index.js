import { Wallet } from '@ethersproject/wallet'
import { Web3Provider } from '@ethersproject/providers'
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

const provider = new Web3Provider(wallet);

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  const coinTypeNode = await wallet.request({ method: 'snap_getBip44Entropy_966' });
  const deriver = getBIP44AddressKeyDeriver(coinTypeNode);
  const privKey = deriver(0).slice(0, 32);
  const polygonWallet = new Wallet(privKey, provider);
  switch (requestObject.method) {
    case 'sign': {
      const transaction = requestObject.params[0];
      await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Do you want to sign this transaction?`,
            description:
              'foo bar',
            textAreaContent: JSON.stringify(transaction),
          },
        ],
      })
      return polygonWallet.signTransaction(transaction);
    }
    default:
      throw new Error('Method not found.');
  }
});

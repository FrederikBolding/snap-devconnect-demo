import { Wallet } from '@ethersproject/wallet'
import { Web3Provider } from '@ethersproject/providers'
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

const provider = new Web3Provider(wallet);

async function getTransactions() {
  const state = await wallet.request({ method: 'snap_manageState', params: ['get'] });
  return state?.transactions ?? [];
}

async function saveTransaction(tx) {
  const transactions = await getTransactions();
  return wallet.request({ method: 'snap_manageState', params: ['update', { transactions: [...transactions, tx] }] })
}

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  const coinTypeNode = await wallet.request({ method: 'snap_getBip44Entropy_966' });
  const deriver = getBIP44AddressKeyDeriver(coinTypeNode);
  const privKey = deriver(0).slice(0, 32);
  const polygonWallet = new Wallet(privKey, provider);
  switch (requestObject.method) {
    case 'getAddress': {
      return polygonWallet.address;
    }
    case 'getTransactions': {
      return getTransactions();
    }
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
      const signed = await polygonWallet.signTransaction(transaction);
      await saveTransaction(signed);
      return signed;
    }
    default:
      throw new Error('Method not found.');
  }
});

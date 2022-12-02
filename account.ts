import cosmosclient from "@cosmos-client/core";

// set user account
const account = "ununifi1v45254hgxun3vnydjcl6dhw6sz82ulftu6t53s";

interface listData {
  address: string;
  txType: string;
  classId: string;
  nftId: string;
  timestamp: string;
}

let data: listData[] = [];

const headerWithTitle = [
  { id: "address", title: "address" },
  { id: "txType", title: "txType" },
  { id: "classId", title: "classID" },
  { id: "nftId", title: "nftID" },
  { id: "timestamp", title: "timestamp" },
];

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriterWithHeader = createCsvWriter({
  path: account + ".csv",
  header: headerWithTitle,
});

const sdk = new cosmosclient.CosmosSDK(
  "https://nft-market-poc-v1.cauchye.net:1318",
  "ununifi-first-poc"
);

getTxsData("list_nft")
  .catch((err) => {
    console.error(err);
    return undefined;
  })
  .then(async (res) => {
    if (!res || !res.tx_responses || !res.txs) {
      return;
    }
    for (const tx of res.txs) {
      if (tx.body && tx.body.messages) {
        for (const [index, msg] of tx.body.messages.entries()) {
          if (account == (msg as any).sender) {
            data.push({
              address: account,
              txType: "list",
              classId: (msg as any).nft_id.class_id,
              nftId: (msg as any).nft_id.nft_id,
              timestamp: res.tx_responses[index].timestamp!,
            });
          }
        }
      }
    }

    await getTxsData("place_bid")
      .catch((err) => {
        console.error(err);
        return undefined;
      })
      .then(async (res) => {
        if (!res || !res.tx_responses || !res.txs) {
          return;
        }
        for (const tx of res.txs) {
          if (tx.body && tx.body.messages) {
            for (const [index, msg] of tx.body.messages.entries()) {
              if (account == (msg as any).sender) {
                data.push({
                  address: account,
                  txType: "bid",
                  classId: (msg as any).nft_id.class_id,
                  nftId: (msg as any).nft_id.nft_id,
                  timestamp: res.tx_responses[index].timestamp!,
                });
              }
            }
          }
        }
      });
    await csvWriterWithHeader.writeRecords(data);
    console.log(data);
  });

async function getTxsData(msgAction: string) {
  const data = await cosmosclient.rest.tx
    .getTxsEvent(
      sdk,
      [`message.action='${msgAction}'`],
      undefined,
      undefined,
      undefined,
      true
    )
    .then((res) => res.data)
    .catch((error) => {
      console.error(error);
      return;
    });
  return data;
}

function sortStr(a: listData, b: listData) {
  const classA = a.classId.toUpperCase();
  const classB = b.classId.toUpperCase();
  if (classA < classB) {
    return -1;
  }
  if (classA > classB) {
    return 1;
  }
  const nftA = a.nftId.toUpperCase();
  const nftB = b.nftId.toUpperCase();
  if (nftA < nftB) {
    return -1;
  }
  if (nftA > nftB) {
    return 1;
  }
  return 0;
}

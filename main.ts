import cosmosclient from "@cosmos-client/core";

interface listData {
  classId: string;
  nftId: string;
  list: number;
  bid: number;
}

let data: listData[] = [];

const headers = ["classID", "nftID", "list", "bid"];
const headerWithTitle = [
  { id: "classId", title: "classID" },
  { id: "nftId", title: "nftID" },
  { id: "list", title: "list" },
  { id: "bid", title: "bid" },
];

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriterWithHeader = createCsvWriter({
  path: "./result" + ".csv",
  header: headerWithTitle,
});

const sdk = new cosmosclient.CosmosSDK(
  "https://nft-market-poc-v1.cauchye.net:1318",
  "ununifi-first-poc"
);

getTxs("list_nft")
  .catch((err) => {
    console.error(err);
    return undefined;
  })
  .then(async (txs) => {
    if (!txs) {
      return;
    }
    for (const tx of txs) {
      if (tx.body && tx.body.messages) {
        for (const msg of tx.body.messages) {
          if (data.find((e) => e.classId == (msg as any).nft_id.class_id)) {
            const index = data.findIndex(
              (e) =>
                e.classId == (msg as any).nft_id.class_id &&
                e.nftId == (msg as any).nft_id.nft_id
            );
            if (index != -1) {
              data[index].list++;
            } else {
              data.push({
                classId: (msg as any).nft_id.class_id,
                nftId: (msg as any).nft_id.nft_id,
                list: 1,
                bid: 0,
              });
            }
          } else {
            data.push({
              classId: (msg as any).nft_id.class_id,
              nftId: (msg as any).nft_id.nft_id,
              list: 1,
              bid: 0,
            });
          }
        }
      }
    }

    await getTxs("place_bid")
      .catch((err) => {
        console.error(err);
        return undefined;
      })
      .then(async (txs) => {
        if (!txs) {
          return;
        }
        for (const tx of txs) {
          if (tx.body && tx.body.messages) {
            for (const msg of tx.body.messages) {
              const index = data.findIndex(
                (e) =>
                  e.classId == (msg as any).nft_id.class_id &&
                  e.nftId == (msg as any).nft_id.nft_id
              );
              data[index].bid++;
            }
          }
        }
        data.sort((a, b) => sortStr(a, b));
        await csvWriterWithHeader.writeRecords(data);
        console.log(data);
      });
  });

async function getTxs(msgAction: string) {
  const txs = await cosmosclient.rest.tx
    .getTxsEvent(
      sdk,
      [`message.action='${msgAction}'`],
      undefined,
      undefined,
      undefined,
      true
    )
    .then((res) => res.data.txs)
    .catch((error) => {
      console.error(error);
      return;
    });
  return txs;
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

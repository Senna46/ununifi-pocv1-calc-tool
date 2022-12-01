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
  { id: "classID", title: "classID" },
  { id: "nftID", title: "nftID" },
  { id: "list", title: "list" },
  { id: "bid", title: "bid" },
];

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
              (e) => e.nftId == (msg as any).nft_id.nft_id
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
    console.log(data);

    await getTxs("place_bid");
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

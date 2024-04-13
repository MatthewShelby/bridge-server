console.log("Hello Bridge Server")
var express = require('express');
var ethers = require("ethers");
const TronWeb = require('tronweb');
var staticInfo = require('./data/consts')


var app = express();
var eenv = require('dotenv').config()
const port = process.env.PORT || 3000;

const cors = require('cors');
var fs = require('fs');
const { emit } = require('process');
const { networkInterfaces } = require('os');
const blockchainData = './data/blockchain.json'
const sepoliaProvider = 'https://ethereum-sepolia-rpc.publicnode.com'	 //wss://ethereum-sepolia-rpc.publicnode.com	
//#region CORS
var acceptedUrlArray = process.env.aAurl
console.log('acceptedUrlArray')
console.log(acceptedUrlArray)
app.use(function (req, res, next) {
      console.log('use started')
      //console.info(req.headers)
      const origin = req.headers.origin || req.headers.host;
      console.log('req origin   : ' + origin)

      var accept = ''


      if (acceptedUrlArray.includes(origin)) {
            accept = origin



            res.header("Access-Control-Allow-Origin", origin);
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            //console.log('Origin Has Been set to:')
            //console.log(origin)
            next();
      } else {
            console.log('Origin Error. check if this origin is accepted on env:')
            console.log(origin)
      }

});
//#endregion CORS
app.get('/test', async function (req, res) {
      return res.status(200).json({
            status: 'success',
            message: 'Test is ok.'
      });
})

app.get('/testTA', async function (req, res) {
      var tronWeb = await getTronWallet();
      var nt = await tronWeb.createAccount();
      let index = 3;
      var hd = await tronWeb.fromMnemonic(process.env.phrase2, "m/44'/195'/0'/0/" + index)
      // var hd = await TronWeb.fromMnemonic(process.env.phrase, `m/44'/60'/0'/0/1`)
      console.log(nt)
      console.log(hd)
      return res.status(200).json({
            status: 'success',
            message: 'Test is ok.'
      });
})



// Dev it
function validateTronAddress(address) {
      return true;
}

function validateEthereumAddress(address) {

      return ethers.isAddress(address);
}


function validateUUID(uuid) {
      return isGuidValid(uuid);

}
const isHEX = (ch) => "0123456789abcdef".includes(ch.toLowerCase());

const isGuidValid = (guid) => {
      guid = guid.replaceAll("-", ""); // Format it first!
      return guid.length === 32 && [...guid].every(isHEX);
};
// console.log(ethers.Mnemonic.entropyToPhrase(ttt))

//http://127.0.0.1:3000/getATronAddress?inputAmount=1000&destinationBlockchain=ethereum&tokenIn=usdt&tokenOut=usdt&destinationAddress=0x66F8Ed0F87A59c7Dd55Ab5a822432f43A66b7eC7&uuid=11111111111111111111111111111111
app.get('/getATronAddress', async function (req, res) {
      //#region input validation
      if (req.query.inputAmount == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the input amount.'
            });
      }
      if (req.query.destinationBlockchain == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the origin blockchain.'
            });
      }
      if (req.query.tokenIn == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the input token.'
            });
      }
      if (req.query.tokenOut == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the output token.'
            });
      }
      if (req.query.destinationAddress == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the destination address.'
            });
      }
      if (!validateEthereumAddress(req.query.destinationAddress)) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Destination address is not valid.'
            });
      }
      if (req.query.uuid == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the uuid.'
            });
      }
      if (!validateUUID(req.query.uuid)) {
            return res.status(400).json({
                  status: 'error',
                  message: 'UUID is not valid.'
            });
      }
      //#endregion input validation

      try {
            var tokenIn = req.query.tokenIn;
            var tokenOut = req.query.tokenOut;
            var destinationAddress = req.query.destinationAddress;
            var destinationBlockchain = req.query.destinationBlockchain;
            var inputAmount = req.query.inputAmount;
            var UUID = req.query.uuid


            var file = fs.readFileSync(blockchainData, 'utf8');
            var content = JSON.parse(file)
            var addressIndex = Number(content.latestNumberT + 1)
            var orderId = Number(content.latestOrderId + 3)
            // DEV - generate a tron address
            var wallet = TronWeb.fromMnemonic(process.env.phrase, `m/44'/195'/0'/0/` + addressIndex.toString())
            console.info(wallet)
            var transferPair = {
                  "destinationAddress": destinationAddress,
                  "toPayAddress": wallet.address,
                  "UUID": UUID,
                  "addressIndex": addressIndex,
                  "orderId": orderId,
                  "tokenIn": tokenIn,
                  "tokenOut": tokenOut,
                  "originBlockchain": "tron",
                  "destinationBlockchain": destinationBlockchain,
                  "inputAmount": inputAmount,
                  "status": "waitToPayIn"
            }

            content.latestNumberT = Number(addressIndex);
            content.latestOrderId = orderId;
            var currentPairs = content.transferAddressPairs;
            currentPairs.push(transferPair);
            content.transferAddressPairs = new Array()
            content.transferAddressPairs = currentPairs
            fs.writeFileSync(blockchainData, JSON.stringify(content, null, 2), 'utf8', (err) => {
                  if (err) console.log(err)
            })
            transferPair.addressIndex = "4th"


            paymentCheckIntervalStart()

            return res.status(200).json({
                  status: 'success',
                  data: transferPair
            });

      } catch (error) {
            console.log('error:')
            console.info(error)
            return res.status(500).json({
                  status: 'error',
                  message: error
            });
      }
});


app.get('/getAnEthereumAddress', async function (req, res) {
      //#region input validation
      if (req.query.inputAmount == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the input amount.'
            });
      }
      if (req.query.destinationBlockchain == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the origin blockchain.'
            });
      }
      if (req.query.tokenIn == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the input token.'
            });
      }
      if (req.query.tokenOut == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the output token.'
            });
      }
      if (req.query.destinationAddress == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the destination address.'
            });
      }
      if (!validateTronAddress(req.query.destinationAddress)) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Destination address is not valid.'
            });
      }
      if (req.query.uuid == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the uuid.'
            });
      }
      if (!validateUUID(req.query.uuid)) {
            return res.status(400).json({
                  status: 'error',
                  message: 'UUID is not valid.'
            });
      }
      //#endregion input validation

      try {

            var tokenIn = req.query.tokenIn;
            var tokenOut = req.query.tokenOut;
            var destinationAddress = req.query.destinationAddress;
            var destinationBlockchain = req.query.destinationBlockchain;
            var inputAmount = req.query.inputAmount;
            var UUID = req.query.uuid



            var file = fs.readFileSync(blockchainData, 'utf8');
            var content = JSON.parse(file)
            var addressIndex = Number(content.latestNumber + 1)
            var orderId = Number(content.latestOrderId + 3)
            var wallet = ethers.HDNodeWallet.fromPhrase(process.env.phrase, `m/44'/60'/0'/0/` + addressIndex.toString())
            console.info(wallet)
            var transferPair = {
                  "destinationAddress": destinationAddress,
                  "toPayAddress": wallet.address,
                  "UUID": UUID,
                  "addressIndex": addressIndex,
                  "orderId": orderId,
                  "tokenIn": tokenIn,
                  "tokenOut": tokenOut,
                  "originBlockchain": "ethereum",
                  "destinationBlockchain": destinationBlockchain,
                  "inputAmount": inputAmount,
                  "status": "waitToPayIn"
            }

            content.latestNumber = addressIndex;
            content.latestOrderId = orderId;
            var currentPairs = content.transferAddressPairs;
            currentPairs.push(transferPair);
            content.transferAddressPairs = new Array()
            content.transferAddressPairs = currentPairs
            fs.writeFileSync(blockchainData, JSON.stringify(content, null, 2), 'utf8', (err) => {
                  if (err) console.log(err)
            })
            transferPair.addressIndex = "4th"


            paymentCheckIntervalStart()

            return res.status(200).json({
                  status: 'success',
                  data: transferPair
            });

      } catch (error) {
            console.log('error:')
            console.info(error)
            return res.status(500).json({
                  status: 'error',
                  message: error
            });
      }
});


async function hanlePayment() {
      console.log('handlePayment')
      var file = fs.readFileSync(blockchainData, 'utf8');
      var content = JSON.parse(file)
      for (let i = 0; i < content.transferAddressPairs.length; i++) {
            const element = content.transferAddressPairs[i];
            if (element.status == 'waitToPayIn') {
                  var isPayed = await isPayedOrder(element);
                  console.log('For order: ' + element.orderId + ' isPayed: ' + isPayed)
                  if (isPayed) {
                        content.transferAddressPairs[i].status = 'payInDone'
                        content.transferAddressPairs[i].paydInAmount = isPayed / (10 ** getDecimalForObj(element))
                  }
            }
      }
      for (let i = 0; i < content.transferAddressPairs.length; i++) {
            const element = content.transferAddressPairs[i];
            if (element.status == 'payInDone') {
                  let mid = Number(element.paydInAmount) * 98.5 / 100;
                  let out = Math.floor((mid + Number.EPSILON) * 100) / 100
                  let obj = element
                  let toPayAmount = out * (10 ** Number(getDecimalForObj(obj)))
                  if (obj.originBlockchain == 'ethereum' && obj.tokenIn == "Tether") {
                        if (obj.destinationBlockchain == "tron" && obj.tokenOut == "tron-usdt") {
                              let res = await sendTronTokenTo(obj.tokenOut, obj.destinationAddress, toPayAmount);
                              console.log('res on hanlePayment > sendTronTokenTo   : ')
                              console.info(res)
                              if (res.status == "confirmed") {
                                    content.transferAddressPairs[i].status = 'payOutDone'
                                    content.transferAddressPairs[i].tx = res
                                    console.log('Writing tx res on data:' + await savePairs(content))
                                    console.log(res.data.ret[0].contractRet)
                              } else {
                                    // Handle the failure of the transaction somehow
                              }
                        }
                  } else if (obj.originBlockchain == 'tron' && obj.tokenIn == "tron-usdt") {
                        if (obj.destinationBlockchain == "ethereum" && obj.tokenOut == "ethereum-tether") {
                              let res = await sendEthereumTokenTo(obj.tokenOut, obj.destinationAddress, toPayAmount);
                              //let res = await sendTronTokenTo(obj.tokenOut, obj.destinationAddress, toPayAmount);
                              console.log('res on hanlePayment > sendTronTokenTo   : ')
                              console.info(res)
                              if (res.status == "confirmed") {
                                    content.transferAddressPairs[i].status = 'payOutDone'
                                    content.transferAddressPairs[i].tx = res
                                    console.log('Writing tx res on data:' + await savePairs(content))
                                    //console.log(res.data.ret[0].contractRet)
                              } else {
                                    // Handle the failure of the transaction somehow
                              }
                        }
                  }
            }
      }
}

app.get('/getStatus', async function (req, res) {

      let orderId = req.query.orderId;
      if (orderId == undefined) {
            return res.status(400).json({
                  status: 'error',
                  message: 'Could not detect the order id.'
            });
      }
      var file = fs.readFileSync(blockchainData, 'utf8');
      var content = JSON.parse(file)
      for (let i = 0; i < content.transferAddressPairs.length; i++) {
            const element = content.transferAddressPairs[i];
            // DEV
            if (element.orderId == orderId) {
                  var data = {
                        "status": element.status
                  }
                  
                  if (element.status == 'payOutDone') {
                        data.destinationBlockchain = element.destinationBlockchain
                        data.hash = element.tx.txID
                  }

                  return res.status(200).json({
                        status: 'success',
                        data: data
                  });
            }
      }
      return res.status(404).json({
            status: 'error',
            message: 'Could not find an order with given id.'
      });
})

async function savePairs(content) {
      fs.writeFileSync(blockchainData, JSON.stringify(content, null, 2), 'utf8', (err) => {
            if (err) console.log(err)
      })
      return true
}



async function isPayedOrder(obj) {
      let decimal = getDecimalForObj(obj)
      if (obj.originBlockchain == "ethereum" && obj.tokenIn == 'Tether') {
            let provider = new ethers.JsonRpcProvider(sepoliaProvider)
            let Tether = new ethers.Contract(staticInfo.sepoliaTetherAddres, staticInfo.ERC20ABI, provider);
            let amount = (Number(obj.inputAmount) * (10 ** decimal))
            var balance = await Tether.balanceOf(obj.toPayAddress)
            if (balance >= amount) {
                  console.log('Orderid: ' + obj.orderId + '     - balance: ' + balance)
                  return Number(balance)
            }
            return undefined
      }
      if (obj.originBlockchain == "tron" && obj.tokenIn == 'tron-usdt') {
            let amount = (Number(obj.inputAmount) * (10 ** decimal))
            console.log('Orderid: ' + obj.orderId + '     - amount: ' + amount)

            var balance = await getTronUSDTBalanceof(obj.toPayAddress)
            if (balance >= amount) {
                  console.log('Orderid: ' + obj.orderId + '     - balance: ' + balance)
                  return Number(balance)
            }
            return undefined
      }
      return undefined

}


function getDecimalForObj(obj) {
      let decimal = 18;
      if (obj.originBlockchain == "ethereum" && obj.tokenIn == 'Tether') {
            decimal = 6
      }
      if (obj.originBlockchain == "tron" && obj.tokenIn == 'tron-usdt') {
            decimal = 6
      }
      return decimal
}


async function sendEthereumTokenTo(token, address, amount) {

      if (token == "ethereum-tether") {

            try {

                  let signer = await getEthereumWallet();
                  let Tether = new ethers.Contract(staticInfo.sepoliaTetherAddres, staticInfo.ERC20ABI, signer);
                  //let result = await Tether.transfer('0xf1ccEA469D75BC034034C1464542bB5CDC5515c2', ethers.parseUnits('1', 6));
                  console.log('input amount: ' + amount)
                  //console.log('adjusted amount: ' + ethers.parseUnits(amount.toString(),6))

                  let result = await Tether.transfer(address, amount);
                  console.log('----------result:')
                  console.log(result)
                  // let result = await tronWeb.trx.getTransaction(txID);
                  // console.log('result (transfer)');
                  // console.log(result);
                  var res = {
                        "status": "confirmed",
                        "txID": result.hash,
                        "data": result
                  }
                  return res
            } catch (error) {
                  console.log(error)
                  var res = {
                        "status": "error",
                        "error": error
                  }
                  return res
            }
      }
}

async function sendTronTokenTo(token, address, amount) {

      if (token == "tron-usdt") {
            var tronWeb = await getTronWallet();
            try {
                  let contract = await tronWeb.contract(staticInfo.TRC20ABI, staticInfo.nileUSDTAddress);
                  let txID = await contract.transfer(address, amount).send();
                  console.log('----------txID:')
                  console.log(txID)
                  let result = await tronWeb.trx.getTransaction(txID);
                  console.log('result (transfer)');
                  console.log(result);
                  var res = {
                        "status": "confirmed",
                        "txID": txID,
                        "data": result
                  }
                  return res
            } catch (error) {
                  console.log(error)
                  var res = {
                        "status": "error",
                        "error": error
                  }
                  return res
            }
      }
}

async function getTronUSDTBalanceof(address) {

      var tronWeb = await getTronWallet();
      try {
            let contract = await tronWeb.contract(staticInfo.TRC20ABI, staticInfo.nileUSDTAddress);
            let result = await contract.balanceOf(address).call()
            console.log('result.toString');
            console.log(result.toString(10));
            return Number(result.toString(10))
      } catch (error) {
            console.log(error)
      }
}

async function getTronWallet() {
      const HttpProvider = TronWeb.providers.HttpProvider;
      const fullNode = new HttpProvider('https://api.nileex.io');// new HttpProvider('https://api.trongrid.io');
      const solidityNode = new HttpProvider('https://api.nileex.io');
      const eventServer = 'https://event.nileex.io/';

      var tronWeb = new TronWeb(
            fullNode,
            solidityNode,
            eventServer,

      );
      tronWeb.setPrivateKey(process.env.TRONPRVKEY)

      //tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      return tronWeb
}
async function getEthereumWallet() {

      let provider = new ethers.JsonRpcProvider(sepoliaProvider)
      let acc = new ethers.Wallet(process.env.ETHPRVK, provider)

      return acc;
}
//https://faucet.quicknode.com/ethereum/sepolia
//getEthereumWallet()
// Runs the app on the Port
app.listen(port, async () => {
      console.log(`Example app listening on port ${port}!`);
      paymentCheckIntervalStart()


});

function paymentCheckIntervalStart() {
      let startTime = Date.now()
      var handlerInterval = setInterval(() => {
            hanlePayment()
            if (Date.now >= (startTime + 6 * 60 * 6000)) {
                  clearInterval(handlerInterval)
            }
      }, 15000);
}


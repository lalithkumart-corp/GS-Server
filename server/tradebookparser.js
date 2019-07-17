const csv=require('csvtojson');
var fs = require('fs');
const _ = require('lodash');
var jsonexport = require('jsonexport');

let $this = module.exports = {
    start: async () => {
        let jsonObj = await $this.generateJSON();       
        let jsonObj2 = $this.setProfitLoss(jsonObj);        
        let holdings = $this.getHoldings(jsonObj2);
        let topLevelHoldings = $this.getTopLevelHoldings(holdings);               
        $this.writeToFile(jsonObj2, 'newtradebook.csv');
        $this.writeToFile(holdings, 'holdings.csv');
        $this.writeToFile(topLevelHoldings, 'topLevelHoldings.csv');    
    },
    generateJSON: async (filterCompany) => {
        try{
            let csvFilePath = "F:/lalith-workspace/backend/tradebook.csv";
            const jsonArray=await csv().fromFile(csvFilePath);
            let bucket = [];
            _.each(jsonArray, (anObj, index) => {
              let theObj = {};
              theObj.index = index;      
              theObj.date = anObj['trade_date'];
              theObj.company = anObj['tradingsymbol'];

              if(anObj.trade_type == 'buy') {
                theObj.buyQty = parseInt(anObj['quantity']);
                theObj.buyPrice = parseFloat(anObj['price']);
                theObj.soldQty = 0;
              } else {
                theObj.sellQty = parseInt(anObj['quantity']);
                theObj.sellPrice = parseFloat(anObj['price']);
              }
              if(filterCompany) {
                  if(filterCompany == theObj.company)
                    bucket.push(theObj);
              } else {
                bucket.push(theObj);
              }
            });
            return bucket;
          } catch(e) {
            console.log(e);
          } 
    },
    setProfitLoss: (bucket) => {
  
        _.each(bucket, (anObj, index) => {          
          if(anObj.sellQty) {
            anObj.sellQty = parseInt(anObj.sellQty);
            anObj.sellPrice = parseFloat(anObj.sellPrice);            
           
            let buyDetails = $this.getBuyDetails(parseInt(anObj.sellQty), anObj.company, bucket, anObj.date); //Fetch the intraday trades

            let yetToFetch = parseInt(anObj.sellQty);
            _.each(buyDetails, (aDetail, index) => {
                yetToFetch -= parseInt(aDetail.qty);
            });

            let buyDetails2 = $this.getBuyDetails(yetToFetch, anObj.company, bucket); //Fetch remainging from Holdings            
            let buyAvg = 0;
            let buyPrices = [];

            buyDetails.push(...buyDetails2);

            let uniques = [];
            _.each(buyDetails, (aDetail, key) => {
                if(uniques.indexOf(aDetail.index) == -1){
                    buyPrices.push(parseInt(aDetail.qty) * parseFloat(aDetail.price));
                    uniques.push(aDetail.index);
                }
            });           
      
            _.each(buyPrices, (aPrice, tt) => {
              buyAvg += aPrice;
            });
            
            let result = (anObj.sellQty * anObj.sellPrice) - buyAvg;
            
            if(result > 0) {
              anObj.profit = result;
            } else {
              anObj.loss = result;
            }
          }
        });      
        return bucket;
      },
      
      getBuyDetails: (sellQty, company, bucket, date) => {
        let stocks = [];
        let reqQty = sellQty;
        _.each(bucket, (anObj, index) => {
          if(reqQty !== 0) {            

            if(anObj.company == company) {
              
                if(date) {
                    if(anObj.date == date) {
                        let available = parseInt(anObj.buyQty)-parseInt(anObj.soldQty);
                        if(available > 0) {
                            if(available >= reqQty) {
                                stocks.push({qty: reqQty, price: anObj.buyPrice, index: anObj.index, date: anObj.date});
                                anObj.soldQty += reqQty;
                                reqQty = 0;
                            } else {
                                let remainingReqQty = reqQty - available;
                                stocks.push({qty: available, price: anObj.buyPrice, index: anObj.index, date: anObj.date});
                                anObj.soldQty += available;
                                reqQty = remainingReqQty;
                                let temp = $this.getBuyDetails(parseInt(remainingReqQty), company, bucket, date);
                                reqQty = 0;                                                       
                                stocks.push(...temp);
                            }
                        }
                    }
                } else {
                    let available = parseInt(anObj.buyQty)-parseInt(anObj.soldQty);
                    if(available > 0) {
                        if(available >= reqQty) {
                            stocks.push({qty: reqQty, price: anObj.buyPrice, index: anObj.index, date: anObj.date});
                            anObj.soldQty += reqQty;
                            reqQty = 0;
                        } else {
                            let remainingReqQty = reqQty - available;
                            stocks.push({qty: available, price: anObj.buyPrice, index: anObj.index, date: anObj.date});
                            anObj.soldQty += available;
                            reqQty = remainingReqQty;
                            let temp = $this.getBuyDetails(parseInt(remainingReqQty), company, bucket, date);
                            reqQty = 0;
                            stocks.push(...temp);
                        }
                    }
                }
            }
          }
        });
        return stocks;
      },

      getHoldings: (bucket) => {
        let holdingsArr = [];
        _.each(bucket, (anObj, index) => {
            if(anObj.buyQty) {
                let remainingQty = anObj.buyQty - anObj.soldQty;
                if(remainingQty) {
                    holdingsArr.push({
                        date: anObj.date,
                        company: anObj.company,
                        index: anObj.index,
                        presentQty: anObj.buyQty - anObj.soldQty,
                        price: anObj.buyPrice
                    });
                }
            }
        });

        return holdingsArr;        
      },

      getTopLevelHoldings: (holdingsArr) => {
        let holdings = {};
        _.each(holdingsArr, (anObj, index) => {
            holdings[anObj.company] = holdings[anObj.company] || {presentQty: 0, totalPrice: 0};
            holdings[anObj.company].presentQty = parseInt(holdings[anObj.company].presentQty) + parseInt(anObj.presentQty);
            holdings[anObj.company].totalPrice += anObj.presentQty * parseFloat(anObj.price);
        });
        return holdings;
      },
 
      writeToFile: (jsonObj, fileName) => {
        jsonexport(jsonObj,function(err, csv){
            if(err) return console.log(err);
            fs.writeFile(fileName, csv, (err) => {
                console.log(err);
            });
        });          
      }
}


/* INPUT: F:/lalith-workspace/backend/tradebook.csv

trade_date,tradingsymbol,trade_type,quantity,price
12/28/2018,YESBANK,buy,10,182.15
1/2/2019,JINDALSTEL,buy,2,158.65
1/2/2019,JINDALSTEL,buy,1,158.65
1/2/2019,JINDALSTEL,buy,10,158.65
1/2/2019,JINDALSTEL,buy,5,158.65
1/2/2019,JINDALSTEL,buy,2,158.65
1/2/2019,ASHOKLEY,buy,10,101
1/2/2019,YESBANK,buy,8,186.15
1/2/2019,YESBANK,buy,2,186.2
1/7/2019,JAMNAAUTO,buy,7,64
1/7/2019,JAMNAAUTO,buy,13,64.05
1/8/2019,SUNTV,buy,2,593
1/8/2019,SUNTV,buy,5,596.1
1/8/2019,SUNTV,buy,3,596.2
1/8/2019,SUNTV,buy,5,599.25
1/8/2019,YESBANK,sell,1,189.75
.
.
.

*/
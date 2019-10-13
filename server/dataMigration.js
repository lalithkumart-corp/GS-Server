let fs = require('fs');
const _ = require('lodash');
let json = require('../pledgebook.json');
let ornJSON = require('../orn.json');
let moment = require('moment');
//let app = require('./server');

const init = async (app) => {
    console.log(1);
    //_.each(json, async (aRec, index) => {
    let startTime = +new Date();
    for(let i=10000; i< 13586; i++) {
        //if(index < 100) {
            console.log('---------START', i);
            let newBillParam = consructNewBillData(json[i]);
            let response = await app.models.Pledgebook.insertNewBillAPIHandler({accessToken: '1bDYys8sDwSqj6TKnICdMEEJkcXlX2NZm4LhzzW59yKxP0StiE23uzQcytkUwFtP', requestParams: newBillParam});
            //console.log(response);
            if(!newBillParam.status) {
                let closedBillParam = constructClosedBillData(newBillParam, json[i]);
                let resp = await app.models.Pledgebook.redeemPendingBillAPIHandler({accessToken: '1bDYys8sDwSqj6TKnICdMEEJkcXlX2NZm4LhzzW59yKxP0StiE23uzQcytkUwFtP', requestParams: [closedBillParam]});
                //console.log(resp);  
            }
        //}
    }
    let endTime = +new Date();
    console.log(`Time Took = ${endTime-startTime}`);
    //});    
}

const consructNewBillData = (aRawObj) => {
    let parsedObj = parseRawObj(aRawObj);
    let param = {
        uniqueIdentifier: (+new Date()), //for temp
        date: parsedObj._date,
        billSeries: parsedObj._billSeries,
        billNo: parsedObj._billNo,
        amount: parsedObj._amount,
        cname: parsedObj._cname,
        gaurdianName: parsedObj._gaurdianName,
        address: parsedObj._address,
        place: parsedObj._place,
        city: parsedObj._city,
        pinCode: parsedObj._pinCode,
        mobile: parsedObj._mobile,
        orn: parsedObj._orn,
        billRemarks: parsedObj._billRemarks,
        moreDetails: parsedObj._moreDetails,
        userPicture: parsedObj._userPicture,
        ornPicture: parsedObj._ornPicture,
        status: parsedObj._status
    }
    return param;
}

const constructClosedBillData = (newBillData, aRawObj) => {
    let param = {};

    param.pledgeBookUID = newBillData.uniqueIdentifier;

    let billNo = newBillData.billNo;
    if(newBillData.billSeries !== "")
        billNo = newBillData.billSeries + "." + billNo;
    param.billNo = billNo;

    param.pledgedDate = newBillData.date;

    let tt = moment(aRawObj.billClosedDate, 'DD/MM/YYYY').toDate(); //.format('YYYY-MM-DD HH:M:SS');        
    param.closedDate = moment(tt).format('YYYY-MM-DD HH:M:SS');
    
    param.principalAmt = newBillData.amount;
    param.noOfMonth = 0;
    param.roi = 0;
    param.interestPerMonth = 0;
    param.interestValue = 0;
    param.estimatedAmount = 0;
    param.discountValue = 0;
    param.paidAmount = 0;
    param.handedTo = '';

    return param;
}

const parseRawObj = (aRawObj) => {
    let cleaned = {...aRawObj};
    try{
        
        let tt = moment(aRawObj.dates, 'DD/MM/YYYY').toDate(); //.format('YYYY-MM-DD HH:M:SS');        
        cleaned._date = moment(tt).format('YYYY-MM-DD HH:M:SS');
        
        let billSeries = '';
        let billNo = '';
        let billNoSplits = aRawObj.billNo.split('.');
        if(billNoSplits.length > 1) {
            billSeries = billNoSplits[0];
            billNo = billNoSplits[1];
        } else {
            billSeries = '';
            billNo = billNoSplits[0];
        }
        cleaned._billSeries = billSeries;
        cleaned._billNo = billNo;

        cleaned._amount = aRawObj.amount;
        cleaned._cname = aRawObj.cname;
        cleaned._gaurdianName = aRawObj.fgname;
        cleaned._address = aRawObj.address;
        cleaned._place = aRawObj.address2;
        cleaned._city = aRawObj.place;
        cleaned._pinCode = aRawObj.pincode;
        cleaned._mobile = aRawObj.mobile;

        let ornBucket = {};
        let ornItems = aRawObj.ornaments.split(',');
        _.each(ornItems, (anItem, index) => {
            let detailSplits = anItem.split(':');
            let tt = {
                ornItem: detailSplits[0],
                ornSpec: detailSplits[1] || '',
                ornNos: detailSplits[2] || 0,
                ornGWt: 0,
                ornNWt: 0,
            }
            if(!ornBucket[1]) {
                tt.ornNWt = aRawObj.netwt;
                tt.ornGWt = aRawObj.grossWt;
            }
            ornBucket[index+1] = tt;
        });
        cleaned._orn = ornBucket;

        cleaned._billRemarks = '';
        cleaned._moreDetails = [];
        cleaned._userPicture = {imageId: null};
        cleaned._ornPicture = {imageId: null};

        cleaned._status = (aRawObj.status == 'open')?1:0;
    } catch(e) {
        console.log(e);
        console.log(aRawObj);
    } finally {
        return cleaned;
    }
    //aRawObj._dates = aRawObj.dates;   
}

const uploadOrnamentData = async (app) => {
    for(let i=0; i< ornJSON.length; i++) {
        let category = ornJSON[i].substring(0, 1);
        let resp = await app.models.Ornament.insert({userId: 19, category: category, title: ornJSON[i]});
        console.log(resp);
    }
}

//init();
module.exports = {
    init: init,
    uploadOrnamentData: uploadOrnamentData
}



/*
{
    "sno": 13585,
    "identifier": "1567566750",
    "dates": "04/09/2019",
    "billNo": "A.1843",
    "amount": "20000",
    "cname": "RAVI",
    "fgname": "SIVAPUNIYAM",
    "address": "F.S.2 VINOD VICTORIYA  FLAT, PULIYAR KOIL STREET",
    "address2": "KATTUPPAKKAM",
    "place": "CHENNAI",
    "pincode": "600056",
    "mobile": "9003520346",
    "telephone": "",
    "ornaments": "G Ring Round::1",G Ladies Ring::3,G Kalkash::1
    "netwt": "7.8",
    "grossWt": "7.8",
    "ornType": "gold",
    "interest": "2",
    "interest_amt": "400",
    "given_amt": "19600",
    "profilepicpath": "/uploads/default.jpg",
    "status": "open",
    "billClosedDate": "",
    "redeem_amount": "",
    "custid": "RS12",
    "address_old": "",
    "mobile2": "",
    "mobile3": "",
    "is_trashed": ""
}

let params = {
    date: state.formData.date.inputVal.replace('T', ' ').slice(0,23), //2018-12-22 04:25:57.429
    billSeries: state.formData.billseries.inputVal,
    billNo: state.formData.billno.inputVal, //_getBillNo(thatState),
    amount: state.formData.amount.inputVal,
    cname: state.selectedCustomer.name || state.formData.cname.inputVal,
    gaurdianName: state.selectedCustomer.gaurdianName || state.formData.gaurdianName.inputVal,
    address: state.selectedCustomer.address || state.formData.address.inputVal,
    place: state.selectedCustomer.place || state.formData.place.inputVal,
    city: state.selectedCustomer.city || state.formData.city.inputVal,
    pinCode: state.selectedCustomer.pincode || state.formData.pincode.inputVal,
    mobile: state.selectedCustomer.mobile || state.formData.mobile.inputVal,
    orn: _getOrnamentsData(thatState),
    billRemarks: _getBillRemarks(thatState),
    moreDetails: _getMoreData(thatState),
    userPicture: getPicData(thatState),
    ornPicture: getOrnPicData(thatState)
};

let anObj = {
        pledgeBookID: billData.PledgeBookID,
        pledgeBookUID: billData.UniqueIdentifier,
        billNo: billData.BillNo,
        pledgedDate: billData.Date.replace('T', ' ').slice(0,23),
        closedDate: billData.closingDate.replace('T', ' ').slice(0,23),
        principalAmt: billData.Amount,
        noOfMonth: billData._monthDiff,
        roi: billData._roi,
        interestPerMonth: billData._interestPerMonth,
        interestValue: billData._totalInterestValue,
        estimatedAmount: billData.Amount + billData._interestPerMonth,
        discountValue: billData._discountValue,
        paidAmount: billData._totalValue,
        handedTo: billData.Name
    };
*/
/*
{
    "1": {
        "ornItem": "G CHAIN",
        "ornGWt": "8",
        "ornNWt": "7.8",
        "ornSpec": "",
        "ornNos": "1"
    },
    "2": {
        "ornItem": "G RING",
        "ornGWt": "4",
        "ornNWt": "3.5",
        "ornSpec": "Bend",
        "ornNos": "5"
    },
    "3": {
        "ornItem": "G NADHIYA KAMAL",
        "ornGWt": "2",
        "ornNWt": "1.8",
        "ornSpec": "BROKEN",
        "ornNos": "2"
    }
}
*/
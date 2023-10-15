import { get } from "./db.js"

async function getDataFromGST(GSTNumber){
    return await get('client', GSTNumber)
}


function getProductDetails(products){

    let newData = {
        Products: []
    }

    let total = 0

    products.forEach(product=>{

        let productTotal = product.Qty * product.UnitPrice
        
        newData.Products.push({
            ...product,
            CGST: 9,
            SGST: 9,
            Boxes: product.Qty/product.MOQ,
            TotalAmount: productTotal,
        })

        total+= productTotal

    })

    
    newData.IGST = 18
    newData.IGSTValue = 0.18 * total
    newData.Total = total + newData.IGSTValue

    return newData
}



function getFormattedDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('en-US', options);
    return formattedDate;
  }

async function fillData(order){


    let clientData = await getDataFromGST(order.GSTINNumber)

    try{
    delete clientData.ConsigneeAddress
    delete clientData.ConsigneeCity
    delete clientData.ConsigneeMobileNumber
    delete clientData.ConsigneeName
    delete clientData.ConsigneePIN
    delete clientData.ConsigneeState
    delete clientData.ContactPersonName
    }
    catch{
      
    }
    
    let newData = {
        challanNumber: order.DeliveryChallanNumber,
        challanData: {
            ...clientData, 
            ...order, 
            DeliveryChallanDate: getFormattedDate(),
            ...getProductDetails(order.Products),
        }
    }

    return newData
}


function convertAmountToWords(amount) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const thousands = ["", "thousand", "lakh", "crore", "arab", "kharab", "neel", "padma", "shankh"];
  
    function convertGroup(number, group) {
      if (number === 0) {
        return "";
      } else if (number < 10) {
        return ones[number] + " ";
      } else if (number < 20) {
        return teens[number - 10] + " ";
      } else {
        return tens[Math.floor(number / 10)] + " " + ones[number % 10] + " ";
      }
    }
  
    function convertToWords(number) {
      if (number === 0) {
        return "zero";
      }
  
      let words = "";
      for (let i = 0; number > 0; i++) {
        const group = number % 100;
        if (group !== 0) {
          words = convertGroup(group, i) + thousands[i] + " " + words;
        }
        number = Math.floor(number / 100);
      }
      return words.trim();
    }
  
    const cleanAmount = Math.floor(amount); // Convert to integer
    const rupees = Math.floor(cleanAmount);
    const paise = Math.round((amount - rupees) * 100);
  
    const rupeesWords = convertToWords(rupees);
    const paiseWords = paise > 0 ? "and " + convertToWords(paise) + " paise" : "";
  
    return rupeesWords + " rupees " + paiseWords;
  }
  


export default async function completeChallanData(data){

    let completeData = []

    

    for(let i=0; i<data.length; i++){
        completeData.push(await fillData(data[i]))
    }

    // Calculate Total

    

    completeData.forEach(order=>{
    
        let serial = 1
        let totalAmount = 0
        order.challanData.Products.forEach(item=>{
            item.SNo = serial++
            totalAmount+= item.TotalAmount
        })

        order.challanData.Total = totalAmount
        order.challanData.AmountInWords = convertAmountToWords(totalAmount)
    })

    
    return completeData
}
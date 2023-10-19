import { get, set } from "./db.js"

async function getDataFromGST(GSTNumber){
    return await get('client', GSTNumber)
}


function getProductDetails(products, GSTINNumber){

    let integratedGST = !(GSTINNumber.startsWith('07'))

    let newData = {
        Products: []
    }

    let serial = 1

    products.forEach(product=>{
       product.SNo = serial++
       product.TotalPreTax = (product.Qty * product.UnitPrice)
       product.TaxValue =  (product.TaxRate/100) * (product.Qty * product.UnitPrice)
       product.TotalAmount = product.TotalPreTax + product.TaxValue
       product.CGST = integratedGST ? 'IGST' : product.TaxRate/2
       product.SGST = integratedGST ? product.TaxRate : product.TaxRate/2
       newData.Products.push(product)
    })

    return newData
}

async function generateChallanNumber() {
  const currentDate = new Date();

  // Extract day, month, and year components from the current date
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Month is zero-based, so add 1
  const year = currentDate.getFullYear() % 100; // Get the last two digits of the year

  // Ensure day and month are two digits
  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedMonth = month < 10 ? `0${month}` : month;

  // Combine the formatted values into the desired string format
  const customString = `DC${formattedDay}${formattedMonth}${year}`;

  let currentCount = await get('challanSerialNumber', customString)
  currentCount = currentCount ? currentCount.count : 1
  await set('challanSerialNumber', customString, {count: currentCount+1})

  return customString+currentCount;
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
    
    let challanNumber = await generateChallanNumber()
    let newData = {
        challanNumber: challanNumber,
        challanData: {
            ...clientData, 
            ...order, 
            DeliveryChallanDate: getFormattedDate(),
            ...getProductDetails(order.Products, order.GSTINNumber),
            TaxLabel: order.GSTINNumber.startsWith('07') ? 'IGST' : 'C + S GST',
            DeliveryChallanNumber: challanNumber
        }
    }




    return newData
}


function convertNumberToWords(number) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertToWordsLessThanThousand(num) {
    let words = '';

    if (num >= 100) {
      words += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num > 0) {
      words += ones[num] + ' ';
    }

    return words.trim();
  }

  if (number === 0) {
    return 'Zero';
  }

  let words = '';

  if (number >= 10000000) {
    words += convertToWordsLessThanThousand(Math.floor(number / 10000000)) + ' Crore ';
    number %= 10000000;
  }

  if (number >= 100000) {
    words += convertToWordsLessThanThousand(Math.floor(number / 100000)) + ' Lakh ';
    number %= 100000;
  }

  if (number >= 1000) {
    words += convertToWordsLessThanThousand(Math.floor(number / 1000)) + ' Thousand ';
    number %= 1000;
  }

  if (number > 0) {
    words += convertToWordsLessThanThousand(number);
  }

  return words.trim();
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
        let taxAmount = 0
        let grandTotal = 0

        order.challanData.Products.forEach(item=>{
            item.SNo = serial++
            totalAmount+= item.Qty * item.UnitPrice
            taxAmount+= item.TaxValue
            grandTotal+= item.TotalAmount
        })

        order.challanData.TotalAmount = totalAmount
        order.challanData.TaxAmount = taxAmount
        order.challanData.GrandTotal = grandTotal
        order.challanData.AmountInWords = convertNumberToWords(grandTotal)
    })

    
    return completeData
}
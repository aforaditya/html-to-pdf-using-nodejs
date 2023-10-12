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
    let newData = {
        challanNumber: order.DeliveryChallanNumber,
        challanData: {
            ...order, 
            ...clientData, 
            DeliveryChallanDate: getFormattedDate(),
            ...getProductDetails(order.Products)
        }
    }

    return newData
}



export default async function completeChallanData(data){
    console.log(JSON.stringify(data));
    let completeData = []

    for(let i=0; i<data.length; i++){
        completeData.push(await fillData(data[i]))
    }

    return completeData
}
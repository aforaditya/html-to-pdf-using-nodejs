function getDataFromGST(GSTNumber){
    


    return {
      ContactPersonName: "John Doe",
      ReceiverName: "Jane Smith",
      ConsigneeName: "ABC Company",
      ReceiverAddress: "123 Main St",
      SpokesPersonName: "Sam Brown",
      ConsigneeMobileNumber: "555-123-4567",
      ReceiverCity: "Cityville",
      ConsigneeAddress: "456 Oak St",
      ReceiverStateAndPin: "State A, 12345",
      ConsigneeCity: "Townsville",
      ConsigneeStateAndPin: "State B, 54321",
      GSTINNumber: "GSTIN12345",
      ShipToState: "State C",
      StateCode: "6789",
    }
}


function getProductDetails(product){
    return {
      ProductDescription: "Sample Product",
      HSNCode: "HSN-1234",
      MOQ: "10",
      Boxes: "5",
      Quantity: "50",
      UnitPrice: "$20",
      TotalAmount: "$1000",
      CGST: "$50",
      SGST: "$50",
      IGSTValue: "$0",
      IGST: "$0",
      Total: "$1100",
      TotalPreTax: "$1000",
    }
}

async function fillData(order){
    let newData = {
        challanNumber: order.DeliveryChallanNumber,
        challanData: {
            ...order, 
            ...getDataFromGST(order.GSTINNumber), 
            ...getProductDetails(order.Products),
            DeliveryChallanDate: "2023-10-08",
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
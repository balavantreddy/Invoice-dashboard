const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class InvoiceDownloader {
  async downloadInvoice(passenger) {
    try {
      // Simulate download process with random success/failure
      // In real implementation, you would call the airline portal API
      
      const shouldSucceed = Math.random() > 0.3; // 70% success rate for demo
      
      if (!shouldSucceed) {
        return {
          success: false,
          message: 'Invoice not found on airline portal',
          error: 'NOT_FOUND'
        };
      }

      // Generate text-based invoice file (more reliable than PDF for parsing)
      const fileName = `invoice_${passenger.id}.txt`;
      const filePath = path.join(__dirname, '../data/pdfs', fileName);
      
      const invoiceNumber = `INV${passenger.id.substring(0, 8)}`;
      const invoiceDate = new Date().toISOString().split('T')[0];
      const amount = Math.floor(Math.random() * 50000 + 5000);
      const airline = 'AirIndia';
      const gstin = '29AABCU9603R1ZX';
      const passengerName = `${passenger.firstName} ${passenger.lastName}`;
      
      const invoiceText = `
AIRLINE INVOICE

Invoice Number: ${invoiceNumber}
Date: ${invoiceDate}

PASSENGER DETAILS
Name: ${passengerName}
Passenger ID: ${passenger.id}

INVOICE DETAILS
Airline: ${airline}
Amount: Rs. ${amount.toLocaleString()}
GSTIN: ${gstin}

PAYMENT INFORMATION
Payment Status: Paid
Payment Method: Credit Card
Transaction ID: TXN${Date.now().toString().substring(5)}

TERMS & CONDITIONS
1. This is an electronic invoice and does not require a physical signature.
2. All amounts are in Indian Rupees (INR).
3. For any queries, contact support@airline.com
4. GST applicable as per Indian tax regulations.
`;

      await fs.writeFile(filePath, invoiceText.trim());
      
      // Add delay to simulate real download
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return {
        success: true,
        message: 'Invoice downloaded successfully',
        pdfPath: fileName
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Download failed',
        error: error.message
      };
    }
  }
}

module.exports = new InvoiceDownloader();

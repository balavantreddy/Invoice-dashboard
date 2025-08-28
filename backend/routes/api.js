const express = require('express');
const router = express.Router();
const downloader = require('../services/downloader');
const parser = require('../services/parser');
const fs = require('fs-extra');
const path = require('path');

// In-memory storage for demo (use database in production)
let passengerRecords = [];
let invoiceRecords = [];

// Initialize passenger data from CSV
const initializeData = () => {
  // This would read from your CSV file
  passengerRecords = [
    { id: '2172860898782', firstName: 'Ashar', lastName: 'Ahmed', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2173425250895', firstName: 'PRASOON', lastName: 'YADAV', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2173420960092', firstName: 'VICTOR', lastName: 'WAGNER', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2173420770687', firstName: 'NAYAN', lastName: 'KHANNA', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2175905535614', firstName: 'KAUSHIK', lastName: 'BANERJEE', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2175904917328', firstName: 'MANJUNATHASWAMY', lastName: 'DINNIMATH', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2175413770504', firstName: 'SOUMYA', lastName: 'PARVATIYAR', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2173079287333', firstName: 'RAGHAV', lastName: 'SALLY', downloadStatus: 'pending', parseStatus: 'pending' },
    { id: '2173078482499', firstName: 'VIKAS', lastName: 'SAINI', downloadStatus: 'pending', parseStatus: 'pending' }
  ];
};

initializeData();

// Get all passenger records
router.get('/passengers', (req, res) => {
  res.json(passengerRecords);
});

// Download invoice for a passenger
router.post('/download/:passengerId', async (req, res) => {
  const { passengerId } = req.params;
  
  try {
    const passenger = passengerRecords.find(p => p.id === passengerId);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    // Update status to loading
    passenger.downloadStatus = 'loading';
    
    // Attempt to download
    const result = await downloader.downloadInvoice(passenger);
    
    // Update passenger record
    passenger.downloadStatus = result.success ? 'success' : 'not_found';
    passenger.pdfPath = result.pdfPath;
    passenger.error = result.error;

    res.json({ 
      success: result.success, 
      message: result.message,
      passenger 
    });
    
  } catch (error) {
    console.error('Download error:', error);
    const passenger = passengerRecords.find(p => p.id === passengerId);
    if (passenger) {
      passenger.downloadStatus = 'error';
      passenger.error = error.message;
    }
    res.status(500).json({ error: 'Download failed', message: error.message });
  }
});

// Parse invoice for a passenger
router.post('/parse/:passengerId', async (req, res) => {
  const { passengerId } = req.params;
  
  try {
    const passenger = passengerRecords.find(p => p.id === passengerId);
    if (!passenger || passenger.downloadStatus !== 'success') {
      return res.status(400).json({ error: 'Invoice not downloaded or passenger not found' });
    }

    // Update status to loading
    passenger.parseStatus = 'loading';
    
    // Attempt to parse
    const result = await parser.parseInvoice(passenger);
    
    // Update passenger record
    passenger.parseStatus = result.success ? 'success' : 'error';
    passenger.parseError = result.error;

    // Add to invoice records if successful
    if (result.success && result.invoiceData) {
      const existingIndex = invoiceRecords.findIndex(inv => inv.passengerId === passengerId);
      if (existingIndex >= 0) {
        invoiceRecords[existingIndex] = { ...result.invoiceData, passengerId };
      } else {
        invoiceRecords.push({ ...result.invoiceData, passengerId });
      }
    }

    res.json({ 
      success: result.success, 
      message: result.message,
      invoiceData: result.invoiceData,
      passenger 
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    const passenger = passengerRecords.find(p => p.id === passengerId);
    if (passenger) {
      passenger.parseStatus = 'error';
      passenger.parseError = error.message;
    }
    res.status(500).json({ error: 'Parsing failed', message: error.message });
  }
});

// Get all parsed invoices
router.get('/invoices', (req, res) => {
  res.json(invoiceRecords);
});

// Get invoice summary
router.get('/summary', (req, res) => {
  const summary = {
    totalInvoices: invoiceRecords.length,
    totalAmount: invoiceRecords.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0),
    airlines: {}
  };

  invoiceRecords.forEach(inv => {
    if (inv.airline) {
      if (!summary.airlines[inv.airline]) {
        summary.airlines[inv.airline] = { count: 0, total: 0 };
      }
      summary.airlines[inv.airline].count++;
      summary.airlines[inv.airline].total += parseFloat(inv.amount) || 0;
    }
  });

  res.json(summary);
});

// Get high-value invoices (bonus)
router.get('/high-value/:threshold', (req, res) => {
  const threshold = parseFloat(req.params.threshold) || 10000;
  const highValueInvoices = invoiceRecords.filter(inv => 
    parseFloat(inv.amount) > threshold
  );
  res.json(highValueInvoices);
});

module.exports = router;

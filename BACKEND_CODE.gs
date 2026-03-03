
/**
 * Personal Finance Tracker - UPDATED Google Apps Script Backend
 */

const SHEET_NAME = 'Transactions';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Complete Header Row (21 Columns)
    sheet.appendRow([
      'ID', 'Date', 'Month', 'Brought Forward', 'Cash Received', 
      'Groceries', 'Vegetables', 'Fish & Egg', 'Chicken', 'Fuel', 
      'Parcel', 'Bike Repair', 'House Rent', 'Electricity', 'Water Bill', 
      'Travel', 'Compound Investment', 'Others', 'Total Expenses', 
      'Total Balance', 'Timestamp'
    ]);
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  let data;
  try {
    // Attempt to parse the incoming data
    // When using fetch with mode: 'no-cors' and text/plain, the body arrives here.
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'Invalid JSON: ' + err.toString() });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { setup(); sheet = ss.getSheetByName(SHEET_NAME); }
  
  const action = data.action;

  if (action === 'sync') {
    const records = data.records;
    if (!Array.isArray(records)) return createJsonResponse({ status: 'error', message: 'Records must be an array' });
    
    // Clear everything except headers
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    if (records.length === 0) return createJsonResponse({ status: 'success', message: 'Sheet cleared' });

    // Map JSON objects to spreadsheet rows
    const rows = records.map(tx => [
      tx.id || Utilities.getUuid(),
      tx.date || "",
      tx.month || "",
      Number(tx.broughtForward || 0),
      Number(tx.dailyCash || 0),
      Number(tx.groceries || 0),
      Number(tx.vegetables || 0),
      Number(tx.fishEgg || 0),
      Number(tx.chicken || 0),
      Number(tx.fuel || 0),
      Number(tx.parcel || 0),
      Number(tx.bikeRepair || 0),
      Number(tx.houseRent || 0),
      Number(tx.electricity || 0),
      Number(tx.water || 0),
      Number(tx.travel || 0),
      Number(tx.compoundInvestment || 0),
      Number(tx.others || 0),
      Number(tx.totalExpenses || 0),
      Number(tx.totalBalance || 0),
      tx.timestamp || new Date().toISOString()
    ]);
    
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    return createJsonResponse({ status: 'success', count: rows.length });
  }

  return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { setup(); return createJsonResponse({ records: [] }); }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return createJsonResponse({ records: [] });
  
  const headers = values[0];
  const records = [];
  
  const keyMap = {
    'ID': 'id', 'Date': 'date', 'Month': 'month', 'Brought Forward': 'broughtForward',
    'Cash Received': 'dailyCash', 'Groceries': 'groceries', 'Vegetables': 'vegetables',
    'Fish & Egg': 'fishEgg', 'Chicken': 'chicken', 'Fuel': 'fuel', 'Parcel': 'parcel',
    'Bike Repair': 'bikeRepair', 'House Rent': 'houseRent', 'Electricity': 'electricity',
    'Water Bill': 'water', 'Travel': 'travel', 'Compound Investment': 'compoundInvestment',
    'Others': 'others', 'Total Expenses': 'totalExpenses', 'Total Balance': 'totalBalance',
    'Timestamp': 'timestamp'
  };

  for (let i = 1; i < values.length; i++) {
    const record = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim();
      const key = keyMap[cleanHeader] || cleanHeader.toLowerCase().replace(/\s+/g, '');
      let val = values[i][index];
      
      if ((key === 'date') && val instanceof Date) {
        val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      }
      
      const numericKeys = [
        'broughtForward', 'dailyCash', 'groceries', 'vegetables', 'fishEgg', 
        'chicken', 'fuel', 'parcel', 'bikeRepair', 'houseRent', 
        'electricity', 'water', 'travel', 'compoundInvestment', 
        'others', 'totalExpenses', 'totalBalance'
      ];
      if (numericKeys.includes(key)) {
        val = (val === "" || isNaN(val)) ? 0 : Number(val);
      }
      record[key] = val;
    });
    records.push(record);
  }

  return createJsonResponse({ records });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*");
}

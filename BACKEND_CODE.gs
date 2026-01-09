
/**
 * Personal Finance Tracker - Google Apps Script Backend
 */

const SHEET_NAME = 'Transactions';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'ID', 'Date', 'Month', 'Groceries', 'Vegetables', 
      'FishEgg', 'Chicken', 'HouseRent', 'Electricity', 'Water', 'Travel', 'Others',
      'DailyCash', 'BroughtForward', 'TotalExpenses', 'TotalBalance', 'Timestamp'
    ]);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'Invalid JSON' });
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const action = data.action;

  if (action === 'create') {
    const id = Utilities.getUuid();
    sheet.appendRow([
      id, data.date, data.month, data.groceries, data.vegetables,
      data.fishEgg, data.chicken, data.houseRent, data.electricity, data.water, data.travel, data.others,
      data.dailyCash, data.broughtForward, data.totalExpenses, data.totalBalance, data.timestamp
    ]);
    return createJsonResponse({ status: 'success', id: id });
  }

  if (action === 'update') {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        sheet.getRange(i + 1, 1, 1, 17).setValues([[
          data.id, data.date, data.month, data.groceries, data.vegetables,
          data.fishEgg, data.chicken, data.houseRent, data.electricity, data.water, data.travel, data.others,
          data.dailyCash, data.broughtForward, data.totalExpenses, data.totalBalance, data.timestamp
        ]]);
        break;
      }
    }
    return createJsonResponse({ status: 'success' });
  }

  if (action === 'delete') {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return createJsonResponse({ status: 'success' });
  }

  if (action === 'register' || action === 'login') {
     return createJsonResponse({ success: true, user: { id: "1", name: data.name || "User", email: data.email } });
  }

  return createJsonResponse({ status: 'error', message: 'Unknown action' });
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse({ records: [] });
  }
  
  const headers = values[0];
  const records = [];
  
  const keyMap = {
    'ID': 'id',
    'Date': 'date',
    'Month': 'month',
    'Groceries': 'groceries',
    'Vegetables': 'vegetables',
    'FishEgg': 'fishEgg',
    'Chicken': 'chicken',
    'HouseRent': 'houseRent',
    'Electricity': 'electricity',
    'Water': 'water',
    'Travel': 'travel',
    'Others': 'others',
    'DailyCash': 'dailyCash',
    'BroughtForward': 'broughtForward',
    'TotalExpenses': 'totalExpenses',
    'TotalBalance': 'totalBalance',
    'Timestamp': 'timestamp'
  };

  for (let i = 1; i < values.length; i++) {
    const record = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim();
      const key = keyMap[cleanHeader] || cleanHeader.toLowerCase().replace(/\s+/g, '');
      let val = values[i][index];
      
      if ((cleanHeader === 'Date' || key === 'date') && val instanceof Date) {
        val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      }
      
      const numericFields = ['groceries', 'vegetables', 'fishEgg', 'chicken', 'houseRent', 'electricity', 'water', 'travel', 'others', 'dailyCash', 'broughtForward', 'totalExpenses', 'totalBalance'];
      if (numericFields.includes(key)) {
        val = val === "" ? 0 : Number(val);
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

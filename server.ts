import express from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';

// Handle ES module vs CommonJS compatibility for sheetjs (xlsx)
const xlsxModule = (XLSX as any).readFile ? XLSX : ((XLSX as any).default || XLSX);

const app = express();
const PORT = 3000;

// Enable JSON bodies with limit for excel base64 upload
app.use(express.json({ limit: '20mb' }));

const EXCEL_FILE_PATH = path.join(process.cwd(), 'inventory.xlsx');

// Mock initial data
const DEFAULT_PRODUCTS = [
  { id: 'PRD-1001', name: 'Wireless Headphones', category: 'Electronics', price: 2499.00, quantity: 15, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1002', name: 'Ergonomic Office Chair', category: 'Furniture', price: 8500.00, quantity: 4, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1003', name: 'Mechanical Keyboard', category: 'Electronics', price: 3499.00, quantity: 8, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1004', name: 'Stainless Steel Chai Mug', category: 'Office Supplies', price: 399.00, quantity: 25, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1005', name: 'Leather Journal Diary', category: 'Office Supplies', price: 650.00, quantity: 0, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1006', name: 'Cotton Printed Kurta', category: 'Apparel', price: 1199.00, quantity: 30, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1007', name: 'Desk Organizer Stand', category: 'Office Supplies', price: 899.00, quantity: 2, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1008', name: 'Portable Bluetooth Speaker', category: 'Electronics', price: 1999.00, quantity: 12, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1009', name: 'Height Adjustable Desk', category: 'Furniture', price: 21500.00, quantity: 1, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1010', name: 'USB-C Multiport Hub', category: 'Electronics', price: 1499.00, quantity: 0, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1011', name: 'Premium Hooded Sweatshirt', category: 'Apparel', price: 1899.00, quantity: 18, lastUpdated: new Date().toISOString() },
  { id: 'PRD-1012', name: 'Copper Water Bottle', category: 'Sports & Outdoors', price: 950.00, quantity: 40, lastUpdated: new Date().toISOString() },
];

// Helper to write products to excel
function writeProductsToExcel(products: any[]) {
  const rows = products.map((p) => ({
    'Product ID': p.id,
    'Product Name': p.name,
    'Category': p.category,
    'Price': Number(p.price) || 0,
    'Quantity': Number(p.quantity) || 0,
  }));

  const worksheet = xlsxModule.utils.json_to_sheet(rows);
  const workbook = xlsxModule.utils.book_new();
  xlsxModule.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  xlsxModule.writeFile(workbook, EXCEL_FILE_PATH);
}

// Helper to read products from excel
function readProductsFromExcel(): any[] {
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    // Create Excel file with default products if it does not exist
    writeProductsToExcel(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }

  try {
    const workbook = xlsxModule.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = xlsxModule.utils.sheet_to_json(worksheet) as any[];

    // Map excel columns back to products array
    return rawRows.map((row, idx) => {
      return {
        id: String(row['Product ID'] || `PRD-TEMP-${1000 + idx}`),
        name: String(row['Product Name'] || 'Unnamed Product'),
        category: String(row['Category'] || 'General'),
        price: Number(row['Price']) || 0,
        quantity: Number(row['Quantity']) || 0,
        // Since we don't save virtual lastUpdated in excel, we can generate a default or keep order
        lastUpdated: new Date(fs.statSync(EXCEL_FILE_PATH).mtime).toISOString()
      };
    });
  } catch (error) {
    console.error('Error reading excel database, falling back to defaults:', error);
    return DEFAULT_PRODUCTS;
  }
}

// Ensure database file is initialized
readProductsFromExcel();

// ---------------- API ENDPOINTS ----------------

// 1. Get all products
app.get('/api/products', (req, res) => {
  try {
    const products = readProductsFromExcel();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Add product
app.post('/api/products', (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;
    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const products = readProductsFromExcel();

    // Auto-generate Product ID: PRD-XXXX where XXXX is incremented from highest existing numeric PRD suffix
    let nextIdNum = 1001;
    const prdIds = products
      .map(p => {
        const match = p.id.match(/^PRD-(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    if (prdIds.length > 0) {
      nextIdNum = Math.max(...prdIds) + 1;
    }
    const newId = `PRD-${nextIdNum}`;

    const newProduct = {
      id: newId,
      name: String(name).trim(),
      category: String(category).trim(),
      price: Math.max(0, Number(price)),
      quantity: Math.max(0, Math.floor(Number(quantity))),
      lastUpdated: new Date().toISOString()
    };

    products.push(newProduct);
    writeProductsToExcel(products);

    res.status(201).json({ success: true, product: newProduct, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Edit product
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity } = req.body;

    const products = readProductsFromExcel();
    const productIdx = products.findIndex(p => p.id === id);

    if (productIdx === -1) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (name) products[productIdx].name = String(name).trim();
    if (category) products[productIdx].category = String(category).trim();
    if (price !== undefined) products[productIdx].price = Math.max(0, Number(price));
    if (quantity !== undefined) products[productIdx].quantity = Math.max(0, Math.floor(Number(quantity)));
    products[productIdx].lastUpdated = new Date().toISOString();

    writeProductsToExcel(products);

    res.json({ success: true, product: products[productIdx], products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Delete product
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const products = readProductsFromExcel();
    const filteredProducts = products.filter(p => p.id !== id);

    if (products.length === filteredProducts.length) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    writeProductsToExcel(filteredProducts);
    res.json({ success: true, products: filteredProducts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Upload new Excel file (Base64)
app.post('/api/upload', (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    
    // Parse to validate structure before saving
    const workbook = xlsxModule.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = xlsxModule.utils.sheet_to_json(worksheet) as any[];

    if (rawRows.length === 0) {
      return res.status(400).json({ success: false, error: 'The uploaded Excel file is empty.' });
    }

    // Verify required headers
    const firstRow = rawRows[0];
    const requiredColumns = ['Product ID', 'Product Name', 'Category', 'Price', 'Quantity'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid file format. Missing columns: ${missingColumns.join(', ')}. Please use correct headers: Product ID, Product Name, Category, Price, Quantity.` 
      });
    }

    // If valid, write to the server's Excel path
    fs.writeFileSync(EXCEL_FILE_PATH, buffer);

    // Read saved products to return
    const updatedProducts = readProductsFromExcel();
    res.json({ success: true, message: 'Inventory updated successfully from Excel file.', products: updatedProducts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Failed to parse Excel: ${err.message}` });
  }
});

// 6. Download Excel database file
app.get('/api/download', (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      writeProductsToExcel(DEFAULT_PRODUCTS);
    }
    res.download(EXCEL_FILE_PATH, 'inventory.xlsx');
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Download CSV representation
app.get('/api/download-csv', (req, res) => {
  try {
    const products = readProductsFromExcel();
    const headers = ['Product ID', 'Product Name', 'Category', 'Price', 'Quantity'];
    const rows = products.map(p => [
      `"${String(p.id).replace(/"/g, '""')}"`,
      `"${String(p.name).replace(/"/g, '""')}"`,
      `"${String(p.category).replace(/"/g, '""')}"`,
      p.price,
      p.quantity
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

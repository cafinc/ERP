# QuickBooks Integration Testing Guide

## 🎉 Connection Successful! Now Let's Test Data Sync

---

## 🧪 Test 1: Verify Connection Status

### **In Your App:**

1. Go to **Settings → QuickBooks**
2. You should see:
   - ✅ Status: "Connected"
   - ✅ Company Name displayed
   - ✅ Realm ID shown
   - ✅ Token expiration date
   - ✅ Sync settings section visible

### **Expected Result:**
- All connection details should be visible
- "Recent Sync Activity" section should be empty (no syncs yet)

---

## 🧪 Test 2: Create a Test Customer

### **Step 1: Create Customer in Your System**

1. Go to **CRM → Customers**
2. Click **"Add Customer"**
3. Fill in test data:
   ```
   Name: Test Customer QB
   Email: testqb@example.com
   Phone: 555-0123
   Address: 123 Test St, Calgary, AB
   ```
4. **Save the customer**

### **Step 2: Check Sync Logs**

1. Go back to **Settings → QuickBooks**
2. Scroll to **"Recent Sync Activity"**
3. Look for a new entry:
   - Entity: Customer
   - Operation: Create
   - Status: ✓ Success (or ⚠ Error with message)
   - Timestamp: Just now

### **Step 3: Verify in QuickBooks**

1. Open QuickBooks Online in a new tab
2. Log in with hello@cafinc.ca
3. Go to **Sales → Customers**
4. Search for "Test Customer QB"
5. **Should appear in the list!** ✅

---

## 🧪 Test 3: Create a Test Invoice

### **Step 1: Create Invoice in Your System**

1. Go to **Finance → Invoices** (or wherever you create invoices)
2. Click **"Create Invoice"**
3. Fill in test data:
   ```
   Customer: Test Customer QB (the one we just created)
   Date: Today
   Due Date: 30 days from now
   
   Line Item:
   - Description: Test Snow Removal Service
   - Quantity: 1
   - Price: $100.00
   
   Total: $100.00
   ```
4. **Save the invoice**

### **Step 2: Check Sync Logs**

1. Go to **Settings → QuickBooks**
2. Check **"Recent Sync Activity"**
3. Look for:
   - Entity: Invoice
   - Operation: Create
   - Status: ✓ Success
   - Entity ID: (QuickBooks invoice ID)

### **Step 3: Verify in QuickBooks**

1. In QuickBooks Online, go to **Sales → Invoices**
2. Look for the new invoice
3. Should show:
   - Customer: Test Customer QB
   - Amount: $100.00
   - Status: Unpaid
   - Date: Today

---

## 🧪 Test 4: Record a Test Payment

### **Step 1: Record Payment in Your System**

1. Go to the invoice you just created
2. Click **"Record Payment"** or similar
3. Fill in:
   ```
   Amount: $100.00
   Payment Method: Check/Cash
   Date: Today
   ```
4. **Save the payment**

### **Step 2: Check Sync**

1. Go to **Settings → QuickBooks**
2. Check sync logs for:
   - Entity: Payment
   - Operation: Create
   - Status: Success

### **Step 3: Verify in QuickBooks**

1. In QuickBooks, go back to the invoice
2. Should now show:
   - Status: **Paid** ✅
   - Payment recorded
   - Balance: $0.00

---

## 🧪 Test 5: Create a Test Estimate

### **Step 1: Create Estimate in Your System**

1. Go to **Estimates** section
2. Click **"Create Estimate"**
3. Fill in:
   ```
   Customer: Test Customer QB
   Date: Today
   Expiration: 30 days
   
   Line Item:
   - Description: Snow Removal Estimate
   - Quantity: 10
   - Price: $50.00
   
   Total: $500.00
   ```
4. **Save**

### **Step 2: Check Sync**

1. Settings → QuickBooks → Sync logs
2. Look for Estimate creation

### **Step 3: Verify in QuickBooks**

1. In QuickBooks: **Sales → Estimates**
2. Find the estimate
3. Should show all details correctly

---

## 📊 Interpreting Sync Logs

### **Success Entry:**
```
✓ Customer | Create | ID: 123 | 2 minutes ago
```
**Meaning:** Customer successfully synced to QuickBooks

### **Error Entry:**
```
⚠ Invoice | Create | Error: Invalid customer reference | 5 minutes ago
```
**Meaning:** Sync failed - need to fix the issue

### **Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid customer reference" | Customer doesn't exist in QB | Sync customer first |
| "Required field missing" | Missing data (e.g., due date) | Add required field |
| "Duplicate name" | Customer already exists | Use different name or update existing |
| "Unauthorized" | Token expired | Disconnect and reconnect |

---

## 🔍 Manual API Test (Advanced)

If you want to test the API directly without using the UI:

### **Test Creating a Customer:**

```bash
curl -X POST 'https://client-hub-48.preview.emergentagent.com/api/quickbooks/customers?user_id=YOUR_USER_ID' \
  -H 'Content-Type: application/json' \
  -d '{
    "DisplayName": "API Test Customer",
    "GivenName": "John",
    "FamilyName": "Doe",
    "PrimaryEmailAddr": {
      "Address": "john@example.com"
    }
  }'
```

**Expected Response:**
```json
{
  "Id": "456",
  "DisplayName": "API Test Customer",
  "GivenName": "John",
  ...
}
```

Then check QuickBooks to see if "API Test Customer" appears!

---

## ✅ What "Working" Looks Like

### **Connection Status:**
- ✅ Shows "Connected" in settings
- ✅ Company name displayed
- ✅ No error messages

### **Sync Logs:**
- ✅ Shows create operations
- ✅ Status shows "Success" (green checkmark)
- ✅ Entity IDs populated

### **QuickBooks:**
- ✅ Test customer appears in Customers list
- ✅ Test invoice appears in Invoices list
- ✅ Payment shows invoice as paid
- ✅ Estimate appears in Estimates list

### **Data Accuracy:**
- ✅ Names match
- ✅ Amounts correct
- ✅ Dates correct
- ✅ All fields populated

---

## ❌ Troubleshooting Failed Syncs

### **If Customer Sync Fails:**

1. **Check sync log error message**
2. **Common issues:**
   - Duplicate customer name → Change name or update existing
   - Missing required field → Add customer email or name
   - Invalid data format → Check special characters

### **If Invoice Sync Fails:**

1. **Ensure customer exists in QuickBooks first**
2. **Check that:**
   - Customer is synced
   - Invoice has line items
   - Amounts are valid numbers
   - Dates are in correct format

### **If Payment Sync Fails:**

1. **Invoice must exist in QuickBooks first**
2. **Check that:**
   - Invoice ID is valid
   - Payment amount ≤ invoice amount
   - Invoice isn't already paid

---

## 📞 Getting Help

### **Check Sync Logs:**
Settings → QuickBooks → Recent Sync Activity

Look for:
- Error messages
- Entity IDs (helps trace issues)
- Timestamps

### **Check Backend Logs:**
```bash
sudo supervisorctl tail backend | grep quickbooks
```

Look for:
- API errors
- intuit_tid (for Intuit support)
- Error details

### **Common Solutions:**

1. **"Connection not found"**
   - Disconnect and reconnect QuickBooks

2. **"Token expired"**
   - System should auto-refresh
   - If persists, reconnect

3. **"Rate limit exceeded"**
   - Wait 60 seconds
   - System respects 500 req/min limit

---

## 🎯 Success Criteria

Your integration is working if:

1. ✅ Create customer in your app → Appears in QuickBooks
2. ✅ Create invoice in your app → Appears in QuickBooks
3. ✅ Record payment → Updates invoice in QuickBooks
4. ✅ All sync logs show "Success"
5. ✅ Data matches exactly between systems

---

## 🚀 Next Steps After Testing

Once verified working:

1. **Configure Sync Settings:**
   - Enable/disable specific entity types
   - Choose sync direction (one-way recommended)

2. **Train Your Team:**
   - Show them how to check sync logs
   - Explain what gets synced
   - Document any workflows

3. **Monitor:**
   - Check sync logs regularly
   - Watch for errors
   - Verify data accuracy

4. **Clean Up Test Data:**
   - Delete or mark inactive test records
   - In both your system and QuickBooks

---

## 📝 Quick Test Checklist

- [ ] Connection shows "Connected"
- [ ] Create test customer → Check QB
- [ ] Create test invoice → Check QB
- [ ] Record test payment → Check QB
- [ ] Create test estimate → Check QB
- [ ] All sync logs show success
- [ ] Data accurate in both systems
- [ ] No error messages

**If all checked: Your QuickBooks integration is fully working!** 🎉

---

## 💡 Pro Tips

1. **Test in order:** Customer → Invoice → Payment (because they depend on each other)

2. **Check both sides:** Always verify in QuickBooks, not just sync logs

3. **Use test data:** Don't use real customer names while testing

4. **Watch sync logs:** Refresh the page to see new sync operations

5. **Clean up after:** Delete test data when done testing

**Happy testing!** 🚀

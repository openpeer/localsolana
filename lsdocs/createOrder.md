# Create Order Logic

--------------------------------------------------------------------------------
1) Where the order is created in the code:

Inside “orders.controller.js” (based on lines ~306–345 in your snippet), the relevant logic appears to look like this:

• You obtain the following pieces of information from the request body:  
  – list_id (to know which listing we are buying from or selling to)  
  – token_amount  
  – fiat_amount  
  – price  
  – payment_method (which itself can contain .id and/or a nested bank object, etc.)  

• The code then checks the listing (list) to see if it’s a “SellList” or a “BuyList”. Based on that, it decides whether the current user is the seller or the buyer.  
• You also see logic that extracts a “bankID” from payment_method depending on whether it’s a “SellList” or a “BuyList”.  
• Finally, it calls models.payment_methods.create(…) to create an entry for the order’s payment method and then models.Order.create(…) for the core order row.

--------------------------------------------------------------------------------
2) The likely JSON format to POST:

Use something along these lines (adjust values as needed). You would typically POST to an endpoint like /orders (exact route may differ in your project):

```json
{
  "list_id": 95,
  "fiat_amount": 100,
  "price": 50.25,
  "token_amount": 2,
  "payment_method": {
    "id": 123,
    "bank": {
      "id": 11
    },
    "values": {
      "account_number": "000123456789",
      "account_holder": "Some Buyer",
      "...": "any other necessary payment details"
    }
  }
}
```

Key details in the above example:  
• "list_id" tells the backend which listing you want to create an order against.  
• "fiat_amount" is the amount of fiat currency the buyer will pay.  
• "token_amount" is how many tokens or crypto units are involved in the order.  
• "price" is the price point used for the transaction.  
• "payment_method" is an object providing the ID of the method (if relevant), plus a nested "bank": { id }, plus any “values” the code expects to store with this payment method (e.g., an account number).  

--------------------------------------------------------------------------------
3) Authentication and user info:

Your code also uses req.user internally to figure out who is making the request. Make sure you’re sending a valid access token (e.g. via Authorization header) so that req.user is set. The code automatically decides which user is buyer_id and which is seller_id depending on the list’s type (“SellList” vs. “BuyList”).

--------------------------------------------------------------------------------
4) Status definitions:

Yes, in your code:
• status = 0 means “inactive” (sometimes “new” or “created”),  
• status = 1 means “active,” and  
• status = 2 means “cancelled.”  

For a newly created order, you’ll usually see status set to 0 in the create logic. The listing might still be “active” (status = 1), which means it’s open to accept new orders.

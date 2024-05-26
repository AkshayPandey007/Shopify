const axios = require('axios');


const SHOPIFY_API_KEY = 'shopify_api_key';
const SHOPIFY_PASSWORD = 'shopify_password';
const SHOPIFY_STORE_NAME = 'store_name';
const ORDER_ID = 'order_id';
const PIPEDRIVE_API_KEY = 'pipedrive_api_key';

// Function to get Shopify order details
const getShopifyOrder = async (orderId) => {
  const url = `https://${SHOPIFY_API_KEY}:${SHOPIFY_PASSWORD}@${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2021-04/orders/${orderId}.json`;
  try {
    const response = await axios.get(url);
    return response.data.order;
  } catch (error) {
    console.error('Error fetching Shopify order:', error);
  }
};

// Function to find a person in Pipedrive by email
const findPersonInPipedrive = async (email) => {
  const url = `https://api.pipedrive.com/v1/persons/search?term=${email}&fields=email&api_token=${PIPEDRIVE_API_KEY}`;
  try {
    const response = await axios.get(url);
    const items = response.data.data.items;
    if (items.length > 0) {
      return items[0].item.id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for person in Pipedrive:', error);
  }
};

// Function to create a person in Pipedrive
const createPersonInPipedrive = async (customer) => {
  const url = `https://api.pipedrive.com/v1/persons?api_token=${PIPEDRIVE_API_KEY}`;
  const personData = {
    name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone
  };
  try {
    const response = await axios.post(url, personData);
    return response.data.data.id;
  } catch (error) {
    console.error('Error creating person in Pipedrive:', error);
  }
};

// Function to find a product in Pipedrive by SKU
const findProductInPipedrive = async (sku) => {
  const url = `https://api.pipedrive.com/v1/products/search?term=${sku}&fields=code&api_token=${PIPEDRIVE_API_KEY}`;
  try {
    const response = await axios.get(url);
    const items = response.data.data.items;
    if (items.length > 0) {
      return items[0].item.id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for product in Pipedrive:', error);
  }
};

// Function to create a product in Pipedrive
const createProductInPipedrive = async (item) => {
  const url = `https://api.pipedrive.com/v1/products?api_token=${PIPEDRIVE_API_KEY}`;
  const productData = {
    name: item.name,
    code: item.sku,
    prices: [{ price: item.price }]
  };
  try {
    const response = await axios.post(url, productData);
    return response.data.data.id;
  } catch (error) {
    console.error('Error creating product in Pipedrive:', error);
  }
};

// Function to create a deal in Pipedrive
const createDealInPipedrive = async (personId) => {
  const url = `https://api.pipedrive.com/v1/deals?api_token=${PIPEDRIVE_API_KEY}`;
  const dealData = {
    title: `Deal for Order ${ORDER_ID}`,
    person_id: personId
  };
  try {
    const response = await axios.post(url, dealData);
    return response.data.data.id;
  } catch (error) {
    console.error('Error creating deal in Pipedrive:', error);
  }
};

// Function to attach a product to a deal in Pipedrive
const attachProductToDeal = async (dealId, productId) => {
  const url = `https://api.pipedrive.com/v1/deals/${dealId}/products?api_token=${PIPEDRIVE_API_KEY}`;
  const productData = {
    product_id: productId,
    quantity: 1
  };
  try {
    await axios.post(url, productData);
  } catch (error) {
    console.error('Error attaching product to deal in Pipedrive:', error);
  }
};

// Main function to execute the integration
const main = async () => {
  const shopifyOrder = await getShopifyOrder(ORDER_ID);
  
  const customerEmail = shopifyOrder.email;
  let personId = await findPersonInPipedrive(customerEmail);
  
  if (!personId) {
    const customer = shopifyOrder.customer;
    personId = await createPersonInPipedrive(customer);
  }
  
  const productIds = [];
  for (const item of shopifyOrder.line_items) {
    let productId = await findProductInPipedrive(item.sku);
    if (!productId) {
      productId = await createProductInPipedrive(item);
    }
    productIds.push(productId);
  }
  
  const dealId = await createDealInPipedrive(personId);
  
  for (const productId of productIds) {
    await attachProductToDeal(dealId, productId);
  }
  
  console.log('Integration complete!');
};

main();

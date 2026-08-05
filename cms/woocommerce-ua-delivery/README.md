# UA Delivery Shipping for WooCommerce

Simple WooCommerce shipping method for the CMS/plugin level of the test task.

## Features

- Custom shipping method for WooCommerce shipping zones.
- Checkout fields: city, warehouse, delivery comment.
- Server-side validation and sanitized order meta.
- Admin order display and email meta.
- WooCommerce logger usage.
- Action hook `ua_delivery_shipping_order_ready` for external API/webhook integrations.
- Optional Nova Poshta API key setting for cached directory integrations.
- No WordPress or WooCommerce core changes.

## Installation

1. Copy `cms/woocommerce-ua-delivery` to `wp-content/plugins/woocommerce-ua-delivery`.
2. Activate `UA Delivery Shipping for WooCommerce` in WordPress admin.
3. Open WooCommerce shipping zone settings and add `UA Delivery`.
4. Configure title, fixed cost, and optional Nova Poshta API key.
5. Test checkout and verify saved delivery meta in the order admin page.

